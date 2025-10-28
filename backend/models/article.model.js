const mongoose = require('mongoose');

const CATEGORY_SUBCATEGORY_MAP = Object.freeze({
  news: ['The Institute', 'City & State', 'Science & Research'],
  life: ['Events', 'RSOs', 'Student Features'],
  opinion: ['Op Ed', 'Consensus', 'Letters to the Editor'],
  entertainment: ['Music', 'Film & TV', 'Arts & Theater'],
  sports: ['Jackets', 'Atlanta']
});

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true
  },
  authors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: {
      type: Number,
      default: 0
    }
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  subcategories: [{
    category: {
      type: String,
      required: true,
      enum: Object.keys(CATEGORY_SUBCATEGORY_MAP)
    },
    value: {
      type: String,
      required: true,
      validate: {
        validator: function(subcategory) {
          const allowedSubcategories = CATEGORY_SUBCATEGORY_MAP[this.category] || [];
          return allowedSubcategories.includes(subcategory);
        },
        message: function(props) {
          return `Subcategory \"${props.value}\" is not valid for category \"${this.category}\".`;
        }
      }
    }
  }],
  featuredImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media'
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'private', 'trash'],
    default: 'draft'
  },
  isSticky: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate slug from title before saving
articleSchema.pre('save', function(next) {
  if (!this.isModified('title')) return next();
  this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  next();
});

module.exports = mongoose.model('Article', articleSchema);
