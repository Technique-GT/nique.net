import { Request, Response } from 'express';
import Collaborator, { ICollaborator } from '../models/Collab';
import mongoose from 'mongoose';

// Helper function to validate and convert string to ObjectId
const toObjectId = (id: string | string[] | undefined): mongoose.Types.ObjectId | null => {
  if (!id || Array.isArray(id) || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return new mongoose.Types.ObjectId(id);
};

export const createCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, title, email } = req.body;

    console.log('🔍 CREATE COLLABORATOR - Received data:', { name, title, email });
    console.log('🔍 Request body:', req.body);

    // Validate required fields
    if (!name || !name.trim()) {
      console.log('❌ Name validation failed');
      res.status(400).json({
        success: false,
        message: 'Name is required'
      });
      return;
    }

    if (!title || !title.trim()) {
      console.log('❌ Title validation failed');
      res.status(400).json({
        success: false,
        message: 'Title is required'
      });
      return;
    }

    console.log('🔍 Checking for existing collaborator with name:', name.trim());
    
    // Check if collaborator with same name already exists
    const existingCollaborator = await Collaborator.findOne({ 
      name: name.trim()
    });

    if (existingCollaborator) {
      console.log('❌ Collaborator with same name already exists:', existingCollaborator._id);
      res.status(409).json({
        success: false,
        message: 'Collaborator with this name already exists'
      });
      return;
    }

    console.log('🔍 Creating new collaborator...');
    
    const collaborator: ICollaborator = new Collaborator({
      name: name.trim(),
      title: title.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      status: 'active',
      joinDate: new Date()
    });

    console.log('🔍 Saving collaborator to database...');
    await collaborator.save();
    console.log('✅ Collaborator saved successfully:', collaborator._id);
    
    res.status(201).json({
      success: true,
      message: 'Collaborator added successfully',
      data: collaborator
    });
  } catch (error: any) {
    console.error('❌ ERROR in createCollaborator:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      console.log('❌ Validation errors:', errors);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
};

export const getCollaborators = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;

    let query: any = {};

    // Add search filter
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { title: searchRegex },
        { email: searchRegex }
      ];
    }

    // Add status filter
    if (status && typeof status === 'string' && status !== 'all') {
      query.status = status;
    }

    const collaborators = await Collaborator.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: collaborators,
      count: collaborators.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching collaborators',
      error: error.message
    });
  }
};

export const getCollaboratorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid collaborator ID'
      });
      return;
    }

    const collaborator = await Collaborator.findById(objectId);
    
    if (!collaborator) {
      res.status(404).json({
        success: false,
        message: 'Collaborator not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: collaborator
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching collaborator',
      error: error.message
    });
  }
};

export const updateCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    const { name, title, email, status } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid collaborator ID'
      });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (title) updateData.title = title.trim();
    if (email !== undefined) {
      updateData.email = email ? email.toLowerCase().trim() : undefined;
    }
    if (status) updateData.status = status;

    const collaborator = await Collaborator.findByIdAndUpdate(
      objectId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!collaborator) {
      res.status(404).json({
        success: false,
        message: 'Collaborator not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Collaborator updated successfully',
      data: collaborator
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
      res.status(500).json({
        success: false,
        message: 'Error updating collaborator',
        error: error.message
      });
    }
  }
};

export const deleteCollaborator = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid collaborator ID'
      });
      return;
    }

    const collaborator = await Collaborator.findByIdAndDelete(objectId);
    
    if (!collaborator) {
      res.status(404).json({
        success: false,
        message: 'Collaborator not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Collaborator deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting collaborator',
      error: error.message
    });
  }
};

export const updateCollaboratorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    const { status } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid collaborator ID'
      });
      return;
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Valid status is required (active or inactive)'
      });
      return;
    }

    const collaborator = await Collaborator.findByIdAndUpdate(
      objectId,
      { status },
      { new: true, runValidators: true }
    );

    if (!collaborator) {
      res.status(404).json({
        success: false,
        message: 'Collaborator not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Collaborator status updated successfully',
      data: collaborator
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating collaborator status',
      error: error.message
    });
  }
};