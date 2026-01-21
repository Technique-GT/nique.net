import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import mongoose from 'mongoose';
import Article, { IArticle } from '../models/Article';
import User from '../models/User';
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

// parsePublished is removed or commented out as it's no longer used in the new buildArticleUpdate logic (we check typeof directly)
// const parsePublished = (body: any): boolean => { ... };

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
  const categoryId = toObjectId(body?.categoryId ?? body?.category) ?? undefined;
  const subcategoryId = toObjectId(body?.subcategoryId ?? body?.subcategory) ?? undefined;

  // Only update tagIds if present in body
  let tagIds: mongoose.Types.ObjectId[] | undefined;
  if (body?.tagIds !== undefined || body?.tags !== undefined) {
    tagIds = toObjectIdArray(body?.tagIds ?? body?.tags);
  }

  // Authors can come as string[] or [{authorId, order}]
  let authors: any[] | undefined;
  if (body?.authors !== undefined || body?.authorIds !== undefined) {
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
  }

  const featuredMediaId = toObjectId(body?.featuredMediaId) ?? undefined;
  const imageCaption = typeof body?.imageCaption === 'string' ? body.imageCaption : undefined;

  const published = typeof body?.published === 'boolean' ? body.published : undefined;
  const allowComments = typeof body?.allowComments === 'boolean' ? body.allowComments : undefined;
  const isFeatured = typeof body?.isFeatured === 'boolean' ? body.isFeatured : undefined;
  const isSticky = typeof body?.isSticky === 'boolean' ? body.isSticky : undefined;

  const editorState = body?.editorState;
  const reviewStatus = body?.reviewStatus;

  // Only update publishedAt if published state is explicitly changing to true
  let publishedAt = undefined;
  if (published === true) {
    publishedAt = parsePublishedAt(body, true, existing?.publishedAt ?? null);
  }

  const update: Partial<IArticle> = {};

  if (title !== undefined) update.title = title;
  if (content !== undefined) update.content = content;
  if (categoryId) update.categoryId = categoryId;
  if (subcategoryId !== undefined) update.subcategoryId = subcategoryId;

  if (authors !== undefined) update.authors = authors as any;
  if (tagIds !== undefined) update.tagIds = tagIds as any;

  if (featuredMediaId !== undefined) update.featuredMediaId = featuredMediaId;
  if (imageCaption !== undefined) update.imageCaption = imageCaption;

  if (editorState !== undefined) update.editorState = editorState;
  if (reviewStatus !== undefined) update.reviewStatus = reviewStatus;

  if (published !== undefined) {
    update.published = published;
    if (publishedAt !== undefined) {
      update.publishedAt = publishedAt;
    } else if (published === false) {
      // Keep publishedAt if unpublishing? Usually null it out or keep as "last published"
      // Current logic was: update.publishedAt = null
      update.publishedAt = null;
    }
  }

  if (allowComments !== undefined) update.allowComments = allowComments;

  // Featured/sticky rules: only published articles can be featured/sticky
  // If published is changing to false, force featured/sticky off
  // If published is not present but existing is false, force featured/sticky off if they are being set to true (validation)
  // But simpler: just enforce consistency based on resulting state.
  
  const resultingPublished = published !== undefined ? published : existing?.published ?? false;

  if (isFeatured !== undefined) {
    update.isFeatured = resultingPublished ? isFeatured : false;
  } else if (!resultingPublished && existing?.isFeatured) {
    update.isFeatured = false;
  }

  if (isSticky !== undefined) {
    update.isSticky = resultingPublished ? isSticky : false;
  } else if (!resultingPublished && existing?.isSticky) {
    update.isSticky = false;
  }
  
  if (!resultingPublished && (update.published === false || existing?.published)) {
     if (update.publishedAt === undefined) {
         update.publishedAt = null;
     }
  }

  return update;
};

const idsAreEqual = (id1: any, id2: any): boolean => {
  if (!id1 && !id2) return true;
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};

const arraysAreEqual = (arr1: any[], arr2: any[], comparator: (a: any, b: any) => boolean): boolean => {
  if (!arr1 && !arr2) return true;
  if (!arr1 || !arr2) return false;
  if (arr1.length !== arr2.length) return false;
  return arr1.every((item, index) => comparator(item, arr2[index]));
};

const hasArticleChanged = (existing: IArticle, update: Partial<IArticle>): boolean => {
  if (update.title !== undefined && update.title !== existing.title) return true;
  // Content can be large, but string comparison is efficient enough
  if (update.content !== undefined && update.content !== existing.content) return true;
  if ('categoryId' in update && !idsAreEqual(update.categoryId, existing.categoryId)) return true;
  if ('subcategoryId' in update && !idsAreEqual(update.subcategoryId, existing.subcategoryId)) return true;
  if ('featuredMediaId' in update && !idsAreEqual(update.featuredMediaId, existing.featuredMediaId)) return true;

  if (update.tagIds && !arraysAreEqual(update.tagIds, existing.tagIds, idsAreEqual)) return true;

  if (update.authors) {
      // Check if authors array changed. Note: existing.authors contains { authorId, order, _id }.
      // update.authors contains { authorId, order }.
      const authorsChanged = !arraysAreEqual(update.authors, existing.authors, (a, b) => {
          return idsAreEqual(a.authorId, b.authorId) && a.order === b.order;
      });
      if (authorsChanged) return true;
  }

  if (update.editorState) {
      // Deep compare editorState (JSON)
      // Note: This relies on key order being deterministic in JSON.stringify which isn't guaranteed,
      // but for Lexical state produced by same client, it's often consistent enough.
      // A better approach would be deep object equality, but JSON stringify is a quick proxy.
      try {
        if (JSON.stringify(update.editorState) !== JSON.stringify(existing.editorState)) return true;
      } catch (e) {
        // If stringify fails or circular, assume changed
        return true;
      }
  }
  
  if (update.imageCaption !== undefined && update.imageCaption !== existing.imageCaption) return true;

  return false;
};

export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = (req as any)?.user?.id;
    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

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

    const authors = update.authors && update.authors.length > 0
      ? update.authors
      : [{ authorId: new mongoose.Types.ObjectId(ownerId), order: 0 }];
    const tagIds = update.tagIds ?? [];

    const article = await Article.create({
      ...update,
      slug,
      authors,
      ownerId,
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

export const getArticles = async (req: any, res: Response): Promise<void> => {
  try {
    // In case validateQuery mutation fails or behaves unexpectedly, allow safe parsing
    const { page, limit, search, status, categoryId, hideDrafts } = req.query;
    const andFilters: any[] = [];
    const orFilters: any[] = [];

    if (typeof search === 'string' && search.trim().length > 0) {
      const rx = new RegExp(search.trim(), 'i');
      orFilters.push({ title: rx });

      const matchedUsers = await User.find({ name: rx }).select('_id');
      if (matchedUsers.length > 0) {
        orFilters.push({ 'authors.authorId': { $in: matchedUsers.map((u) => u._id) } });
      }
    }

    if (typeof categoryId === 'string') {
      const categoryObjectId = toObjectId(categoryId);
      if (categoryObjectId) {
        andFilters.push({ categoryId: categoryObjectId });
      }
    }

    if (typeof status === 'string') {
      if (status === 'published' || status === 'draft') {
        andFilters.push({
          $or: [
            { reviewStatus: status },
            { reviewStatus: { $exists: false }, published: status === 'published' },
          ],
        });
      } else {
        andFilters.push({ reviewStatus: status });
      }
    }

    if (hideDrafts === true || hideDrafts === 'true') {
      andFilters.push({ reviewStatus: { $ne: 'draft' } });
    }

    // Filter for non-admins: only show owned or authored articles
    if (!req.user.isAdmin) {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      andFilters.push({ $or: [{ ownerId: userId }, { 'authors.authorId': userId }] });
    }

    if (orFilters.length > 0) {
      andFilters.push({ $or: orFilters });
    }

    const filter = andFilters.length > 0 ? { $and: andFilters } : {};

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const [articles, total] = await Promise.all([
      populateArticle(Article.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum)),
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
      filter.$or = [{ title: rx }];
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      populateArticle(
        Article.find(filter)
          .sort({ isSticky: -1, publishedAt: -1 })
          .skip(skip)
          .limit(limit),
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
      filter.$or = [{ title: rx }];
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
          .limit(limit),
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
      Article.find({ published: true, isFeatured: true }).sort({ publishedAt: -1 }).limit(10),
    );

    res.json({ success: true, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured articles', error: error?.message });
  }
};

export const getStickyArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await populateArticle(
      Article.find({ published: true, isSticky: true }).sort({ publishedAt: -1 }),
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
      Article.find({ categoryId, published: true }).sort({ isSticky: -1, publishedAt: -1 }),
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
      delete update.reviewStatus; // Ensure non-admins use transitions
    }

    // Logic for pending changes on published articles
    if (existing.published) {
       // Check for actual changes before flagging as pending
       const hasChanges = hasArticleChanged(existing, update);

       if (hasChanges) {
           update.hasPendingChanges = true;
           // If not admin, force status change to ensure re-review
           if (!req.user.isAdmin) {
             update.reviewStatus = 'changes_requested';
           }
       }
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

export const toggleFeatured = async (req: any, res: Response): Promise<void> => {
  try {
    if (!canPublishArticle(req.user)) {
      res.status(403).json({ success: false, message: 'Only admins can toggle featured' });
      return;
    }

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

export const toggleSticky = async (req: any, res: Response): Promise<void> => {
  try {
    if (!canPublishArticle(req.user)) {
      res.status(403).json({ success: false, message: 'Only admins can toggle sticky' });
      return;
    }

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

export const updateArticleStatus = async (req: any, res: Response): Promise<void> => {
  try {
    if (!canPublishArticle(req.user)) {
      res.status(403).json({ success: false, message: 'Only admins can update article status' });
      return;
    }

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

      if (published) {
        updateData.reviewStatus = 'published';
        updateData.hasPendingChanges = false;
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = req.user.id;
      } else {
        updateData.reviewStatus = 'draft';
      }

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

    // Final consistency check: if not published (either by this request or existing state), force flags off
      // "published" variable holds the *intended* state for this request (or existing if not changing)
    if (!published) {
      updateData.isFeatured = false;
      updateData.isSticky = false;
    }

    const updatedArticle = await Article.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedArticle) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    // Check if we just published it, and notify
    // published is the intended state; check if it wasn't published before
    if (published && !article.published) {
        // Notify owner
        if (updatedArticle.ownerId.toString() !== req.user.id) {
          await NotificationService.create(
            updatedArticle.ownerId,
            'published',
            'Article Published',
            `Your article "${updatedArticle.title}" has been published!`,
            `/articles/${updatedArticle._id}/edit`,
            { articleId: updatedArticle._id }
          );
        }
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

    if (article.reviewStatus !== 'draft' && article.reviewStatus !== 'changes_requested') {
      // Allow re-requesting if published but has pending changes
      if (!(article.reviewStatus === 'published' && article.hasPendingChanges)) {
         res.status(400).json({ success: false, message: 'Article is already in review or published' });
         return;
      }
    }

    if (article.ownerId.toString() !== req.user.id && !req.user.isAdmin) {
      res.status(403).json({ success: false, message: 'Only the owner can request review' });
      return;
    }

    article.reviewStatus = 'in_review';
    await article.save();

    // Notify admins
    await NotificationService.notifyAdmins(
      'review_requested',
      'Review Requested',
      `${req.user.name || 'An author'} requested a review for "${article.title}"`,
      `/articles/${article._id}/edit`,
      { articleId: article._id }
    );

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

    if (article.reviewStatus !== 'in_review') {
      res.status(400).json({ success: false, message: 'Article is not in review' });
      return;
    }

    if (article.ownerId.toString() !== req.user.id && !req.user.isAdmin) {
      res.status(403).json({ success: false, message: 'Only the owner can unrequest review' });
      return;
    }

    if (article.published) {
      // If it was published but in review (e.g. pending changes), revert to published
      // Wait, if it has pending changes, "unrequest review" means "keep pending changes but stop reviewing"
      // or "discard pending changes"?
      // Usually "Withdraw review request" -> returns to "In Progress" (Changes Requested / Draft).
      // If published, it should go back to 'changes_requested' (if changes exist) or 'published' (if no changes?)
      // But we only allow request review if pending changes exist on published.
      // So let's revert to 'changes_requested' to imply "still working on it".
    if (article.reviewStatus !== 'in_review') {
      res.status(400).json({ success: false, message: 'Article is not in review' });
      return;
    }

    article.reviewStatus = 'changes_requested';
    } else {
      article.reviewStatus = 'draft';
    }
    
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
    article.hasPendingChanges = false;
    article.publishedAt = article.publishedAt || new Date();
    article.reviewedAt = new Date();
    article.reviewedBy = req.user.id;
    await article.save();

    // Notify owner
    if (article.ownerId.toString() !== req.user.id) {
      await NotificationService.create(
        article.ownerId,
        'published',
        'Article Published',
        `Your article "${article.title}" has been published!`,
        `/articles/${article._id}/edit`,
        { articleId: article._id }
      );
    }

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

export const requestChanges = async (req: any, res: Response): Promise<void> => {
  try {
    if (!canPublishArticle(req.user)) { // Assume admins/editors can request changes
      res.status(403).json({ success: false, message: 'Only admins can request changes' });
      return;
    }

    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (article.reviewStatus !== 'in_review') {
      res.status(400).json({ success: false, message: 'Article is not in review' });
      return;
    }

    article.reviewStatus = 'changes_requested';
    if (req.body.reviewNotes) {
      article.reviewNotes = req.body.reviewNotes;
    }
    await article.save();

    // Notify owner
    await NotificationService.create(
      article.ownerId,
      'changes_requested',
      'Changes Requested',
      `Admin requested changes on "${article.title}"`,
      `/articles/${article._id}/edit`,
      { articleId: article._id, notes: req.body.reviewNotes }
    );

    res.json({ success: true, message: 'Changes requested', data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error requesting changes', error: error.message });
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
