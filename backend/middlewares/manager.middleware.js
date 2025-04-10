const Article = require('../models/article.model');

exports.verifyManagerCategory = async (req, res, next) => {
  try {
    if (req.user.role !== 'manager') return next();

    const articleId = req.params.id || req.params.articleId;
    const article = await Article.findById(articleId).select('categories');
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const userCategories = req.user.categories || [];
    const hasPermission = article.categories.some(cat => 
      userCategories.includes(cat.toString())
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Not authorized for this article category' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};