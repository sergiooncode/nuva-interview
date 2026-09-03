import { z } from 'zod';
import { DomainError } from './errors.ts';

/**
 * Integer euro cents. The brand makes passing a euro amount where cents are
 * expected a compile error rather than a hundredfold undercharge.
 */
export type Cents = number & { readonly __brand: unique symbol };

/** The one place the brand is applied, so no other module needs a cast. */
export const CentsSchema = z
  .number()
  .int()
  .nonnegative()
  .transform((value) => value as Cents);

/** For values already in cents — bucket edges and the like — rather than euros. */
export const cents = (value: number): Cents => CentsSchema.parse(value);

export const centsFromEuros = (euros: number): Cents => {
  if (!Number.isFinite(euros)) {
    throw new DomainError(`Rent is not a finite number: ${String(euros)}`);
  }
  const cents = Math.round(euros * 100);
  if (Math.abs(euros * 100 - cents) > Number.EPSILON * Math.abs(cents)) {
    throw new DomainError(`Rent ${String(euros)} EUR is not a whole number of cents`);
  }
  if (cents < 0) {
    throw new DomainError(`Rent ${String(euros)} EUR is negative`);
  }
  return cents as Cents;
};

/** The only place cents become a display string. */
export const formatCents = (cents: Cents): string =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
