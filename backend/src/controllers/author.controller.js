"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthorByName = void 0;
const User_1 = __importDefault(require("../models/User"));
const security_1 = require("../utils/security");
const asObjectRecord = (value) => value !== null && typeof value === 'object' ? value : null;
const sanitizeSocialLinks = (value) => {
    if (!Array.isArray(value))
        return [];
    return value
        .map((entry) => {
        const candidate = asObjectRecord(entry);
        return {
            platform: typeof candidate?.platform === 'string' ? candidate.platform.trim() : '',
            url: typeof candidate?.url === 'string' ? candidate.url.trim() : '',
        };
    })
        .filter((entry) => entry.platform.length > 0 && entry.url.length > 0);
};
const getAuthorByName = async (req, res) => {
    try {
        const authorNameRaw = typeof req.params.authorName === 'string' ? req.params.authorName : '';
        const authorName = authorNameRaw.trim();
        if (!authorName) {
            res.status(400).json({ success: false, message: 'Author name is required' });
            return;
        }
        const author = await User_1.default.findOne({
            name: { $regex: new RegExp(`^${(0, security_1.escapeRegex)(authorName)}$`, 'i') },
        })
            .sort({ _id: 1 })
            .select('_id name bio profilePictureUrl socialLinks')
            .lean();
        if (!author) {
            res.status(404).json({ success: false, message: 'Author not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                _id: author._id,
                name: author.name,
                ...(typeof author.bio === 'string' ? { bio: author.bio } : {}),
                ...(typeof author.profilePictureUrl === 'string' ? { profilePictureUrl: author.profilePictureUrl } : {}),
                socialLinks: sanitizeSocialLinks(author.socialLinks),
            },
        });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching author', error));
    }
};
exports.getAuthorByName = getAuthorByName;
