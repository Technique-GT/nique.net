"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryStats = exports.hardDeleteCategory = exports.deleteCategory = exports.updateCategory = exports.getCategoryBySlug = exports.getCategoryById = exports.getCategories = exports.createCategory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Category_1 = __importDefault(require("../models/Category"));
const Subcategory_1 = __importDefault(require("../models/Subcategory"));
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
const createCategory = async (req, res) => {
    try {
        const nameRaw = typeof req.body?.name === 'string' ? req.body.name : '';
        const name = nameRaw.trim();
        if (!name) {
            res.status(400).json({ success: false, message: 'Category name is required' });
            return;
        }
        const slug = typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0 ? req.body.slug.trim() : slugify(name);
        const existing = await Category_1.default.findOne({ $or: [{ slug }, { name: { $regex: new RegExp(`^${(0, security_1.escapeRegex)(name)}$`, 'i') } }] });
        if (existing) {
            res.status(409).json({ success: false, message: 'Category with this name or slug already exists' });
            return;
        }
        const category = await Category_1.default.create({ name, slug });
        res.status(201).json({ success: true, message: 'Category created successfully', data: category });
    }
    catch (error) {
        if (error?.code === 11000) {
            res.status(409).json({ success: false, message: 'Category with this slug already exists' });
            return;
        }
        res.status(500).json((0, security_1.safeErrorResponse)('Server error', error));
    }
};
exports.createCategory = createCategory;
const getCategories = async (req, res) => {
    try {
        const { search } = req.query;
        const query = {};
        if (typeof search === 'string' && search.trim().length > 0) {
            const rx = (0, security_1.safeRegex)(search.trim());
            query.$or = [{ name: rx }, { slug: rx }];
        }
        const categories = await Category_1.default.find(query).sort({ name: 1 }).lean();
        res.status(200).json({ success: true, data: categories, count: categories.length });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching categories', error));
    }
};
exports.getCategories = getCategories;
const getCategoryById = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({ success: false, message: 'Invalid category ID' });
            return;
        }
        const category = await Category_1.default.findById(objectId);
        if (!category) {
            res.status(404).json({ success: false, message: 'Category not found' });
            return;
        }
        res.status(200).json({ success: true, data: category });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching category', error));
    }
};
exports.getCategoryById = getCategoryById;
const getCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await Category_1.default.findOne({ slug });
        if (!category) {
            res.status(404).json({ success: false, message: 'Category not found' });
            return;
        }
        res.status(200).json({ success: true, data: category });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching category', error));
    }
};
exports.getCategoryBySlug = getCategoryBySlug;
const updateCategory = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({ success: false, message: 'Invalid category ID' });
            return;
        }
        const update = {};
        if (typeof req.body?.name === 'string') {
            update.name = req.body.name.trim();
            if (!update.name) {
                res.status(400).json({ success: false, message: 'Category name cannot be empty' });
                return;
            }
        }
        if (typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0) {
            update.slug = req.body.slug.trim();
        }
        else if (update.name) {
            update.slug = slugify(update.name);
        }
        const category = await Category_1.default.findByIdAndUpdate(objectId, update, { new: true, runValidators: true });
        if (!category) {
            res.status(404).json({ success: false, message: 'Category not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
    }
    catch (error) {
        if (error?.code === 11000) {
            res.status(409).json({ success: false, message: 'Category with this slug already exists' });
            return;
        }
        res.status(500).json((0, security_1.safeErrorResponse)('Error updating category', error));
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({ success: false, message: 'Invalid category ID' });
            return;
        }
        const category = await Category_1.default.findByIdAndDelete(objectId);
        if (!category) {
            res.status(404).json({ success: false, message: 'Category not found' });
            return;
        }
        await Subcategory_1.default.deleteMany({ categoryId: objectId });
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error deleting category', error));
    }
};
exports.deleteCategory = deleteCategory;
exports.hardDeleteCategory = exports.deleteCategory;
const getCategoryStats = async (_req, res) => {
    try {
        const totalCategories = await Category_1.default.countDocuments({});
        res.status(200).json({ success: true, data: { totalCategories } });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching category stats', error));
    }
};
exports.getCategoryStats = getCategoryStats;
