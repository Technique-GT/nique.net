import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { safeRegex, safeErrorResponse } from '../utils/security';

const toObjectId = (id: string | string[] | undefined): mongoose.Types.ObjectId | null => {
  if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

const readSocialLinks = (value: any): Array<{ platform: string; url: string }> => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => ({ platform: typeof v?.platform === 'string' ? v.platform.trim() : '', url: typeof v?.url === 'string' ? v.url.trim() : '' }))
    .filter((v) => v.platform.length > 0 && v.url.length > 0);
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, isAdmin, sortBy, sortDir } = req.query;

    const filter: any = {};

    if (typeof isAdmin === 'string') {
      filter.isAdmin = isAdmin === 'true';
    }

    if (typeof search === 'string' && search.trim().length > 0) {
      const rx = safeRegex(search.trim());
      filter.$or = [{ name: rx }, { bio: rx }, { email: rx }];
    }

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit as string, 10) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields: Record<string, string> = {
      name: 'name',
      email: 'email',
      isAdmin: 'isAdmin',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };
    const sortKey =
      typeof sortBy === 'string' && allowedSortFields[sortBy]
        ? allowedSortFields[sortBy]
        : 'name';
    const sortDirection =
      typeof sortDir === 'string' && sortDir.toLowerCase() === 'desc' ? -1 : 1;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ [sortKey]: sortDirection }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
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
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching users', error));
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching user', error));
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
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
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ success: false, message: 'email already in use' });
        return;
      }
    }
    const googleSubRaw = typeof req.body?.googleSub === 'string' ? req.body.googleSub : undefined;
    const googleSub = googleSubRaw?.trim() || undefined;
    if (googleSub) {
      const existingUser = await User.findOne({ googleSub });
      if (existingUser) {
        res.status(400).json({ success: false, message: 'googleSub already in use' });
        return;
      }
    }

    const profilePictureMediaIdRaw = typeof req.body?.profilePictureMediaId === 'string' ? req.body.profilePictureMediaId : undefined;
    const profilePictureMediaId = toObjectId(profilePictureMediaIdRaw) ?? undefined;

    const socialLinks = readSocialLinks(req.body?.socialLinks);

    const user = await User.create({
      name,
      ...(bio ? { bio } : {}),
      isAdmin,
      ...(email ? { email } : {}),
      ...(googleSub ? { googleSub } : {}),
      ...(profilePictureMediaId ? { profilePictureMediaId } : {}),
      socialLinks,
    });

    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error creating user', error));
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const update: any = {};

    if (typeof req.body?.name === 'string') {
      update.name = req.body.name.trim();
      if (!update.name) {
        res.status(400).json({ success: false, message: 'Name cannot be empty' });
        return;
      }
    }

    if (typeof req.body?.bio === 'string' || req.body?.bio === null) {
      update.bio = req.body.bio ?? undefined;
    }

    if (typeof req.body?.isAdmin === 'boolean') {
      update.isAdmin = req.body.isAdmin;
    }

    if (typeof req.body?.email === 'string' || req.body?.email === null) {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (req.body.email === null) {
        update.email = undefined;
      } else if (!email) {
        res.status(400).json({ success: false, message: 'email cannot be empty' });
        return;
      } else {
        const existingUser = await User.findOne({ email, _id: { $ne: id } });
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
        update.googleSub = undefined;
      } else if (!googleSub) {
        res.status(400).json({ success: false, message: 'googleSub cannot be empty' });
        return;
      } else {
        const existingUser = await User.findOne({ googleSub, _id: { $ne: id } });
        if (existingUser) {
          res.status(400).json({ success: false, message: 'googleSub already in use' });
          return;
        }
        update.googleSub = googleSub;
      }
    }

    if (typeof req.body?.profilePictureMediaId === 'string' || req.body?.profilePictureMediaId === null) {
      const pid = toObjectId(req.body.profilePictureMediaId);
      if (req.body.profilePictureMediaId !== null && !pid) {
        res.status(400).json({ success: false, message: 'Invalid profilePictureMediaId' });
        return;
      }
      update.profilePictureMediaId = pid ?? undefined;
    }

    if (req.body?.socialLinks !== undefined) {
      update.socialLinks = readSocialLinks(req.body.socialLinks);
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error updating user', error));
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error deleting user', error));
  }
};

export const inviteUser = async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ success: false, message: 'inviteUser not implemented in canonical user model' });
};

export const bulkDeleteUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const objectIds = ids.map((id: any) => (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null)).filter(Boolean);

    if (objectIds.length === 0) {
      res.status(400).json({ success: false, message: 'No valid user IDs provided' });
      return;
    }

    const result = await User.deleteMany({ _id: { $in: objectIds } });
    res.status(200).json({ success: true, message: 'Users deleted successfully', data: { deletedCount: result.deletedCount } });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error deleting users', error));
  }
};
