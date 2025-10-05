// PSEUDO: JWT Token Validation Middleware and role guard
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { getUserById } from '../models/user.model.js';
import { isTokenBlacklisted } from '../models/token.model.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, jwtConfig.accessSecret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
    const blacklisted = await isTokenBlacklisted(decoded.jti);
    if (blacklisted) {
      return res.status(401).json({ error: { message: 'Token revoked' } });
    }
    const user = await getUserById(decoded.sub);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    req.user = { id: user.id, role: user.role };
    req.token = decoded;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { message: 'Token expired' } });
    }
    return res.status(401).json({ error: { message: 'Invalid token' } });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }
    next();
  };
}
