"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHtml = exports.stripHtml = exports.safeRegex = exports.escapeRegex = exports.hashToken = exports.safeErrorResponse = exports.safeErrorMessage = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Returns a safe error message for API responses.
 * In production, hides internal error details; in development, includes them.
 */
const safeErrorMessage = (error, fallbackMessage) => {
    if (process.env.NODE_ENV === 'production') {
        return fallbackMessage;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallbackMessage;
};
exports.safeErrorMessage = safeErrorMessage;
/**
 * Creates a safe error response object for API responses.
 * In production, hides the error field; in development, includes it.
 */
const safeErrorResponse = (message, error) => {
    const response = {
        success: false,
        message,
    };
    if (process.env.NODE_ENV !== 'production' && error) {
        response.error = error instanceof Error ? error.message : String(error);
    }
    return response;
};
exports.safeErrorResponse = safeErrorResponse;
/**
 * Hashes a JWT string for storage/comparison.
 */
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
exports.hashToken = hashToken;
/**
 * Escapes special regex characters to prevent ReDoS attacks.
 * Use this whenever creating a RegExp from user input.
 */
const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
exports.escapeRegex = escapeRegex;
/**
 * Creates a safe case-insensitive regex from user input.
 */
const safeRegex = (str) => {
    return new RegExp((0, exports.escapeRegex)(str.trim()), 'i');
};
exports.safeRegex = safeRegex;
/**
 * Basic HTML sanitization - strips all HTML tags.
 * For rich content that needs to preserve some HTML, use a library like DOMPurify.
 */
const stripHtml = (str) => {
    return str.replace(/<[^>]*>/g, '');
};
exports.stripHtml = stripHtml;
/**
 * Sanitizes content that may contain HTML.
 * This is a basic implementation - for production, consider using isomorphic-dompurify.
 *
 * Allowed tags: p, br, strong, em, u, s, a, ul, ol, li, h1-h6, blockquote, code, pre, img
 */
const sanitizeHtml = (html) => {
    if (!html || typeof html !== 'string')
        return '';
    // Remove script tags and their content
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove event handlers (onclick, onerror, etc.)
    clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    clean = clean.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
    // Remove javascript: and data: URLs
    clean = clean.replace(/href\s*=\s*["']?\s*javascript:[^"'>]*/gi, 'href="#"');
    clean = clean.replace(/src\s*=\s*["']?\s*javascript:[^"'>]*/gi, 'src=""');
    clean = clean.replace(/href\s*=\s*["']?\s*data:[^"'>]*/gi, 'href="#"');
    clean = clean.replace(/src\s*=\s*["']?\s*data:(?!image\/)[^"'>]*/gi, 'src=""');
    // Remove style tags and their content
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    // Remove iframe, object, embed, form tags
    clean = clean.replace(/<(iframe|object|embed|form|input|button|textarea|select)[^>]*>.*?<\/\1>/gis, '');
    clean = clean.replace(/<(iframe|object|embed|form|input|button|textarea|select)[^>]*\/?>/gi, '');
    return clean;
};
exports.sanitizeHtml = sanitizeHtml;
