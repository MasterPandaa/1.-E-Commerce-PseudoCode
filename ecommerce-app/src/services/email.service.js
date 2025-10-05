// PSEUDO: Email sending service
import { sendEmail } from '../config/email.js';

export async function sendPasswordResetEmail(to, resetLink) {
  const html = `<p>You requested a password reset.</p><p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, you can ignore this email.</p>`;
  return sendEmail({ to, subject: 'Password Reset', html });
}

export async function sendOrderConfirmationEmail(to, orderId) {
  const html = `<p>Thank you for your order #${orderId}.</p>`;
  return sendEmail({ to, subject: `Order Confirmation #${orderId}` , html });
}
