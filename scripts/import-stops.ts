/**
 * Imports Prague tram stops + line relationships from GTFS into Firestore.
 * Usage: npx tsx scripts/import-stops.ts
 *
 * Requires .env.local with Firebase credentials.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const GTFS_DIR = path.join(__dirname, '..', '..', 'pid', 'public', 'gtfs');

function parseCSV(filename: string): Record<string, string>[] {
  const content = fs.readFileSync(path.join(GTFS_DIR, filename), 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().replace(/\r/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/\r/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ''));
    return row;
  });
}

async function main() {
  console.log('Reading GTFS files...');

  // Parse routes — keep only trams (route_type = 0)
  const routes = parseCSV('routes.txt').filter((r) => r.route_type === '0');
  const tramRouteIds = new Set(routes.map((r) => r.route_id));
  const routeByShortName = new Map(routes.map((r) => [r.route_id, parseInt(r.route_short_name)]));
  console.log(`  ${routes.length} tram routes`);

  // Parse trips — map route_id → trip_id set
  const trips = parseCSV('trips.txt').filter((t) => tramRouteIds.has(t.route_id));
  const tripToRoute = new Map(trips.map((t) => [t.trip_id, t.route_id]));
  console.log(`  ${trips.length} tram trips`);

  // Parse stop_times — map stop_id → set of route_ids
  console.log('  Reading stop_times.txt (large file)...');
  const stopToRoutes = new Map<string, Set<string>>();
  const stopTimesContent = fs.readFileSync(path.join(GTFS_DIR, 'stop_times.txt'), 'utf-8');
  const stLines = stopTimesContent.trim().split('\n');
  const stHeaders = stLines[0].split(',').map((h) => h.trim().replace(/\r/g, ''));
  const tripIdIdx = stHeaders.indexOf('trip_id');
  const stopIdIdx = stHeaders.indexOf('stop_id');

  for (let i = 1; i < stLines.length; i++) {
    const vals = stLines[i].split(',');
    const tripId = vals[tripIdIdx]?.trim().replace(/\r/g, '');
    const stopId = vals[stopIdIdx]?.trim().replace(/\r/g, '');
    if (!tripId || !stopId) continue;
    const routeId = tripToRoute.get(tripId);
    if (!routeId) continue;
    if (!stopToRoutes.has(stopId)) stopToRoutes.set(stopId, new Set());
    stopToRoutes.get(stopId)!.add(routeId);
  }
  console.log(`  ${stopToRoutes.size} stops with tram service`);

  // Parse stops — keep only those served by trams
  const allStops = parseCSV('stops.txt');
  const tramStops = allStops.filter((s) => stopToRoutes.has(s.stop_id));
  console.log(`  ${tramStops.length} tram stops total`);

  // Deduplicate by name + approximate location (multiple stop_ids per physical stop)
  // Use the base stop_id (without direction suffix) as canonical
  // PID stop IDs: e.g. U4Z1P (platform 1, direction P)
  // Group by name and pick unique physical stops
  const seen = new Map<string, typeof tramStops[0]>();
  for (const s of tramStops) {
    const key = s.stop_name.trim();
    if (!seen.has(key)) {
      seen.set(key, s);
    }
  }

  // Merge lines for all platforms of same-name stop
  const stopLines = new Map<string, Set<number>>();
  for (const [key, s] of seen.entries()) {
    const lineNums = new Set<number>();
    // Find all stops with same name
    for (const stop of tramStops) {
      if (stop.stop_name.trim() === key) {
        const routes = stopToRoutes.get(stop.stop_id);
        if (routes) {
          for (const routeId of routes) {
            const lineNum = routeByShortName.get(routeId);
            if (lineNum !== undefined) lineNums.add(lineNum);
          }
        }
      }
    }
    stopLines.set(key, lineNums);
  }

  console.log(`\nImporting ${seen.size} unique stops to Firestore...`);

  // Write in batches of 500
  const entries = Array.from(seen.entries());
  let count = 0;
  for (let i = 0; i < entries.length; i += 400) {
    const batch = writeBatch(db);
    const chunk = entries.slice(i, i + 400);
    for (const [name, s] of chunk) {
      const lines = Array.from(stopLines.get(name) ?? []).sort((a, b) => a - b);
      // Use stop_name as doc ID (URL-safe)
      const docId = s.stop_id;
      const ref = doc(collection(db, 'stations'), docId);
      batch.set(ref, {
        id: docId,
        name: s.stop_name.trim(),
        lat: parseFloat(s.stop_lat),
        lng: parseFloat(s.stop_lon),
        lines,
      });
      count++;
    }
    await batch.commit();
    console.log(`  ${Math.min(i + 400, entries.length)}/${seen.size} stops written`);
  }

  console.log(`\nDone. Imported ${count} tram stops.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
