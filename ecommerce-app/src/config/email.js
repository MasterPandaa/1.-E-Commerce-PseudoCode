// PSEUDO: Email configuration and transporter
import nodemailer from 'nodemailer';

const {
  SMTP_HOST = 'localhost',
  SMTP_PORT = 587,
  SMTP_SECURE = 'false',
  SMTP_USER = '',
  SMTP_PASSWORD = '',
  SMTP_FROM = 'Shop <no-reply@example.com>',
} = process.env;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === 'true',
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
});

export async function sendEmail({ to, subject, html, text, attachments }) {
  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
    text,
    attachments,
  });
  return info;
}
