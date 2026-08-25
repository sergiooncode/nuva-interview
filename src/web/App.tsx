import { useEffect, useState } from 'react';
import type { SearchResponse } from '../api/contract.ts';
import { DEFAULT_FILTER_STATE, type FilterState } from '../domain/filters.ts';
import { fetchProperties } from './api.ts';
import { BedroomFilter } from './BedroomFilter.tsx';
import { PropertyCard } from './PropertyCard.tsx';

const sameFilters = (a: FilterState, b: FilterState): boolean =>
  a.bedrooms.length === b.bedrooms.length &&
  a.bedrooms.every((value) => b.bedrooms.includes(value));

const toggleValue = (values: readonly number[], value: number): number[] =>
  values.includes(value) ? values.filter((each) => each !== value) : [...values, value];

export const App = () => {
  // pending is what the panel has staged; applied is what the results reflect.
  const [pending, setPending] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [applied, setApplied] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <h1 className="text-xl font-semibold">Yaya House</h1>
          <p className="text-sm text-slate-500">Catálogo de viviendas disponibles</p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-64">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <BedroomFilter
              options={data?.facets.bedrooms ?? []}
              selected={pending.bedrooms}
              onToggle={(value) => {
                setPending({ ...pending, bedrooms: toggleValue(pending.bedrooms, value) });
              }}
            />
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={apply}
                disabled={sameFilters(pending, applied)}
                className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-300"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Restablecer
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          {error !== null && (
            <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
          )}

          {data !== null && (
            <>
              <div className="mb-4 flex items-baseline justify-between">
                <p className="text-sm text-slate-600">
                  {data.total === 1 ? '1 vivienda' : `${String(data.total)} viviendas`}
                </p>
                {data.rejectedRows > 0 && (
                  <p className="text-sm text-amber-700">
                    {data.rejectedRows} fila(s) descartada(s) del CSV
                  </p>
                )}
              </div>

              {data.total === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                  Ninguna vivienda coincide con estos filtros.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {data.results.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};
