type IconProps = { className?: string };

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const BedIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
    <path d="M3 17v-9" />
    <path d="M3 12h18v5" />
    <path d="M21 17v-3" />
    <path d="M7 12v-2.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1V12" />
    <circle cx="9.5" cy="10.5" r="1.25" />
  </svg>
);

export const BathIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
    <path d="M4 12h16v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
    <path d="M6 12V6.5A2.5 2.5 0 0 1 8.5 4a2.5 2.5 0 0 1 2.5 2.5" />
    <path d="M10 7h2.5" />
    <path d="M7 18l-1 2M17 18l1 2" />
  </svg>
);

export const AreaIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="4" {...strokeProps} />
    <text
      x="12"
      y="15.5"
      textAnchor="middle"
      fontSize="9"
      fontWeight="600"
      fill="currentColor"
      stroke="none"
    >
      m²
    </text>
  </svg>
);

export const SlidersIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
    <path d="M4 7h9M17 7h3" />
    <path d="M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...strokeProps}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
