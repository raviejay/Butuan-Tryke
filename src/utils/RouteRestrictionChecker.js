
class RouteRestrictionChecker {
  constructor(restrictedGeoJSON) {
    this.restrictedPolygons = this.parseGeoJSON(restrictedGeoJSON)
    
   
    this.northWaypoints = [
      { id: 'N1', lat: 8.948823, lng: 125.530714, name: 'North Gap 1 (west)' },
      { id: 'N2', lat: 8.950436, lng: 125.534950, name: 'North Gap 2 (mid)' },
      { id: 'N3', lat: 8.948924, lng: 125.540743, name: 'North Gap 3 (east)' },
      { id: 'N4', lat: 8.958513, lng: 125.527187, name: 'North Gap SUB 1 (East)' },

      { id: 'N5', lat: 8.947064, lng: 125.540719, name: 'North Gap mid 1 (mid)' }
    ]
    
   
    this.southWaypoints = [
      // { id: 'S0', lat: 8.939976, lng: 125.528662, name: 'South Gap sub 1 (East)' },
      { id: 'S1', lat: 8.941320, lng: 125.533488, name: 'South Gap 1 (west)' },
      { id: 'S2', lat: 8.943665, lng: 125.537128, name: 'South Gap 2 (mid)' },
      { id: 'S3', lat: 8.944301, lng: 125.540400, name: 'South Gap 3 (east)' },
      { id: 'S4', lat: 8.940970, lng: 125.532428, name: 'South Gap sub 4 (east)' },
    ]
    

    this.highwayCenterLine = [
      [125.508836, 8.943283],  //west
      [125.519338, 8.943069], 
      [125.530741, 8.945172],  
      [125.536227, 8.947275],  
      [125.543083, 8.947382],  //east
    ]
    
    this.bufferDistance = 0.00005 // 5 meters buffer
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

  // Determine which side of highway a point is on (dynamic based on curve)
  getPointSide(point) {
    const [lat, lng] = point
    
    // Find the two closest centerline points by longitude
    let closestIdx = 0
    let minDist = Math.abs(this.highwayCenterLine[0][0] - lng)
    
    for (let i = 1; i < this.highwayCenterLine.length; i++) {
      const dist = Math.abs(this.highwayCenterLine[i][0] - lng)
      if (dist < minDist) {
        minDist = dist
        closestIdx = i
      }
    }
    
    // Interpolate highway center latitude at this longitude
    let centerLat
    if (closestIdx === 0) {
      // Before first point - use first point
      centerLat = this.highwayCenterLine[0][1]
    } else if (closestIdx === this.highwayCenterLine.length - 1) {
      // After last point - use last point
      centerLat = this.highwayCenterLine[closestIdx][1]
    } else {
      // Interpolate between points
      const p1 = this.highwayCenterLine[closestIdx]
      const p2 = closestIdx > 0 && Math.abs(this.highwayCenterLine[closestIdx - 1][0] - lng) < Math.abs(this.highwayCenterLine[closestIdx + 1][0] - lng)
        ? this.highwayCenterLine[closestIdx - 1]
        : this.highwayCenterLine[closestIdx + 1]
      
      // Linear interpolation
      const lngDiff = p2[0] - p1[0]
      const latDiff = p2[1] - p1[1]
      const ratio = (lng - p1[0]) / lngDiff
      centerLat = p1[1] + (latDiff * ratio)
    }
    
    return lat > centerLat ? 'north' : 'south'
  }

  // Check if a point is inside a polygon using ray casting
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

  // Check if a line segment intersects with polygon
  lineIntersectsPolygon(point1, point2, polygon) {
    const coords = polygon.coordinates
    
    // Check if either endpoint is inside
    if (this.isPointInPolygon(point1, polygon) || 
        this.isPointInPolygon(point2, polygon)) {
      return true
    }
    
    // Check if line intersects any polygon edge
    for (let i = 0; i < coords.length - 1; i++) {
      if (this.segmentsIntersect(point1, point2, coords[i], coords[i + 1])) {
        return true
      }
    }
    
    return false
  }

  // Check if two line segments intersect
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

  getPolygonsForMap() {
    return this.restrictedPolygons.map(p => p.coordinates)
  }

  // Check if a direct path between two points crosses restrictions
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

  // Check if route coordinates intersect restricted areas
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

  // Calculate distance between two points (Haversine)
  calculateDistance(point1, point2) {
    const [lat1, lng1] = point1
    const [lat2, lng2] = point2
    const R = 6371 // Earth radius in km

    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) * 
              Math.cos((lat2 * Math.PI) / 180) * 
              Math.sin(dLng / 2) * Math.sin(dLng / 2)

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
  }

  // ENHANCED: Smart waypoint selection with up to 2 waypoints per side
  findOptimalWaypoints(startPoint, endPoint, violations) {
    console.log('\n=== SMART WAYPOINT SELECTION (2 per side) ===')

    const startSide = this.getPointSide(startPoint)
    const endSide = this.getPointSide(endPoint)
    const startLng = startPoint[1]
    const endLng = endPoint[1]

    console.log(`Start: ${startSide} | End: ${endSide}`)

    const selectedWaypoints = []

    const travelingEast = endLng > startLng
    const direction = travelingEast ? 'East' : 'West'
    console.log(`Direction: ${direction}`)

    // Helper for selecting multiple best waypoints with restriction checking
    const selectTopWaypoints = (pointA, pointB, waypoints, count = 2) => {
      const startLng = pointA[1]
      const endLng = pointB[1]
      const minLng = Math.min(startLng, endLng)
      const maxLng = Math.max(startLng, endLng)

      // Filter waypoints that are within or near the route's longitude range
      const relevantWaypoints = waypoints.filter(wp => {
        const buffer = 0.005 // ~500m buffer outside range
        return wp.lng >= (minLng - buffer) && wp.lng <= (maxLng + buffer)
      })

      // If we have enough relevant waypoints, use them; otherwise use all
      const candidateWaypoints = relevantWaypoints.length >= count ? relevantWaypoints : waypoints

      // Score based on proximity AND check for restrictions TO THIS WAYPOINT ONLY
      const scored = candidateWaypoints.map(wp => {
        const wpPoint = [wp.lat, wp.lng]
        const distFromStart = this.calculateDistance(pointA, wpPoint)
        const distFromEnd = this.calculateDistance(wpPoint, pointB)
        
        // ONLY check if path FROM pointA TO this waypoint crosses restrictions
        // Don't check beyond the waypoint - that's for the next segment
        let penaltyForRestrictions = 0
        const pathToWaypoint = this.checkDirectPath(pointA, wpPoint)
        
        if (pathToWaypoint.hasViolation) {
          penaltyForRestrictions += 10.0 // Heavy penalty for restricted path
          console.log(`    ⚠️ ${wp.name} has ${pathToWaypoint.violations.length} violations on approach from pointA`)
        }
        
        // Heavily weight proximity to start point + penalize restricted paths
        const score = (distFromStart * 2.0) + (distFromEnd * 0.5) + penaltyForRestrictions
        
        return { wp, score, distFromStart, violations: pathToWaypoint.violations.length }
      })

      // Sort by score (lower is better) and take top N
      const selected = scored
        .sort((a, b) => a.score - b.score)
        .slice(0, count)

      // Sort by proximity to start point (not by longitude!)
      // This ensures the CLOSEST waypoint comes first in the sequence
      const orderedByProximity = selected.sort((a, b) => a.distFromStart - b.distFromStart)

      return orderedByProximity.map(s => s.wp)
    }

    if (startSide === endSide) {
      console.log(`Strategy: Both on ${startSide} side - selecting up to 2 ${startSide} waypoints`)
      const waypoints = startSide === 'north' ? this.northWaypoints : this.southWaypoints
      const bestTwo = selectTopWaypoints(startPoint, endPoint, waypoints, 2)
      bestTwo.forEach((wp, idx) => {
        selectedWaypoints.push([wp.lat, wp.lng])
        const dist = this.calculateDistance(startPoint, [wp.lat, wp.lng])
        console.log(`  [${idx + 1}] ${wp.name} - ${(dist * 1000).toFixed(0)}m from start`)
      })
      console.log(`Selected: ${bestTwo.map(wp => wp.name).join(' → ')}`)
    } else {
      console.log('Strategy: Crossing sides - using up to 2 waypoints from each side')

      const midLng = (startLng + endLng) / 2
      const midLat = this.getInterpolatedHighwayLat(midLng)

      const startWaypoints = startSide === 'north' ? this.northWaypoints : this.southWaypoints
      const endWaypoints = endSide === 'north' ? this.northWaypoints : this.southWaypoints

      const bestStartSide = selectTopWaypoints(startPoint, [midLat, midLng], startWaypoints, 2)
      const bestEndSide = selectTopWaypoints([midLat, midLng], endPoint, endWaypoints, 2)

      console.log(`Start side (${startSide}):`)
      bestStartSide.forEach((wp, idx) => {
        const dist = this.calculateDistance(startPoint, [wp.lat, wp.lng])
        const pathCheck = this.checkDirectPath(startPoint, [wp.lat, wp.lng])
        const status = pathCheck.hasViolation ? `❌ ${pathCheck.violations.length} violations from START` : '✅ CLEAR from START'
        console.log(`  [${idx + 1}] ${wp.name} - ${(dist * 1000).toFixed(0)}m from start | ${status}`)
        selectedWaypoints.push([wp.lat, wp.lng])
      })

      console.log(`End side (${endSide}):`)
      bestEndSide.forEach((wp, idx) => {
        const dist = this.calculateDistance([wp.lat, wp.lng], endPoint)
        const pathCheck = this.checkDirectPath([wp.lat, wp.lng], endPoint)
        const status = pathCheck.hasViolation ? `❌ ${pathCheck.violations.length} violations to END` : '✅ CLEAR to END'
        console.log(`  [${idx + 1}] ${wp.name} - ${(dist * 1000).toFixed(0)}m from end | ${status}`)
        selectedWaypoints.push([wp.lat, wp.lng])
      })

      console.log(`Selected start side: ${bestStartSide.map(wp => wp.name).join(' → ')}`)
      console.log(`Selected end side: ${bestEndSide.map(wp => wp.name).join(' → ')}`)
    }

    console.log(`Total waypoints: ${selectedWaypoints.length}`)
    console.log('========================================\n')

    return selectedWaypoints
  }

  // Helper: Get interpolated highway latitude at any longitude
  getInterpolatedHighwayLat(lng) {
    // Find closest points
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
    
    // Interpolate
    const p1 = this.highwayCenterLine[closestIdx]
    const p2 = closestIdx > 0 && Math.abs(this.highwayCenterLine[closestIdx - 1][0] - lng) < Math.abs(this.highwayCenterLine[closestIdx + 1][0] - lng)
      ? this.highwayCenterLine[closestIdx - 1]
      : this.highwayCenterLine[closestIdx + 1]
    
    const lngDiff = p2[0] - p1[0]
    const latDiff = p2[1] - p1[1]
    const ratio = (lng - p1[0]) / lngDiff
    return p1[1] + (latDiff * ratio)
  }

  // Find best waypoint from a specific side
  findBestWaypointOnSide(startPoint, endPoint, waypoints) {
    const startLng = startPoint[1]
    const endLng = endPoint[1]
    const minLng = Math.min(startLng, endLng)
    const maxLng = Math.max(startLng, endLng)

    // Compute a total route cost for each waypoint
    const scored = waypoints.map(wp => {
      const wpPoint = [wp.lat, wp.lng]
      const distStart = this.calculateDistance(startPoint, wpPoint)
      const distEnd = this.calculateDistance(wpPoint, endPoint)
      const totalDist = distStart + distEnd

      // Bonus if waypoint is between the start and end (helps route shape)
      const inRangeBonus = (wp.lng >= minLng && wp.lng <= maxLng) ? -0.05 : 0.0

      return { wp, score: totalDist + inRangeBonus }
    })

    // Select waypoint with lowest total travel distance
    const best = scored.reduce((min, cur) => (cur.score < min.score ? cur : min), scored[0])

    return best.wp
  }

  // Build waypoint string for OSRM API
  buildWaypointString(startPoint, endPoint, waypoints) {
    const allPoints = [startPoint, ...waypoints, endPoint]
    return allPoints.map(p => `${p[1]},${p[0]}`).join(';')
  }

  // Get visual representation of all waypoints for map display
  getAllWaypointMarkers() {
    return [...this.northWaypoints, ...this.southWaypoints].map(wp => ({
      lat: wp.lat,
      lng: wp.lng,
      name: wp.name,
      id: wp.id,
      side: wp.id.startsWith('N') ? 'north' : 'south'
    }))
  }

  // Validate that waypoint path avoids all restrictions
  async validateWaypointPath(startPoint, endPoint, waypoints) {
    const allPoints = [startPoint, ...waypoints, endPoint]
    
    for (let i = 0; i < allPoints.length - 1; i++) {
      const point1 = allPoints[i]
      const point2 = allPoints[i + 1]
      
      for (const polygon of this.restrictedPolygons) {
        if (this.lineIntersectsPolygon(point1, point2, polygon)) {
          return false
        }
      }
    }
    
    return true
  }

  // Debug helper
  analyzeRoute(startPoint, endPoint) {
    console.log('\n=== ROUTE ANALYSIS ===')
    console.log('Start:', startPoint, `(${this.getPointSide(startPoint)} side)`)
    console.log('End:', endPoint, `(${this.getPointSide(endPoint)} side)`)
    console.log('Lng span:', Math.abs(endPoint[1] - startPoint[1]).toFixed(5))
    console.log('Crosses highway:', this.getPointSide(startPoint) !== this.getPointSide(endPoint))
    console.log('=====================\n')
  }
}

export default RouteRestrictionChecker