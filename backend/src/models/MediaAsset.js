"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const MediaAssetSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    fileNameLower: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    contentType: { type: String, required: false, trim: true },
    size: { type: Number, required: true, default: 0 },
    etag: { type: String, required: false, trim: true },
    lastModified: { type: Date, required: false },
    uploadedAt: { type: Date, required: true, default: Date.now },
}, {
    timestamps: true,
});
MediaAssetSchema.index({ uploadedAt: -1, _id: -1 });
MediaAssetSchema.index({ lastModified: -1, _id: -1 });
MediaAssetSchema.index({ size: -1, _id: -1 });
MediaAssetSchema.index({ fileNameLower: 1 });
exports.default = mongoose_1.default.model('MediaAsset', MediaAssetSchema);
