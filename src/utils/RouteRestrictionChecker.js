
class RouteRestrictionChecker {
  constructor(restrictedGeoJSON) {
    this.restrictedPolygons = this.parseGeoJSON(restrictedGeoJSON)
    
   
    this.northWaypoints = [
      { id: 'N1', lat: 8.948823, lng: 125.530714, name: 'North Gap 1 (west)' },
      { id: 'N2', lat: 8.950436, lng: 125.534950, name: 'North Gap 2 (mid)' },
      { id: 'N3', lat: 8.948924, lng: 125.540743, name: 'North Gap 3 (east)' },
      { id: 'N4', lat: 8.958513, lng: 125.527187, name: 'North Gap SUB 1 (East)' },

      { id: 'N5', lat: 8.947064, lng: 125.540719, name: 'North Gap mid 1 (mid)' },
      
      { id: 'N6', lat: 8.949574, lng: 125.543668, name: 'North Gap mid 2 (mid)' }
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

   findOptimalWaypoints(startPoint, endPoint, violations) {
    console.log('\n=== DYNAMIC WAYPOINT SELECTION ===')

    const startSide = this.getPointSide(startPoint)
    const endSide = this.getPointSide(endPoint)
    const startLng = startPoint[1]
    const endLng = endPoint[1]

    console.log(`Start: ${startSide} | End: ${endSide}`)

    const travelingEast = endLng > startLng
    console.log(`Direction: ${travelingEast ? 'East' : 'West'}`)

    // Helper: Test if a path configuration is valid (no restrictions)
    const testPath = (waypoints) => {
      const allPoints = [startPoint, ...waypoints.map(wp => [wp.lat, wp.lng]), endPoint]
      
      for (let i = 0; i < allPoints.length - 1; i++) {
        const check = this.checkDirectPath(allPoints[i], allPoints[i + 1])
        if (check.hasViolation) {
          return { valid: false, violations: check.violations.length, segment: i }
        }
      }
      return { valid: true, violations: 0 }
    }

    // Helper: Get scored waypoints for a side
    const getScoredWaypoints = (pointA, pointB, waypoints) => {
      const minLng = Math.min(pointA[1], pointB[1])
      const maxLng = Math.max(pointA[1], pointB[1])
      const buffer = 0.005

      const relevant = waypoints.filter(wp => 
        wp.lng >= (minLng - buffer) && wp.lng <= (maxLng + buffer)
      )
      const candidates = relevant.length > 0 ? relevant : waypoints

      return candidates.map(wp => {
        const wpPoint = [wp.lat, wp.lng]
        const distFromStart = this.calculateDistance(pointA, wpPoint)
        const distFromEnd = this.calculateDistance(wpPoint, pointB)
        const score = (distFromStart * 2.0) + (distFromEnd * 0.5)
        
        return { wp, score, distFromStart }
      }).sort((a, b) => a.score - b.score)
    }

    if (startSide === endSide) {
      // Same side strategy: try 0, 1, then 2 waypoints
      console.log(`Strategy: Both on ${startSide} side - testing minimal waypoints`)
      const waypoints = startSide === 'north' ? this.northWaypoints : this.southWaypoints
      const scored = getScoredWaypoints(startPoint, endPoint, waypoints)

      // Try 0 waypoints (direct path)
      console.log('Testing: Direct path (0 waypoints)...')
      const directTest = testPath([])
      if (directTest.valid) {
        console.log('✅ Direct path is CLEAR!')
        console.log('========================================\n')
        return []
      }
      console.log(`❌ Direct path has ${directTest.violations} violations`)

      // Try 1 waypoint
      console.log('Testing: 1 waypoint...')
      for (let i = 0; i < Math.min(3, scored.length); i++) {
        const wp = scored[i].wp
        const test = testPath([wp])
        if (test.valid) {
          console.log(`✅ SUCCESS with 1 waypoint: ${wp.name}`)
          console.log('========================================\n')
          return [[wp.lat, wp.lng]]
        }
        console.log(`  ❌ ${wp.name} - still has violations`)
      }

      // Try 2 waypoints
      console.log('Testing: 2 waypoints...')
      for (let i = 0; i < Math.min(2, scored.length); i++) {
        for (let j = i + 1; j < Math.min(3, scored.length); j++) {
          const wp1 = scored[i].wp
          const wp2 = scored[j].wp
          const orderedWps = scored[i].distFromStart < scored[j].distFromStart 
            ? [wp1, wp2] : [wp2, wp1]
          
          const test = testPath(orderedWps)
          if (test.valid) {
            console.log(`✅ SUCCESS with 2 waypoints: ${orderedWps.map(w => w.name).join(' → ')}`)
            console.log('========================================\n')
            return orderedWps.map(wp => [wp.lat, wp.lng])
          }
        }
      }

      // Fallback: use top 2
      console.log('⚠️ Using fallback: top 2 waypoints')
      const fallback = scored.slice(0, 2).sort((a, b) => a.distFromStart - b.distFromStart).map(s => s.wp)
      console.log(`Fallback: ${fallback.map(wp => wp.name).join(' → ')}`)
      console.log('========================================\n')
      return fallback.map(wp => [wp.lat, wp.lng])

    } else {
      // Cross-side strategy: try different combinations
      console.log('Strategy: Crossing sides - testing combinations')
      
      const midLng = (startLng + endLng) / 2
      const midLat = this.getInterpolatedHighwayLat(midLng)
      
      const startWaypoints = startSide === 'north' ? this.northWaypoints : this.southWaypoints
      const endWaypoints = endSide === 'north' ? this.northWaypoints : this.southWaypoints
      
      const startScored = getScoredWaypoints(startPoint, [midLat, midLng], startWaypoints)
      const endScored = getScoredWaypoints([midLat, midLng], endPoint, endWaypoints)

      // Try: 1 start + 1 end
      console.log('Testing: 1 start + 1 end waypoint...')
      for (let i = 0; i < Math.min(3, startScored.length); i++) {
        for (let j = 0; j < Math.min(3, endScored.length); j++) {
          const combo = [startScored[i].wp, endScored[j].wp]
          const test = testPath(combo)
          if (test.valid) {
            console.log(`✅ SUCCESS: ${combo.map(w => w.name).join(' → ')}`)
            console.log('========================================\n')
            return combo.map(wp => [wp.lat, wp.lng])
          }
        }
      }

      // Try: 2 start + 1 end
      console.log('Testing: 2 start + 1 end waypoint...')
      for (let i = 0; i < Math.min(2, startScored.length); i++) {
        for (let j = i + 1; j < Math.min(3, startScored.length); j++) {
          for (let k = 0; k < Math.min(2, endScored.length); k++) {
            const startPair = startScored[i].distFromStart < startScored[j].distFromStart
              ? [startScored[i].wp, startScored[j].wp] 
              : [startScored[j].wp, startScored[i].wp]
            const combo = [...startPair, endScored[k].wp]
            const test = testPath(combo)
            if (test.valid) {   
              console.log(`✅ SUCCESS: ${combo.map(w => w.name).join(' → ')}`)
              console.log('========================================\n')
              return combo.map(wp => [wp.lat, wp.lng])
            }
          }
        }
      }

      // Try: 1 start + 2 end
      console.log('Testing: 1 start + 2 end waypoints...')
      for (let i = 0; i < Math.min(2, startScored.length); i++) {
        for (let j = 0; j < Math.min(2, endScored.length); j++) {
          for (let k = j + 1; k < Math.min(3, endScored.length); k++) {
            const endPair = endScored[j].distFromStart < endScored[k].distFromStart
              ? [endScored[j].wp, endScored[k].wp]
              : [endScored[k].wp, endScored[j].wp]
            const combo = [startScored[i].wp, ...endPair]
            const test = testPath(combo)
            if (test.valid) {
              console.log(`✅ SUCCESS: ${combo.map(w => w.name).join(' → ')}`)
              console.log('========================================\n')
              return combo.map(wp => [wp.lat, wp.lng])
            }
          }
        }
      }

      // Try: 2 start + 2 end
      console.log('Testing: 2 start + 2 end waypoints...')
      const startPair = startScored.slice(0, 2).sort((a, b) => a.distFromStart - b.distFromStart).map(s => s.wp)
      const endPair = endScored.slice(0, 2).sort((a, b) => a.distFromStart - b.distFromStart).map(s => s.wp)
      const combo = [...startPair, ...endPair]
      const test = testPath(combo)
      
      if (test.valid) {
        console.log(`✅ SUCCESS: ${combo.map(w => w.name).join(' → ')}`)
      } else {
        console.log(`⚠️ Using fallback combination (may have violations)`)
      }
      console.log('========================================\n')
      return combo.map(wp => [wp.lat, wp.lng])
    }
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