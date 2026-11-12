"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const pino_http_1 = __importDefault(require("pino-http"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const article_routes_1 = __importDefault(require("./routes/article.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const playlist_routes_1 = __importDefault(require("./routes/playlist.routes"));
const publication_routes_1 = __importDefault(require("./routes/publication.routes"));
const sliver_routes_1 = __importDefault(require("./routes/sliver.routes"));
const subCategory_routes_1 = __importDefault(require("./routes/subCategory.routes"));
const tag_routes_1 = __importDefault(require("./routes/tag.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const author_routes_1 = __importDefault(require("./routes/author.routes"));
const admin_articles_routes_1 = __importDefault(require("./routes/admin.articles.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const env_1 = require("./utils/env");
const logger_1 = require("./utils/logger");
function createApp() {
    const app = (0, express_1.default)();
    const isProduction = env_1.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    // Production runs behind Cloudflare/reverse proxies.
    // Trust one proxy hop so rate limiting keys by real client IP.
    if (isProduction) {
        app.set('trust proxy', 1);
    }
    // Security: HTTP headers
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false, // Disable for API compatibility
    }));
    // Search engines should not index API responses.
    app.use((_req, res, next) => {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
        next();
    });
    // Security: Rate limiting
    // Global API rate limiter
    const apiLimiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: isTest ? 100000 : 2000, // Higher limit in tests
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests, please try again later.' },
        skip: () => isTest, // Skip rate limiting in tests
    });
    // Stricter rate limiter for auth endpoints
    const authLimiter = (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000, // 1 minute
        max: isTest ? 100000 : 10, // 10 requests per minute
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many authentication attempts, please try again later.' },
        // Skip low-risk session checks to avoid logging users out from transient 429s.
        skip: (req) => isTest || req.path === '/me' || req.path === '/logout',
    });
    // Stricter rate limiter for write operations (comments, uploads)
    const writeLimiter = (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000, // 1 minute
        max: isTest ? 10000 : 20, // 20 writes per minute
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests, please slow down.' },
        // Only rate-limit write attempts on these route prefixes.
        skip: (req) => isTest || ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
    });
    // Basic middleware
    app.use((0, pino_http_1.default)({
        logger: logger_1.logger,
        customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
        // Silence logs during tests
        autoLogging: process.env.NODE_ENV !== 'test',
    }));
    const allowedOrigins = new Set([
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:4173',
        'http://localhost:3000',
        'https://nique.net',
        'https://www.nique.net',
        'https://technique-4t5.pages.dev',
        'https://technique-dashboard.pages.dev',
        'https://dashboard.nique.net',
    ]);
    // Allow branch-preview aliases for known frontend/dashboard projects.
    const allowedPreviewHostPatterns = [
        /^([a-z0-9-]+\.)?technique-4t5\.pages\.dev$/i,
        /^([a-z0-9-]+\.)?technique-dashboard\.pages\.dev$/i,
        /^([a-z0-9-]+\.)?technique-dash-5men\.vercel\.app$/i,
    ];
    const isAllowedOrigin = (origin) => {
        if (allowedOrigins.has(origin))
            return true;
        try {
            const { protocol, hostname } = new URL(origin);
            if (protocol !== 'https:')
                return false;
            return allowedPreviewHostPatterns.some((pattern) => pattern.test(hostname));
        }
        catch {
            return false;
        }
    };
    const configuredClientOrigins = (env_1.env.CLIENT_URLS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    configuredClientOrigins.forEach((origin) => allowedOrigins.add(origin));
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin)
                return callback(null, true);
            if (!isProduction || isAllowedOrigin(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-device-id'],
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use((0, cookie_parser_1.default)());
    // Double-Submit Cookie CSRF Protection Middleware
    const csrfProtection = (req, res, next) => {
        // Skip safe methods and test environments
        if (isTest || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return next();
        }
        const tokenFromHeader = req.headers['x-csrf-token'];
        const tokenFromCookie = req.cookies['csrf-token'];
        if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
            res.status(403).json({ success: false, message: 'Invalid or missing CSRF token' });
            return;
        }
        next();
    };
    // Endpoint to issue CSRF token cookie to frontend clients
    app.get('/api/csrf-token', (req, res) => {
        let csrfToken = req.cookies['csrf-token'];
        if (!csrfToken) {
            csrfToken = node_crypto_1.default.randomBytes(32).toString('hex');
            res.cookie('csrf-token', csrfToken, {
                httpOnly: false, // Must be readable by frontend JS to attach to headers
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
            });
        }
        res.json({ success: true, csrfToken });
    });
    // Apply CSRF protection globally to state-changing API requests
    app.use('/api', csrfProtection);
    const sendHealthResponse = (_req, res) => {
        res.json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
        });
    };
    // Apply global rate limiting to all API routes
    app.use('/api/', apiLimiter);
    // Apply stricter rate limiting to auth routes
    app.use('/api/auth', authLimiter);
    // Apply write rate limiting to comment creation and media uploads
    app.use('/api/comments', writeLimiter);
    app.use('/api/admin/media', writeLimiter);
    // Serve uploaded files statically
    app.use('/uploads', express_1.default.static('uploads'));
    // Routes
    app.use('/api/articles', article_routes_1.default);
    app.use('/api/admin', admin_articles_routes_1.default);
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/categories', category_routes_1.default);
    app.use('/api/sub-categories', subCategory_routes_1.default);
    app.use('/api/tags', tag_routes_1.default);
    app.use('/api/users', user_routes_1.default);
    app.use('/api/authors', author_routes_1.default);
    app.use('/api/playlists', playlist_routes_1.default);
    app.use('/api/publications', publication_routes_1.default);
    app.use('/api/slivers', sliver_routes_1.default);
    app.use('/api/comments', comment_routes_1.default);
    app.use('/api/admin/media', media_routes_1.default);
    app.use('/api/notifications', notification_routes_1.default);
    // API health check
    app.get('/health', sendHealthResponse);
    app.get('/api/health', sendHealthResponse);
    // OpenAPI contract for tooling clients (e.g., Postman import).
    app.get('/api/openapi.json', (_req, res) => {
        const openApiPath = node_path_1.default.resolve(__dirname, '../openapi.json');
        if (!node_fs_1.default.existsSync(openApiPath)) {
            res.status(503).json({
                success: false,
                message: 'OpenAPI spec not found. Run `npm run openapi:generate` in backend/',
            });
            return;
        }
        res.sendFile(openApiPath);
    });
    app.use(error_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    return app;
}
