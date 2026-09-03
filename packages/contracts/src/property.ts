/**
 * The property as it crosses the wire.
 *
 * Today this is the domain shape verbatim, which is convenient and is also the reason
 * this module exists: when the domain model gains a field the client has no business
 * seeing — an owner, an acquisition cost, a margin — the projection is applied here and
 * nowhere else. Re-exporting is the seam; widening it is a deliberate edit.
 */
export {
  PROPERTY_STATUSES,
  PropertySchema,
  type Property,
  type PropertyStatus,
} from '@yaya/domain/property.ts';
