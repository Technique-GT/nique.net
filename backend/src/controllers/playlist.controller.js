"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivePlaylist = exports.setActivePlaylist = exports.deletePlaylist = exports.updatePlaylist = exports.getPlaylistById = exports.getPlaylists = exports.createPlaylist = void 0;
const Playlist_1 = __importDefault(require("../models/Playlist"));
const mongoose_1 = __importDefault(require("mongoose"));
const security_1 = require("../utils/security");
// Helper function to validate and convert string to ObjectId
const toObjectId = (id) => {
    if (!id || Array.isArray(id) || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return null;
    }
    return new mongoose_1.default.Types.ObjectId(id);
};
const createPlaylist = async (req, res) => {
    try {
        const { name, description, spotifyUrl } = req.body;
        const playlist = new Playlist_1.default({
            name,
            description: description || '',
            spotifyUrl,
            isActive: false
        });
        await playlist.save();
        res.status(201).json({
            success: true,
            message: 'Playlist created successfully',
            data: playlist
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }
        else {
            res.status(500).json((0, security_1.safeErrorResponse)('Server error', error));
        }
    }
};
exports.createPlaylist = createPlaylist;
const getPlaylists = async (_req, res) => {
    try {
        const playlists = await Playlist_1.default.find()
            .sort({ isActive: -1, createdAt: -1 })
            .select('-__v');
        res.status(200).json({
            success: true,
            data: playlists,
            count: playlists.length
        });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching playlists', error));
    }
};
exports.getPlaylists = getPlaylists;
const getPlaylistById = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({
                success: false,
                message: 'Invalid playlist ID'
            });
            return;
        }
        const playlist = await Playlist_1.default.findById(objectId);
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
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching playlist', error));
    }
};
exports.getPlaylistById = getPlaylistById;
const updatePlaylist = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({
                success: false,
                message: 'Invalid playlist ID'
            });
            return;
        }
        const { name, description, spotifyUrl } = req.body;
        const playlist = await Playlist_1.default.findByIdAndUpdate(objectId, {
            name,
            description: description || '',
            spotifyUrl
        }, { new: true, runValidators: true });
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
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }
        else {
            res.status(500).json((0, security_1.safeErrorResponse)('Error updating playlist', error));
        }
    }
};
exports.updatePlaylist = updatePlaylist;
const deletePlaylist = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({
                success: false,
                message: 'Invalid playlist ID'
            });
            return;
        }
        const playlist = await Playlist_1.default.findByIdAndDelete(objectId);
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
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error deleting playlist', error));
    }
};
exports.deletePlaylist = deletePlaylist;
const setActivePlaylist = async (req, res) => {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            res.status(400).json({
                success: false,
                message: 'Invalid playlist ID'
            });
            return;
        }
        const existing = await Playlist_1.default.findById(objectId);
        if (!existing) {
            res.status(404).json({
                success: false,
                message: 'Playlist not found'
            });
            return;
        }
        if (existing.isActive) {
            const playlist = await Playlist_1.default.findByIdAndUpdate(objectId, { isActive: false }, { new: true });
            res.status(200).json({
                success: true,
                message: 'Playlist deactivated',
                data: playlist
            });
            return;
        }
        // Set all playlists to inactive first
        await Playlist_1.default.updateMany({}, { isActive: false });
        // Set the selected playlist to active
        const playlist = await Playlist_1.default.findByIdAndUpdate(objectId, { isActive: true }, { new: true });
        res.status(200).json({
            success: true,
            message: 'Playlist set as active',
            data: playlist
        });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error setting active playlist', error));
    }
};
exports.setActivePlaylist = setActivePlaylist;
const getActivePlaylist = async (_req, res) => {
    try {
        const playlist = await Playlist_1.default.findOne({ isActive: true });
        res.status(200).json({
            success: true,
            data: playlist
        });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching active playlist', error));
    }
};
exports.getActivePlaylist = getActivePlaylist;
