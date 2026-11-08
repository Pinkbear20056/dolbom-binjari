import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { latLngBounds, type LatLngBoundsExpression } from 'leaflet';
import type { School } from '../../../shared/types';
import { markerState, vacancy, type MarkerColor } from '../../../shared/rules';

const MARKER_FILL: Record<MarkerColor, string> = {
  grey: '#9ca3af',
  red: '#dc2626',
  yellow: '#f59e0b',
  green: '#16a34a',
};

interface SchoolMapProps {
  schools: School[];
  homeSchoolId: string;
  selectedId: string | null;
  now: Date;
  onSelect: (schoolId: string) => void;
}

const DEFAULT_CENTER: [number, number] = [37.725, 126.75];

/** Re-fits the view whenever the set of located schools changes. */
function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    const bounds: LatLngBoundsExpression = latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key summarises points
  }, [map, key]);
  return null;
}

export default function SchoolMap({ schools, homeSchoolId, selectedId, now, onSelect }: SchoolMapProps) {
  const located = useMemo(() => schools.filter((s) => s.lat !== null && s.lng !== null), [schools]);
  const center = useMemo<[number, number]>(() => {
    if (located.length === 0) return DEFAULT_CENTER;
    const lat = located.reduce((sum, s) => sum + (s.lat ?? 0), 0) / located.length;
    const lng = located.reduce((sum, s) => sum + (s.lng ?? 0), 0) / located.length;
    return [lat, lng];
  }, [located]);

  const points = useMemo<Array<[number, number]>>(() => located.map((s) => [s.lat as number, s.lng as number]), [located]);
  const missing = schools.length - located.length;

  return (
    <div className="map-wrap">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="map" aria-label="묶음 안 학교 지도">
        <FitBounds points={points} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((s) => {
          const marker = markerState(s, now);
          const isHome = s.id === homeSchoolId;
          const isSelected = s.id === selectedId;
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat as number, s.lng as number]}
              radius={isSelected ? 16 : 12}
              pathOptions={{
                color: isSelected ? '#1c1917' : '#ffffff',
                weight: isSelected ? 4 : 3,
                fillColor: MARKER_FILL[marker.color],
                fillOpacity: 0.95,
              }}
              eventHandlers={{ click: () => onSelect(s.id) }}
            >
              <Tooltip permanent direction="right" offset={[14, 0]} className={`map-label map-label-${marker.color}`}>
                <strong>{s.name.replace('초등학교', '초')}</strong>
                {isHome && <span className="map-home"> 우리 학교</span>}
                <br />
                {marker.label}
                {marker.level !== 'stale' && ` · 빈자리 ${vacancy(s)}`}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {missing > 0 && (
        <p className="map-note">좌표가 없는 학교 {missing}곳은 지도에 없고 아래 목록에만 있습니다.</p>
      )}
    </div>
  );
}
