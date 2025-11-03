import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { MapRegion } from '../../types';

interface BoundedTileLayerProps {
  region: MapRegion;
  tileUrl: string;
}

/**
 * Calculate tile bounds for a region at a given zoom level
 */
function getTileBounds(bounds: MapRegion['bounds'], zoom: number) {
  const [[south, west], [north, east]] = bounds;
  
  const lat2tile = (lat: number, z: number) => {
    return Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, z)
    );
  };
  
  const lon2tile = (lon: number, z: number) => {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, z));
  };

  const xMin = lon2tile(west, zoom);
  const xMax = lon2tile(east, zoom);
  const yMin = lat2tile(north, zoom);
  const yMax = lat2tile(south, zoom);

  return { xMin, xMax, yMin, yMax };
}

/**
 * Custom Leaflet GridLayer that only loads tiles within bounds
 */
class BoundedGridLayer extends L.GridLayer {
  private region: MapRegion;
  private tileUrl: string;
  private blackTile: string;

  constructor(region: MapRegion, tileUrl: string) {
    super({
      tileSize: 256,
      noWrap: true,
    });
    this.region = region;
    this.tileUrl = tileUrl;
    this.blackTile = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%23000000'/%3E%3C/svg%3E";
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement('img');
    
    L.DomEvent.on(tile, 'load', () => {
      done(undefined, tile);
    });
    
    L.DomEvent.on(tile, 'error', () => {
      done(new Error('Tile failed to load'), tile);
    });

    // Check if tile is within bounds
    const { xMin, xMax, yMin, yMax } = getTileBounds(this.region.bounds, coords.z);
    
    if (coords.x < xMin || coords.x > xMax || coords.y < yMin || coords.y > yMax) {
      // Outside bounds - use black tile
      tile.src = this.blackTile;
    } else {
      // Inside bounds - load actual tile
      tile.src = `${this.tileUrl}/${coords.z}/${coords.x}/${coords.y}.png`;
      tile.crossOrigin = 'anonymous';
    }

    return tile;
  }

  updateRegion(region: MapRegion, tileUrl: string): void {
    this.region = region;
    this.tileUrl = tileUrl;
    this.redraw();
  }
}

/**
 * Custom tile layer that only loads tiles within the selected region bounds
 * and shows black tiles for areas outside the region
 */
export function BoundedTileLayer({ region, tileUrl }: BoundedTileLayerProps) {
  const [tilesReady, setTilesReady] = useState(false);
  const map = useMap();
  const layerRef = useRef<BoundedGridLayer | null>(null);

  // Add layer to map
  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = new BoundedGridLayer(region, tileUrl);
      layerRef.current.addTo(map);
    } else {
      layerRef.current.updateRegion(region, tileUrl);
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, region, tileUrl]);

  // Preload tiles when region changes
  useEffect(() => {
    setTilesReady(false);
    const criticalZoom = region.zoom;
    
    const preloadTiles = async () => {
      const { xMin, xMax, yMin, yMax } = getTileBounds(region.bounds, criticalZoom);
      const criticalTiles: Promise<void>[] = [];
      
      // Load tiles for the critical zoom level
      for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
          const img = new Image();
          const promise = new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Don't fail on missing tiles
            img.crossOrigin = 'anonymous';
            img.src = `${tileUrl}/${criticalZoom}/${x}/${y}.png`;
          });
          criticalTiles.push(promise);
        }
      }

      // Wait for critical tiles to load
      await Promise.all(criticalTiles);
      setTilesReady(true);
      
      // Continue loading adjacent zoom levels in background
      const adjacentZooms = [criticalZoom - 1, criticalZoom + 1].filter(z => z >= 5 && z <= 12);
      for (const z of adjacentZooms) {
        const { xMin, xMax, yMin, yMax } = getTileBounds(region.bounds, z);
        for (let x = xMin; x <= xMax; x++) {
          for (let y = yMin; y <= yMax; y++) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = `${tileUrl}/${z}/${x}/${y}.png`;
          }
        }
      }
    };

    preloadTiles();
  }, [region, tileUrl]);

  return (
    <>
      {!tilesReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-[1000] pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading {region.name} map tiles...</p>
          </div>
        </div>
      )}
    </>
  );
}

