"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubCategoryStats = exports.getSubCategoriesByCategory = exports.hardDeleteSubCategory = exports.deleteSubCategory = exports.updateSubCategory = exports.getSubCategoryBySlug = exports.getSubCategoryById = exports.getSubCategories = exports.createSubCategory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Subcategory_1 = __importDefault(require("../models/Subcategory"));
const Category_1 = __importDefault(require("../models/Category"));
const security_1 = require("../utils/security");
const toObjectId = (id) => {
    if (!id || Array.isArray(id) || !mongoose_1.default.Types.ObjectId.isValid(id))
        return null;
    return new mongoose_1.default.Types.ObjectId(id);
};
const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
const createSubCategory = async (req, res) => {
    try {
        const nameRaw = typeof req.body?.name === 'string' ? req.body.name : '';
        const name = nameRaw.trim();
        if (!name) {
            res.status(400).json({ success: false, message: 'Sub-category name is required' });
            return;
        }
        const categoryIdRaw = typeof req.body?.categoryId === 'string' ? req.body.categoryId : typeof req.body?.category === 'string' ? req.body.category : undefined;
        const categoryId = toObjectId(categoryIdRaw);
        if (!categoryId) {
            res.status(400).json({ success: false, message: 'Invalid category ID' });
            return;
        }
        const parentCategory = await Category_1.default.findById(categoryId);
        if (!parentCategory) {
            res.status(404).json({ success: false, message: 'Parent category not found' });
            return;
        }
        const slug = typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0 ? req.body.slug.trim() : slugify(name);
        const existing = await Subcategory_1.default.findOne({ $or: [{ slug }, { name: { $regex: new RegExp(`^${(0, security_1.escapeRegex)(name)}$`, 'i') } }] });
        if (existing) {
            res.status(409).json({ success: false, message: 'Sub-category with this name or slug already exists' });
            return;
        }
        const subCategory = await Subcategory_1.default.create({ name, slug, categoryId });
        res.status(201).json({ success: true, message: 'Sub-category created successfully', data: subCategory });
    }
    catch (error) {
        if (error?.code === 11000) {
            res.status(409).json({ success: false, message: 'Sub-category with this slug already exists' });
            return;
        }
        res.status(500).json((0, security_1.safeErrorResponse)('Server error', error));
    }
};
exports.createSubCategory = createSubCategory;
const getSubCategories = async (req, res) => {
    try {
        const { search, category, categoryId } = req.query;
        const query = {};
        if (typeof search === 'string' && search.trim().length > 0) {
            const rx = (0, security_1.safeRegex)(search.trim());
            query.$or = [{ name: rx }, { slug: rx }];
        }
        const catRaw = typeof categoryId === 'string' ? categoryId : typeof category === 'string' ? category : undefined;
        if (catRaw) {
            const catId = toObjectId(catRaw);
            if (!catId) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }
            query.categoryId = catId;
        }
        const subCategories = await Subcategory_1.default.find(query).sort({ name: 1 }).lean();
        res.status(200).json({ success: true, data: subCategories, count: subCategories.length });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching sub-categories', error));
    }
};
exports.getSubCategories = getSubCategories;
const getSubCategoryById = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({ success: false, message: 'Invalid sub-category ID' });
            return;
        }
        const subCategory = await Subcategory_1.default.findById(objectId);
        if (!subCategory) {
            res.status(404).json({ success: false, message: 'Sub-category not found' });
            return;
        }
        res.status(200).json({ success: true, data: subCategory });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching sub-category', error));
    }
};
exports.getSubCategoryById = getSubCategoryById;
const getSubCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const subCategory = await Subcategory_1.default.findOne({ slug });
        if (!subCategory) {
            res.status(404).json({ success: false, message: 'Sub-category not found' });
            return;
        }
        res.status(200).json({ success: true, data: subCategory });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching sub-category', error));
    }
};
exports.getSubCategoryBySlug = getSubCategoryBySlug;
const updateSubCategory = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({ success: false, message: 'Invalid sub-category ID' });
            return;
        }
        const update = {};
        if (typeof req.body?.name === 'string') {
            update.name = req.body.name.trim();
            if (!update.name) {
                res.status(400).json({ success: false, message: 'Sub-category name cannot be empty' });
                return;
            }
        }
        if (typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0) {
            update.slug = req.body.slug.trim();
        }
        else if (update.name) {
            update.slug = slugify(update.name);
        }
        const categoryIdRaw = typeof req.body?.categoryId === 'string' ? req.body.categoryId : typeof req.body?.category === 'string' ? req.body.category : undefined;
        if (categoryIdRaw !== undefined) {
            const catId = toObjectId(categoryIdRaw);
            if (!catId) {
                res.status(400).json({ success: false, message: 'Invalid category ID' });
                return;
            }
            const parentCategory = await Category_1.default.findById(catId);
            if (!parentCategory) {
                res.status(404).json({ success: false, message: 'Category not found' });
                return;
            }
            update.categoryId = catId;
        }
        const subCategory = await Subcategory_1.default.findByIdAndUpdate(objectId, update, { new: true, runValidators: true });
        if (!subCategory) {
            res.status(404).json({ success: false, message: 'Sub-category not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Sub-category updated successfully', data: subCategory });
    }
    catch (error) {
        if (error?.code === 11000) {
            res.status(409).json({ success: false, message: 'Sub-category with this slug already exists' });
            return;
        }
        res.status(500).json((0, security_1.safeErrorResponse)('Error updating sub-category', error));
    }
};
exports.updateSubCategory = updateSubCategory;
const deleteSubCategory = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({ success: false, message: 'Invalid sub-category ID' });
            return;
        }
        const subCategory = await Subcategory_1.default.findByIdAndDelete(objectId);
        if (!subCategory) {
            res.status(404).json({ success: false, message: 'Sub-category not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Sub-category deleted successfully' });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error deleting sub-category', error));
    }
};
exports.deleteSubCategory = deleteSubCategory;
exports.hardDeleteSubCategory = exports.deleteSubCategory;
const getSubCategoriesByCategory = async (req, res) => {
    try {
        const categoryObjectId = toObjectId(req.params.categoryId);
        if (!categoryObjectId) {
            res.status(400).json({ success: false, message: 'Invalid category ID' });
            return;
        }
        const subCategories = await Subcategory_1.default.find({ categoryId: categoryObjectId }).sort({ name: 1 }).lean();
        res.status(200).json({ success: true, data: subCategories, count: subCategories.length });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching sub-categories', error));
    }
};
exports.getSubCategoriesByCategory = getSubCategoriesByCategory;
const getSubCategoryStats = async (_req, res) => {
    try {
        const totalSubCategories = await Subcategory_1.default.countDocuments({});
        res.status(200).json({ success: true, data: { totalSubCategories } });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching sub-category stats', error));
    }
};
exports.getSubCategoryStats = getSubCategoryStats;
