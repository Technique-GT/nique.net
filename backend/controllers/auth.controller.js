const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/users.model');

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_REDIRECT_COOKIE = 'oauth_redirect';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: COOKIE_MAX_AGE
});

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_TOKEN,
    { expiresIn: '7d' }
  );
};

const buildGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  const state = crypto.randomBytes(16).toString('hex');
  params.set('state', state);

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, state };
};

const exchangeCodeForTokens = async (code) => {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code'
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  return response.json();
};

const fetchGoogleProfile = async (accessToken) => {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google userinfo failed: ${errorText}`);
  }

  return response.json();
};

const generateUsername = async (email) => {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '').toLowerCase() || 'user';
  let username = base;
  let suffix = 1;

  while (await User.exists({ username })) {
    username = `${base}-${suffix}`;
    suffix += 1;
  }

  return username;
};

exports.googleAuth = (req, res) => {
  try {
    const redirect = typeof req.query.redirect === 'string' ? req.query.redirect : '';
    const { url, state } = buildGoogleAuthUrl();

    res.cookie(OAUTH_STATE_COOKIE, state, { ...getCookieOptions(), maxAge: 10 * 60 * 1000 });
    if (redirect) {
      res.cookie(OAUTH_REDIRECT_COOKIE, redirect, { ...getCookieOptions(), maxAge: 10 * 60 * 1000 });
    }

    return res.redirect(url);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.googleAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedState = req.cookies?.[OAUTH_STATE_COOKIE];
    const redirect = req.cookies?.[OAUTH_REDIRECT_COOKIE];

    res.clearCookie(OAUTH_STATE_COOKIE);
    res.clearCookie(OAUTH_REDIRECT_COOKIE);

    if (!code || !state || !storedState || state !== storedState) {
      return res.status(400).json({ message: 'Invalid OAuth state' });
    }

    const tokenResponse = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleProfile(tokenResponse.access_token);

    if (!profile?.email || !profile?.email_verified) {
      return res.status(403).json({ message: 'Google account not verified' });
    }

    let user = await User.findOne({ email: profile.email });
    if (!user) {
      const username = await generateUsername(profile.email);
      const randomPassword = crypto.randomBytes(24).toString('hex');
      user = await User.create({
        username,
        email: profile.email,
        password: randomPassword,
        firstName: profile.given_name || '',
        lastName: profile.family_name || '',
        profilePicture: profile.picture || '',
        role: 'subscriber'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res.cookie('jwt', token, getCookieOptions());

    const appRedirect = redirect || process.env.APP_BASE_URL || '/';
    return res.redirect(appRedirect);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out successfully' });
};

exports.getCurrentUser = async (req, res) => {

  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};