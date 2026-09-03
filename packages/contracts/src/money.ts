/**
 * Money crosses the wire as integer cents, so the brand travels with it — a client that
 * receives `Cents` cannot pass it where euros are expected any more than the server can.
 * Formatting is the client's business and stays a render-time concern.
 */
export {
  centsFromEuros,
  formatCents,
  type Cents,
} from '@yaya/domain/money.ts';
