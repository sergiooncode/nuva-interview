import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { PropertyCsvRowSchema, type Property } from '@yaya/domain/property.ts';

export type RejectedRow = { row: number; reason: string };

export type Catalogue = {
  properties: Property[];
  rejected: RejectedRow[];
};

const describe = (error: unknown): string => {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`)
      .join('; ');
  }
  return error instanceof Error ? error.message : String(error);
};

/**
 * The CSV is untrusted input, so a row that fails validation is collected with its
 * line number rather than aborting the load. `relax_column_count` keeps a row of the
 * wrong width a row-level failure instead of a file-level one.
 */
export const parseCatalogue = (csv: string): Catalogue => {
  const records = parse<{ record: unknown; info: { lines: number } }>(csv, {
    columns: true,
    bom: true,
    info: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  const properties: Property[] = [];
  const rejected: RejectedRow[] = [];

  for (const { record, info } of records) {
    try {
      properties.push(PropertyCsvRowSchema.parse(record));
    } catch (error) {
      rejected.push({ row: info.lines, reason: describe(error) });
    }
  }

  return { properties, rejected };
};
