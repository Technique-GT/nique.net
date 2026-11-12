"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toObjectId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const toObjectId = (id) => {
    if (!id)
        return null;
    if (Array.isArray(id))
        return null;
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        return null;
    return new mongoose_1.default.Types.ObjectId(id);
};
exports.toObjectId = toObjectId;
