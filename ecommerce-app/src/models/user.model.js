// PSEUDO: User and auth-related DB operations
import { query, getConnection } from '../config/database.js';

export async function userExistsByEmail(email) {
  const rows = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  return rows.length > 0;
}

export async function createUser(email, passwordHash, name) {
  const rows = await query(
    "INSERT INTO users (email, password_hash, name, role, status, created_at, updated_at) VALUES (?, ?, ?, 'customer', 'active', NOW(), NOW())",
    [email, passwordHash, name]
  );
  return rows.insertId;
}

export async function getUserByEmail(email) {
  const rows = await query(
    'SELECT id, email, password_hash, name, role, status FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

export async function getUserById(id) {
  const rows = await query(
    'SELECT id, email, name, role, status FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function updateUserPassword(userId, newHash, conn = null) {
  const runner = conn ? conn.execute.bind(conn) : query;
  const sql = 'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?';
  const params = [newHash, userId];
  if (conn) {
    const [res] = await runner(sql, params);
    return res.affectedRows;
  } else {
    const res = await runner(sql, params);
    return res.affectedRows;
  }
}

export async function createPasswordResetToken(userId, tokenHash, expiresAt) {
  const rows = await query(
    'INSERT INTO password_resets (user_id, token_hash, expires_at, used_at, created_at) VALUES (?, ?, ?, NULL, NOW())',
    [userId, tokenHash, expiresAt]
  );
  return rows.insertId;
}

export async function getResetRecordByTokenHash(tokenHash) {
  const rows = await query(
    'SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at, u.email FROM password_resets pr JOIN users u ON u.id = pr.user_id WHERE pr.token_hash = ? LIMIT 1',
    [tokenHash]
  );
  return rows[0] || null;
}

export async function markResetTokenUsed(resetId, conn = null) {
  const runner = conn ? conn.execute.bind(conn) : query;
  const sql = 'UPDATE password_resets SET used_at = NOW() WHERE id = ? AND used_at IS NULL';
  const params = [resetId];
  if (conn) {
    const [res] = await runner(sql, params);
    return res.affectedRows;
  } else {
    const res = await runner(sql, params);
    return res.affectedRows;
  }
}

export async function storeRefreshToken(userId, refreshTokenHash, expiresAt, deviceInfo, ip) {
  const rows = await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip, created_at, revoked_at) VALUES (?, ?, ?, ?, ?, NOW(), NULL)',
    [userId, refreshTokenHash, expiresAt, deviceInfo || null, ip || null]
  );
  return rows.insertId;
}

export async function revokeRefreshToken(refreshHash) {
  const res = await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL',
    [refreshHash]
  );
  return res.affectedRows;
}

export async function revokeAllRefreshTokensForUser(userId, conn = null) {
  const runner = conn ? conn.execute.bind(conn) : query;
  const sql = 'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL';
  const params = [userId];
  if (conn) {
    const [res] = await runner(sql, params);
    return res.affectedRows;
  } else {
    const res = await runner(sql, params);
    return res.affectedRows;
  }
}

// Admin helpers
export async function findUsersAdmin({ page, limit, q, status, role }) {
  let base = 'FROM users u WHERE 1=1';
  const params = [];
  if (q) {
    base += ' AND (u.email LIKE ? OR u.name LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (status) {
    base += ' AND u.status = ?';
    params.push(status);
  }
  if (role) {
    base += ' AND u.role = ?';
    params.push(role);
  }
  const totalRows = await query(`SELECT COUNT(*) as total ${base}`, params);
  const total = totalRows[0]?.total || 0;
  const items = await query(
    `SELECT u.id, u.email, u.name, u.role, u.status, u.created_at ${base} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );
  return { total, items };
}

export async function setUserStatus(userId, status) {
  const res = await query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, userId]);
  return res.affectedRows;
}
