import type { AvailabilityScope } from '../domain/filters.ts';
import { SlidersIcon } from './icons.tsx';

type ToolbarProps = {
  total: number;
  availability: AvailabilityScope;
  onAvailabilityChange: (availability: AvailabilityScope) => void;
  onOpenFilters: () => void;
};

export const Toolbar = ({
  total,
  availability,
  onAvailabilityChange,
  onOpenFilters,
}: ToolbarProps) => {
  const showingUnavailable = availability === 'all';

  // Equal 1fr columns either side keep the controls centred on the page rather than
  // on whatever is left over after the heading, whose width changes with the result
  // count. Below md the two stack instead.
  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
      <h2 className="text-xl font-semibold text-slate-900">
        {total === 1 ? '1 alquiler' : `${String(total)} alquileres`}{' '}
        <span className="font-normal text-slate-400">en Madrid</span>
      </h2>

      <div className="flex items-center justify-center gap-4">
        {/* A label cannot label a button, so the switch points at the text by id. */}
        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <span id="availability-switch-label">Mostrar no disponibles</span>
          <button
            type="button"
            role="switch"
            aria-checked={showingUnavailable}
            aria-labelledby="availability-switch-label"
            onClick={() => {
              onAvailabilityChange(showingUnavailable ? 'available' : 'all');
            }}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              showingUnavailable ? 'bg-slate-900' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all ${
                showingUnavailable ? 'left-5.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenFilters}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          <SlidersIcon className="size-5" />
          Filtros
        </button>
      </div>
    </div>
  );
};
