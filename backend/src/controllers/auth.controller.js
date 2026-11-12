"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.devLogin = exports.googleAuthCallback = exports.googleAuth = exports.getCurrentUser = exports.logout = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const lodash_1 = __importDefault(require("lodash"));
const User_1 = __importDefault(require("../models/User"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const security_1 = require("../utils/security");
const RevokedToken_1 = __importDefault(require("../models/RevokedToken"));
const AuthUser = User_1.default;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_REDIRECT_COOKIE = 'oauth_redirect';
const getCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? 'none' : 'lax'),
        maxAge: COOKIE_MAX_AGE,
    };
};
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user._id, name: user.name, isAdmin: user.isAdmin }, process.env.JWT_TOKEN, {
        expiresIn: '7d',
    });
};
const getAdminEmailAllowlist = () => {
    const raw = process.env.ADMIN_EMAIL_ALLOWLIST || '';
    return raw
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
};
const isAdminEmailAllowlisted = async (email, emailVerified) => {
    if (!emailVerified || !email)
        return false;
    const allowlist = getAdminEmailAllowlist();
    if (allowlist.includes(email))
        return true;
    const adminUser = await AuthUser.exists({ email, isAdmin: true });
    return !!adminUser;
};
const getPrimaryClientUrl = () => {
    const raw = process.env.CLIENT_URLS || '';
    return raw
        .split(',')
        .map((value) => value.trim())
        .find(Boolean);
};
const register = async (req, res) => {
    try {
        const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
        if (!name) {
            res.status(400).json({ message: 'Name is required' });
            return;
        }
        const existingUser = await AuthUser.findOne({ name });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const user = new AuthUser({ name, socialLinks: [], isAdmin: false });
        await user.save();
        const token = generateToken(user);
        res.cookie('jwt', token, getCookieOptions());
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                isAdmin: user.isAdmin,
                token,
            },
        });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Registration failed', error));
    }
};
exports.register = register;
const logout = async (req, res) => {
    const token = (0, auth_middleware_1.getTokenFromRequest)(req);
    res.clearCookie('jwt', getCookieOptions());
    if (!token) {
        res.json({ success: true, message: 'Logged out successfully' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;
        if (!expiresAt) {
            res.json({ success: true, message: 'Logged out successfully' });
            return;
        }
        const tokenHash = (0, security_1.hashToken)(token);
        await RevokedToken_1.default.updateOne({ tokenHash }, {
            $setOnInsert: {
                tokenHash,
                userId: decoded?.id ? new mongoose_1.default.Types.ObjectId(decoded.id) : undefined,
                expiresAt,
            },
        }, { upsert: true });
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Logout failed', error));
    }
};
exports.logout = logout;
const getCurrentUser = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        const user = await AuthUser.findById(req.user.id).select('-password');
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Error fetching user', error));
    }
};
exports.getCurrentUser = getCurrentUser;
const buildGoogleAuthUrl = () => {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
    });
    const state = crypto_1.default.randomBytes(16).toString('hex');
    params.set('state', state);
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, state };
};
const exchangeCodeForTokens = async (code) => {
    const body = new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google token exchange failed: ${errorText}`);
    }
    return response.json();
};
const fetchGoogleProfile = async (accessToken) => {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google userinfo failed: ${errorText}`);
    }
    return response.json();
};
const googleAuth = (req, res) => {
    try {
        const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '';
        const { url, state } = buildGoogleAuthUrl();
        res.cookie(OAUTH_STATE_COOKIE, state, { ...getCookieOptions(), maxAge: 10 * 60 * 1000 });
        if (redirect) {
            res.cookie(OAUTH_REDIRECT_COOKIE, redirect, { ...getCookieOptions(), maxAge: 10 * 60 * 1000 });
        }
        res.redirect(url);
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Authentication failed', error));
    }
};
exports.googleAuth = googleAuth;
const googleAuthCallback = async (req, res) => {
    try {
        const code = typeof req.query.code === 'string' ? req.query.code : '';
        const state = typeof req.query.state === 'string' ? req.query.state : '';
        const error = typeof req.query.error === 'string' ? req.query.error : '';
        const storedState = req.cookies?.[OAUTH_STATE_COOKIE];
        const redirect = req.cookies?.[OAUTH_REDIRECT_COOKIE];
        res.clearCookie(OAUTH_STATE_COOKIE, getCookieOptions());
        res.clearCookie(OAUTH_REDIRECT_COOKIE, getCookieOptions());
        if (error) {
            // User likely canceled the login or access was denied.
            // Redirect back to the frontend with the error.
            const appRedirect = redirect || getPrimaryClientUrl() || process.env.APP_BASE_URL || '/';
            const separator = appRedirect.includes('?') ? '&' : '?';
            // Append error param so frontend can show a toast/alert
            res.redirect(`${appRedirect}${separator}error=${encodeURIComponent(error)}`);
            return;
        }
        if (!code || !state || !storedState || state !== storedState) {
            res.status(400).json({ message: 'Invalid OAuth state' });
            return;
        }
        const tokenResponse = await exchangeCodeForTokens(code);
        const profile = (await fetchGoogleProfile(tokenResponse.access_token));
        const fullName = typeof profile?.name === 'string' ? profile.name.trim() : '';
        const googleSub = typeof profile?.sub === 'string' ? profile.sub.trim() : '';
        const email = typeof profile?.email === 'string' ? profile.email.trim().toLowerCase() : '';
        const emailVerified = profile?.email_verified === true;
        const isAllowlistedAdmin = await isAdminEmailAllowlisted(email, emailVerified);
        if (!googleSub) {
            res.status(403).json({ message: 'Google profile missing sub' });
            return;
        }
        if (!fullName) {
            res.status(403).json({ message: 'Google profile missing name' });
            return;
        }
        let user = await AuthUser.findOne({ googleSub });
        const emailUser = !user && email ? await AuthUser.findOne({ email }) : null;
        if (!user && !emailUser && !isAllowlistedAdmin) {
            res.status(403).json({ message: 'Email not authorized' });
            return;
        }
        if (!user) {
            user = emailUser ?? await AuthUser.create({
                name: fullName,
                socialLinks: [],
                isAdmin: isAllowlistedAdmin,
                googleSub,
                ...(isAllowlistedAdmin ? { email } : {}),
            });
        }
        else if (isAllowlistedAdmin) {
            const updates = {};
            if (!user.isAdmin) {
                updates.isAdmin = true;
            }
            if (user.email !== email) {
                updates.email = email;
            }
            if (user.googleSub !== googleSub) {
                updates.googleSub = googleSub;
            }
            if (user.name !== fullName) {
                updates.name = fullName;
            }
            if (Object.keys(updates).length > 0) {
                user.set(updates);
                await user.save();
            }
        }
        const token = generateToken(user);
        res.cookie('jwt', token, getCookieOptions());
        const appRedirect = redirect || getPrimaryClientUrl() || process.env.APP_BASE_URL || '/';
        res.redirect(appRedirect);
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Authentication callback failed', error));
    }
};
exports.googleAuthCallback = googleAuthCallback;
/**
 * DEV-ONLY: Log in as any existing user by name, bypassing Google OAuth.
 * Returns 404 in production so the route is completely hidden.
 */
const devLogin = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.status(404).json({ message: 'Not found' });
        return;
    }
    try {
        const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
        if (!name) {
            res.status(400).json({ success: false, message: 'name is required' });
            return;
        }
        const safeName = lodash_1.default.escapeRegExp(name);
        const user = await AuthUser.findOne({ name: { $regex: new RegExp(`^${safeName}$`, 'i') } });
        if (!user) {
            res.status(404).json({ success: false, message: `No user found with name "${name}"` });
            return;
        }
        const token = generateToken(user);
        res.cookie('jwt', token, getCookieOptions());
        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                isAdmin: user.isAdmin,
                token,
            },
        });
    }
    catch (error) {
        res.status(500).json((0, security_1.safeErrorResponse)('Dev login failed', error));
    }
};
exports.devLogin = devLogin;
