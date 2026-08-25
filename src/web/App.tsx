import { useEffect, useState } from 'react';
import type { SearchResponse } from '../api/contract.ts';
import {
  DEFAULT_FILTER_STATE,
  type AvailabilityScope,
  type FilterState,
} from '../domain/filters.ts';
import { fetchProperties } from './api.ts';
import { FilterDrawer } from './FilterDrawer.tsx';
import { PropertyCard } from './PropertyCard.tsx';
import { Toolbar } from './Toolbar.tsx';

const sameFilters = (a: FilterState, b: FilterState): boolean =>
  a.availability === b.availability &&
  a.bedrooms.length === b.bedrooms.length &&
  a.bedrooms.every((value) => b.bedrooms.includes(value));

export const App = () => {
  // pending is what the drawer has staged; applied is what the results reflect.
  const [pending, setPending] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [applied, setApplied] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = async (filters: FilterState): Promise<void> => {
    try {
      setData(await fetchProperties(filters));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error inesperado');
    }
  };

  useEffect(() => {
    void load(DEFAULT_FILTER_STATE);
  }, []);

  const apply = () => {
    setApplied(pending);
    void load(pending);
  };

  const reset = () => {
    setPending(DEFAULT_FILTER_STATE);
    setApplied(DEFAULT_FILTER_STATE);
    void load(DEFAULT_FILTER_STATE);
  };

  /**
   * The scope switch lives outside the filter drawer, so it commits on the spot
   * instead of waiting for Apply — still from a handler, never from an effect.
   */
  const changeAvailability = (availability: AvailabilityScope) => {
    const next = { ...applied, availability };
    setPending({ ...pending, availability });
    setApplied(next);
    void load(next);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white">
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Yaya House</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-6">
        <Toolbar
          total={data?.total ?? 0}
          availability={applied.availability}
          onAvailabilityChange={changeAvailability}
          onOpenFilters={() => {
            setFiltersOpen(true);
          }}
        />

        {error !== null && (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
        )}

        {data !== null && data.rejectedRows > 0 && (
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            {data.rejectedRows} fila(s) del CSV se han descartado por no ser válidas.
          </p>
        )}

        {data !== null &&
          (data.total === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
              Ninguna vivienda coincide con estos filtros.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {data.results.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ))}
      </main>

      {filtersOpen && data !== null && (
        <FilterDrawer
          facets={data.facets}
          pending={pending}
          applyDisabled={sameFilters(pending, applied)}
          onPendingChange={setPending}
          onApply={apply}
          onReset={reset}
          onClose={() => {
            setFiltersOpen(false);
          }}
        />
      )}
    </div>
  );
};
