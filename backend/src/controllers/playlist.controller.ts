import { Request, Response } from 'express';
import Playlist, { IPlaylist } from '../models/Playlist';
import mongoose from 'mongoose';
import { safeErrorResponse } from '../utils/security';

// Helper function to validate and convert string to ObjectId
const toObjectId = (id: string | string[] | undefined): mongoose.Types.ObjectId | null => {
  if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return new mongoose.Types.ObjectId(id);
};

export const createPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, spotifyUrl, image } = req.body;
    
    const playlist: IPlaylist = new Playlist({
      name,
      description: description || '',
      spotifyUrl,
      image: image || '',
      isActive: false
    });

    await playlist.save();
    
    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      data: playlist
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else {
      res.status(500).json(safeErrorResponse('Server error', error));
    }
  }
};

export const getPlaylists = async (_req: Request, res: Response): Promise<void> => {
  try {
    const playlists = await Playlist.find()
      .sort({ isActive: -1, createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: playlists,
      count: playlists.length
    });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching playlists', error));
  }
};

export const getPlaylistById = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    
    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid playlist ID'
      });
      return;
    }

    const playlist = await Playlist.findById(objectId);
    
    if (!playlist) {
      res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: playlist
    });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching playlist', error));
  }
};

export const updatePlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    
    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid playlist ID'
      });
      return;
    }

    const { name, description, spotifyUrl, image } = req.body;
    
    const playlist = await Playlist.findByIdAndUpdate(
      objectId,
      {
        name,
        description: description || '',
        spotifyUrl,
        image: image || ''
      },
      { new: true, runValidators: true }
    );

    if (!playlist) {
      res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Playlist updated successfully',
      data: playlist
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else {
      res.status(500).json(safeErrorResponse('Error updating playlist', error));
    }
  }
};

export const deletePlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    
    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid playlist ID'
      });
      return;
    }

    const playlist = await Playlist.findByIdAndDelete(objectId);
    
    if (!playlist) {
      res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error deleting playlist', error));
  }
};

export const setActivePlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    
    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid playlist ID'
      });
      return;
    }

    // Set all playlists to inactive first
    await Playlist.updateMany({}, { isActive: false });

    // Set the selected playlist to active
    const playlist = await Playlist.findByIdAndUpdate(
      objectId,
      { isActive: true },
      { new: true }
    );

    if (!playlist) {
      res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Playlist set as active',
      data: playlist
    });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error setting active playlist', error));
  }
};

export const getActivePlaylist = async (_req: Request, res: Response): Promise<void> => {
  try {
    const playlist = await Playlist.findOne({ isActive: true });
    
    res.status(200).json({
      success: true,
      data: playlist
    });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching active playlist', error));
  }
};