"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteUsers = exports.inviteUser = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const security_1 = require("../utils/security");
const SOCIAL_PLATFORM_HOSTS = {
    instagram: 'instagram.com',
    linkedin: 'linkedin.com',
    github: 'github.com',
    x: 'x.com',
    youtube: 'youtube.com',
    facebook: 'facebook.com',
};
const isAllowedSocialUrl = (rawUrl, platform) => {
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }
        if (platform === 'website') {
            return true;
        }
        const hostname = parsed.hostname.toLowerCase();
        const expected = SOCIAL_PLATFORM_HOSTS[platform];
        return hostname === expected || hostname.endsWith(`.${expected}`);
    }
    catch {
        return false;
    }
};
const readSocialLinks = (value) => {
    if (!Array.isArray(value))
        return [];
    return value
        .map((v) => ({
        platform: typeof v?.platform === 'string' ? v.platform.trim().toLowerCase() : '',
        url: typeof v?.url === 'string' ? v.url.trim() : '',
    }))
        .filter((v) => v.platform.length > 0 &&
        v.url.length > 0 &&
        isAllowedSocialUrl(v.url, v.platform));
};
const getUsers = async (req, res) => {
    try {
        const { page = '1', limit = '20', search, isAdmin, sortBy, sortDir } = req.query;
        const filter = {};
        if (typeof isAdmin === 'string') {
            filter.isAdmin = isAdmin === 'true';
        }
        if (typeof search === 'string' && search.trim().length > 0) {
            const rx = (0, security_1.safeRegex)(search.trim());
            filter.$or = [{ name: rx }, { bio: rx }, { email: rx }];
        }
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.max(parseInt(limit, 10) || 20, 1);
        const skip = (pageNum - 1) * limitNum;
        const allowedSortFields = {
            name: 'name',
            email: 'email',
            isAdmin: 'isAdmin',
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        };
        const sortKey = typeof sortBy === 'string' && allowedSortFields[sortBy]
            ? allowedSortFields[sortBy]
            : 'name';
        const sortDirection = typeof sortDir === 'string' && sortDir.toLowerCase() === 'desc' ? -1 : 1;
        const [users, total] = await Promise.all([
            User_1.default.find(filter).sort({ [sortKey]: sortDirection }).skip(skip).limit(limitNum).lean(),
            User_1.default.countDocuments(filter),
        ]);
        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching users', error));
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching user', error));
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const nameRaw = typeof req.body?.name === 'string' ? req.body.name : '';
        const name = nameRaw.trim();
        if (!name) {
            res.status(400).json({ success: false, message: 'Name is required' });
            return;
        }
        const bio = typeof req.body?.bio === 'string' ? req.body.bio : undefined;
        const isAdmin = typeof req.body?.isAdmin === 'boolean' ? req.body.isAdmin : false;
        const emailRaw = typeof req.body?.email === 'string' ? req.body.email : undefined;
        const email = emailRaw?.trim().toLowerCase() || undefined;
        if (email) {
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                res.status(400).json({ success: false, message: 'email already in use' });
                return;
            }
        }
        const googleSubRaw = typeof req.body?.googleSub === 'string' ? req.body.googleSub : undefined;
        const googleSub = googleSubRaw?.trim() || undefined;
        if (googleSub) {
            const existingUser = await User_1.default.findOne({ googleSub });
            if (existingUser) {
                res.status(400).json({ success: false, message: 'googleSub already in use' });
                return;
            }
        }
        const profilePictureUrlRaw = typeof req.body?.profilePictureUrl === 'string' ? req.body.profilePictureUrl.trim() : '';
        const profilePictureUrl = profilePictureUrlRaw.length > 0 ? profilePictureUrlRaw : undefined;
        const socialLinks = readSocialLinks(req.body?.socialLinks);
        const user = await User_1.default.create({
            name,
            ...(bio ? { bio } : {}),
            isAdmin,
            ...(email ? { email } : {}),
            ...(googleSub ? { googleSub } : {}),
            ...(profilePictureUrl ? { profilePictureUrl } : {}),
            socialLinks,
        });
        res.status(201).json({ success: true, message: 'User created successfully', data: user });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error creating user', error));
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const update = {};
        const unset = {};
        if (typeof req.body?.name === 'string') {
            update.name = req.body.name.trim();
            if (!update.name) {
                res.status(400).json({ success: false, message: 'Name cannot be empty' });
                return;
            }
        }
        if (typeof req.body?.bio === 'string' || req.body?.bio === null) {
            if (req.body.bio === null) {
                unset.bio = 1;
            }
            else {
                update.bio = req.body.bio;
            }
        }
        if (typeof req.body?.isAdmin === 'boolean') {
            update.isAdmin = req.body.isAdmin;
        }
        if (typeof req.body?.email === 'string' || req.body?.email === null) {
            const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
            if (req.body.email === null) {
                unset.email = 1;
            }
            else if (!email) {
                res.status(400).json({ success: false, message: 'email cannot be empty' });
                return;
            }
            else {
                const existingUser = await User_1.default.findOne({ email, _id: { $ne: id } });
                if (existingUser) {
                    res.status(400).json({ success: false, message: 'email already in use' });
                    return;
                }
                update.email = email;
            }
        }
        if (typeof req.body?.googleSub === 'string' || req.body?.googleSub === null) {
            const googleSub = typeof req.body?.googleSub === 'string' ? req.body.googleSub.trim() : '';
            if (req.body.googleSub === null) {
                unset.googleSub = 1;
            }
            else if (!googleSub) {
                res.status(400).json({ success: false, message: 'googleSub cannot be empty' });
                return;
            }
            else {
                const existingUser = await User_1.default.findOne({ googleSub, _id: { $ne: id } });
                if (existingUser) {
                    res.status(400).json({ success: false, message: 'googleSub already in use' });
                    return;
                }
                update.googleSub = googleSub;
            }
        }
        if (typeof req.body?.profilePictureUrl === 'string' || req.body?.profilePictureUrl === null) {
            if (req.body.profilePictureUrl === null) {
                unset.profilePictureUrl = 1;
            }
            else {
                const url = req.body.profilePictureUrl.trim();
                update.profilePictureUrl = url;
            }
        }
        if (req.body?.socialLinks !== undefined) {
            update.socialLinks = readSocialLinks(req.body.socialLinks);
        }
        const updateOps = {};
        if (Object.keys(update).length > 0) {
            updateOps.$set = update;
        }
        if (Object.keys(unset).length > 0) {
            updateOps.$unset = unset;
        }
        const user = await User_1.default.findByIdAndUpdate(id, updateOps, { new: true, runValidators: true });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'User updated successfully', data: user });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error updating user', error));
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const user = await User_1.default.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error deleting user', error));
    }
};
exports.deleteUser = deleteUser;
const inviteUser = async (_req, res) => {
    res.status(501).json({ success: false, message: 'inviteUser not implemented in canonical user model' });
};
exports.inviteUser = inviteUser;
const bulkDeleteUsers = async (req, res) => {
    try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
        const objectIds = ids.map((id) => (typeof id === 'string' && mongoose_1.default.Types.ObjectId.isValid(id) ? new mongoose_1.default.Types.ObjectId(id) : null)).filter(Boolean);
        if (objectIds.length === 0) {
            res.status(400).json({ success: false, message: 'No valid user IDs provided' });
            return;
        }
        const result = await User_1.default.deleteMany({ _id: { $in: objectIds } });
        res.status(200).json({ success: true, message: 'Users deleted successfully', data: { deletedCount: result.deletedCount } });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error deleting users', error));
    }
};
exports.bulkDeleteUsers = bulkDeleteUsers;
