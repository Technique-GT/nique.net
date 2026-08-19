import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Article from '../models/Article';
import { safeErrorResponse } from '../utils/security';

type FieldChoice = 'source' | 'target';

interface MergeBody {
  sourceId?: string;
  targetId?: string;
  keepFields?: {
    name?: FieldChoice;
    bio?: FieldChoice;
    email?: FieldChoice;
    profilePictureUrl?: FieldChoice;
    socialLinks?: FieldChoice;
    isAdmin?: FieldChoice;
  };
}

const MERGEABLE_FIELDS = ['name', 'bio', 'email', 'profilePictureUrl', 'socialLinks', 'isAdmin'] as const;

/**
 * POST /api/users/merge
 * Admin-only: merge sourceId into targetId.
 *
 * - Updates the target user's profile fields based on `keepFields`
 * - Replaces all article `authors[].authorId`, `ownerId`, and `reviewedBy`
 *   references from source → target
 * - Deduplicates the `authors` array when both users co-author the same article
 * - Deletes the source user
 *
 * Uses a MongoDB transaction when available (replica set / Atlas).
 * Falls back to sequential operations on standalone instances (local dev).
 */
export const mergeUsers = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as MergeBody;

  const sourceId =
    typeof body?.sourceId === 'string' && mongoose.Types.ObjectId.isValid(body.sourceId)
      ? body.sourceId
      : null;
  const targetId =
    typeof body?.targetId === 'string' && mongoose.Types.ObjectId.isValid(body.targetId)
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

  // Validate keepFields values
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
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Error merging users';

    if (message === 'Source user not found' || message === 'Target user not found') {
      res.status(404).json({ success: false, message });
      return;
    }

    res.status(500).json(safeErrorResponse('Error merging users', error));
  }
};

/** Core merge logic — extracted so it can be called with or without a transaction. */
async function performMerge(
  sourceId: string,
  targetId: string,
  keepFields: MergeBody['keepFields'] & {},
  session?: mongoose.ClientSession,
) {
  const sessionOpt = session ? { session } : {};

  const [sourceUser, targetUser] = await Promise.all([
    User.findById(sourceId).session(session ?? null).lean(),
    User.findById(targetId).session(session ?? null).lean(),
  ]);

  if (!sourceUser) throw new Error('Source user not found');
  if (!targetUser) throw new Error('Target user not found');

  // ── 1. Build target profile updates from keepFields ──────────────
  const update: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};

  for (const field of MERGEABLE_FIELDS) {
    if (keepFields[field] !== 'source') continue;

    const sourceVal = (sourceUser as Record<string, unknown>)[field];

    if (sourceVal === undefined || sourceVal === null) {
      unset[field] = 1;
    } else {
      update[field] = sourceVal;
    }
  }

  const updateOps: Record<string, unknown> = {};
  if (Object.keys(update).length > 0) updateOps.$set = update;
  if (Object.keys(unset).length > 0) updateOps.$unset = unset;

  if (Object.keys(updateOps).length > 0) {
    await User.updateOne({ _id: targetId }, updateOps, sessionOpt);
  }

  // ── 2. Transfer article references ───────────────────────────────
  const sourceOid = new mongoose.Types.ObjectId(sourceId);
  const targetOid = new mongoose.Types.ObjectId(targetId);

  const articlesWithSource = await Article.find({
    'authors.authorId': sourceOid,
  }).session(session ?? null).select('_id authors');

  let articlesUpdated = 0;

  for (const article of articlesWithSource) {
    const authorIds = article.authors.map((a: { authorId: mongoose.Types.ObjectId }) => a.authorId.toString());
    const hasTarget = authorIds.includes(targetId);

    if (hasTarget) {
      await Article.updateOne(
        { _id: article._id },
        { $pull: { authors: { authorId: sourceOid } } },
        sessionOpt,
      );
    } else {
      await Article.updateOne(
        { _id: article._id, 'authors.authorId': sourceOid },
        { $set: { 'authors.$.authorId': targetOid } },
        sessionOpt,
      );
    }
    articlesUpdated++;
  }

  // Transfer ownerId
  const ownerResult = await Article.updateMany(
    { ownerId: sourceOid },
    { $set: { ownerId: targetOid } },
    sessionOpt,
  );
  articlesUpdated = Math.max(articlesUpdated, ownerResult.modifiedCount);

  // Transfer reviewedBy
  await Article.updateMany(
    { reviewedBy: sourceOid },
    { $set: { reviewedBy: targetOid } },
    sessionOpt,
  );

  // ── 3. Delete source user ────────────────────────────────────────
  await User.deleteOne({ _id: sourceOid }, sessionOpt);

  const mergedUser = await User.findById(targetId).lean();

  return { mergedUser, articlesUpdated };
}

/** Try transactional merge first; fall back to non-transactional on standalone MongoDB. */
async function executeMerge(
  sourceId: string,
  targetId: string,
  keepFields: MergeBody['keepFields'] & {},
) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await performMerge(sourceId, targetId, keepFields, session);
    await session.commitTransaction();
    return result;
  } catch (error: unknown) {
    // Abort if a transaction was started
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    const msg = error instanceof Error ? error.message : '';

    // Standalone MongoDB doesn't support transactions — fall back to sequential ops
    if (msg.includes('Transaction numbers are only allowed on a replica set')) {
      await session.endSession();
      return performMerge(sourceId, targetId, keepFields);
    }

    throw error;
  } finally {
    if (session.hasEnded === false) {
      await session.endSession();
    }
  }
}

/**
 * GET /api/users/:id/article-count
 * Returns the count of articles where the user is an author or owner.
 */
export const getUserArticleCount = async (req: Request, res: Response): Promise<void> => {
  const id = typeof req.params.id === 'string' ? req.params.id : '';

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: 'Invalid user ID' });
    return;
  }

  try {
    const userId = new mongoose.Types.ObjectId(id);
    const count = await Article.countDocuments({
      $or: [
        { 'authors.authorId': userId },
        { ownerId: userId },
      ],
    });

    res.status(200).json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error counting articles', error));
  }
};
