import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';

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
    const { page = '1', limit = '20', search, isAdmin } = req.query;

    const filter: any = {};

    if (typeof isAdmin === 'string') {
      filter.isAdmin = isAdmin === 'true';
    }

    if (typeof search === 'string' && search.trim().length > 0) {
      const rx = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: rx }, { bio: rx }];
    }

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit as string, 10) || 20, 1);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
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
    res.status(500).json({ success: false, message: 'Error fetching users', error: error?.message });
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
    res.status(500).json({ success: false, message: 'Error fetching user', error: error?.message });
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

    const profilePictureMediaIdRaw = typeof req.body?.profilePictureMediaId === 'string' ? req.body.profilePictureMediaId : undefined;
    const profilePictureMediaId = toObjectId(profilePictureMediaIdRaw) ?? undefined;

    const socialLinks = readSocialLinks(req.body?.socialLinks);

    const user = await User.create({
      name,
      ...(bio ? { bio } : {}),
      isAdmin,
      ...(profilePictureMediaId ? { profilePictureMediaId } : {}),
      socialLinks,
    });

    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error creating user', error: error?.message });
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
    res.status(500).json({ success: false, message: 'Error updating user', error: error?.message });
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
    res.status(500).json({ success: false, message: 'Error deleting user', error: error?.message });
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
    res.status(500).json({ success: false, message: 'Error deleting users', error: error?.message });
  }
};
