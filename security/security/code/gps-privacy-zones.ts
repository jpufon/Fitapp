// apps/mobile/src/utils/gpsPrivacy.ts (mobile, applied before display)
// AND
// apps/backend/src/services/runPrivacy.ts (backend, applied before serving to OTHER users)
//
// Strava 2018: aggregated "anonymous" run heatmaps revealed US military
// bases. The cause: people start and end runs at sensitive locations.
// Privacy zones blur the start/end so a route can be shared without
// revealing where the runner lives or works.
//
// Scope:
//   1. User can register up to 5 "private locations" (home, work, gym).
//   2. Any route point within `privacyRadiusM` of a private location
//      is removed from the polyline before it's:
//        - shown on a friend's screen
//        - shared on the PR feed
//        - sent in any squad/club leaderboard payload
//   3. The user's own view shows the FULL route. Privacy zones only
//      apply to OTHER viewers.

import polyline from '@mapbox/polyline' // npm i @mapbox/polyline

interface PrivateZone {
  latitude: number
  longitude: number
  radiusM: number     // default 200m
  label?: string      // 'home', 'work' — never shown to others
}

// Haversine — distance between two GPS points in metres
function haversineM(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Strip points inside any privacy zone.
 * Returns the remaining route as a polyline, plus the count of stripped points.
 */
export function applyPrivacyZones(
  encodedPolyline: string,
  zones: PrivateZone[],
): { polyline: string; pointsRemoved: number } {
  if (!zones.length) return { polyline: encodedPolyline, pointsRemoved: 0 }

  const points = polyline.decode(encodedPolyline) // [[lat, lon], ...]
  const filtered = points.filter(([lat, lon]) =>
    !zones.some(zone =>
      haversineM(lat, lon, zone.latitude, zone.longitude) <= zone.radiusM
    )
  )

  return {
    polyline: polyline.encode(filtered),
    pointsRemoved: points.length - filtered.length,
  }
}

/**
 * Heuristic: if no privacy zones are set, automatically trim the first
 * 200m and last 200m of the route. Most runners start at home.
 * Better than nothing for users who don't know they should configure zones.
 */
export function autoTrimEnds(
  encodedPolyline: string,
  trimMeters: number = 200,
): string {
  const points = polyline.decode(encodedPolyline)
  if (points.length < 4) return encodedPolyline

  let cumulative = 0
  let startIdx = 0
  for (let i = 1; i < points.length; i++) {
    cumulative += haversineM(
      points[i - 1][0], points[i - 1][1],
      points[i][0], points[i][1],
    )
    if (cumulative >= trimMeters) {
      startIdx = i
      break
    }
  }

  cumulative = 0
  let endIdx = points.length - 1
  for (let i = points.length - 1; i > 0; i--) {
    cumulative += haversineM(
      points[i][0], points[i][1],
      points[i - 1][0], points[i - 1][1],
    )
    if (cumulative >= trimMeters) {
      endIdx = i
      break
    }
  }

  if (endIdx <= startIdx) return '' // route was entirely inside trim region
  return polyline.encode(points.slice(startIdx, endIdx + 1))
}

// ─── Backend usage — when serving a run to OTHER users ─────────────────
//
// GET /api/v1/runs/:id  (when requester !== run owner)
//
//   const run = await prisma.workoutLog.findUnique({ where: { id }})
//   const owner = await prisma.user.findUnique({ where: { id: run.userId }})
//   if (request.user.id !== owner.id) {
//     // Apply owner's privacy zones (or auto-trim if none set)
//     if (owner.privacyZones?.length) {
//       run.runRoutePolyline = applyPrivacyZones(run.runRoutePolyline, owner.privacyZones).polyline
//     } else {
//       run.runRoutePolyline = autoTrimEnds(run.runRoutePolyline)
//     }
//   }
//   return run

// ─── Default share posture ─────────────────────────────────────────────
//
// In WorkoutLog schema, add:
//
//   model WorkoutLog {
//     ...
//     runShareRoute  Boolean  @default(false)  // user must opt in per-run
//     runShareStats  Boolean  @default(true)   // pace and distance are fine
//   }
//
// PR feed posts always show distance + time + pace. They show the route
// map ONLY if `runShareRoute === true`. Default is OFF for every run.
// User can toggle "share route" on the WorkoutCompleteScreen if they want.

// ─── Schema for privacy zones ──────────────────────────────────────────
//
//   model PrivateZone {
//     id        String  @id @default(cuid())
//     userId    String
//     latitude  Float
//     longitude Float
//     radiusM   Int     @default(200)
//     label     String? // for the user's own reference: "home", "work"
//     user      User    @relation(fields: [userId], references: [id])
//     @@index([userId])
//   }
//
// Cap zones at 5 per user. Zones are server-side only; never returned
// in any payload that goes to other users.
