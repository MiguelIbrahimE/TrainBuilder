import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGameStore } from '../../store/gameStore';
import { TRACK_COLORS, STATION_COLORS } from '../../types';
import type { Coordinates } from '../../types';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom station marker icons
const createStationIcon = (type: string) => {
  const color = STATION_COLORS[type as keyof typeof STATION_COLORS] || STATION_COLORS.regional;
  return L.divIcon({
    className: 'custom-station-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Component to set map bounds based on selected region
function MapBoundsController() {
  const map = useMap();
  const { selectedRegion } = useGameStore();

  useEffect(() => {
    if (selectedRegion) {
      const bounds = L.latLngBounds(
        [selectedRegion.bounds[0][0], selectedRegion.bounds[0][1]],
        [selectedRegion.bounds[1][0], selectedRegion.bounds[1][1]]
      );
      map.setMaxBounds(bounds);
      map.fitBounds(bounds);
    }
  }, [map, selectedRegion]);

  return null;
}

// Map event handler component
function MapEventHandler() {
  const {
    currentTool,
    isDrawingTrack,
    addTrackWaypoint,
  } = useGameStore();

  useMapEvents({
    click: (e) => {
      const coords: Coordinates = {
        lat: e.latlng.lat,
        lon: e.latlng.lng,
      };

      // Handle track drawing waypoints
      if (currentTool === 'track' && isDrawingTrack) {
        addTrackWaypoint(coords);
      }
    },
  });

  return null;
}

export function MapView() {
  const { network, selectedRegion } = useGameStore();

  if (!network || !selectedRegion) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[selectedRegion.center.lat, selectedRegion.center.lon]}
        zoom={selectedRegion.zoom}
        className="h-full w-full"
        zoomControl={true}
        minZoom={selectedRegion.zoom - 2}
        maxZoom={18}
      >
        {/* Clean tile layer without labels and minimal infrastructure */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />

        {/* Set bounds controller */}
        <MapBoundsController />

        {/* Map event handler */}
        <MapEventHandler />

        {/* Render stations */}
        {network.stations.map((station) => (
          <Marker
            key={station.id}
            position={[station.location.lat, station.location.lon]}
            icon={createStationIcon(station.stationType)}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-base mb-1">{station.name}</h3>
                <p className="text-gray-600">Type: {station.stationType}</p>
                <p className="text-gray-600">Platforms: {station.platforms}</p>
                <p className="text-gray-600">Cost: €{(station.cost / 1_000_000).toFixed(1)}M</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render tracks */}
        {network.tracks.map((track) => {
          const positions = track.waypoints.map((wp) => [wp.lat, wp.lon] as [number, number]);
          const color = TRACK_COLORS[track.trackType];

          return (
            <Polyline
              key={track.id}
              positions={positions}
              pathOptions={{
                color,
                weight: track.isDoubleTrack ? 6 : 4,
                opacity: 0.8,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-bold text-base mb-1">Track</h3>
                  <p className="text-gray-600">Type: {track.trackType.toUpperCase()}</p>
                  <p className="text-gray-600">Length: {track.lengthKm.toFixed(2)} km</p>
                  <p className="text-gray-600">
                    {track.isDoubleTrack ? 'Double' : 'Single'} Track
                  </p>
                  <p className="text-gray-600">Speed: {track.speedLimit} km/h</p>
                  <p className="text-gray-600">Cost: €{(track.cost / 1_000_000).toFixed(1)}M</p>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Render crossovers */}
        {network.crossovers.map((crossover) => (
          <Marker
            key={crossover.id}
            position={[crossover.location.lat, crossover.location.lon]}
            icon={L.divIcon({
              className: 'custom-crossover-marker',
              html: `<div style="background-color: #FFA500; width: 12px; height: 12px; border-radius: 3px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-base mb-1">{crossover.name || 'Junction'}</h3>
                <p className="text-gray-600">Type: {crossover.crossoverType}</p>
                <p className="text-gray-600">Cost: €{(crossover.cost / 1_000_000).toFixed(1)}M</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
