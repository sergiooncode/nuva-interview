import type { FacetOption } from '../domain/facets.ts';

const bedroomLabel = (value: number): string => {
  if (value === 0) return 'Estudio';
  return value === 1 ? '1 Dormitorio' : `${String(value)} Dormitorios`;
};

type BedroomFilterProps = {
  options: FacetOption[];
  selected: readonly number[];
  onToggle: (value: number) => void;
};

export const BedroomFilter = ({ options, selected, onToggle }: BedroomFilterProps) => (
  <fieldset>
    <legend className="mb-3 text-sm font-semibold text-slate-900">Dormitorios</legend>

    <div className="flex flex-col gap-1">
      {options.map((option) => {
        const unavailable = option.count === 0;
        return (
          <label
            key={option.value}
            className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm ${
              unavailable ? 'text-slate-300' : 'cursor-pointer text-slate-800 hover:bg-slate-50'
            }`}
          >
            {/* aria-disabled, not disabled: a disabled input is skipped by keyboard
                navigation and ignored by screen readers, hiding "sin disponibilidad"
                from exactly the people who most need to be told. */}
            <input
              type="checkbox"
              className="size-5 rounded-sm accent-slate-900"
              checked={selected.includes(option.value)}
              aria-disabled={unavailable}
              onChange={() => {
                if (unavailable) return;
                onToggle(option.value);
              }}
            />
            <span className="flex-1">{bedroomLabel(option.value)}</span>
            <span className={unavailable ? 'text-slate-300' : 'text-slate-400'}>
              {option.count}
            </span>
          </label>
        );
      })}
    </div>
  </fieldset>
);
