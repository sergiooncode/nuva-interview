import { z } from 'zod';
import { CentsSchema, centsFromEuros } from './money.ts';

export const PROPERTY_STATUSES = ['available', 'reserved', 'rented'] as const;

/** The domain object, and equally the wire shape the frontend validates against. */
export const PropertySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  brand: z.string().min(1),
  neighborhood: z.string().min(1),
  status: z.enum(PROPERTY_STATUSES),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  maxOccupancy: z.number().int().positive(),
  sizeM2: z.number().int().positive(),
  monthlyRent: CentsSchema,
  floorType: z.string().min(1),
  isExterior: z.boolean(),
  ageLabel: z.string().min(1),
});

export type Property = z.infer<typeof PropertySchema>;
export type PropertyStatus = Property['status'];

/**
 * Every CSV cell arrives as a string. `z.coerce.number()` is wrong here: it reads
 * "" and " " as 0, which would turn a missing bedroom count into a studio.
 */
const wholeNumber = (field: string) =>
  z
    .string()
    .regex(/^\d+$/, `${field} must be a whole number`)
    .transform(Number);

export const PropertyCsvRowSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    brand: z.string(),
    neighborhood: z.string(),
    status: z.enum(PROPERTY_STATUSES),
    bedrooms: wholeNumber('bedrooms'),
    bathrooms: wholeNumber('bathrooms'),
    max_occupancy: wholeNumber('max_occupancy'),
    size_m2: wholeNumber('size_m2'),
    monthly_rent: wholeNumber('monthly_rent'),
    currency: z.literal('EUR'),
    floor_type: z.string(),
    // The CSV carries the strings "true"/"false"; z.coerce.boolean() reads "false" as true.
    is_exterior: z.enum(['true', 'false']).transform((value) => value === 'true'),
    age_label: z.string(),
  })
  .transform((row): Property => ({
    id: row.id,
    title: row.title,
    brand: row.brand,
    neighborhood: row.neighborhood,
    status: row.status,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    maxOccupancy: row.max_occupancy,
    sizeM2: row.size_m2,
    monthlyRent: centsFromEuros(row.monthly_rent),
    floorType: row.floor_type,
    isExterior: row.is_exterior,
    ageLabel: row.age_label,
  }));
