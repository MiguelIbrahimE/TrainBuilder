import { useEffect, useState } from 'react';
import { GeoJSON, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import type { MapRegion } from '../../types';
import './map-styles.css';

interface SimpleMapBackgroundProps {
  region: MapRegion;
}

interface GeoData {
  country: any;
  cities: Array<{
    type: string;
    properties: {
      name: string;
      population: number;
      type: string;
    };
    geometry: {
      type: string;
      coordinates: [number, number];
    };
  }>;
  water?: Array<{
    type: string;
    properties: {
      name: string;
      type: 'lake' | 'river';
    };
    geometry: any;
  }>;
}

/**
 * Simple map background using GeoJSON instead of thousands of PNG tiles
 *
 * Benefits:
 * - Single HTTP request instead of 1000+ tile requests
 * - ~10KB GeoJSON vs MBs of PNG tiles
 * - Instant rendering at any zoom level
 * - No missing tiles (404 errors)
 * - Only shows selected country, no surrounding clutter
 */
export function SimpleMapBackground({ region }: SimpleMapBackgroundProps) {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/geodata/${region.id}`
        );

        if (!response.ok) {
          console.warn(`GeoData not available for ${region.id}, using simple background`);
          setGeoData(null);
          return;
        }

        const data = await response.json();
        setGeoData(data);
      } catch (error) {
        console.warn('Failed to load geodata:', error);
        setGeoData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGeoData();
  }, [region.id]);

  if (loading) {
    return null; // Show nothing while loading (very fast anyway)
  }

  return (
    <>
      {/* Ocean/Water background - light blue */}
      <Rectangle
        bounds={[
          [region.bounds[0][0], region.bounds[0][1]],
          [region.bounds[1][0], region.bounds[1][1]],
        ]}
        pathOptions={{
          fillColor: '#a8dadc',
          fillOpacity: 1,
          color: '#457b9d',
          weight: 1,
        }}
      />

      {/* Country land mass - natural terrain colors */}
      {geoData?.country && (
        <GeoJSON
          data={geoData.country}
          style={{
            fillColor: '#e9f5db',  // Light green land
            fillOpacity: 1,
            color: '#52b788',       // Green border
            weight: 2,
          }}
        />
      )}

      {/* Water bodies (lakes, rivers) */}
      {geoData?.water && (
        <GeoJSON
          data={{
            type: 'FeatureCollection',
            features: geoData.water,
          } as any}
          style={(feature) => {
            const isRiver = feature?.properties?.type === 'river';
            return {
              fillColor: '#4a90e2',    // Blue water
              fillOpacity: isRiver ? 0 : 0.6,
              color: '#2e5f8a',         // Darker blue border
              weight: isRiver ? 3 : 1,
              opacity: isRiver ? 0.7 : 1,
            };
          }}
        />
      )}

      {/* Cities - shown as built-up urban areas */}
      {geoData?.cities && (
        <GeoJSON
          data={{
            type: 'FeatureCollection',
            features: geoData.cities,
          } as any}
          pointToLayer={(feature, latlng) => {
            const population = feature.properties.population;
            // Larger cities = bigger urban areas
            const radius = population > 500000 ? 3500 :
                          population > 200000 ? 2000 :
                          population > 100000 ? 1200 : 800;

            // Cities shown as semi-transparent gray urban areas
            return L.circle(latlng, {
              radius,
              fillColor: '#95a5a6',
              fillOpacity: 0.3,
              color: '#7f8c8d',
              weight: 1,
              opacity: 0.5,
            });
          }}
          onEachFeature={(feature, layer) => {
            if (feature.properties && feature.properties.name) {
              // City name labels
              layer.bindTooltip(feature.properties.name, {
                permanent: false,
                direction: 'top',
                className: 'city-label',
                offset: [0, -10],
              });
            }
          }}
        />
      )}
    </>
  );
}
