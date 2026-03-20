import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { safeRegex, safeErrorResponse } from '../utils/security';

const SOCIAL_PLATFORM_HOSTS: Record<'instagram' | 'linkedin', string> = {
  instagram: 'instagram.com',
  linkedin: 'linkedin.com',
};

const isAllowedSocialUrl = (rawUrl: string, platform: keyof typeof SOCIAL_PLATFORM_HOSTS): boolean => {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    const expected = SOCIAL_PLATFORM_HOSTS[platform];
    return hostname === expected || hostname.endsWith(`.${expected}`);
  } catch {
    return false;
  }
};

const readSocialLinks = (value: any): Array<{ platform: string; url: string }> => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => ({
      platform: typeof v?.platform === 'string' ? v.platform.trim().toLowerCase() : '',
      url: typeof v?.url === 'string' ? v.url.trim() : '',
    }))
    .filter((v): v is { platform: 'instagram' | 'linkedin'; url: string } =>
      (v.platform === 'instagram' || v.platform === 'linkedin') &&
      v.url.length > 0 &&
      isAllowedSocialUrl(v.url, v.platform)
    );
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

    const profilePictureUrlRaw = typeof req.body?.profilePictureUrl === 'string' ? req.body.profilePictureUrl.trim() : '';
    const profilePictureUrl = profilePictureUrlRaw.length > 0 ? profilePictureUrlRaw : undefined;

    const socialLinks = readSocialLinks(req.body?.socialLinks);

    const user = await User.create({
      name,
      ...(bio ? { bio } : {}),
      isAdmin,
      ...(email ? { email } : {}),
      ...(googleSub ? { googleSub } : {}),
      ...(profilePictureUrl ? { profilePictureUrl } : {}),
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
    const unset: Record<string, 1> = {};

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
      } else {
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
        unset.googleSub = 1;
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

    if (typeof req.body?.profilePictureUrl === 'string' || req.body?.profilePictureUrl === null) {
      if (req.body.profilePictureUrl === null) {
        unset.profilePictureUrl = 1;
      } else {
        const url = req.body.profilePictureUrl.trim();
        update.profilePictureUrl = url;
      }
    }

    if (req.body?.socialLinks !== undefined) {
      update.socialLinks = readSocialLinks(req.body.socialLinks);
    }

    const updateOps: Record<string, any> = {};
    if (Object.keys(update).length > 0) {
      updateOps.$set = update;
    }
    if (Object.keys(unset).length > 0) {
      updateOps.$unset = unset;
    }

    const user = await User.findByIdAndUpdate(id, updateOps, { new: true, runValidators: true });
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
