import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
import { AuthRequest, getTokenFromRequest } from '../middleware/auth.middleware';
import { hashToken, safeErrorResponse } from '../utils/security';
import RevokedToken from '../models/RevokedToken';

type GoogleProfile = { name?: string; sub?: string; email?: string; email_verified?: boolean };

const AuthUser = User as unknown as mongoose.Model<any>;

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_REDIRECT_COOKIE = 'oauth_redirect';

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: COOKIE_MAX_AGE,
  };
};

const generateToken = (user: any) => {
  return jwt.sign({ id: user._id, name: user.name, isAdmin: user.isAdmin }, process.env.JWT_TOKEN as string, {
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

const isAdminEmailAllowlisted = async (email: string, emailVerified: boolean) => {
  if (!emailVerified || !email) return false;
  const allowlist = getAdminEmailAllowlist();
  if (allowlist.includes(email)) return true;
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

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Registration failed', error));
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const token = getTokenFromRequest(req);

  res.clearCookie('jwt', getCookieOptions());

  if (!token) {
    res.json({ success: true, message: 'Logged out successfully' });
    return;
  }

  try {
    const decoded = jwt.decode(token) as { exp?: number; id?: string } | null;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

    if (!expiresAt) {
      res.json({ success: true, message: 'Logged out successfully' });
      return;
    }

    const tokenHash = hashToken(token);
    await RevokedToken.updateOne(
      { tokenHash },
      {
        $setOnInsert: {
          tokenHash,
          userId: decoded?.id ? new mongoose.Types.ObjectId(decoded.id) : undefined,
          expiresAt,
        },
      },
      { upsert: true },
    );

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Logout failed', error));
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Error fetching user', error));
  }
};

const buildGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  const state = crypto.randomBytes(16).toString('hex');
  params.set('state', state);

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, state };
};

const exchangeCodeForTokens = async (code: string) => {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
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

const fetchGoogleProfile = async (accessToken: string) => {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google userinfo failed: ${errorText}`);
  }

  return response.json();
};

export const googleAuth = (req: Request, res: Response): void => {
  try {
    const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '';
    const { url, state } = buildGoogleAuthUrl();

    res.cookie(OAUTH_STATE_COOKIE, state, { ...getCookieOptions(), maxAge: 10 * 60 * 1000 });
    if (redirect) {
      res.cookie(OAUTH_REDIRECT_COOKIE, redirect, { ...getCookieOptions(), maxAge: 10 * 60 * 1000 });
    }

    res.redirect(url);
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Authentication failed', error));
  }
};

export const googleAuthCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const error = typeof req.query.error === 'string' ? req.query.error : '';
    const storedState = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined;
    const redirect = req.cookies?.[OAUTH_REDIRECT_COOKIE] as string | undefined;

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
    const profile = (await fetchGoogleProfile((tokenResponse as any).access_token)) as GoogleProfile;
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
    } else if (isAllowlistedAdmin) {
      const updates: Record<string, any> = {};
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
  } catch (error: any) {
    res.status(500).json(safeErrorResponse('Authentication callback failed', error));
  }
};
