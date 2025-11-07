const Article = require('../models/article.model');
const SavedArticle = require('../models/saved.model');
const Media = require('../models/media.model');
// const { checkPermission } = require('../utils/permissions');


// Helper function to validate article authors
const validateAuthors = (authors, user) => {
  if (!authors || authors.length === 0) {
    authors = [{ user: user.id, position: 0 }];
  }
  return authors;
};

/**
 * Create a new article, auto-filling an author when none is provided and defaulting
 * the status to draft for non-admins. Unlike `updateArticle`, this path always builds
 * a fresh document, so callers do not need an existing article id.
 */
exports.createArticle = async (req, res) => {
  try {
    // Check if user has permission to create articles
    /*if (!checkPermission(req.user.role, 'createArticle')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }*/

    const { title, content, authors, categories, tags, featuredImage, allowComments } = req.body;
    
    const validatedAuthors = validateAuthors(authors, req.user);
    const status = req.user.role === 'admin' ? 'published' : 'draft';

    const article = new Article({
      title,
      content,
      authors: validatedAuthors,
      categories,
      tags,
      featuredImage,
      allowComments,
      status,
      updatedBy: req.user.id
    });

    await article.save();

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Return a filtered list of articles with optional status, category, author, search,
 * and sticky filters. This endpoint only supports a `limit` cap; use `getArticleFeed`
 * when you need full pagination.
 */
exports.getAllArticles = async (req, res) => {
  try {
    let query = {};
    const { status, category, author, search, limit, isSticky } = req.query;
    const user = req.user || { role: 'viewer', id: null };

    // Apply filters
    if (status) query.status = status;
    if (category) query.categories = category;
    if (author) query['authors.user'] = author;
    if (search) query.title = { $regex: search, $options: 'i' };

    // Non-admins can only see published articles or their own
    if (!['admin', 'manager', 'editor'].includes(user.role || '')) {
      if (user.id) {
        query.$or = [
          { status: 'published' },
          { 'authors.user': user.id }
        ];
      } else {
        query.status = 'published';
      }
    }

    const parsedLimit = parseInt(limit, 10);
    if (typeof isSticky !== 'undefined') {
      if (isSticky === 'true') {
        query.isSticky = true;
      } else if (isSticky === 'false') {
        query.isSticky = false;
      }
    }

    let articleQuery = Article.find(query)
      .populate('authors.user', 'username profilePicture')
      .populate('categories', 'name')
      .populate('tags', 'name')
      .populate('featuredImage', 'url title')
      .sort({ publishedAt: -1 });

    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      articleQuery = articleQuery.limit(parsedLimit);
    }

    const articles = await articleQuery;

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Return a paginated article feed complete with total counts and next-page cursors.
 * Compared to `getAllArticles`, this handler calculates `skip`, enforces sane page/limit
 * bounds, and mirrors infinite-scroll needs on the frontend.
 */
exports.getArticleFeed = async (req, res) => {
  try {
    let query = {};
    const {
      status = 'published',
      category,
      author,
      search,
      limit = 10,
      page = 1,
      offset,
      isSticky,
    } = req.query;
    const user = req.user || { role: 'viewer', id: null };

    if (status) query.status = status;
    if (category) query.categories = category;
    if (author) query['authors.user'] = author;
    if (search) query.title = { $regex: search, $options: 'i' };

    if (!['admin', 'manager', 'editor'].includes(user.role || '')) {
      if (user.id) {
        query.$or = [{ status: 'published' }, { 'authors.user': user.id }];
      } else {
        query.status = 'published';
      }
    }

    if (typeof isSticky !== 'undefined') {
      if (isSticky === 'true') {
        query.isSticky = true;
      } else if (isSticky === 'false') {
        query.isSticky = false;
      }
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedOffset = Number.isNaN(parseInt(offset, 10))
      ? null
      : Math.max(parseInt(offset, 10), 0);
    const skip = parsedOffset !== null ? parsedOffset : (parsedPage - 1) * parsedLimit;

    const [totalItems, articles] = await Promise.all([
      Article.countDocuments(query),
      Article.find(query)
        .populate('authors.user', 'username profilePicture')
        .populate('categories', 'name')
        .populate('tags', 'name')
        .populate('featuredImage', 'url title')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
    ]);

    const nextOffset = skip + articles.length;

    res.json({
      data: articles,
      page: parsedPage,
      limit: parsedLimit,
      total: totalItems,
      hasMore: nextOffset < totalItems,
      offset: skip,
      nextOffset,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Retrieve a single article by id, enforcing visibility rules for unpublished
 * content and incrementing the view counter for published pieces. This is the only
 * endpoint that mutates view counts as part of the read.
 */
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('authors.user', 'username profilePicture')
      .populate('categories', 'name')
      .populate('tags', 'name')
      .populate('featuredImage', 'url title');

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check viewing permissions
    if (article.status !== 'published' && 
        !article.authors.some(a => a.user._id.equals(req.user.id)) &&
        !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Increment view count for published articles
    if (article.status === 'published') {
      article.viewCount += 1;
      await article.save();
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing article after validating authorship and role permissions.
 * Unlike `createArticle`, this route preserves the existing document and only
 * applies the provided changes.
 */
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check edit permissions
    const isAuthor = article.authors.some(a => a.user.equals(req.user.id));

    /*
    const canEditAny = checkPermission(req.user.role, 'editAnyArticle');
    const canEditOwn = checkPermission(req.user.role, 'editOwnArticle');

    if (!canEditAny && !(isAuthor && canEditOwn)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
      */

    // Managers can only edit articles in their categories
    if (req.user.role === 'manager' && !canEditAny) {
      const userCategories = req.user.categories || [];
      const articleCategories = article.categories.map(c => c.toString());
      const hasCommonCategory = userCategories.some(c => articleCategories.includes(c.toString()));

      if (!hasCommonCategory) {
        return res.status(403).json({ message: 'Unauthorized for this category' });
      }
    }

    // Validate authors if provided
    if (updates.authors) {
      updates.authors = validateAuthors(updates.authors, req.user);
    }

    updates.updatedBy = req.user.id;
    const updatedArticle = await Article.findByIdAndUpdate(id, updates, { new: true });

    res.json(updatedArticle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Permanently delete an article and any saved-article references tied to it.
 * This goes beyond `updateArticle`'s soft edits by removing the document entirely.
 */
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check delete permissions
    const isAuthor = article.authors.some(a => a.user.equals(req.user.id));

    /*
    const canDeleteAny = checkPermission(req.user.role, 'deleteAnyArticle');
    const canDeleteOwn = checkPermission(req.user.role, 'deleteOwnArticle');

    if (!canDeleteAny && !(isAuthor && canDeleteOwn)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
      */

    // Managers can only delete articles in their categories
    if (req.user.role === 'manager' && !canDeleteAny) {
      const userCategories = req.user.categories || [];
      const articleCategories = article.categories.map(c => c.toString());
      const hasCommonCategory = userCategories.some(c => articleCategories.includes(c.toString()));

      if (!hasCommonCategory) {
        return res.status(403).json({ message: 'Unauthorized for this category' });
      }
    }

    await Article.findByIdAndDelete(req.params.id);
    await SavedArticle.deleteMany({ article: req.params.id });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Toggle the saved state of a published article for the current user. Unlike the CRUD
 * endpoints above, this works against the SavedArticle collection and is only allowed
 * when the article is already public.
 */
exports.toggleSaveArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;

    // Check if article exists and is published
    const article = await Article.findById(articleId);
    if (!article || article.status !== 'published') {
      return res.status(404).json({ message: 'Article not available' });
    }

    // Check if already saved
    const existing = await SavedArticle.findOne({ user: userId, article: articleId });
    if (existing) {
      await SavedArticle.findByIdAndDelete(existing._id);
      return res.json({ saved: false });
    }

    // Save article
    await SavedArticle.create({ user: userId, article: articleId });
    res.json({ saved: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Transition an article to the published state and stamp `publishedAt`. This is a
 * specialized mutation compared to the more general `updateArticle`, ensuring the
 * publish workflow always sets the expected fields.
 */
exports.publishArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check publish permissions
    /*
    if (!checkPermission(req.user.role, 'publishArticle')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
      */

    article.status = 'published';
    article.publishedAt = new Date();
    article.updatedBy = req.user.id;
    await article.save();

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
