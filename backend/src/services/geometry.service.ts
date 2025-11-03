import type { Coordinates } from '../types';

/**
 * Geometry calculation service
 * Handles all spatial calculations to offload from frontend
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * More accurate for long distances
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Calculate total route length from waypoints
 */
export function calculateRouteLength(waypoints: Coordinates[]): number {
  if (waypoints.length < 2) return 0;

  let totalLength = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalLength += calculateDistance(waypoints[i], waypoints[i + 1]);
  }

  return totalLength;
}

/**
 * Calculate bearing between two points (in degrees)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const dLon = toRadians(to.lon - from.lon);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculate intermediate point at given fraction along great circle path
 * @param fraction - 0 to 1, where 0.5 is midpoint
 */
export function calculateIntermediatePoint(
  from: Coordinates,
  to: Coordinates,
  fraction: number
): Coordinates {
  const lat1 = toRadians(from.lat);
  const lon1 = toRadians(from.lon);
  const lat2 = toRadians(to.lat);
  const lon2 = toRadians(to.lon);

  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
    )
  );

  const a = Math.sin((1 - fraction) * d) / Math.sin(d);
  const b = Math.sin(fraction * d) / Math.sin(d);

  const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
  const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
  const z = a * Math.sin(lat1) + b * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lon = Math.atan2(y, x);

  return {
    lat: toDegrees(lat),
    lon: toDegrees(lon),
  };
}

/**
 * Find nearest point on a line segment to a given point
 */
export function findNearestPointOnLine(
  point: Coordinates,
  lineStart: Coordinates,
  lineEnd: Coordinates
): { point: Coordinates; distance: number } {
  // Simplified implementation - for production, use proper projection
  const totalDistance = calculateDistance(lineStart, lineEnd);
  let minDistance = Infinity;
  let nearestPoint = lineStart;

  // Sample points along the line
  const samples = 100;
  for (let i = 0; i <= samples; i++) {
    const fraction = i / samples;
    const samplePoint = calculateIntermediatePoint(lineStart, lineEnd, fraction);
    const distance = calculateDistance(point, samplePoint);

    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = samplePoint;
    }
  }

  return { point: nearestPoint, distance: minDistance };
}

/**
 * Check if two line segments intersect
 * Uses bounding box check first for performance
 */
export function linesIntersect(
  line1Start: Coordinates,
  line1End: Coordinates,
  line2Start: Coordinates,
  line2End: Coordinates
): boolean {
  // Bounding box check (fast rejection)
  const bbox1 = getBoundingBox([line1Start, line1End]);
  const bbox2 = getBoundingBox([line2Start, line2End]);

  if (!boundingBoxesOverlap(bbox1, bbox2)) {
    return false;
  }

  // Detailed intersection check (slower)
  // For MVP, use simple approach - can be improved later
  const d1 = calculateDistance(line1Start, line2Start);
  const d2 = calculateDistance(line1End, line2End);
  const d3 = calculateDistance(line1Start, line2End);
  const d4 = calculateDistance(line1End, line2Start);

  const len1 = calculateDistance(line1Start, line1End);
  const len2 = calculateDistance(line2Start, line2End);

  // If cross distances are significantly less than parallel distances, likely intersecting
  const threshold = 0.1; // 100 meters
  return (d1 + d2 < len1 + len2 + threshold) || (d3 + d4 < len1 + len2 + threshold);
}

/**
 * Get bounding box for set of coordinates
 */
export function getBoundingBox(coords: Coordinates[]): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  if (coords.length === 0) {
    return { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 };
  }

  let minLat = coords[0].lat;
  let maxLat = coords[0].lat;
  let minLon = coords[0].lon;
  let maxLon = coords[0].lon;

  for (const coord of coords) {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLon = Math.min(minLon, coord.lon);
    maxLon = Math.max(maxLon, coord.lon);
  }

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Check if two bounding boxes overlap
 */
function boundingBoxesOverlap(
  bbox1: ReturnType<typeof getBoundingBox>,
  bbox2: ReturnType<typeof getBoundingBox>
): boolean {
  return !(
    bbox1.maxLat < bbox2.minLat ||
    bbox1.minLat > bbox2.maxLat ||
    bbox1.maxLon < bbox2.minLon ||
    bbox1.minLon > bbox2.maxLon
  );
}

// Helper functions
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
