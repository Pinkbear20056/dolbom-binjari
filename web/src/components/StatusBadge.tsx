import type { MarkerState } from '../../../shared/rules';
import { useLang } from '../lib/LangContext';
import { markerLabel, otherLang } from '../lib/i18n';

interface StatusBadgeProps {
  marker: MarkerState;
  size?: 'sm' | 'lg';
}

/** Colour plus text, always together, so the state is readable without colour. Primary label in the UI language, the other language small. */
export default function StatusBadge({ marker, size = 'sm' }: StatusBadgeProps) {
  const { lang } = useLang();
  return (
    <span className={`badge badge-${marker.color} badge-${size}`}>
      <span className="badge-dot" aria-hidden="true" />
      {markerLabel(marker, lang)}
      <span className="badge-en" lang={otherLang(lang)}>
        {' '}
        · {markerLabel(marker, otherLang(lang))}
      </span>
    </span>
  );
}
