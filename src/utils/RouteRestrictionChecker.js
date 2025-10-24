class RouteRestrictionChecker {
  constructor(restrictedGeoJSON) {
    this.restrictedPolygons = this.parseGeoJSON(restrictedGeoJSON)
    
    this.northWaypoints = [
      { id: 'N1', lat: 8.948823, lng: 125.530714, name: 'North Gap 1 (west)' },
      { id: 'N2', lat: 8.950436, lng: 125.534950, name: 'North Gap 2 (mid)' },
      { id: 'N3', lat: 8.950918, lng: 125.540935, name: 'North Gap 3 (east)' },
      { id: 'N4', lat: 8.958513, lng: 125.527187, name: 'North Gap SUB 1 (East)' },
      { id: 'N5', lat: 8.948280, lng: 125.546785, name: 'North Gap mid 1 (mid)' },
      { id: 'N6', lat: 8.949574, lng: 125.543668, name: 'North Gap mid 2 (mid)' },
      { id: 'N7', lat: 8.951750, lng: 125.537656, name: 'North Gap mid 3 (mid)' },
      { id: 'N10', lat: 8.948201, lng: 125.542222, name: 'North Gap sub 6 (west)' },
      { id: 'N8', lat: 8.956175, lng: 125.504998, name: 'North Gap mid 4 (mid)' },
      { id: 'N9', lat: 8.960337, lng: 125.515402, name: 'North Gap sub 5 (west)' },
    ]
    
    this.southWaypoints = [
      { id: 'S1', lat: 8.941320, lng: 125.533488, name: 'South Gap 1 (west)' },
      { id: 'S2', lat: 8.943665, lng: 125.537128, name: 'South Gap 2 (mid)' },
      { id: 'S3', lat: 8.944301, lng: 125.540400, name: 'South Gap 3 (east)' },
      { id: 'S4', lat: 8.940970, lng: 125.532428, name: 'South Gap sub 4 (east)' },
      { id: 'S5', lat: 8.945942, lng: 125.544160, name: 'South Gap sub 5 (east)' },
      { id: 'S6', lat: 8.940305, lng: 125.525923, name: 'South Gap sub 6 (west)' },
      { id: 'S9', lat: 8.947525, lng: 125.552867, name: 'South Gap sub 9 (east)' },
      { id: 'S8', lat: 8.935942, lng: 125.555209, name: 'South Gap sub 8 (east)' },
      { id: 'S7', lat: 8.927561, lng: 125.557032, name: 'South Gap sub 7 (west)' },
      { id: 'S10', lat: 8.931793, lng: 125.548944, name: 'South Gap sub 10 (east)' },
      { id: 'S11', lat: 8.919436, lng: 125.551529, name: 'South Gap sub 11 (east)' },
      { id: 'S12', lat: 8.925532, lng: 125.539604, name: 'South Gap sub 12 (west)' }
    ]
    
    this.highwayCenterLine = [
      [125.508836, 8.943283],
      [125.519338, 8.943069],
      [125.530741, 8.945172],
      [125.536227, 8.947275],
      [125.543083, 8.947382],
    ]
    
    this.bufferDistance = 0.00005
    this.routeCache = new Map()
  }

  parseGeoJSON(geoJSON) {
    const polygons = []
    geoJSON.features.forEach(feature => {
      if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => {
          const coords = polygon[0].map(coord => [coord[1], coord[0]])
          polygons.push({
            id: feature.properties.id,
            coordinates: coords
          })
        })
      }
    })
    return polygons
  }

  getPointSide(point) {
    const [lat, lng] = point
    let closestIdx = 0
    let minDist = Math.abs(this.highwayCenterLine[0][0] - lng)
    
    for (let i = 1; i < this.highwayCenterLine.length; i++) {
      const dist = Math.abs(this.highwayCenterLine[i][0] - lng)
      if (dist < minDist) {
        minDist = dist
        closestIdx = i
      }
    }
    
    let centerLat
    if (closestIdx === 0) {
      centerLat = this.highwayCenterLine[0][1]
    } else if (closestIdx === this.highwayCenterLine.length - 1) {
      centerLat = this.highwayCenterLine[closestIdx][1]
    } else {
      const p1 = this.highwayCenterLine[closestIdx]
      const p2 = closestIdx > 0 && Math.abs(this.highwayCenterLine[closestIdx - 1][0] - lng) < Math.abs(this.highwayCenterLine[closestIdx + 1][0] - lng)
        ? this.highwayCenterLine[closestIdx - 1]
        : this.highwayCenterLine[closestIdx + 1]
      const lngDiff = p2[0] - p1[0]
      const latDiff = p2[1] - p1[1]
      const ratio = (lng - p1[0]) / lngDiff
      centerLat = p1[1] + (latDiff * ratio)
    }
    
    return lat > centerLat ? 'north' : 'south'
  }

  isPointInPolygon(point, polygon) {
    const [lat, lng] = point
    const coords = polygon.coordinates
    let inside = false
    
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const [lat1, lng1] = coords[i]
      const [lat2, lng2] = coords[j]
      const intersect = ((lng1 > lng) !== (lng2 > lng)) &&
        (lat < (lat2 - lat1) * (lng - lng1) / (lng2 - lng1) + lat1)
      if (intersect) inside = !inside
    }
    
    return inside
  }

  lineIntersectsPolygon(point1, point2, polygon) {
    const coords = polygon.coordinates
    
    if (this.isPointInPolygon(point1, polygon) || this.isPointInPolygon(point2, polygon)) {
      return true
    }
    
    for (let i = 0; i < coords.length - 1; i++) {
      if (this.segmentsIntersect(point1, point2, coords[i], coords[i + 1])) {
        return true
      }
    }
    
    return false
  }

  segmentsIntersect(p1, p2, p3, p4) {
    const [x1, y1] = p1
    const [x2, y2] = p2
    const [x3, y3] = p3
    const [x4, y4] = p4
    
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
    if (denom === 0) return false
    
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom
    
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
  }

  checkRouteIntersection(routeCoordinates) {
    const violations = []
    
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const point1 = routeCoordinates[i]
      const point2 = routeCoordinates[i + 1]
      
      for (const polygon of this.restrictedPolygons) {
        if (this.lineIntersectsPolygon(point1, point2, polygon)) {
          violations.push({
            segmentStart: point1,
            segmentEnd: point2,
            polygonId: polygon.id,
            segmentIndex: i
          })
        }
      }
    }
    
    return {
      hasViolation: violations.length > 0,
      violations
    }
  }

  calculateDistance(point1, point2) {
    const [lat1, lng1] = point1
    const [lat2, lng2] = point2
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
  }

  // Generate cache key for route
  getRouteCacheKey(waypoints) {
    return waypoints.map(p => `${p[0].toFixed(6)},${p[1].toFixed(6)}`).join('|')
  }

  async testPathWithOSRM(waypoints, useCache = true) {
    const cacheKey = this.getRouteCacheKey(waypoints)
    
    // Check cache first
    if (useCache && this.routeCache.has(cacheKey)) {
      return this.routeCache.get(cacheKey)
    }
    
    try {
      const waypointString = waypoints.map(p => `${p[1]},${p[0]}`).join(';')
      const url = `https://router.project-osrm.org/route/v1/driving/${waypointString}?geometries=geojson&overview=full`
      const response = await fetch(url)
      
      if (!response.ok) {
        const result = { valid: false, error: 'OSRM failed' }
        this.routeCache.set(cacheKey, result)
        return result
      }
      
      const data = await response.json()
      if (!data.routes || data.routes.length === 0) {
        const result = { valid: false, error: 'No route found' }
        this.routeCache.set(cacheKey, result)
        return result
      }
      
      const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]])
      const check = this.checkRouteIntersection(routeCoords)
      
      const result = {
        valid: !check.hasViolation,
        violations: check.violations.length,
        routeCoords,
        distance: data.routes[0].distance
      }
      
      this.routeCache.set(cacheKey, result)
      return result
    } catch (error) {
      console.error('OSRM test error:', error)
      const result = { valid: false, error: error.message }
      this.routeCache.set(cacheKey, result)
      return result
    }
  }

  // Smart waypoint filtering - eliminate waypoints that create backward paths
  filterViableWaypoints(startPoint, endPoint, allWaypoints, isEastbound) {
    const [startLat, startLng] = startPoint
    const [endLat, endLng] = endPoint
    
    const buffer = 0.025
    const minLng = Math.min(startLng, endLng) - buffer
    const maxLng = Math.max(startLng, endLng) + buffer
    const minLat = Math.min(startLat, endLat) - buffer
    const maxLat = Math.max(startLat, endLat) + buffer
    
    // Filter waypoints in corridor
    let viable = allWaypoints.filter(wp => 
      wp.lng >= minLng && wp.lng <= maxLng &&
      wp.lat >= minLat && wp.lat <= maxLat
    )
    
    // Pre-filter waypoints that would cause excessive backtracking
    viable = viable.filter(wp => {
      const wpPoint = [wp.lat, wp.lng]
      const distToStart = this.calculateDistance(startPoint, wpPoint)
      const distToEnd = this.calculateDistance(wpPoint, endPoint)
      const directDist = this.calculateDistance(startPoint, endPoint)
      
      // Reject if detour is too extreme (>3x direct distance)
      return (distToStart + distToEnd) < (directDist * 3)
    })
    
    // Sort by longitude
    return viable.sort((a, b) => a.lng - b.lng)
  }

  // Check if waypoint sequence makes geometric sense
  isSequenceViable(waypoints, startPoint, endPoint, isEastbound) {
    if (waypoints.length === 0) return true
    
    const allPoints = [startPoint, ...waypoints, endPoint]
    
    // Check for excessive backtracking
    for (let i = 0; i < allPoints.length - 1; i++) {
      const current = allPoints[i]
      const next = allPoints[i + 1]
      
      // If eastbound, longitude should generally increase
      // Allow some tolerance for necessary detours
      if (isEastbound && next[1] < current[1] - 0.01) {
        return false
      }
      if (!isEastbound && next[1] > current[1] + 0.01) {
        return false
      }
    }
    
    return true
  }

  // A* inspired heuristic scoring
  scoreWaypointPath(waypoints, startPoint, endPoint) {
    if (waypoints.length === 0) return 0
    
    let totalDist = 0
    const allPoints = [startPoint, ...waypoints, endPoint]
    
    for (let i = 0; i < allPoints.length - 1; i++) {
      totalDist += this.calculateDistance(allPoints[i], allPoints[i + 1])
    }
    
    const directDist = this.calculateDistance(startPoint, endPoint)
    
    // Score: prefer shorter total distances and fewer waypoints
    return totalDist / directDist + (waypoints.length * 0.1)
  }

  async findOptimalWaypoints(startPoint, endPoint, violations) {
    console.log('\n=== OPTIMIZED WAYPOINT ROUTING ===')
    
    const startSide = this.getPointSide(startPoint)
    const endSide = this.getPointSide(endPoint)
    const [startLat, startLng] = startPoint
    const [endLat, endLng] = endPoint
    const isEastbound = endLng > startLng
    
    console.log(`Start: ${startSide} (${startLng.toFixed(4)}) | End: ${endSide} (${endLng.toFixed(4)})`)
    console.log(`Direction: ${isEastbound ? 'EAST' : 'WEST'}`)
    
    let bestRoute = {
      waypoints: null,
      violations: Infinity,
      description: '',
      distance: Infinity
    }
    
    const updateBest = (test, wps, desc) => {
      if (!test || test.violations === undefined) return
      
      const isBetter = test.violations < bestRoute.violations ||
        (test.violations === bestRoute.violations && test.distance < bestRoute.distance)
      
      if (isBetter) {
        bestRoute = {
          waypoints: wps,
          violations: test.violations,
          description: desc,
          distance: test.distance,
          routeCoords: test.routeCoords
        }
        const wpNames = wps.map((wp, i) => {
          const match = [...this.northWaypoints, ...this.southWaypoints].find(
            w => Math.abs(w.lat - wp[0]) < 0.0001 && Math.abs(w.lng - wp[1]) < 0.0001
          )
          return match ? match.id : `WP${i}`
        }).join('→')
        console.log(`🏆 ${desc}: ${wpNames} (${test.violations} violations, ${(test.distance/1000).toFixed(1)}km)`)
      }
    }
    
    // Test direct path
    console.log('\n--- Testing direct path ---')
    const directTest = await this.testPathWithOSRM([startPoint, endPoint])
    if (directTest.valid) {
      console.log('✅ Direct path is clear!')
      return []
    }
    updateBest(directTest, [], 'Direct')
    
    // Get filtered waypoints
    const allNorth = this.filterViableWaypoints(startPoint, endPoint, this.northWaypoints, isEastbound)
    const allSouth = this.filterViableWaypoints(startPoint, endPoint, this.southWaypoints, isEastbound)
    
    console.log(`\nViable waypoints - North: ${allNorth.length}, South: ${allSouth.length}`)
    
    let testCount = 0
    const maxTests = 200 // Reduced since we're smarter about selection
    
    // Priority queue: test most promising combinations first
    const testQueue = []
    
    // Generate candidates with heuristic scores
    const addCandidate = (wps, desc) => {
      if (!this.isSequenceViable(wps, startPoint, endPoint, isEastbound)) return
      const score = this.scoreWaypointPath(wps, startPoint, endPoint)
      testQueue.push({ wps, score, desc })
    }
    
    // PHASE 1: Single waypoints
    console.log('\n--- Phase 1: Single waypoint ---')
    for (const wp of [...allNorth, ...allSouth]) {
      addCandidate([[wp.lat, wp.lng]], '1wp')
    }
    
    // Sort by score and test best candidates
    testQueue.sort((a, b) => a.score - b.score)
    
    for (const candidate of testQueue.slice(0, Math.min(30, testQueue.length))) {
      if (testCount++ > maxTests) break
      const test = await this.testPathWithOSRM([startPoint, ...candidate.wps, endPoint])
      updateBest(test, candidate.wps, candidate.desc)
      if (test.valid) return candidate.wps
    }
    
    // PHASE 2: Two waypoints - same side (strategic pairs)
    console.log('\n--- Phase 2: Two waypoints (same side) ---')
    testQueue.length = 0
    
    for (const sideWps of [allNorth, allSouth]) {
      for (let i = 0; i < sideWps.length && i < 8; i++) {
        for (let j = i + 1; j < sideWps.length && j < 10; j++) {
          const wp1 = sideWps[i]
          const wp2 = sideWps[j]
          const wps = isEastbound 
            ? [[wp1.lat, wp1.lng], [wp2.lat, wp2.lng]]
            : [[wp2.lat, wp2.lng], [wp1.lat, wp1.lng]]
          addCandidate(wps, '2wp-same')
        }
      }
    }
    
    testQueue.sort((a, b) => a.score - b.score)
    
    for (const candidate of testQueue.slice(0, Math.min(40, testQueue.length))) {
      if (testCount++ > maxTests) break
      const test = await this.testPathWithOSRM([startPoint, ...candidate.wps, endPoint])
      updateBest(test, candidate.wps, candidate.desc)
      if (test.valid) return candidate.wps
    }
    
    // PHASE 3: Mixed sides (limited strategic combinations)
    console.log('\n--- Phase 3: Two waypoints (mixed) ---')
    testQueue.length = 0
    
    const limitN = Math.min(allNorth.length, 6)
    const limitS = Math.min(allSouth.length, 6)
    
    for (let i = 0; i < limitN; i++) {
      for (let j = 0; j < limitS; j++) {
        const wpN = [allNorth[i].lat, allNorth[i].lng]
        const wpS = [allSouth[j].lat, allSouth[j].lng]
        
        addCandidate([wpN, wpS], '2wp-NS')
        addCandidate([wpS, wpN], '2wp-SN')
      }
    }
    
    testQueue.sort((a, b) => a.score - b.score)
    
    for (const candidate of testQueue.slice(0, Math.min(30, testQueue.length))) {
      if (testCount++ > maxTests) break
      const test = await this.testPathWithOSRM([startPoint, ...candidate.wps, endPoint])
      updateBest(test, candidate.wps, candidate.desc)
      if (test.valid) return candidate.wps
    }
    
    // PHASE 4: Three waypoints (highly selective)
    console.log('\n--- Phase 4: Three waypoints (selective) ---')
    testQueue.length = 0
    
    const limit3 = Math.min(4, allNorth.length, allSouth.length)
    
    for (let i = 0; i < limit3; i++) {
      for (let j = i + 1; j < limit3; j++) {
        for (let k = 0; k < limit3; k++) {
          const wpN1 = [allNorth[i].lat, allNorth[i].lng]
          const wpN2 = [allNorth[j].lat, allNorth[j].lng]
          const wpS = [allSouth[k].lat, allSouth[k].lng]
          
          addCandidate([wpN1, wpN2, wpS], '3wp')
          addCandidate([wpN1, wpS, wpN2], '3wp')
          addCandidate([wpS, wpN1, wpN2], '3wp')
        }
      }
    }
    
    testQueue.sort((a, b) => a.score - b.score)
    
    for (const candidate of testQueue.slice(0, Math.min(50, testQueue.length))) {
      if (testCount++ > maxTests) break
      const test = await this.testPathWithOSRM([startPoint, ...candidate.wps, endPoint])
      updateBest(test, candidate.wps, candidate.desc)
      if (test.valid) return candidate.wps
    }
    
    console.log(`\n⚠️ No violation-free route found (tested ${testCount} combinations)`)
    console.log(`📊 Best route: ${bestRoute.description} (${bestRoute.violations} violations)`)
    
    return bestRoute.waypoints || []
  }

  isPointInsideRestriction(point) {
    for (const polygon of this.restrictedPolygons) {
      if (this.isPointInPolygon(point, polygon)) {
        return { inside: true, polygonId: polygon.id, polygon }
      }
    }
    return { inside: false }
  }

  findNearestSafePoint(point, maxSearchRadius = 0.01) {
    const check = this.isPointInsideRestriction(point)
    if (!check.inside) {
      return { point, adjusted: false }
    }
    
    console.log(`⚠️ Point inside restricted area ${check.polygonId}`)
    const [lat, lng] = point
    const steps = 32
    const radiusSteps = 30
    
    for (let r = 1; r <= radiusSteps; r++) {
      const radius = (maxSearchRadius / radiusSteps) * r
      
      for (let i = 0; i < steps; i++) {
        const angle = (2 * Math.PI * i) / steps
        const testLat = lat + (radius * Math.cos(angle))
        const testLng = lng + (radius * Math.sin(angle))
        const testPoint = [testLat, testLng]
        
        if (!this.isPointInsideRestriction(testPoint).inside) {
          const distanceKm = this.calculateDistance(point, testPoint)
          console.log(`✅ Safe point ${(distanceKm * 1000).toFixed(0)}m away`)
          return { point: testPoint, adjusted: true, originalPoint: point, distanceMoved: distanceKm }
        }
      }
    }
    
    const side = this.getPointSide(point)
    const waypoints = side === 'north' ? this.northWaypoints : this.southWaypoints
    let closest = waypoints[0]
    let minDist = this.calculateDistance(point, [closest.lat, closest.lng])
    
    for (const wp of waypoints) {
      const dist = this.calculateDistance(point, [wp.lat, wp.lng])
      if (dist < minDist) {
        minDist = dist
        closest = wp
      }
    }
    
    console.log(`🔄 Using waypoint: ${closest.name}`)
    return { point: [closest.lat, closest.lng], adjusted: true, originalPoint: point, fallback: true, distanceMoved: minDist }
  }

  adjustRouteEndpoints(startPoint, endPoint) {
    console.log('\n=== CHECKING ENDPOINTS ===')
    const startResult = this.findNearestSafePoint(startPoint)
    const endResult = this.findNearestSafePoint(endPoint)
    
    if (startResult.adjusted || endResult.adjusted) {
      console.log('📍 Adjustments made')
    } else {
      console.log('✅ Both endpoints safe')
    }
    
    return {
      start: startResult.point,
      end: endResult.point,
      adjusted: startResult.adjusted || endResult.adjusted,
      startAdjusted: startResult.adjusted,
      endAdjusted: endResult.adjusted,
      startOriginal: startPoint,
      endOriginal: endPoint
    }
  }

  getAllWaypointMarkers() {
    return [...this.northWaypoints, ...this.southWaypoints].map(wp => ({
      lat: wp.lat,
      lng: wp.lng,
      name: wp.name,
      id: wp.id,
      side: wp.id.startsWith('N') ? 'north' : 'south'
    }))
  }

  getPolygonsForMap() {
    return this.restrictedPolygons.map(p => p.coordinates)
  }

  buildWaypointString(startPoint, endPoint, waypoints) {
    const allPoints = [startPoint, ...waypoints, endPoint]
    return allPoints.map(p => `${p[1]},${p[0]}`).join(';')
  }

  checkDirectPath(point1, point2) {
    const violations = []
    
    for (const polygon of this.restrictedPolygons) {
      if (this.lineIntersectsPolygon(point1, point2, polygon)) {
        violations.push({
          segmentStart: point1,
          segmentEnd: point2,
          polygonId: polygon.id
        })
      }
    }
    
    return {
      hasViolation: violations.length > 0,
      violations
    }
  }

  getInterpolatedHighwayLat(lng) {
    let closestIdx = 0
    let minDist = Math.abs(this.highwayCenterLine[0][0] - lng)
    
    for (let i = 1; i < this.highwayCenterLine.length; i++) {
      const dist = Math.abs(this.highwayCenterLine[i][0] - lng)
      if (dist < minDist) {
        minDist = dist
        closestIdx = i
      }
    }
    
    if (closestIdx === 0) return this.highwayCenterLine[0][1]
    if (closestIdx === this.highwayCenterLine.length - 1) return this.highwayCenterLine[closestIdx][1]
    
    const p1 = this.highwayCenterLine[closestIdx]
    const p2 = closestIdx > 0 && Math.abs(this.highwayCenterLine[closestIdx - 1][0] - lng) < Math.abs(this.highwayCenterLine[closestIdx + 1][0] - lng)
      ? this.highwayCenterLine[closestIdx - 1]
      : this.highwayCenterLine[closestIdx + 1]
    
    const lngDiff = p2[0] - p1[0]
    const latDiff = p2[1] - p1[1]
    const ratio = (lng - p1[0]) / lngDiff
    return p1[1] + (latDiff * ratio)
  }

  analyzeRoute(startPoint, endPoint) {
    console.log('\n=== ROUTE ANALYSIS ===')
    console.log('Start:', startPoint, `(${this.getPointSide(startPoint)} side)`)
    console.log('End:', endPoint, `(${this.getPointSide(endPoint)} side)`)
    console.log('=====================\n')
  }
  
  // Clear cache if needed (useful for testing or memory management)
  clearCache() {
    this.routeCache.clear()
    console.log('Route cache cleared')
  }
  
  // Get cache statistics
  getCacheStats() {
    return {
      size: this.routeCache.size,
      entries: Array.from(this.routeCache.keys())
    }
  }
}

export default RouteRestrictionChecker