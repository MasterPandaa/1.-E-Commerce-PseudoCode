// PSEUDO: Auth service implementing register, login, password reset, logout
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'
import { jwtConfig } from '../config/jwt.js'
import {
  userExistsByEmail,
  createUser,
  getUserByEmail,
  updateUserPassword,
  createPasswordResetToken,
  getResetRecordByTokenHash,
  markResetTokenUsed,
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser
} from '../models/user.model.js'
import { blacklistAccessTokenJti } from '../models/token.model.js'
import { randomToken, sha256 } from '../utils/crypto.js'
import { sendPasswordResetEmail } from './email.service.js'
import { getConnection } from '../config/database.js'

function generateAccessToken (userId, role) {
  const jti = uuidv4()
  const token = jwt.sign({ sub: userId, role }, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpires,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    jwtid: jti
  })
  return { token, jti }
}

function getRefreshExpiryDate () {
  // parse refresh expiry string like '30d'
  const match = String(jwtConfig.refreshExpires).match(/(\d+)([smhd])/)
  if (!match) return dayjs().add(30, 'day').toDate()
  const amount = Number(match[1])
  const unit = match[2]
  const map = { s: 'second', m: 'minute', h: 'hour', d: 'day' }
  return dayjs().add(amount, map[unit]).toDate()
}

export async function registerUser (email, password, name) {
  // PSEUDO: registerUser
  if (await userExistsByEmail(email)) {
    return { type: 'conflict', message: 'Email already registered' }
  }
  const hash = await bcrypt.hash(password, 10)
  const userId = await createUser(email, hash, name)
  // Optional: send verification email (omitted for brevity)
  return { type: 'success', data: { id: userId, email, name } }
}

export async function loginUser (email, password, deviceInfo, ip) {
  // PSEUDO: loginUser
  const user = await getUserByEmail(email)
  if (!user) return { type: 'auth_error', message: 'Invalid credentials' }
  if (user.status !== 'active') {
    return { type: 'auth_error', message: 'Account suspended' }
  }
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) return { type: 'auth_error', message: 'Invalid credentials' }
  const { token: accessToken, jti } = generateAccessToken(user.id, user.role)
  const refreshPlain = randomToken(48)
  const refreshHash = sha256(refreshPlain)
  const refreshExpires = getRefreshExpiryDate()
  await storeRefreshToken(user.id, refreshHash, refreshExpires, deviceInfo, ip)
  return {
    type: 'success',
    data: {
      accessToken,
      refreshToken: refreshPlain,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }
  }
}

export async function requestPasswordReset (email, appBaseUrl) {
  // PSEUDO: requestPasswordReset
  const user = await getUserByEmail(email)
  // Always return success message regardless of existence
  if (user) {
    const rawToken = randomToken(48)
    const tokenHash = sha256(rawToken)
    const expiresAt = dayjs().add(1, 'hour').toDate()
    await createPasswordResetToken(user.id, tokenHash, expiresAt)
    const resetLink = `${appBaseUrl}/reset-password?token=${rawToken}`
    try {
      await sendPasswordResetEmail(user.email, resetLink)
    } catch (e) {
      // swallow to avoid leaking info
    }
  }
  return {
    type: 'success',
    message: 'If the email exists, a reset link has been sent'
  }
}

export async function verifyResetToken (rawToken) {
  const tokenHash = sha256(rawToken)
  const rec = await getResetRecordByTokenHash(tokenHash)
  if (!rec || rec.used_at || dayjs(rec.expires_at).isBefore(dayjs())) {
    return { type: 'error', message: 'Invalid or expired token' }
  }
  return {
    type: 'success',
    data: { resetId: rec.id, userId: rec.user_id, email: rec.email }
  }
}

export async function confirmPasswordReset (rawToken, newPassword) {
  const tokenHash = sha256(rawToken)
  const rec = await getResetRecordByTokenHash(tokenHash)
  if (!rec || rec.used_at || dayjs(rec.expires_at).isBefore(dayjs())) {
    return { type: 'validation_error', message: 'Invalid or expired token' }
  }
  const conn = await getConnection()
  try {
    await conn.beginTransaction()
    const newHash = await bcrypt.hash(newPassword, 10)
    await updateUserPassword(rec.user_id, newHash, conn)
    await markResetTokenUsed(rec.id, conn)
    await revokeAllRefreshTokensForUser(rec.user_id, conn)
    await conn.commit()
    return { type: 'success', message: 'Password updated' }
  } catch (e) {
    await conn.rollback()
    return { type: 'server_error', message: 'Failed to update password' }
  } finally {
    conn.release()
  }
}

export async function logoutUser (decodedAccessToken, refreshTokenPlain) {
  // PSEUDO: logoutUser
  try {
    if (
      decodedAccessToken &&
      decodedAccessToken.jti &&
      decodedAccessToken.exp
    ) {
      const expiresAt = new Date(decodedAccessToken.exp * 1000)
      await blacklistAccessTokenJti(decodedAccessToken.jti, expiresAt)
    }
    if (refreshTokenPlain) {
      const refreshHash = sha256(refreshTokenPlain)
      await revokeRefreshToken(refreshHash)
    }
    return { type: 'success', message: 'Logged out' }
  } catch (e) {
    return { type: 'server_error', message: 'Logout failed' }
  }
}
