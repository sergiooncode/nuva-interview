import { centsFromEuros } from '../money.ts';
import type { Property, PropertyStatus } from '../property.ts';

/**
 * Eight hand-written units. Only bedrooms and status vary, so the expected facet
 * counts are readable straight off the table:
 *
 *   bedrooms | available | other statuses
 *   ---------+-----------+---------------
 *      0     |     1     | 1 reserved
 *      1     |     2     | -
 *      2     |     1     | 1 rented
 *      3     |     0     | 1 rented      <- exists, but nothing available
 *      4     |     1     | -
 *
 * Five units are available in total.
 */
const unit = (
  id: string,
  bedrooms: number,
  status: PropertyStatus,
  euros: number,
): Property => ({
  id,
  title: `piso de ${String(bedrooms)} dormitorios`,
  brand: 'Yaya STAY',
  neighborhood: 'Lavapiés',
  status,
  bedrooms,
  bathrooms: 1,
  maxOccupancy: bedrooms + 1,
  sizeM2: 40 + bedrooms * 20,
  monthlyRent: centsFromEuros(euros),
  floorType: '2ª planta',
  isExterior: true,
  ageLabel: '+1 año',
});

export const FIXTURE_PROPERTIES: readonly Property[] = [
  unit('fx_01', 0, 'available', 760),
  unit('fx_02', 0, 'reserved', 720),
  unit('fx_03', 1, 'available', 1180),
  unit('fx_04', 1, 'available', 1260),
  unit('fx_05', 2, 'available', 1850),
  unit('fx_06', 2, 'rented', 1560),
  unit('fx_07', 3, 'rented', 2100),
  unit('fx_08', 4, 'available', 2140),
];
