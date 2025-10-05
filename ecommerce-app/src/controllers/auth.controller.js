// PSEUDO: Auth controller maps HTTP to service
import * as authService from '../services/auth.service.js';

export async function register(req, res) {
  const { email, password, name } = req.body;
  const result = await authService.registerUser(email, password, name);
  if (result.type === 'success') return res.status(201).json(result.data);
  if (result.type === 'conflict') return res.status(409).json({ error: { message: result.message } });
  return res.status(500).json({ error: { message: 'Registration failed' } });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const deviceInfo = req.headers['x-device-info'] || null;
  const result = await authService.loginUser(email, password, deviceInfo, req.ip);
  if (result.type === 'success') return res.status(200).json(result.data);
  if (result.type === 'auth_error') return res.status(401).json({ error: { message: 'Invalid credentials' } });
  return res.status(500).json({ error: { message: 'Login failed' } });
}

export async function requestPasswordReset(req, res) {
  const { email } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const result = await authService.requestPasswordReset(email, baseUrl);
  if (result.type === 'success') return res.status(200).json({ message: result.message });
  return res.status(500).json({ error: { message: 'Could not process reset request' } });
}

export async function verifyPasswordReset(req, res) {
  const { token } = req.query;
  const result = await authService.verifyResetToken(String(token));
  if (result.type === 'success') return res.status(200).json({ valid: true, email: result.data.email });
  return res.status(400).json({ valid: false, error: { message: result.message } });
}

export async function confirmPasswordReset(req, res) {
  const { token, newPassword } = req.body;
  const result = await authService.confirmPasswordReset(String(token), newPassword);
  if (result.type === 'success') return res.status(200).json({ message: 'Password updated' });
  if (result.type === 'validation_error') return res.status(400).json({ error: { message: result.message } });
  return res.status(500).json({ error: { message: 'Failed to update password' } });
}

export async function logout(req, res) {
  const { refreshToken } = req.body || {};
  const result = await authService.logoutUser(req.token, refreshToken);
  if (result.type === 'success') return res.status(200).json({ message: 'Logged out' });
  return res.status(500).json({ error: { message: 'Logout failed' } });
}
