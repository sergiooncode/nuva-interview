import { useState } from 'react';
import { formatCents } from '../domain/money.ts';
import type { Property, PropertyStatus } from '../domain/property.ts';
import { AreaIcon, BathIcon, BedIcon } from './icons.tsx';

/** One shared photograph until the catalogue carries its own image column. */
const PROPERTY_IMAGE = '/property.jpg';

const BRAND_TONE: Record<string, string | undefined> = {
  'Yaya STAY': 'text-yaya-orange',
  'Yaya FLEX': 'text-yaya-mint',
};

const AGE_TONE: Record<string, string | undefined> = {
  '+1 año': 'bg-yaya-orange text-white',
  '-1 año': 'bg-yaya-mint text-white',
};

const STATUS_LABEL: Record<PropertyStatus, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  rented: 'Alquilado',
};

const capitalise = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

type BadgeProps = { children: React.ReactNode; className?: string };

const Badge = ({ children, className = '' }: BadgeProps) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap shadow-sm ${className}`}
  >
    {children}
  </span>
);

/** Scale to fit the box rather than filling it, so no export is stretched. */
const SPEC_ICON = 'max-h-full max-w-full object-contain';

type SpecProps = { icon: React.ReactNode; value: string };

const Spec = ({ icon, value }: SpecProps) => (
  <div className="flex flex-1 flex-col items-center gap-2">
    {/* The three exports are 29×15, 27×24 and 25×26. An identical box plus
        object-contain gives them one optical size instead of three, and the
        exports carry their own colour, so no text-* class applies here. */}
    <span className="flex h-6 w-7 items-center justify-center">{icon}</span>
    <span className="text-sm font-medium text-slate-700">{value}</span>
  </div>
);

type PropertyCardProps = { property: Property };

export const PropertyCard = ({ property }: PropertyCardProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const isAvailable = property.status === 'available';

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-900/5">
      <div className="relative aspect-4/3 bg-linear-to-br from-slate-200 to-slate-300">
        {!imageFailed && (
          <img
            src={PROPERTY_IMAGE}
            alt=""
            className={`size-full object-cover ${isAvailable ? '' : 'opacity-60 grayscale-25'}`}
            onError={() => {
              setImageFailed(true);
            }}
          />
        )}

        <div className="absolute inset-x-3 top-3 flex flex-wrap items-start gap-1.5">
          <Badge className={AGE_TONE[property.ageLabel] ?? 'bg-slate-700 text-white'}>
            {property.ageLabel}
          </Badge>

          <Badge className={isAvailable ? 'bg-white text-slate-800' : 'bg-white/85 text-slate-400'}>
            {isAvailable && <span className="size-1.5 rounded-full bg-yaya-green" />}
            {STATUS_LABEL[property.status]}
          </Badge>

          <Badge className="bg-white text-slate-800">{capitalise(property.floorType)}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className={`font-semibold ${BRAND_TONE[property.brand] ?? 'text-slate-500'}`}>
            {property.brand}
          </span>
          <span className="text-slate-700">{property.neighborhood}</span>
          <span className="text-slate-400">· Máx {property.maxOccupancy}</span>
        </p>

        <h3 className="text-lg leading-snug font-semibold text-slate-900">
          {capitalise(property.title)}
        </h3>

        <p className="text-lg font-semibold text-slate-900">
          {formatCents(property.monthlyRent)}
          <span className="text-sm font-normal text-slate-500"> /mes</span>
        </p>

        <div className="mt-auto flex divide-x divide-slate-200 border-y border-slate-100 py-3">
          <Spec icon={<BedIcon className={SPEC_ICON} />} value={String(property.bedrooms)} />
          <Spec icon={<BathIcon className={SPEC_ICON} />} value={String(property.bathrooms)} />
          <Spec icon={<AreaIcon className={SPEC_ICON} />} value={String(property.sizeM2)} />
        </div>

        <button
          type="button"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          Detalles y alquilar
        </button>
      </div>
    </article>
  );
};
