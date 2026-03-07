import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Comment from '../models/Comment';
import Article from '../models/Article';
import CommentReaction from '../models/CommentReaction';
import { stripHtml, safeErrorResponse } from '../utils/security';

const toObjectId = (id: string | string[] | undefined): mongoose.Types.ObjectId | null => {
  if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

const getDeviceId = (req: Request): string | null => {
  const header = req.header('x-device-id');
  if (typeof header === 'string' && header.trim()) return header.trim();
  if (typeof req.body?.deviceId === 'string' && req.body.deviceId.trim()) {
    return req.body.deviceId.trim();
  }
  return null;
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const contentRaw = typeof req.body?.content === 'string' ? req.body.content : '';
    // Sanitize comment content to prevent XSS
    const content = stripHtml(contentRaw.trim());

    const articleIdRaw = typeof req.body?.articleId === 'string' ? req.body.articleId : typeof req.body?.article === 'string' ? req.body.article : undefined;
    const articleId = toObjectId(articleIdRaw);

    const parentCommentIdRaw = typeof req.body?.parentCommentId === 'string' ? req.body.parentCommentId : typeof req.body?.parentComment === 'string' ? req.body.parentComment : undefined;
    const parentCommentId = toObjectId(parentCommentIdRaw) ?? undefined;

    const usernameRaw = typeof req.body?.username === 'string' ? req.body.username : '';
    // Sanitize username to prevent XSS
    const username = stripHtml(usernameRaw.trim()) || 'Anonymous';

    if (!content) {
      res.status(400).json({ success: false, message: 'Comment content is required' });
      return;
    }

    if (!articleId) {
      res.status(400).json({ success: false, message: 'Invalid article ID' });
      return;
    }

    const article = await Article.findById(articleId);
    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId);
      if (!parent) {
        res.status(404).json({ success: false, message: 'Parent comment not found' });
        return;
      }
      if (String(parent.articleId) !== String(articleId)) {
        res.status(400).json({ success: false, message: 'Parent comment does not match article' });
        return;
      }
      if (!parent.approved) {
        res.status(400).json({ success: false, message: 'Parent comment is not approved' });
        return;
      }
    }

    const comment = await Comment.create({
      articleId,
      ...(parentCommentId ? { parentCommentId } : {}),
      content,
      username,
      thumbsUp: 0,
      thumbsDown: 0,
      approved: false,
    });

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully. It will appear after approval.',
      data: comment,
    });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Server error', error));
  }
};

export const getCommentsByArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const articleId = (req.params as any).articleId ?? (req.query as any).articleId;
    const { status = 'approved', includeReplies = 'true', page = '1', limit = '50' } = req.query as any;
    const deviceId = getDeviceId(req);

    const articleObjectId = toObjectId(articleId);
    if (!articleObjectId) {
      res.status(400).json({ success: false, message: 'Invalid article ID' });
      return;
    }

    const query: any = { articleId: articleObjectId };

    if (status === 'approved') query.approved = true;
    if (status === 'pending') query.approved = false;

    if (includeReplies === 'false') {
      query.$or = [{ parentCommentId: { $exists: false } }, { parentCommentId: null }];
    }

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit as string, 10) || 50, 1);
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
      Comment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Comment.countDocuments(query),
    ]);

    const reactionMap = new Map<string, 'up' | 'down'>();
    if (deviceId && comments.length > 0) {
      const ids = comments.map((c) => c._id);
      const reactions = await CommentReaction.find({ commentId: { $in: ids }, deviceId }).lean();
      for (const reaction of reactions) {
        reactionMap.set(String(reaction.commentId), reaction.reaction);
      }
    }

    // Structure comments as a tree (parent with children)
    const byId = new Map<string, any>();
    const roots: any[] = [];

    for (const c of comments) {
      const myReaction = reactionMap.get(String(c._id)) ?? null;
      byId.set(String(c._id), { ...c, myReaction, replies: [] });
    }

    for (const c of comments) {
      const node = byId.get(String(c._id));
      const parentId = c.parentCommentId ? String(c.parentCommentId) : null;

      if (parentId && byId.has(parentId)) {
        byId.get(parentId).replies.push(node);
      } else {
        roots.push(node);
      }
    }

    res.status(200).json({
      success: true,
      data: roots,
      count: roots.length,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
    });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching comments', error));
  }
};

export const getCommentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid comment ID' });
      return;
    }
    const deviceId = getDeviceId(req);

    const comment = await Comment.findById(objectId).lean();
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    let myReaction: 'up' | 'down' | null = null;
    if (deviceId) {
      const reaction = await CommentReaction.findOne({ commentId: comment._id, deviceId }).lean();
      if (reaction?.reaction === 'up' || reaction?.reaction === 'down') {
        myReaction = reaction.reaction;
      }
    }

    res.status(200).json({ success: true, data: { ...comment, myReaction } });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching comment', error));
  }
};

export const getAllComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '50', approved, articleId } = req.query;

    const filter: any = {};

    // If articleId is provided, filter by it (Plan.md Step 4: GET /api/comments?articleId=...)
    if (typeof articleId === 'string' && articleId.trim()) {
      const articleObjectId = toObjectId(articleId);
      if (!articleObjectId) {
        res.status(400).json({ success: false, message: 'Invalid articleId' });
        return;
      }
      filter.articleId = articleObjectId;
    }

    if (typeof approved === 'string') filter.approved = approved === 'true';

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit as string, 10) || 50, 1);
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
      Comment.find(filter).populate('articleId', 'title slug').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Comment.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, data: comments, pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum } });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching comments', error));
  }
};

export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid comment ID' });
      return;
    }

    const update: any = {};
    if (typeof req.body?.content === 'string') {
      update.content = req.body.content.trim();
      if (!update.content) {
        res.status(400).json({ success: false, message: 'Content cannot be empty' });
        return;
      }
    }

    if (typeof req.body?.username === 'string') {
      update.username = req.body.username.trim() || 'Anonymous';
    }

    const comment = await Comment.findByIdAndUpdate(objectId, update, { new: true, runValidators: true });
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Comment updated successfully', data: comment });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error updating comment', error));
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid comment ID' });
      return;
    }

    const comment = await Comment.findByIdAndDelete(objectId);
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error deleting comment', error));
  }
};

export const updateCommentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid comment ID' });
      return;
    }

    let approved: boolean | undefined;
    if (typeof req.body?.approved === 'boolean') approved = req.body.approved;
    if (typeof req.body?.status === 'string') approved = req.body.status === 'approved';

    if (approved === undefined) {
      res.status(400).json({ success: false, message: 'Missing approved/status' });
      return;
    }

    const comment = await Comment.findByIdAndUpdate(objectId, { approved }, { new: true, runValidators: true });
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Comment status updated successfully', data: comment });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error updating comment status', error));
  }
};

export const likeComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, { $inc: { thumbsUp: 1 } }, { new: true });
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    res.status(200).json({ success: true, data: comment });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error liking comment', error));
  }
};

export const dislikeComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, { $inc: { thumbsDown: 1 } }, { new: true });
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    res.status(200).json({ success: true, data: comment });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error disliking comment', error));
  }
};

export const setCommentReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) {
      res.status(400).json({ success: false, message: 'Invalid comment ID' });
      return;
    }

    const deviceId = getDeviceId(req);
    if (!deviceId) {
      res.status(400).json({ success: false, message: 'Missing device ID' });
      return;
    }

    const reaction = req.body?.reaction;
    if (reaction !== 'up' && reaction !== 'down' && reaction !== null) {
      res.status(400).json({ success: false, message: 'Invalid reaction' });
      return;
    }

    const existing = await CommentReaction.findOne({ commentId: objectId, deviceId });

    let incUp = 0;
    let incDown = 0;
    let nextReaction: 'up' | 'down' | null = reaction;

    if (!existing) {
      if (reaction === null) {
        const comment = await Comment.findById(objectId);
        if (!comment) {
          res.status(404).json({ success: false, message: 'Comment not found' });
          return;
        }
        res.status(200).json({ success: true, data: { ...comment.toObject(), myReaction: null } });
        return;
      }

      await CommentReaction.create({ commentId: objectId, deviceId, reaction });
      if (reaction === 'up') incUp = 1;
      if (reaction === 'down') incDown = 1;
    } else {
      const prev = existing.reaction;
      if (reaction === null) {
        await CommentReaction.deleteOne({ _id: existing._id });
        nextReaction = null;
        if (prev === 'up') incUp = -1;
        if (prev === 'down') incDown = -1;
      } else if (prev !== reaction) {
        existing.reaction = reaction;
        await existing.save();
        if (prev === 'up') incUp -= 1;
        if (prev === 'down') incDown -= 1;
        if (reaction === 'up') incUp += 1;
        if (reaction === 'down') incDown += 1;
      } else {
        nextReaction = prev;
      }
    }

    const comment = await Comment.findByIdAndUpdate(
      objectId,
      { $inc: { thumbsUp: incUp, thumbsDown: incDown } },
      { new: true },
    );

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    res.status(200).json({ success: true, data: { ...comment.toObject(), myReaction: nextReaction } });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error updating comment reaction', error));
  }
};

export const getCommentStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, approved] = await Promise.all([
      Comment.countDocuments({}),
      Comment.countDocuments({ approved: true }),
    ]);

    res.status(200).json({ success: true, data: { totalComments: total, approvedComments: approved, pendingComments: total - approved } });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching comment stats', error));
  }
};
