import type { MarkerState } from '../../../shared/rules';

interface StatusBadgeProps {
  marker: MarkerState;
  size?: 'sm' | 'lg';
}

/** Colour plus text, always together, so the state is readable without colour. */
export default function StatusBadge({ marker, size = 'sm' }: StatusBadgeProps) {
  return (
    <span className={`badge badge-${marker.color} badge-${size}`}>
      <span className="badge-dot" aria-hidden="true" />
      {marker.label}
      <span className="badge-en"> · {marker.labelEn}</span>
    </span>
  );
}
