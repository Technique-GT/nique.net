import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Article, { IArticle } from '../models/Article';
import { 
  canEditArticle, 
  canManageAuthors, 
  canDeleteArticle, 
  canPublishArticle 
} from '../utils/permissions';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const toObjectId = (id: string | string[] | undefined): mongoose.Types.ObjectId | null => {
  if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

const toObjectIdArray = (ids: any): mongoose.Types.ObjectId[] => {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null))
    .filter((v): v is mongoose.Types.ObjectId => v !== null);
};

const populateArticle = (query: any) =>
  query
    .populate('categoryId', 'name slug')
    .populate('subcategoryId', 'name slug categoryId')
    .populate('tagIds', 'name slug')
    .populate('authors.authorId', 'name isAdmin profilePictureMediaId')
    .populate('featuredMediaId', 'url altText');

const populateArticleForFeed = (query: any) =>
  query
    .populate('categoryId', 'name slug')
    .populate('tagIds', 'name slug')
    .populate('authors.authorId', 'name profilePictureMediaId')
    .populate('featuredMediaId', 'url altText');

const parsePublished = (body: any): boolean => {
  if (typeof body?.published === 'boolean') return body.published;
  if (typeof body?.isPublished === 'boolean') return body.isPublished;
  if (typeof body?.status === 'string') return body.status === 'published';
  return false;
};

const parsePublishedAt = (body: any, published: boolean, existingPublishedAt?: Date | null): Date | null => {
  if (body?.publishedAt instanceof Date) return body.publishedAt;
  if (typeof body?.publishedAt === 'string') {
    const t = Date.parse(body.publishedAt);
    if (!Number.isNaN(t)) return new Date(t);
  }

  if (published) {
    return existingPublishedAt ?? new Date();
  }

  return null;
};

const buildArticleUpdate = async (params: { body: any; existing?: IArticle | null }): Promise<Partial<IArticle>> => {
  const { body, existing } = params;

  const title = typeof body?.title === 'string' ? body.title : undefined;
  const content = typeof body?.content === 'string' ? body.content : undefined;
  const excerpt = body?.excerpt === null ? undefined : typeof body?.excerpt === 'string' ? body.excerpt : undefined;

  const categoryId = toObjectId(body?.categoryId ?? body?.category) ?? undefined;
  const subcategoryId = toObjectId(body?.subcategoryId ?? body?.subcategory) ?? undefined;

  const tagIds = toObjectIdArray(body?.tagIds ?? body?.tags);

  // Authors can come as string[] or [{authorId, order}]
  let authors: any[] | undefined;
  if (Array.isArray(body?.authors)) {
    if (body.authors.length > 0 && typeof body.authors[0] === 'object' && body.authors[0] !== null && (body.authors[0] as any).authorId) {
      authors = body.authors
        .map((a: any, idx: number) => {
          const authorId = toObjectId(a?.authorId);
          if (!authorId) return null;
          const order = typeof a?.order === 'number' ? a.order : idx;
          return { authorId, order };
        })
        .filter(Boolean);
    } else {
      const ids = toObjectIdArray(body.authors);
      authors = ids.map((authorId, idx) => ({ authorId, order: idx }));
    }
  } else if (Array.isArray(body?.authorIds)) {
    const ids = toObjectIdArray(body.authorIds);
    authors = ids.map((authorId, idx) => ({ authorId, order: idx }));
  }

  const featuredMediaId = toObjectId(body?.featuredMediaId) ?? undefined;
  const imageCaption = typeof body?.imageCaption === 'string' ? body.imageCaption : undefined;

  const published = parsePublished(body);
  const allowComments = typeof body?.allowComments === 'boolean' ? body.allowComments : undefined;
  const isFeatured = typeof body?.isFeatured === 'boolean' ? body.isFeatured : undefined;
  const isSticky = typeof body?.isSticky === 'boolean' ? body.isSticky : undefined;

  const editorState = body?.editorState;
  const reviewStatus = body?.reviewStatus;

  const publishedAt = parsePublishedAt(body, published, existing?.publishedAt ?? null);

  const update: Partial<IArticle> = {};

  if (title !== undefined) update.title = title;
  if (content !== undefined) update.content = content;
  if (excerpt !== undefined) update.excerpt = excerpt;

  if (categoryId) update.categoryId = categoryId;
  if (subcategoryId !== undefined) update.subcategoryId = subcategoryId;

  if (authors !== undefined) update.authors = authors as any;
  if (tagIds !== undefined) update.tagIds = tagIds as any;

  if (featuredMediaId !== undefined) update.featuredMediaId = featuredMediaId;
  if (imageCaption !== undefined) update.imageCaption = imageCaption;

  if (editorState !== undefined) update.editorState = editorState;
  if (reviewStatus !== undefined) update.reviewStatus = reviewStatus;

  update.published = published;
  update.publishedAt = publishedAt;

  if (allowComments !== undefined) update.allowComments = allowComments;

  // Featured/sticky rules: only published articles can be featured/sticky
  const basePublished = published;
  if (isFeatured !== undefined) update.isFeatured = basePublished ? isFeatured : false;
  if (isSticky !== undefined) update.isSticky = basePublished ? isSticky : false;

  if (!basePublished) {
    update.isFeatured = false;
    update.isSticky = false;
    update.publishedAt = null;
  }

  return update;
};

export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const titleRaw = typeof req.body?.title === 'string' ? req.body.title : '';
    const contentRaw = typeof req.body?.content === 'string' ? req.body.content : '';

    const title = titleRaw.trim();
    const content = contentRaw;

    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    if (!content) {
      res.status(400).json({ success: false, message: 'Content is required' });
      return;
    }

    const slug = typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0 ? req.body.slug.trim() : `${slugify(title)}-${Date.now()}`;

    const existing = await Article.findOne({ slug });
    if (existing) {
      res.status(409).json({ success: false, message: 'An article with this slug already exists' });
      return;
    }

    const update = await buildArticleUpdate({ body: { ...req.body, title, content } });

    const categoryId = update.categoryId;
    if (!categoryId) {
      res.status(400).json({ success: false, message: 'categoryId is required' });
      return;
    }

    const authors = update.authors ?? [];
    const tagIds = update.tagIds ?? [];

    const article = await Article.create({
      ...update,
      slug,
      authors,
      tagIds,
      viewCount: 0,
    });

    const populatedArticle = await populateArticle(Article.findById(article._id));

    res.status(201).json({ success: true, message: 'Article created successfully', data: populatedArticle });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, message: 'Duplicate key error' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create article', error: error?.message });
  }
};

export const getArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search } = req.query;

    const filter: any = {};
    if (typeof search === 'string' && search.trim().length > 0) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: rx }, { excerpt: rx }];
    }

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit as string, 10) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const [articles, total] = await Promise.all([
      populateArticle(Article.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).select('-content')),
      Article.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: articles,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch articles', error: error?.message });
  }
};

export const getPublishedArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    // This endpoint intentionally stays simple; the richer public feed is `getFeed`.
    const { page, limit, search } = req.query as unknown as { page: number; limit: number; search?: string };

    const filter: any = { published: true };
    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [{ title: rx }, { excerpt: rx }];
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      populateArticle(
        Article.find(filter)
          .sort({ isSticky: -1, publishedAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-content'),
      ),
      Article.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: articles,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch published articles', error: error?.message });
  }
};

export const getFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, search, categoryId, tagId, authorId, isSticky } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      categoryId?: string;
      tagId?: string;
      authorId?: string;
      isSticky?: boolean;
    };

    const filter: any = { published: true };

    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [{ title: rx }, { excerpt: rx }];
    }

    if (categoryId) filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    if (tagId) filter.tagIds = new mongoose.Types.ObjectId(tagId);
    if (authorId) filter['authors.authorId'] = new mongoose.Types.ObjectId(authorId);
    if (isSticky !== undefined) filter.isSticky = isSticky;

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      populateArticleForFeed(
        Article.find(filter)
          .sort({ isSticky: -1, publishedAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-content'),
      ),
      Article.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: articles,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch feed', error: error?.message });
  }
};

export const getFeaturedArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await populateArticle(
      Article.find({ published: true, isFeatured: true }).sort({ publishedAt: -1 }).select('-content').limit(10),
    );

    res.json({ success: true, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured articles', error: error?.message });
  }
};

export const getStickyArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await populateArticle(
      Article.find({ published: true, isSticky: true }).sort({ publishedAt: -1 }).select('-content'),
    );

    res.json({ success: true, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch sticky articles', error: error?.message });
  }
};

export const getArticlesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = toObjectId(req.params.category);
    if (!categoryId) {
      res.status(400).json({ success: false, message: 'Invalid category ID' });
      return;
    }

    const articles = await populateArticle(
      Article.find({ categoryId, published: true }).sort({ isSticky: -1, publishedAt: -1 }).select('-content'),
    );

    res.json({ success: true, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch articles by category', error: error?.message });
  }
};

export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const article = await populateArticle(
      Article.findOneAndUpdate({ _id: req.params.id, published: true }, { $inc: { viewCount: 1 } }, { new: true }),
    );

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    res.json({ success: true, data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch article', error: error?.message });
  }
};

export const getArticleBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const article = await populateArticle(
      Article.findOneAndUpdate({ slug, published: true }, { $inc: { viewCount: 1 } }, { new: true }),
    );

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    res.json({ success: true, data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch article', error: error?.message });
  }
};

export const updateArticle = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await Article.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (!canEditArticle(req.user, existing)) {
      res.status(403).json({ success: false, message: 'Not authorized to edit this article' });
      return;
    }

    // Check lock state
    if (existing.reviewStatus === 'in_review' && !req.user.isAdmin) {
      res.status(403).json({ success: false, message: 'Article is locked for review' });
      return;
    }

    // Handle author changes (requires canManageAuthors)
    if (req.body.authors && !canManageAuthors(req.user, existing)) {
      res.status(403).json({ success: false, message: 'Only owner or admin can manage authors' });
      return;
    }

    const update = await buildArticleUpdate({ body: req.body, existing });

    // Prevent non-admin from publishing directly via updateArticle
    if (!req.user.isAdmin) {
      delete update.published;
      delete update.isFeatured;
      delete update.isSticky;
    }

    const article = await Article.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    const populatedArticle = await populateArticle(Article.findById(article._id));

    res.json({ success: true, message: 'Article updated successfully', data: populatedArticle });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update article', error: error?.message });
  }
};

export const deleteArticle = async (req: any, res: Response): Promise<void> => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (!canDeleteArticle(req.user, article)) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this article' });
      return;
    }

    await Article.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete article', error: error?.message });
  }
};

export const toggleFeatured = async (req: Request, res: Response): Promise<void> => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (!article.published) {
      res.status(400).json({ success: false, message: 'Only published articles can be featured' });
      return;
    }

    article.isFeatured = !article.isFeatured;
    await article.save();

    const populatedArticle = await populateArticle(Article.findById(article._id));

    res.json({
      success: true,
      message: `Article ${article.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: populatedArticle,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to toggle featured status', error: error?.message });
  }
};

export const toggleSticky = async (req: Request, res: Response): Promise<void> => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (!article.published) {
      res.status(400).json({ success: false, message: 'Only published articles can be sticky' });
      return;
    }

    article.isSticky = !article.isSticky;
    await article.save();

    const populatedArticle = await populateArticle(Article.findById(article._id));

    res.json({
      success: true,
      message: `Article ${article.isSticky ? 'pinned' : 'unpinned'} successfully`,
      data: populatedArticle,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to toggle sticky status', error: error?.message });
  }
};

export const updateArticleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, isFeatured, isSticky } = req.body;

    const article = await Article.findById(id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    const updateData: Partial<IArticle> = {};

    let published = article.published;
    if (typeof status === 'string') {
      published = status === 'published';
      updateData.published = published;
      updateData.publishedAt = published ? article.publishedAt ?? new Date() : null;

      if (!published) {
        updateData.isFeatured = false;
        updateData.isSticky = false;
      }
    }

    if (typeof isFeatured === 'boolean') {
      if (!published && !article.published) {
        res.status(400).json({ success: false, message: 'Only published articles can be featured' });
        return;
      }
      updateData.isFeatured = isFeatured;
    }

    if (typeof isSticky === 'boolean') {
      if (!published && !article.published) {
        res.status(400).json({ success: false, message: 'Only published articles can be sticky' });
        return;
      }
      updateData.isSticky = isSticky;
    }

    const updatedArticle = await Article.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedArticle) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    const populatedArticle = await populateArticle(Article.findById(updatedArticle._id));

    res.json({ success: true, message: 'Article status updated successfully', data: populatedArticle });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update article status', error: error?.message });
  }
};

export const createDraft = async (req: any, res: Response): Promise<void> => {
  try {
    const ownerId = req.user.id;
    const title = 'Untitled Article';
    const slug = `untitled-${Date.now()}`;

    const article = await Article.create({
      title,
      slug,
      content: '<p></p>',
      ownerId,
      authors: [{ authorId: ownerId, order: 0 }],
      published: false,
      reviewStatus: 'draft',
      viewCount: 0,
      // categoryId will be undefined/null, which is allowed now
    });

    res.status(201).json({ success: true, data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create draft', error: error.message });
  }
};

export const getAdminArticleById = async (req: any, res: Response): Promise<void> => {
  try {
    const article = await populateArticle(Article.findById(req.params.id));

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (!canEditArticle(req.user, article)) {
      res.status(403).json({ success: false, message: 'Not authorized to edit this article' });
      return;
    }

    res.json({ success: true, data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch article', error: error.message });
  }
};

export const requestReview = async (req: any, res: Response): Promise<void> => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (article.ownerId.toString() !== req.user.id && !req.user.isAdmin) {
      res.status(403).json({ success: false, message: 'Only the owner can request review' });
      return;
    }

    article.reviewStatus = 'in_review';
    await article.save();

    res.json({ success: true, message: 'Review requested', data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error requesting review', error: error.message });
  }
};

export const unrequestReview = async (req: any, res: Response): Promise<void> => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (article.ownerId.toString() !== req.user.id && !req.user.isAdmin) {
      res.status(403).json({ success: false, message: 'Only the owner can unrequest review' });
      return;
    }

    article.reviewStatus = 'draft';
    await article.save();

    res.json({ success: true, message: 'Review cancelled', data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error cancelling review', error: error.message });
  }
};

export const adminPublish = async (req: any, res: Response): Promise<void> => {
  try {
    if (!canPublishArticle(req.user)) {
      res.status(403).json({ success: false, message: 'Only admins can publish' });
      return;
    }

    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    article.published = true;
    article.reviewStatus = 'published';
    article.publishedAt = article.publishedAt || new Date();
    await article.save();

    res.json({ success: true, message: 'Article published', data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error publishing article', error: error.message });
  }
};

export const adminUnpublish = async (req: any, res: Response): Promise<void> => {
  try {
    if (!canPublishArticle(req.user)) {
      res.status(403).json({ success: false, message: 'Only admins can unpublish' });
      return;
    }

    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    article.published = false;
    article.reviewStatus = 'draft';
    article.isFeatured = false;
    article.isSticky = false;
    await article.save();

    res.json({ success: true, message: 'Article unpublished', data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error unpublishing article', error: error.message });
  }
};

export const transferOwnership = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user.isAdmin) {
      res.status(403).json({ success: false, message: 'Only admins can transfer ownership' });
      return;
    }

    const { newOwnerId } = req.body;
    if (!newOwnerId) {
      res.status(400).json({ success: false, message: 'newOwnerId is required' });
      return;
    }

    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    article.ownerId = new mongoose.Types.ObjectId(newOwnerId);
    await article.save();

    res.json({ success: true, message: 'Ownership transferred', data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error transferring ownership', error: error.message });
  }
};
