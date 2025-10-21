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
      { id: 'N7', lat: 8.951750, lng: 125.537656, name: 'North Gap mid 3 (mid)' }
    ]
    
    this.southWaypoints = [
      { id: 'S1', lat: 8.941320, lng: 125.533488, name: 'South Gap 1 (west)' },
      { id: 'S2', lat: 8.943665, lng: 125.537128, name: 'South Gap 2 (mid)' },
      { id: 'S3', lat: 8.944301, lng: 125.540400, name: 'South Gap 3 (east)' },
      { id: 'S4', lat: 8.940970, lng: 125.532428, name: 'South Gap sub 4 (east)' },
      { id: 'S5', lat: 8.945942, lng: 125.544160, name: 'South Gap sub 5 (east)' },
      { id: 'S6', lat: 8.940305, lng: 125.525923, name: 'South Gap sub 6 (west)' }
    ]

    this.highwayCenterLine = [
      [125.508836, 8.943283],
      [125.519338, 8.943069], 
      [125.530741, 8.945172],  
      [125.536227, 8.947275],  
      [125.543083, 8.947382],
    ]
    
    this.bufferDistance = 0.00005
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
    
    if (this.isPointInPolygon(point1, polygon) || 
        this.isPointInPolygon(point2, polygon)) {
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

  getPolygonsForMap() {
    return this.restrictedPolygons.map(p => p.coordinates)
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
              Math.cos((lat1 * Math.PI) / 180) * 
              Math.cos((lat2 * Math.PI) / 180) * 
              Math.sin(dLng / 2) * Math.sin(dLng / 2)

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
  }

  async testPathWithOSRM(waypoints) {
    try {
      const waypointString = waypoints.map(p => `${p[1]},${p[0]}`).join(';')
      const url = `https://router.project-osrm.org/route/v1/driving/${waypointString}?geometries=geojson&overview=full`
      
      const response = await fetch(url)
      if (!response.ok) return { valid: false, error: 'OSRM failed' }
      
      const data = await response.json()
      if (!data.routes || data.routes.length === 0) {
        return { valid: false, error: 'No route found' }
      }
      
      const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]])
      const check = this.checkRouteIntersection(routeCoords)
      
      return { 
        valid: !check.hasViolation, 
        violations: check.violations.length,
        routeCoords 
      }
    } catch (error) {
      console.error('OSRM test error:', error)
      return { valid: false, error: error.message }
    }
  }

  async findOptimalWaypoints(startPoint, endPoint, violations) {
    console.log('\n=== DYNAMIC WAYPOINT SELECTION (OSRM-TESTED) ===')

    const startSide = this.getPointSide(startPoint)
    const endSide = this.getPointSide(endPoint)
    const startLng = startPoint[1]
    const endLng = endPoint[1]

    console.log(`Start: ${startSide} | End: ${endSide}`)
    console.log(`Direction: ${endLng > startLng ? 'East' : 'West'}`)

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
      console.log(`Strategy: Both on ${startSide} side`)
      const waypoints = startSide === 'north' ? this.northWaypoints : this.southWaypoints
      const scored = getScoredWaypoints(startPoint, endPoint, waypoints)

      // Test direct path
      console.log('Testing: Direct path (0 waypoints)...')
      const directTest = await this.testPathWithOSRM([startPoint, endPoint])
      if (directTest.valid) {
        console.log('✅ Direct path is CLEAR!')
        console.log('========================================\n')
        return []
      }
      console.log(`❌ Direct: ${directTest.violations} violations`)

      // Try 1 waypoint
      console.log('Testing: 1 waypoint...')
      for (let i = 0; i < Math.min(scored.length, waypoints.length); i++) {
        const wp = scored[i].wp
        const test = await this.testPathWithOSRM([startPoint, [wp.lat, wp.lng], endPoint])
        if (test.valid) {
          console.log(`✅ SUCCESS: ${wp.name}`)
          console.log('========================================\n')
          return [[wp.lat, wp.lng]]
        }
        console.log(`  ❌ ${wp.name}: ${test.violations} violations`)
      }

      // Try 2 waypoints
      console.log('Testing: 2 waypoints...')
      for (let i = 0; i < Math.min(scored.length - 1, waypoints.length - 1); i++) {
        for (let j = i + 1; j < Math.min(scored.length, waypoints.length); j++) {
          const wp1 = scored[i].wp
          const wp2 = scored[j].wp
          const orderedWps = scored[i].distFromStart < scored[j].distFromStart 
            ? [[wp1.lat, wp1.lng], [wp2.lat, wp2.lng]] 
            : [[wp2.lat, wp2.lng], [wp1.lat, wp1.lng]]
          
          const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
          if (test.valid) {
            console.log(`✅ SUCCESS: ${wp1.name} → ${wp2.name}`)
            console.log('========================================\n')
            return orderedWps
          }
        }
      }

      // Try 3 waypoints
      console.log('Testing: 3 waypoints...')
      for (let i = 0; i < Math.min(3, scored.length - 2); i++) {
        for (let j = i + 1; j < Math.min(4, scored.length - 1); j++) {
          for (let k = j + 1; k < Math.min(5, scored.length); k++) {
            const wp1 = scored[i].wp
            const wp2 = scored[j].wp
            const wp3 = scored[k].wp
            
            // Order by distance from start
            const orderedWps = [
              { wp: wp1, dist: scored[i].distFromStart },
              { wp: wp2, dist: scored[j].distFromStart },
              { wp: wp3, dist: scored[k].distFromStart }
            ]
              .sort((a, b) => a.dist - b.dist)
              .map(item => [item.wp.lat, item.wp.lng])
            
            const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
            if (test.valid) {
              console.log(`✅ SUCCESS: ${wp1.name} → ${wp2.name} → ${wp3.name}`)
              console.log('========================================\n')
              return orderedWps
            }
          }
        }
      }

      // Try 4 waypoints
      console.log('Testing: 4 waypoints...')
      for (let i = 0; i < Math.min(2, scored.length - 3); i++) {
        for (let j = i + 1; j < Math.min(3, scored.length - 2); j++) {
          for (let k = j + 1; k < Math.min(4, scored.length - 1); k++) {
            for (let l = k + 1; l < Math.min(5, scored.length); l++) {
              const wp1 = scored[i].wp
              const wp2 = scored[j].wp
              const wp3 = scored[k].wp
              const wp4 = scored[l].wp
              
              // Order by distance from start
              const orderedWps = [
                { wp: wp1, dist: scored[i].distFromStart },
                { wp: wp2, dist: scored[j].distFromStart },
                { wp: wp3, dist: scored[k].distFromStart },
                { wp: wp4, dist: scored[l].distFromStart }
              ]
                .sort((a, b) => a.dist - b.dist)
                .map(item => [item.wp.lat, item.wp.lng])
              
              const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
              if (test.valid) {
                console.log(`✅ SUCCESS: ${wp1.name} → ${wp2.name} → ${wp3.name} → ${wp4.name}`)
                console.log('========================================\n')
                return orderedWps
              }
            }
          }
        }
      }

      // Fallback: use best 2 waypoints
      console.log('⚠️ Using best 2 waypoints (may have violations)')
      const fallback = scored.slice(0, 2)
        .sort((a, b) => a.distFromStart - b.distFromStart)
        .map(s => [s.wp.lat, s.wp.lng])
      console.log('========================================\n')
      return fallback

    } else {
      // Cross-side routing
      console.log('Strategy: Crossing sides')
      
      const midLng = (startLng + endLng) / 2
      const midLat = this.getInterpolatedHighwayLat(midLng)
      
      const startWaypoints = startSide === 'north' ? this.northWaypoints : this.southWaypoints
      const endWaypoints = endSide === 'north' ? this.northWaypoints : this.southWaypoints
      
      const startScored = getScoredWaypoints(startPoint, [midLat, midLng], startWaypoints)
      const endScored = getScoredWaypoints([midLat, midLng], endPoint, endWaypoints)

      // Try 1 start + 1 end
      console.log('Testing: 1 start + 1 end...')
      for (let i = 0; i < Math.min(3, startScored.length); i++) {
        for (let j = 0; j < Math.min(3, endScored.length); j++) {
          const wps = [
            [startScored[i].wp.lat, startScored[i].wp.lng],
            [endScored[j].wp.lat, endScored[j].wp.lng]
          ]
          const test = await this.testPathWithOSRM([startPoint, ...wps, endPoint])
          if (test.valid) {
            console.log(`✅ SUCCESS: ${startScored[i].wp.name} → ${endScored[j].wp.name}`)
            console.log('========================================\n')
            return wps
          }
        }
      }

      // Try 2 start + 1 end
      console.log('Testing: 2 start + 1 end...')
      for (let i = 0; i < Math.min(2, startScored.length - 1); i++) {
        for (let j = i + 1; j < Math.min(3, startScored.length); j++) {
          for (let k = 0; k < Math.min(2, endScored.length); k++) {
            const startPair = startScored[i].distFromStart < startScored[j].distFromStart
              ? [[startScored[i].wp.lat, startScored[i].wp.lng], [startScored[j].wp.lat, startScored[j].wp.lng]] 
              : [[startScored[j].wp.lat, startScored[j].wp.lng], [startScored[i].wp.lat, startScored[i].wp.lng]]
            const wps = [...startPair, [endScored[k].wp.lat, endScored[k].wp.lng]]
            
            const test = await this.testPathWithOSRM([startPoint, ...wps, endPoint])
            if (test.valid) {
              console.log(`✅ SUCCESS: ${startScored[i].wp.name} → ${startScored[j].wp.name} → ${endScored[k].wp.name}`)
              console.log('========================================\n')
              return wps
            }
          }
        }
      }

      // Try 1 start + 2 end
      console.log('Testing: 1 start + 2 end...')
      for (let i = 0; i < Math.min(2, startScored.length); i++) {
        for (let j = 0; j < Math.min(2, endScored.length - 1); j++) {
          for (let k = j + 1; k < Math.min(3, endScored.length); k++) {
            const endPair = endScored[j].distFromStart < endScored[k].distFromStart
              ? [[endScored[j].wp.lat, endScored[j].wp.lng], [endScored[k].wp.lat, endScored[k].wp.lng]]
              : [[endScored[k].wp.lat, endScored[k].wp.lng], [endScored[j].wp.lat, endScored[j].wp.lng]]
            const wps = [[startScored[i].wp.lat, startScored[i].wp.lng], ...endPair]
            
            const test = await this.testPathWithOSRM([startPoint, ...wps, endPoint])
            if (test.valid) {
              console.log(`✅ SUCCESS: ${startScored[i].wp.name} → ${endScored[j].wp.name} → ${endScored[k].wp.name}`)
              console.log('========================================\n')
              return wps
            }
          }
        }
      }

      // Try 2 start + 2 end
      console.log('Testing: 2 start + 2 end...')
      for (let i = 0; i < Math.min(2, startScored.length - 1); i++) {
        for (let j = i + 1; j < Math.min(3, startScored.length); j++) {
          for (let k = 0; k < Math.min(2, endScored.length - 1); k++) {
            for (let l = k + 1; l < Math.min(3, endScored.length); l++) {
              const startPair = startScored[i].distFromStart < startScored[j].distFromStart
                ? [[startScored[i].wp.lat, startScored[i].wp.lng], [startScored[j].wp.lat, startScored[j].wp.lng]]
                : [[startScored[j].wp.lat, startScored[j].wp.lng], [startScored[i].wp.lat, startScored[i].wp.lng]]
              const endPair = endScored[k].distFromStart < endScored[l].distFromStart
                ? [[endScored[k].wp.lat, endScored[k].wp.lng], [endScored[l].wp.lat, endScored[l].wp.lng]]
                : [[endScored[l].wp.lat, endScored[l].wp.lng], [endScored[k].wp.lat, endScored[k].wp.lng]]
              const wps = [...startPair, ...endPair]
              
              const test = await this.testPathWithOSRM([startPoint, ...wps, endPoint])
              if (test.valid) {
                console.log(`✅ SUCCESS: 4 waypoints (2+2)`)
                console.log('========================================\n')
                return wps
              }
            }
          }
        }
      }

      // Fallback for cross-side
      const fallback = [
        [startScored[0].wp.lat, startScored[0].wp.lng],
        [endScored[0].wp.lat, endScored[0].wp.lng]
      ]
      console.log('⚠️ Using fallback cross-side waypoints')
      console.log('========================================\n')
      return fallback
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

  buildWaypointString(startPoint, endPoint, waypoints) {
    const allPoints = [startPoint, ...waypoints, endPoint]
    return allPoints.map(p => `${p[1]},${p[0]}`).join(';')
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

  analyzeRoute(startPoint, endPoint) {
    console.log('\n=== ROUTE ANALYSIS ===')
    console.log('Start:', startPoint, `(${this.getPointSide(startPoint)} side)`)
    console.log('End:', endPoint, `(${this.getPointSide(endPoint)} side)`)
    console.log('=====================\n')
  }
}

export default RouteRestrictionChecker