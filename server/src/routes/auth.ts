import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/connection';
import { authenticate } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(user: { id: number; email: string; name: string; role: string }) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
}

// POST /api/auth/sso-exchange — verifies a portal-issued SSO token and
// returns access + refresh tokens, auto-creating the IT Request user row
// if needed.
router.post('/sso-exchange', async (req: Request, res: Response) => {
  try {
    const ssoSecret = process.env.PORTAL_SSO_SECRET;
    if (!ssoSecret) {
      res.status(503).json({ message: 'SSO not configured.' });
      return;
    }
    const { ptoken } = req.body || {};
    if (typeof ptoken !== 'string') {
      res.status(400).json({ message: 'ptoken required' });
      return;
    }
    let claims: { email: string; full_name?: string; portal_role?: string };
    try {
      claims = jwt.verify(ptoken, ssoSecret, {
        issuer: 'nycoa-portal',
        audience: 'it',
      }) as typeof claims;
    } catch {
      res.status(401).json({ message: 'Invalid or expired SSO token.' });
      return;
    }
    const email = String(claims.email || '').trim().toLowerCase();
    if (!email) {
      res.status(400).json({ message: 'SSO token missing email.' });
      return;
    }
    const isPortalAdmin = claims.portal_role === 'admin';
    let user = await db('users').where({ email }).first();
    if (!user) {
      const [created] = await db('users')
        .insert({
          email,
          name: claims.full_name || email,
          role: isPortalAdmin ? 'it_admin' : 'employee',
          is_active: true,
          password_hash: '!sso',
        })
        .returning('*');
      user = created;
    } else {
      const updates: Record<string, unknown> = {};
      if (!user.is_active) updates.is_active = true;
      if (claims.full_name && user.name !== claims.full_name) updates.name = claims.full_name;
      if (isPortalAdmin && user.role !== 'it_admin') updates.role = 'it_admin';
      if (Object.keys(updates).length > 0) {
        await db('users').where({ id: user.id }).update(updates);
        user = { ...user, ...updates };
      }
    }
    const tokens = generateTokens(user);
    await db('users').where({ id: user.id }).update({ refresh_token: tokens.refreshToken });
    const dept = user.department_id
      ? await db('departments').where({ id: user.department_id }).first()
      : null;
    const manager = user.manager_id
      ? await db('users').where({ id: user.manager_id }).select('id', 'name', 'email').first()
      : null;
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: dept?.name || '',
        manager_id: user.manager_id,
        manager_name: manager?.name || '',
        manager_email: manager?.email || '',
        is_active: user.is_active,
      },
      tokens,
    });
  } catch (err) {
    console.error('IT Request SSO exchange error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await db('users').where({ email, is_active: true }).first();
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const tokens = generateTokens(user);
    await db('users').where({ id: user.id }).update({ refresh_token: tokens.refreshToken });

    // Get department name
    const dept = user.department_id
      ? await db('departments').where({ id: user.department_id }).first()
      : null;

    // Get manager info
    const manager = user.manager_id
      ? await db('users').where({ id: user.manager_id }).select('id', 'name', 'email').first()
      : null;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: dept?.name || '',
        manager_id: user.manager_id,
        manager_name: manager?.name || '',
        manager_email: manager?.email || '',
        is_active: user.is_active,
      },
      tokens,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ message: 'Missing refresh token' });
      return;
    }

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: number };
    const user = await db('users').where({ id: payload.id, refresh_token: refreshToken, is_active: true }).first();
    if (!user) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const tokens = generateTokens(user);
    await db('users').where({ id: user.id }).update({ refresh_token: tokens.refreshToken });

    res.json({ tokens });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await db('users').where({ id: req.user!.id }).first();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const dept = user.department_id
      ? await db('departments').where({ id: user.department_id }).first()
      : null;
    const manager = user.manager_id
      ? await db('users').where({ id: user.manager_id }).select('id', 'name', 'email').first()
      : null;

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: dept?.name || '',
      manager_id: user.manager_id,
      manager_name: manager?.name || '',
      manager_email: manager?.email || '',
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    await db('users').where({ id: req.user!.id }).update({ refresh_token: null });
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get test users (dev only)
router.get('/test-users', async (_req: Request, res: Response) => {
  try {
    const users = await db('users')
      .select('email', 'name', 'role')
      .where({ is_active: true })
      .orderBy('role');
    res.json(users);
  } catch (err) {
    console.error('Test users error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
