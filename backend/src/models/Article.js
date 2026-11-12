"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const AuthorRefSchema = new mongoose_1.Schema({
    authorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Number, required: true },
}, { _id: false });
const ArticleSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true },
    content: { type: String, required: true },
    authors: { type: [AuthorRefSchema], required: true, default: [] },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: false },
    subcategoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SubCategory', required: false },
    tagIds: { type: [mongoose_1.Schema.Types.ObjectId], ref: 'Tag', required: true, default: [] },
    featuredMediaUrl: { type: String, required: false, trim: true },
    imageCaption: { type: String, required: false },
    published: { type: Boolean, required: true, default: false },
    publishedAt: { type: Date, required: false, default: null },
    allowComments: { type: Boolean, required: true, default: true },
    isFeatured: { type: Boolean, required: true, default: false },
    isSticky: { type: Boolean, required: true, default: false },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    editorState: { type: mongoose_1.Schema.Types.Mixed, required: false },
    reviewStatus: {
        type: String,
        enum: ['draft', 'in_review', 'changes_requested', 'published'],
        required: true,
        default: 'draft'
    },
    reviewedAt: { type: Date, required: false },
    reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: false },
    reviewNotes: { type: String, required: false },
    viewCount: { type: Number, required: true, default: 0 },
}, {
    timestamps: true,
});
// Canonical indexes (kept in sync with audit script expectations)
ArticleSchema.index({ slug: 1 }, { unique: true });
ArticleSchema.index({ published: 1, publishedAt: -1 });
ArticleSchema.index({ 'authors.authorId': 1, published: 1, publishedAt: -1 });
ArticleSchema.index({ categoryId: 1, published: 1, publishedAt: -1 });
ArticleSchema.index({ isFeatured: 1, published: 1, publishedAt: -1 });
ArticleSchema.index({ featuredMediaUrl: 1 }, { sparse: true });
ArticleSchema.index({ createdAt: -1, publishedAt: -1 });
exports.default = mongoose_1.default.model('Article', ArticleSchema);
