import { z } from 'zod';
import { centsFromEuros } from './money.ts';

/**
 * Every CSV cell arrives as a string. `z.coerce.number()` is wrong here: it reads
 * "" and " " as 0, which would turn a missing bedroom count into a studio.
 */
const wholeNumber = (field: string) =>
  z
    .string()
    .regex(/^\d+$/, `${field} must be a whole number`)
    .transform(Number);

export const PROPERTY_STATUSES = ['available', 'reserved', 'rented'] as const;

const PropertyRowSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  brand: z.string().min(1),
  neighborhood: z.string().min(1),
  status: z.enum(PROPERTY_STATUSES),
  bedrooms: wholeNumber('bedrooms'),
  bathrooms: wholeNumber('bathrooms'),
  max_occupancy: wholeNumber('max_occupancy'),
  size_m2: wholeNumber('size_m2'),
  monthly_rent: wholeNumber('monthly_rent'),
  currency: z.literal('EUR'),
  floor_type: z.string().min(1),
  // The CSV carries the strings "true"/"false"; z.coerce.boolean() reads "false" as true.
  is_exterior: z.enum(['true', 'false']).transform((value) => value === 'true'),
  age_label: z.string().min(1),
});

export const PropertySchema = PropertyRowSchema.transform((row) => ({
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

export type Property = z.infer<typeof PropertySchema>;
export type PropertyStatus = Property['status'];
