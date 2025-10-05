// PSEUDO: Crypto utilities for tokens and hashing
import crypto from 'crypto'

export function randomToken (size = 48) {
  return crypto.randomBytes(size).toString('base64url')
}

export function sha256 (value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function maskCard (number) {
  if (!number) return ''
  const s = String(number).replace(/\D/g, '')
  if (s.length < 4) return '****'
  return '**** **** **** ' + s.slice(-4)
}
