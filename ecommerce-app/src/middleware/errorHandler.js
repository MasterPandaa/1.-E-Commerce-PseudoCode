// PSEUDO: Middleware - Centralized error handler
import { logger } from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const safeMessage = status >= 500 ? 'Internal server error' : err.message || 'Error';
  logger.error('Error handler', {
    method: req.method,
    url: req.originalUrl,
    status,
    message: err.message,
    stack: err.stack,
  });
  res.status(status).json({ error: { message: safeMessage } });
}
