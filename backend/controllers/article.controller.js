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

exports.getAllArticles = async (req, res) => {
  try {
    let query = {};
    const { status, category, author, search, limit } = req.query;
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

    let articleQuery = Article.find(query)
      .populate('authors.user', 'username profilePicture')
      .populate('categories', 'name')
      .populate('tags', 'name')
      .populate('featuredImage', 'url title')
      .sort({ createdAt: -1 });

    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      articleQuery = articleQuery.limit(parsedLimit);
    }

    const articles = await articleQuery;

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getArticleByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit } = req.query;
    const parsedLimit = parseInt(limit, 10);

    let articleQuery = Article.find({ 
      categories: categoryId, 
      status: 'published' 
    })
    .populate('authors.user', 'username profilePicture')
    .populate('categories', 'name')
    .populate('tags', 'name')
    .populate('featuredImage', 'url title')
    .sort({ createdAt: -1 });

    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      articleQuery = articleQuery.limit(parsedLimit);
    }

    const articles = await articleQuery;

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
