import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import '../../utils/leafletSetup';
import { severityColor } from '../../utils/formatters';

const AHMEDABAD_CENTER = [23.0225, 72.5714];

// Colored marker for incidents
const createIncidentIcon = (severity) => {
  const color = severityColor(severity);
  return L.divIcon({
    className: 'incident-marker',
    html: `<div style="
      width: 18px; height: 18px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 8px ${color};
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

// Emoji marker for resources
const createResourceIcon = (subtype, status) => {
  const emoji =
    {
      fire_team: '🚒',
      ambulance: '🚑',
      police: '🚓',
      rescue: '🛟',
      hospital: '🏥',
      shelter: '🏠',
    }[subtype] || '•';

  const opacity = status === 'available' ? 1 : 0.5;

  return L.divIcon({
    className: 'resource-marker',
    html: `<div style="
      font-size: 16px;
      opacity: ${opacity};
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
    ">${emoji}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Component to recenter the map
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
};

const MapView = ({ incidents = [], resources = [], center = null, height = '100%' }) => {
  return (
    <MapContainer
      center={center ? [center[1], center[0]] : AHMEDABAD_CENTER}
      zoom={13}
      style={{ height, width: '100%', borderRadius: 'var(--radius-lg)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {center && <RecenterMap center={[center[1], center[0]]} />}

      {/* Incidents */}
      {incidents.map((incident) => {
        const coords = incident.location?.coordinates;
        if (!coords || coords.length !== 2) return null;
        const [lng, lat] = coords;
        return (
          <Marker
            key={incident._id}
            position={[lat, lng]}
            icon={createIncidentIcon(incident.severity)}
          >
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <strong>{incident.publicId}</strong>
                <div style={{ fontSize: '12px', marginTop: '4px', textTransform: 'capitalize' }}>
                  {incident.type} · {incident.severity}
                </div>
                <div style={{ fontSize: '11px', marginTop: '4px', color: '#666' }}>
                  {incident.address || 'Unknown location'}
                </div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  Priority: <strong>{incident.priority}</strong>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Resources */}
      {resources.map((resource) => {
        const coords = resource.location?.coordinates;
        if (!coords || coords.length !== 2) return null;
        const [lng, lat] = coords;
        return (
          <Marker
            key={resource._id}
            position={[lat, lng]}
            icon={createResourceIcon(resource.subtype, resource.status)}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <strong>{resource.publicId}</strong>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>{resource.name}</div>
                <div style={{ fontSize: '11px', marginTop: '4px', color: '#666' }}>
                  Status: {resource.status}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapView;