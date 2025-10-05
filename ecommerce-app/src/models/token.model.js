// PSEUDO: Token blacklist and related operations
import { query } from '../config/database.js';

export async function isTokenBlacklisted(jti) {
  const rows = await query(
    'SELECT 1 FROM token_blacklist WHERE jti = ? AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1',
    [jti]
  );
  return rows.length > 0;
}

export async function blacklistAccessTokenJti(jti, expiresAt) {
  const rows = await query(
    'INSERT INTO token_blacklist (jti, expires_at, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)',
    [jti, expiresAt]
  );
  return rows.insertId || 0;
}
