import type { PriceBucket } from '../domain/facets.ts';
import type { PriceRange } from '../domain/filters.ts';
import { centsFromEuros, formatCents, type Cents } from '../domain/money.ts';

const toEuroInput = (value: Cents | null): string =>
  value === null ? '' : String(Math.round(value / 100));

/** An empty field means "unbounded on this side", not zero. */
const fromEuroInput = (raw: string): Cents | null => {
  if (raw.trim() === '') return null;
  const euros = Math.floor(Number(raw));
  return Number.isFinite(euros) && euros >= 0 ? centsFromEuros(euros) : null;
};

type PriceFilterProps = {
  buckets: PriceBucket[];
  range: PriceRange;
  onChange: (range: PriceRange) => void;
};

export const PriceFilter = ({ buckets, range, onChange }: PriceFilterProps) => {
  const busiest = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-slate-900">Precio</legend>

      {buckets.length > 0 && (
        <div className="mb-4 flex h-16 items-end gap-0.5" aria-hidden="true">
          {buckets.map((bucket) => {
            const inRange =
              (range.min === null || bucket.to >= range.min) &&
              (range.max === null || bucket.from <= range.max);
            return (
              <div
                key={bucket.from}
                title={`${formatCents(bucket.from)} – ${formatCents(bucket.to)}: ${String(bucket.count)}`}
                style={{ height: `${String(Math.max(4, (bucket.count / busiest) * 100))}%` }}
                className={`flex-1 rounded-t-sm ${inRange ? 'bg-slate-800' : 'bg-slate-200'}`}
              />
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="flex-1 text-xs text-slate-500">
          Mínimo
          <input
            type="number"
            min={0}
            step={50}
            inputMode="numeric"
            placeholder="Sin mínimo"
            value={toEuroInput(range.min)}
            onChange={(event) => {
              onChange({ ...range, min: fromEuroInput(event.target.value) });
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </label>

        <label className="flex-1 text-xs text-slate-500">
          Máximo
          <input
            type="number"
            min={0}
            step={50}
            inputMode="numeric"
            placeholder="Sin máximo"
            value={toEuroInput(range.max)}
            onChange={(event) => {
              onChange({ ...range, max: fromEuroInput(event.target.value) });
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>

      {range.min !== null && range.max !== null && range.min > range.max && (
        <p className="mt-2 text-xs text-red-600">
          El mínimo no puede superar al máximo.
        </p>
      )}
    </fieldset>
  );
};
