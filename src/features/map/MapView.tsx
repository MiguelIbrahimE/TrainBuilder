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

// Component to set map bounds based on selected region - strict boundaries
function MapBoundsController() {
  const map = useMap();
  const { selectedRegion } = useGameStore();

  useEffect(() => {
    if (selectedRegion) {
      const bounds = L.latLngBounds(
        [selectedRegion.bounds[0][0], selectedRegion.bounds[0][1]],
        [selectedRegion.bounds[1][0], selectedRegion.bounds[1][1]]
      );
      
      // Set strict bounds - cannot pan outside the region
      map.setMaxBounds(bounds);
      map.setMinZoom(selectedRegion.zoom - 2);
      map.setMaxZoom(14); // Limit max zoom to avoid loading too many tiles
      
      // Fit to bounds with padding
      map.fitBounds(bounds, { padding: [20, 20] });
      
      // Prevent panning outside bounds
      map.on('drag', () => {
        if (!bounds.contains(map.getCenter())) {
          map.panInsideBounds(bounds, { animate: false });
        }
      });
    }
  }, [map, selectedRegion]);

  return null;
}

// Helper functions
const findNearestStation = (coord: Coordinates, stations: any[], maxDistance = 0.02): any => {
  let nearest = null;
  let minDistance = Infinity;

  stations.forEach(station => {
    const distance = Math.sqrt(
      Math.pow(coord.lat - station.location.lat, 2) + 
      Math.pow(coord.lon - station.location.lon, 2)
    );
    
    if (distance < minDistance && distance < maxDistance) {
      minDistance = distance;
      nearest = station;
    }
  });

  return nearest;
};

const generateStationName = (stationCount: number): string => {
  const cities = [
    'Amsterdam', 'Rotterdam', 'Utrecht', 'The Hague', 'Eindhoven', 
    'Groningen', 'Maastricht', 'Nijmegen', 'Arnhem', 'Breda',
    'Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liège',
    'Cologne', 'Aachen', 'Düsseldorf', 'Lille', 'Luxembourg'
  ];
  
  return stationCount < cities.length 
    ? cities[stationCount] 
    : `Station ${stationCount + 1}`;
};

// Enhanced MapEventHandler with complete construction logic
function MapEventHandler() {
  const {
    currentTool,
    isDrawingTrack,
    trackStartNodeId,
    trackDrawingPoints,
    addStation,
    startDrawingTrack,
    addTrackWaypoint,
    finishDrawingTrack,
    cancelDrawingTrack,
    toolSettings,
    network,
  } = useGameStore();

  const map = useMap();

  useMapEvents({
    click: (e) => {
      const coords: Coordinates = {
        lat: e.latlng.lat,
        lon: e.latlng.lng,
      };

      switch (currentTool) {
        case 'station':
          // Add new station
          const stationName = generateStationName(network?.stations.length || 0);
          addStation({
            name: stationName,
            location: coords,
            platforms: toolSettings.platforms,
            stationType: toolSettings.stationType,
            facilities: toolSettings.facilities,
          });
          break;

        case 'track':
          if (!isDrawingTrack) {
            // Start drawing track from nearest station
            const nearestStation = findNearestStation(coords, network?.stations || []);
            if (nearestStation) {
              startDrawingTrack(nearestStation.id, nearestStation.location);
              addTrackWaypoint(coords); // Add first waypoint
            }
          } else {
            // Continue drawing track
            addTrackWaypoint(coords);
          }
          break;

        case 'crossover':
          // Add crossover at clicked location
          const crossoverName = `Junction ${(network?.crossovers.length || 0) + 1}`;
          useGameStore.getState().addCrossover({
            id: crypto.randomUUID(),
            name: crossoverName,
            location: coords,
            crossoverType: toolSettings.crossoverType,
            cost: 0, // Will be calculated in the store
          });
          break;
      }
    },

    dblclick: (e) => {
      // Finish track on double click
      if (currentTool === 'track' && isDrawingTrack && trackDrawingPoints.length > 1) {
        const coords: Coordinates = {
          lat: e.latlng.lat,
          lon: e.latlng.lng,
        };
        
        const nearestStation = findNearestStation(coords, network?.stations || []);

        if (nearestStation && trackStartNodeId) {
          finishDrawingTrack({
            trackType: toolSettings.trackType,
            fromNodeId: trackStartNodeId,
            toNodeId: nearestStation.id,
            waypoints: trackDrawingPoints,
            isDoubleTrack: toolSettings.isDoubleTrack,
          });
        } else {
          // Cancel if no station to connect to
          cancelDrawingTrack();
        }
      }
    },

    contextmenu: (e) => {
      // Right-click to cancel drawing
      if (isDrawingTrack) {
        cancelDrawingTrack();
        e.originalEvent.preventDefault();
      }
    },
  });

  return null;
}

// Track drawing visualization
function TrackDrawingOverlay() {
  const { isDrawingTrack, trackDrawingPoints } = useGameStore();
  
  if (!isDrawingTrack || trackDrawingPoints.length < 2) return null;

  const positions = trackDrawingPoints.map(wp => [wp.lat, wp.lon] as [number, number]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#00ff00',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
      }}
    />
  );
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
        maxZoom={14}
        maxBounds={[
          [selectedRegion.bounds[0][0], selectedRegion.bounds[0][1]],
          [selectedRegion.bounds[1][0], selectedRegion.bounds[1][1]],
        ]}
        maxBoundsViscosity={1.0} // Strict - cannot pan outside
      >
        {/* OpenStreetMap tiles - shows roads, buildings, highways */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={6}
        />

        {/* Set bounds controller */}
        <MapBoundsController />

        {/* Map event handler */}
        <MapEventHandler />

        {/* Track drawing overlay */}
        <TrackDrawingOverlay />

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