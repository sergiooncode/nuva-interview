import { formatCents } from '../domain/money.ts';
import type { Property } from '../domain/property.ts';

type PropertyCardProps = { property: Property };

export const PropertyCard = ({ property }: PropertyCardProps) => (
  <article className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <h3 className="text-base font-semibold text-slate-900 first-letter:uppercase">
        {property.title}
      </h3>
      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        {property.brand}
      </span>
    </div>

    <p className="text-sm text-slate-500">
      {property.neighborhood} · {property.floorType}
      {property.isExterior ? ' · exterior' : ' · interior'}
    </p>

    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
      <div className="flex gap-1">
        <dt className="text-slate-500">Dormitorios</dt>
        <dd className="font-medium">{property.bedrooms}</dd>
      </div>
      <div className="flex gap-1">
        <dt className="text-slate-500">Baños</dt>
        <dd className="font-medium">{property.bathrooms}</dd>
      </div>
      <div className="flex gap-1">
        <dt className="text-slate-500">Superficie</dt>
        <dd className="font-medium">{property.sizeM2} m²</dd>
      </div>
    </dl>

    <p className="mt-auto text-lg font-semibold text-slate-900">
      {formatCents(property.monthlyRent)}
      <span className="text-sm font-normal text-slate-500"> /mes</span>
    </p>
  </article>
);
