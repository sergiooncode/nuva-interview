import type { FacetOption } from '../domain/facets.ts';

const bedroomLabel = (value: number): string => {
  if (value === 0) return 'Estudio';
  return value === 1 ? '1 dormitorio' : `${String(value)} dormitorios`;
};

type BedroomFilterProps = {
  options: FacetOption[];
  selected: readonly number[];
  onToggle: (value: number) => void;
};

export const BedroomFilter = ({ options, selected, onToggle }: BedroomFilterProps) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="mb-2 text-sm font-semibold text-slate-900">Dormitorios</legend>
    {options.map((option) => {
      const unavailable = option.count === 0;
      return (
        <label
          key={option.value}
          className={`flex cursor-pointer items-center gap-2 text-sm ${
            unavailable ? 'cursor-default text-slate-400' : 'text-slate-700'
          }`}
        >
          {/* aria-disabled, not disabled: a disabled input is skipped by keyboard
              navigation and screen readers, hiding "sin disponibilidad" from the
              people who most need to hear it. */}
          <input
            type="checkbox"
            className="size-4 accent-slate-900"
            checked={selected.includes(option.value)}
            aria-disabled={unavailable}
            onChange={() => {
              if (unavailable) return;
              onToggle(option.value);
            }}
          />
          <span className="flex-1">{bedroomLabel(option.value)}</span>
          <span className={unavailable ? 'text-slate-400' : 'text-slate-500'}>
            {unavailable ? 'sin disponibilidad' : option.count}
          </span>
        </label>
      );
    })}
  </fieldset>
);
