type IconProps = { className?: string };

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * The three card spec icons are the Figma exports. They are decorative — the value
 * beside each one carries the meaning — so they stay out of the accessibility tree.
 */
const exported = (src: string) => {
  const Icon = ({ className }: IconProps) => (
    <img src={src} alt="" aria-hidden="true" className={className} />
  );
  return Icon;
};

export const BedIcon = exported('/icons/bed.png');
export const BathIcon = exported('/icons/bath.png');
export const AreaIcon = exported('/icons/squared-meter.png');

/* Not exported from Figma yet, so these two stay inline and take currentColor. */

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
