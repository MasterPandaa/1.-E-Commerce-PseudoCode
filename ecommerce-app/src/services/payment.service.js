// PSEUDO: Payment processing simulation with idempotency
import { maskCard } from '../utils/crypto.js';

export async function charge({ method, card, amount, currency = 'USD', idempotencyKey }) {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 50));
  if (method === 'card') {
    // Basic simulation: approve if amount > 0
    if (amount <= 0) {
      return { status: 'declined', reason: 'Invalid amount' };
    }
    const masked = maskCard(card?.number || '');
    return { status: 'approved', paymentId: `pay_${Date.now()}`, maskedCard: masked };
  }
  if (method === 'cod') {
    return { status: 'approved', paymentId: `cod_${Date.now()}` };
  }
  return { status: 'declined', reason: 'Unsupported method' };
}

export async function refund(paymentId) {
  // Simulate refund success always
  await new Promise((r) => setTimeout(r, 50));
  return { status: 'refunded', paymentId };
}
