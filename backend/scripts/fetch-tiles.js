// Simple tile prefetcher for selected regions and zooms
// Uses Carto light_nolabels as a base (no labels). Replace URL for other styles as needed.
import fs from 'fs';
import path from 'path';

const REGIONS = {
  belgium: { bounds: [[49.5, 2.5], [51.5, 6.4]] },
  netherlands: { bounds: [[50.75, 3.36], [53.55, 7.23]] },
};

const TILE_SOURCE = process.env.TILE_SOURCE_URL || 'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png';
const OUT_DIR = process.env.TILE_DIR || path.join(process.cwd(), 'tiles');
const REGIONS_LIST = (process.env.TILE_REGIONS || 'belgium,netherlands').split(',').map((s) => s.trim()).filter(Boolean);
const MIN_Z = parseInt(process.env.TILE_MIN_Z || '5', 10);
const MAX_Z = parseInt(process.env.TILE_MAX_Z || '12', 10);

function lat2tile(lat, z) {
  return Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * Math.pow(2, z));
}

function lon2tile(lon, z) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, z));
}

async function fetchTile(z, x, y) {
  const url = TILE_SOURCE.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
  const outPath = path.join(OUT_DIR, String(z), String(x), `${y}.png`);
  if (fs.existsSync(outPath)) return; // skip existing
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
}

async function fetchRegionTiles(regionId) {
  const region = REGIONS[regionId];
  if (!region) return;
  const [[south, west], [north, east]] = region.bounds;
  const tasks = [];
  for (let z = MIN_Z; z <= MAX_Z; z++) {
    const xMin = lon2tile(west, z);
    const xMax = lon2tile(east, z);
    const yMin = lat2tile(north, z);
    const yMax = lat2tile(south, z);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        tasks.push(fetchTile(z, x, y).catch(() => {}));
      }
    }
  }
  // throttle in chunks
  const chunkSize = 20;
  for (let i = 0; i < tasks.length; i += chunkSize) {
    await Promise.all(tasks.slice(i, i + chunkSize));
    process.stdout.write(`Fetched ${Math.min(i + chunkSize, tasks.length)}/${tasks.length} tiles for ${regionId}\r`);
  }
  process.stdout.write(`\nDone ${regionId}.\n`);
}

(async () => {
  console.log('Prefetching tiles to', OUT_DIR);
  for (const id of REGIONS_LIST) {
    await fetchRegionTiles(id);
  }
  console.log('All tiles fetched');
})();


