"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserArticleCount = exports.mergeUsers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Article_1 = __importDefault(require("../models/Article"));
const security_1 = require("../utils/security");
const MERGEABLE_FIELDS = ['name', 'bio', 'email', 'profilePictureUrl', 'socialLinks', 'isAdmin'];
const mergeUsers = async (req, res) => {
    const body = req.body;
    const sourceId = typeof body?.sourceId === 'string' && mongoose_1.default.Types.ObjectId.isValid(body.sourceId)
        ? body.sourceId
        : null;
    const targetId = typeof body?.targetId === 'string' && mongoose_1.default.Types.ObjectId.isValid(body.targetId)
        ? body.targetId
        : null;
    if (!sourceId || !targetId) {
        res.status(400).json({ success: false, message: 'Valid sourceId and targetId are required' });
        return;
    }
    if (sourceId === targetId) {
        res.status(400).json({ success: false, message: 'sourceId and targetId must be different' });
        return;
    }
    const keepFields = body?.keepFields ?? {};
    for (const field of MERGEABLE_FIELDS) {
        const val = keepFields[field];
        if (val !== undefined && val !== 'source' && val !== 'target') {
            res.status(400).json({
                success: false,
                message: `keepFields.${field} must be "source" or "target"`,
            });
            return;
        }
    }
    try {
        const result = await executeMerge(sourceId, targetId, keepFields);
        res.status(200).json({
            success: true,
            message: 'Users merged successfully',
            data: result,
        });
    }
    catch (error) {
        const message = typeof error?.message === 'string' ? error.message : 'Error merging users';
        if (message === 'Source user not found' || message === 'Target user not found') {
            res.status(404).json({ success: false, message });
            return;
        }
        res.status(500).json((0, security_1.safeErrorResponse)('Error merging users', error));
    }
};
exports.mergeUsers = mergeUsers;
async function performMerge(sourceId, targetId, keepFields, session) {
    const sessionOpt = session ? { session } : {};
    const [sourceUser, targetUser] = await Promise.all([
        User_1.default.findById(sourceId).session(session ?? null).lean(),
        User_1.default.findById(targetId).session(session ?? null).lean(),
    ]);
    if (!sourceUser)
        throw new Error('Source user not found');
    if (!targetUser)
        throw new Error('Target user not found');
    const update = {};
    const unset = {};
    for (const field of MERGEABLE_FIELDS) {
        if (keepFields[field] !== 'source')
            continue;
        const sourceVal = sourceUser[field];
        if (sourceVal === undefined || sourceVal === null) {
            unset[field] = 1;
        }
        else {
            update[field] = sourceVal;
        }
    }
    const updateOps = {};
    if (Object.keys(update).length > 0)
        updateOps.$set = update;
    if (Object.keys(unset).length > 0)
        updateOps.$unset = unset;
    if (Object.keys(updateOps).length > 0) {
        await User_1.default.updateOne({ _id: targetId }, updateOps, sessionOpt);
    }
    const sourceOid = new mongoose_1.default.Types.ObjectId(sourceId);
    const targetOid = new mongoose_1.default.Types.ObjectId(targetId);
    const articlesWithSource = await Article_1.default.find({
        'authors.authorId': sourceOid,
    }).session(session ?? null).select('_id authors');
    let articlesUpdated = 0;
    for (const article of articlesWithSource) {
        const authorIds = article.authors.map((a) => a.authorId.toString());
        const hasTarget = authorIds.includes(targetId);
        if (hasTarget) {
            await Article_1.default.updateOne({ _id: article._id }, { $pull: { authors: { authorId: sourceOid } } }, sessionOpt);
        }
        else {
            await Article_1.default.updateOne({ _id: article._id, 'authors.authorId': sourceOid }, { $set: { 'authors.$.authorId': targetOid } }, sessionOpt);
        }
        articlesUpdated++;
    }
    const ownerResult = await Article_1.default.updateMany({ ownerId: sourceOid }, { $set: { ownerId: targetOid } }, sessionOpt);
    articlesUpdated = Math.max(articlesUpdated, ownerResult.modifiedCount);
    await Article_1.default.updateMany({ reviewedBy: sourceOid }, { $set: { reviewedBy: targetOid } }, sessionOpt);
    await User_1.default.deleteOne({ _id: sourceOid }, sessionOpt);
    const mergedUser = await User_1.default.findById(targetId).lean();
    return { mergedUser, articlesUpdated };
}
async function executeMerge(sourceId, targetId, keepFields) {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const result = await performMerge(sourceId, targetId, keepFields, session);
        await session.commitTransaction();
        return result;
    }
    catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('Transaction numbers are only allowed on a replica set')) {
            await session.endSession();
            return performMerge(sourceId, targetId, keepFields);
        }
        throw error;
    }
    finally {
        if (session.hasEnded === false) {
            await session.endSession();
        }
    }
}
const getUserArticleCount = async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id : '';
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid user ID' });
        return;
    }
    try {
        const userId = new mongoose_1.default.Types.ObjectId(id);
        const count = await Article_1.default.countDocuments({
            $or: [
                { 'authors.authorId': userId },
                { ownerId: userId },
            ],
        });
        res.status(200).json({ success: true, data: { count } });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error counting articles', error));
    }
};
exports.getUserArticleCount = getUserArticleCount;
