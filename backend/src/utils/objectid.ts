import mongoose from 'mongoose';

export const toObjectId = (id: string | string[] | undefined): mongoose.Types.ObjectId | null => {
  if (!id) return null;
  if (Array.isArray(id)) return null;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};
