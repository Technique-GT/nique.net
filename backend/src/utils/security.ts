import crypto from 'crypto';

/**
 * Returns a safe error message for API responses.
 * In production, hides internal error details; in development, includes them.
 */
export const safeErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (process.env.NODE_ENV === 'production') {
    return fallbackMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
};

/**
 * Creates a safe error response object for API responses.
 * In production, hides the error field; in development, includes it.
 */
export const safeErrorResponse = (message: string, error?: unknown): { success: false; message: string; error?: string } => {
  const response: { success: false; message: string; error?: string } = {
    success: false,
    message,
  };
  
  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = error instanceof Error ? error.message : String(error);
  }
  
  return response;
};

/**
 * Hashes a JWT string for storage/comparison.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Escapes special regex characters to prevent ReDoS attacks.
 * Use this whenever creating a RegExp from user input.
 */
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Creates a safe case-insensitive regex from user input.
 */
export const safeRegex = (str: string): RegExp => {
  return new RegExp(escapeRegex(str.trim()), 'i');
};

/**
 * Basic HTML sanitization - strips all HTML tags.
 * For rich content that needs to preserve some HTML, use a library like DOMPurify.
 */
export const stripHtml = (str: string): string => {
  return str.replace(/<[^>]*>/g, '');
};

/**
 * Sanitizes content that may contain HTML.
 * This is a basic implementation - for production, consider using isomorphic-dompurify.
 * 
 * Allowed tags: p, br, strong, em, u, s, a, ul, ol, li, h1-h6, blockquote, code, pre, img
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
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
