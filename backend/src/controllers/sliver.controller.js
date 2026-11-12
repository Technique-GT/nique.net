"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSliver = exports.getAllSlivers = exports.createSliver = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Sliver_1 = __importDefault(require("../models/Sliver"));
const security_1 = require("../utils/security");
const SLIVER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const toObjectId = (id) => {
    if (!id || Array.isArray(id) || !mongoose_1.default.Types.ObjectId.isValid(id))
        return null;
    return new mongoose_1.default.Types.ObjectId(id);
};
const createSliver = async (req, res) => {
    try {
        const textRaw = typeof req.body?.text === 'string' ? req.body.text : typeof req.body?.content === 'string' ? req.body.content : '';
        const text = textRaw.trim();
        if (!text) {
            res.status(400).json({ success: false, message: 'text is required' });
            return;
        }
        const expiresAt = new Date(Date.now() + SLIVER_TTL_MS);
        const sliver = await Sliver_1.default.create({ text, expiresAt });
        res.status(201).json({ success: true, data: sliver });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error creating sliver', error));
    }
};
exports.createSliver = createSliver;
const getAllSlivers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, sortBy, sortDir } = req.query;
        const query = {};
        if (typeof search === 'string' && search.trim().length > 0) {
            const rx = (0, security_1.safeRegex)(search.trim());
            query.text = rx;
        }
        const pageNum = Math.max(Number(page) || 1, 1);
        const limitNum = Math.max(Number(limit) || 20, 1);
        const skip = (pageNum - 1) * limitNum;
        const sortKey = sortBy ?? 'createdAt';
        const sortDirection = sortDir === 'asc' ? 1 : -1;
        const [slivers, total] = await Promise.all([
            Sliver_1.default.find(query).sort({ [sortKey]: sortDirection }).skip(skip).limit(limitNum).lean(),
            Sliver_1.default.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: slivers,
            count: slivers.length,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching slivers', error));
    }
};
exports.getAllSlivers = getAllSlivers;
const deleteSliver = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({ success: false, message: 'Invalid sliver ID' });
            return;
        }
        const sliver = await Sliver_1.default.findByIdAndDelete(objectId);
        if (!sliver) {
            res.status(404).json({ success: false, message: 'Sliver not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Sliver deleted successfully' });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error deleting sliver', error));
    }
};
exports.deleteSliver = deleteSliver;
