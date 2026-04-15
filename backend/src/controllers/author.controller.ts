import { Request, Response } from 'express';

import User from '../models/User';
import { escapeRegex, safeErrorResponse } from '../utils/security';

const asObjectRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const sanitizeSocialLinks = (value: unknown): Array<{ platform: string; url: string }> => {
  if (!Array.isArray(value)) return [];

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

export const getAuthorByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const authorNameRaw = typeof req.params.authorName === 'string' ? req.params.authorName : '';
    const authorName = authorNameRaw.trim();

    if (!authorName) {
      res.status(400).json({ success: false, message: 'Author name is required' });
      return;
    }

    const author = await User.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(authorName)}$`, 'i') },
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
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching author', error));
  }
};
