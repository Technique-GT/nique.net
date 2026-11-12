"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTagStats = exports.hardDeleteTag = exports.deleteTag = exports.updateTag = exports.getTagBySlug = exports.getTagById = exports.getTags = exports.createTag = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Tag_1 = __importDefault(require("../models/Tag"));
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
const createTag = async (req, res) => {
    try {
        const nameRaw = typeof req.body?.name === 'string' ? req.body.name : '';
        const name = nameRaw.trim();
        if (!name) {
            res.status(400).json({ success: false, message: 'Tag name is required' });
            return;
        }
        const slug = typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0 ? req.body.slug.trim() : slugify(name);
        const existing = await Tag_1.default.findOne({ $or: [{ slug }, { name: { $regex: new RegExp(`^${(0, security_1.escapeRegex)(name)}$`, 'i') } }] });
        if (existing) {
            res.status(409).json({ success: false, message: 'Tag with this name or slug already exists' });
            return;
        }
        const tag = await Tag_1.default.create({ name, slug });
        res.status(201).json({ success: true, message: 'Tag created successfully', data: tag });
    }
    catch (error) {
        if (error?.code === 11000) {
            res.status(409).json({ success: false, message: 'Tag with this slug already exists' });
            return;
        }
        res.status(500).json((0, security_1.safeErrorResponse)('Server error', error));
    }
};
exports.createTag = createTag;
const getTags = async (req, res) => {
    try {
        const { search } = req.query;
        const query = {};
        if (typeof search === 'string' && search.trim().length > 0) {
            const rx = (0, security_1.safeRegex)(search.trim());
            query.$or = [{ name: rx }, { slug: rx }];
        }
        const tags = await Tag_1.default.find(query).sort({ name: 1 }).lean();
        res.status(200).json({ success: true, data: tags, count: tags.length });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching tags', error));
    }
};
exports.getTags = getTags;
const getTagById = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({ success: false, message: 'Invalid tag ID' });
            return;
        }
        const tag = await Tag_1.default.findById(objectId);
        if (!tag) {
            res.status(404).json({ success: false, message: 'Tag not found' });
            return;
        }
        res.status(200).json({ success: true, data: tag });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching tag', error));
    }
};
exports.getTagById = getTagById;
const getTagBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const tag = await Tag_1.default.findOne({ slug });
        if (!tag) {
            res.status(404).json({ success: false, message: 'Tag not found' });
            return;
        }
        res.status(200).json({ success: true, data: tag });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching tag', error));
    }
};
exports.getTagBySlug = getTagBySlug;
const updateTag = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({ success: false, message: 'Invalid tag ID' });
            return;
        }
        const update = {};
        if (typeof req.body?.name === 'string') {
            update.name = req.body.name.trim();
            if (!update.name) {
                res.status(400).json({ success: false, message: 'Tag name cannot be empty' });
                return;
            }
        }
        if (typeof req.body?.slug === 'string' && req.body.slug.trim().length > 0) {
            update.slug = req.body.slug.trim();
        }
        else if (update.name) {
            update.slug = slugify(update.name);
        }
        const tag = await Tag_1.default.findByIdAndUpdate(objectId, update, { new: true, runValidators: true });
        if (!tag) {
            res.status(404).json({ success: false, message: 'Tag not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Tag updated successfully', data: tag });
    }
    catch (error) {
        if (error?.code === 11000) {
            res.status(409).json({ success: false, message: 'Tag with this slug already exists' });
            return;
        }
        res.status(500).json((0, security_1.safeErrorResponse)('Error updating tag', error));
    }
};
exports.updateTag = updateTag;
const deleteTag = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({ success: false, message: 'Invalid tag ID' });
            return;
        }
        const tag = await Tag_1.default.findByIdAndDelete(objectId);
        if (!tag) {
            res.status(404).json({ success: false, message: 'Tag not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Tag deleted successfully' });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error deleting tag', error));
    }
};
exports.deleteTag = deleteTag;
exports.hardDeleteTag = exports.deleteTag;
const getTagStats = async (_req, res) => {
    try {
        const totalTags = await Tag_1.default.countDocuments({});
        res.status(200).json({ success: true, data: { totalTags } });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching tag stats', error));
    }
};
exports.getTagStats = getTagStats;
