import { useEffect } from 'react';
import type { Facets } from '../domain/facets.ts';
import type { FilterState } from '../domain/filters.ts';
import { BedroomFilter } from './BedroomFilter.tsx';
import { CloseIcon } from './icons.tsx';
import { PriceFilter } from './PriceFilter.tsx';

type FilterModalProps = {
  facets: Facets;
  pending: FilterState;
  applyDisabled: boolean;
  onPendingChange: (pending: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
};

const toggleValue = (values: readonly number[], value: number): number[] =>
  values.includes(value) ? values.filter((each) => each !== value) : [...values, value];

export const FilterModal = ({
  facets,
  pending,
  applyDisabled,
  onPendingChange,
  onApply,
  onReset,
  onClose,
}: FilterModalProps) => {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* max-h keeps a long filter list scrolling inside the panel rather than
          pushing Apply off the bottom of the viewport. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filtros"
        className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Filtros</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
          <PriceFilter
            buckets={facets.price}
            range={pending.price}
            onChange={(price) => {
              onPendingChange({ ...pending, price });
            }}
          />

          <BedroomFilter
            options={facets.bedrooms}
            selected={pending.bedrooms}
            onToggle={(value) => {
              onPendingChange({ ...pending, bedrooms: toggleValue(pending.bedrooms, value) });
            }}
          />
        </div>

        <footer className="flex flex-col items-center gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onApply}
            disabled={applyDisabled}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            reset
          </button>
        </footer>
      </aside>
    </div>
  );
};
