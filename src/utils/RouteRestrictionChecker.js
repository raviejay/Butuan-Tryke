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

  // Replace your findOptimalWaypoints method with this enhanced version

// Replace your findOptimalWaypoints method with this enhanced version

async findOptimalWaypoints(startPoint, endPoint, violations) {
  console.log('\n=== DYNAMIC WAYPOINT SELECTION (OSRM-TESTED) ===')

  const startSide = this.getPointSide(startPoint)
  const endSide = this.getPointSide(endPoint)
  const startLng = startPoint[1]
  const endLng = endPoint[1]

  console.log(`Start: ${startSide} | End: ${endSide}`)
  console.log(`Direction: ${endLng > startLng ? 'East' : 'West'}`)

  // Track the best route found (lowest violations)
  let bestRoute = {
    waypoints: null,
    violations: Infinity,
    description: '',
    routeCoords: null
  }

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

  const updateBestRoute = (test, waypoints, description) => {
    if (!test || test.violations === undefined) {
      console.warn('Invalid test result:', test)
      return
    }
    
    if (test.violations < bestRoute.violations) {
      bestRoute = {
        waypoints,
        violations: test.violations,
        description,
        routeCoords: test.routeCoords
      }
      console.log(`🏆 New best: ${description} (${test.violations} violations)`)
    }
  }

  if (startSide === endSide) {
    console.log(`Strategy: Both on ${startSide} side`)
    
    // IMPORTANT: Test BOTH north and south waypoints to find lowest violations
    const sameSideWaypoints = startSide === 'north' ? this.northWaypoints : this.southWaypoints
    const oppositeSideWaypoints = startSide === 'north' ? this.southWaypoints : this.northWaypoints
    
    const sameSideScored = getScoredWaypoints(startPoint, endPoint, sameSideWaypoints)
    const oppositeSideScored = getScoredWaypoints(startPoint, endPoint, oppositeSideWaypoints)

    // Test direct path
    console.log('Testing: Direct path (0 waypoints)...')
    const directTest = await this.testPathWithOSRM([startPoint, endPoint])
    if (directTest.valid) {
      console.log('✅ Direct path is CLEAR!')
      console.log('========================================\n')
      return []
    }
    updateBestRoute(directTest, [], 'Direct path')
    console.log(`❌ Direct: ${directTest.violations} violations`)

    // Try 1 waypoint (SAME SIDE)
    console.log(`Testing: 1 waypoint (${startSide} side)...`)
    for (let i = 0; i < Math.min(sameSideScored.length, sameSideWaypoints.length); i++) {
      const wp = sameSideScored[i].wp
      const wps = [[wp.lat, wp.lng]]
      const test = await this.testPathWithOSRM([startPoint, ...wps, endPoint])
      
      updateBestRoute(test, wps, `1wp-${startSide}: ${wp.name}`)
      
      if (test.valid) {
        console.log(`✅ SUCCESS: ${wp.name}`)
        console.log('========================================\n')
        return wps
      }
      console.log(`  ❌ ${wp.name}: ${test.violations} violations`)
    }

    // Try 1 waypoint (OPPOSITE SIDE)
    const oppositeSide = startSide === 'north' ? 'south' : 'north'
    console.log(`Testing: 1 waypoint (${oppositeSide} side - checking alternative)...`)
    for (let i = 0; i < Math.min(oppositeSideScored.length, oppositeSideWaypoints.length); i++) {
      const wp = oppositeSideScored[i].wp
      const wps = [[wp.lat, wp.lng]]
      const test = await this.testPathWithOSRM([startPoint, ...wps, endPoint])
      
      updateBestRoute(test, wps, `1wp-${oppositeSide}: ${wp.name}`)
      
      if (test.valid) {
        console.log(`✅ SUCCESS (opposite side): ${wp.name}`)
        console.log('========================================\n')
        return wps
      }
      console.log(`  ❌ ${wp.name}: ${test.violations} violations`)
    }

    // Try 2 waypoints (SAME SIDE)
    console.log(`Testing: 2 waypoints (${startSide} side)...`)
    for (let i = 0; i < Math.min(sameSideScored.length - 1, sameSideWaypoints.length - 1); i++) {
      for (let j = i + 1; j < Math.min(sameSideScored.length, sameSideWaypoints.length); j++) {
        const wp1 = sameSideScored[i].wp
        const wp2 = sameSideScored[j].wp
        const orderedWps = sameSideScored[i].distFromStart < sameSideScored[j].distFromStart 
          ? [[wp1.lat, wp1.lng], [wp2.lat, wp2.lng]] 
          : [[wp2.lat, wp2.lng], [wp1.lat, wp1.lng]]
        
        const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
        
        updateBestRoute(test, orderedWps, `2wp-${startSide}: ${wp1.name} → ${wp2.name}`)
        
        if (test.valid) {
          console.log(`✅ SUCCESS: ${wp1.name} → ${wp2.name}`)
          console.log('========================================\n')
          return orderedWps
        }
      }
    }

    // Try 2 waypoints (OPPOSITE SIDE)
    console.log(`Testing: 2 waypoints (${oppositeSide} side)...`)
    for (let i = 0; i < Math.min(oppositeSideScored.length - 1, oppositeSideWaypoints.length - 1); i++) {
      for (let j = i + 1; j < Math.min(oppositeSideScored.length, oppositeSideWaypoints.length); j++) {
        const wp1 = oppositeSideScored[i].wp
        const wp2 = oppositeSideScored[j].wp
        const orderedWps = oppositeSideScored[i].distFromStart < oppositeSideScored[j].distFromStart 
          ? [[wp1.lat, wp1.lng], [wp2.lat, wp2.lng]] 
          : [[wp2.lat, wp2.lng], [wp1.lat, wp1.lng]]
        
        const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
        
        updateBestRoute(test, orderedWps, `2wp-${oppositeSide}: ${wp1.name} → ${wp2.name}`)
        
        if (test.valid) {
          console.log(`✅ SUCCESS (opposite side): ${wp1.name} → ${wp2.name}`)
          console.log('========================================\n')
          return orderedWps
        }
      }
    }

    // Try 2 waypoints (MIXED: 1 same + 1 opposite)
    console.log(`Testing: 2 waypoints (mixed sides)...`)
    for (let i = 0; i < Math.min(3, sameSideScored.length); i++) {
      for (let j = 0; j < Math.min(3, oppositeSideScored.length); j++) {
        const wp1 = sameSideScored[i].wp
        const wp2 = oppositeSideScored[j].wp
        
        // Try both orders
        const orderedWps = sameSideScored[i].distFromStart < oppositeSideScored[j].distFromStart 
          ? [[wp1.lat, wp1.lng], [wp2.lat, wp2.lng]] 
          : [[wp2.lat, wp2.lng], [wp1.lat, wp1.lng]]
        
        const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
        
        updateBestRoute(test, orderedWps, `2wp-mixed: ${wp1.name} → ${wp2.name}`)
        
        if (test.valid) {
          console.log(`✅ SUCCESS (mixed): ${wp1.name} → ${wp2.name}`)
          console.log('========================================\n')
          return orderedWps
        }
      }
    }

    // Try 3 waypoints (exploring all combinations)
    console.log('Testing: 3 waypoints (all combinations)...')
    
    // Same side combinations
    for (let i = 0; i < Math.min(2, sameSideScored.length - 2); i++) {
      for (let j = i + 1; j < Math.min(3, sameSideScored.length - 1); j++) {
        for (let k = j + 1; k < Math.min(4, sameSideScored.length); k++) {
          const wp1 = sameSideScored[i].wp
          const wp2 = sameSideScored[j].wp
          const wp3 = sameSideScored[k].wp
          
          const orderedWps = [
            { wp: wp1, dist: sameSideScored[i].distFromStart },
            { wp: wp2, dist: sameSideScored[j].distFromStart },
            { wp: wp3, dist: sameSideScored[k].distFromStart }
          ]
            .sort((a, b) => a.dist - b.dist)
            .map(item => [item.wp.lat, item.wp.lng])
          
          const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
          
          updateBestRoute(test, orderedWps, `3wp-${startSide}: ${wp1.name} → ${wp2.name} → ${wp3.name}`)
          
          if (test.valid) {
            console.log(`✅ SUCCESS: ${wp1.name} → ${wp2.name} → ${wp3.name}`)
            console.log('========================================\n')
            return orderedWps
          }
        }
      }
    }
    
    // Opposite side combinations
    for (let i = 0; i < Math.min(2, oppositeSideScored.length - 2); i++) {
      for (let j = i + 1; j < Math.min(3, oppositeSideScored.length - 1); j++) {
        for (let k = j + 1; k < Math.min(4, oppositeSideScored.length); k++) {
          const wp1 = oppositeSideScored[i].wp
          const wp2 = oppositeSideScored[j].wp
          const wp3 = oppositeSideScored[k].wp
          
          const orderedWps = [
            { wp: wp1, dist: oppositeSideScored[i].distFromStart },
            { wp: wp2, dist: oppositeSideScored[j].distFromStart },
            { wp: wp3, dist: oppositeSideScored[k].distFromStart }
          ]
            .sort((a, b) => a.dist - b.dist)
            .map(item => [item.wp.lat, item.wp.lng])
          
          const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
          
          updateBestRoute(test, orderedWps, `3wp-${oppositeSide}: ${wp1.name} → ${wp2.name} → ${wp3.name}`)
          
          if (test.valid) {
            console.log(`✅ SUCCESS (opposite): ${wp1.name} → ${wp2.name} → ${wp3.name}`)
            console.log('========================================\n')
            return orderedWps
          }
        }
      }
    }
    
    // Mixed: 2 same + 1 opposite
    for (let i = 0; i < Math.min(2, sameSideScored.length - 1); i++) {
      for (let j = i + 1; j < Math.min(3, sameSideScored.length); j++) {
        for (let k = 0; k < Math.min(2, oppositeSideScored.length); k++) {
          const wp1 = sameSideScored[i].wp
          const wp2 = sameSideScored[j].wp
          const wp3 = oppositeSideScored[k].wp
          
          const orderedWps = [
            { wp: wp1, dist: sameSideScored[i].distFromStart },
            { wp: wp2, dist: sameSideScored[j].distFromStart },
            { wp: wp3, dist: oppositeSideScored[k].distFromStart }
          ]
            .sort((a, b) => a.dist - b.dist)
            .map(item => [item.wp.lat, item.wp.lng])
          
          const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
          
          updateBestRoute(test, orderedWps, `3wp-mixed(2+1): ${wp1.name} → ${wp2.name} → ${wp3.name}`)
          
          if (test.valid) {
            console.log(`✅ SUCCESS (mixed 2+1)`)
            console.log('========================================\n')
            return orderedWps
          }
        }
      }
    }
    
    // Mixed: 1 same + 2 opposite
    for (let i = 0; i < Math.min(2, sameSideScored.length); i++) {
      for (let j = 0; j < Math.min(2, oppositeSideScored.length - 1); j++) {
        for (let k = j + 1; k < Math.min(3, oppositeSideScored.length); k++) {
          const wp1 = sameSideScored[i].wp
          const wp2 = oppositeSideScored[j].wp
          const wp3 = oppositeSideScored[k].wp
          
          const orderedWps = [
            { wp: wp1, dist: sameSideScored[i].distFromStart },
            { wp: wp2, dist: oppositeSideScored[j].distFromStart },
            { wp: wp3, dist: oppositeSideScored[k].distFromStart }
          ]
            .sort((a, b) => a.dist - b.dist)
            .map(item => [item.wp.lat, item.wp.lng])
          
          const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
          
          updateBestRoute(test, orderedWps, `3wp-mixed(1+2): ${wp1.name} → ${wp2.name} → ${wp3.name}`)
          
          if (test.valid) {
            console.log(`✅ SUCCESS (mixed 1+2)`)
            console.log('========================================\n')
            return orderedWps
          }
        }
      }
    }

    // Try 4 waypoints (limited combinations for performance)
    console.log('Testing: 4 waypoints (key combinations)...')
    
    // All same side
    for (let i = 0; i < Math.min(1, sameSideScored.length - 3); i++) {
      for (let j = i + 1; j < Math.min(2, sameSideScored.length - 2); j++) {
        for (let k = j + 1; k < Math.min(3, sameSideScored.length - 1); k++) {
          for (let l = k + 1; l < Math.min(4, sameSideScored.length); l++) {
            const wp1 = sameSideScored[i].wp
            const wp2 = sameSideScored[j].wp
            const wp3 = sameSideScored[k].wp
            const wp4 = sameSideScored[l].wp
            
            const orderedWps = [
              { wp: wp1, dist: sameSideScored[i].distFromStart },
              { wp: wp2, dist: sameSideScored[j].distFromStart },
              { wp: wp3, dist: sameSideScored[k].distFromStart },
              { wp: wp4, dist: sameSideScored[l].distFromStart }
            ]
              .sort((a, b) => a.dist - b.dist)
              .map(item => [item.wp.lat, item.wp.lng])
            
            const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
            
            updateBestRoute(test, orderedWps, `4wp-${startSide}: 4 waypoints`)
            
            if (test.valid) {
              console.log(`✅ SUCCESS: 4 waypoints (${startSide})`)
              console.log('========================================\n')
              return orderedWps
            }
          }
        }
      }
    }
    
    // All opposite side
    for (let i = 0; i < Math.min(1, oppositeSideScored.length - 3); i++) {
      for (let j = i + 1; j < Math.min(2, oppositeSideScored.length - 2); j++) {
        for (let k = j + 1; k < Math.min(3, oppositeSideScored.length - 1); k++) {
          for (let l = k + 1; l < Math.min(4, oppositeSideScored.length); l++) {
            const wp1 = oppositeSideScored[i].wp
            const wp2 = oppositeSideScored[j].wp
            const wp3 = oppositeSideScored[k].wp
            const wp4 = oppositeSideScored[l].wp
            
            const orderedWps = [
              { wp: wp1, dist: oppositeSideScored[i].distFromStart },
              { wp: wp2, dist: oppositeSideScored[j].distFromStart },
              { wp: wp3, dist: oppositeSideScored[k].distFromStart },
              { wp: wp4, dist: oppositeSideScored[l].distFromStart }
            ]
              .sort((a, b) => a.dist - b.dist)
              .map(item => [item.wp.lat, item.wp.lng])
            
            const test = await this.testPathWithOSRM([startPoint, ...orderedWps, endPoint])
            
            updateBestRoute(test, orderedWps, `4wp-${oppositeSide}: 4 waypoints`)
            
            if (test.valid) {
              console.log(`✅ SUCCESS: 4 waypoints (${oppositeSide})`)
              console.log('========================================\n')
              return orderedWps
            }
          }
        }
      }
    }

    // Return best route found (lowest violations)
    console.log(`\n⚠️ No violation-free route found`)
    
    if (!bestRoute.waypoints && bestRoute.violations === Infinity) {
      // No valid routes tested at all - return empty for direct route fallback
      console.log(`❌ No valid routes found - using direct path`)
      console.log('========================================\n')
      return []
    }
    
    console.log(`📊 Using best option: ${bestRoute.description}`)
    console.log(`   Violations: ${bestRoute.violations}`)
    console.log('========================================\n')
    
    // Ensure we return waypoints or empty array, never null
    return bestRoute.waypoints || []

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
        
        updateBestRoute(test, wps, `Cross: ${startScored[i].wp.name} → ${endScored[j].wp.name}`)
        
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
          
          updateBestRoute(test, wps, `Cross 2+1: ${startScored[i].wp.name} → ${startScored[j].wp.name} → ${endScored[k].wp.name}`)
          
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
          
          updateBestRoute(test, wps, `Cross 1+2: ${startScored[i].wp.name} → ${endScored[j].wp.name} → ${endScored[k].wp.name}`)
          
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
            
            updateBestRoute(test, wps, `Cross 2+2: 4 waypoints`)
            
            if (test.valid) {
              console.log(`✅ SUCCESS: 4 waypoints (2+2)`)
              console.log('========================================\n')
              return wps
            }
          }
        }
      }
    }

    // Return best cross-side route
    console.log(`\n⚠️ No violation-free route found`)
    
    if (!bestRoute.waypoints && bestRoute.violations === Infinity) {
      // No valid routes tested at all - return empty for direct route fallback
      console.log(`❌ No valid routes found - using direct path`)
      console.log('========================================\n')
      return []
    }
    
    console.log(`📊 Using best option: ${bestRoute.description}`)
    console.log(`   Violations: ${bestRoute.violations}`)
    console.log('========================================\n')
    
    // Ensure we return waypoints or empty array, never null
    return bestRoute.waypoints || []
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



// Add these methods to your RouteRestrictionChecker class

/**
 * Check if a point is inside any restricted polygon
 */
isPointInsideRestriction(point) {
  for (const polygon of this.restrictedPolygons) {
    if (this.isPointInPolygon(point, polygon)) {
      return {
        inside: true,
        polygonId: polygon.id,
        polygon: polygon
      }
    }
  }
  return { inside: false }
}

/**
 * Find nearest safe point outside restricted areas
 * Uses a radial search pattern to find closest valid location
 */
findNearestSafePoint(point, maxSearchRadius = 0.01) {
  // If point is already safe, return it
  const check = this.isPointInsideRestriction(point)
  if (!check.inside) {
    return { point, adjusted: false }
  }

  console.log(`⚠️ Point ${point} is inside restricted area ${check.polygonId}`)
  console.log('🔍 Searching for nearest safe point...')

  const [lat, lng] = point
  const steps = 32 // Increased directions for better coverage
  const radiusSteps = 30 // More distance increments

  // Try increasing radii
  for (let r = 1; r <= radiusSteps; r++) {
    const radius = (maxSearchRadius / radiusSteps) * r

    // Try points in a circle around the original point
    for (let i = 0; i < steps; i++) {
      const angle = (2 * Math.PI * i) / steps
      const testLat = lat + (radius * Math.cos(angle))
      const testLng = lng + (radius * Math.sin(angle))
      const testPoint = [testLat, testLng]

      // Check if this test point is safe
      const testCheck = this.isPointInsideRestriction(testPoint)
      if (!testCheck.inside) {
        const distanceKm = this.calculateDistance(point, testPoint)
        console.log(`✅ Found safe point ${(distanceKm * 1000).toFixed(0)}m away: ${testPoint}`)
        return { 
          point: testPoint, 
          adjusted: true,
          originalPoint: point,
          distanceMoved: distanceKm
        }
      }
    }
  }

  // If no safe point found, try waypoints as fallback
  console.log('⚠️ No safe point in radial search, trying waypoints...')
  const side = this.getPointSide(point)
  const waypoints = side === 'north' ? this.northWaypoints : this.southWaypoints
  
  // Find closest waypoint
  let closestWp = waypoints[0]
  let minDist = this.calculateDistance(point, [waypoints[0].lat, waypoints[0].lng])
  
  for (const wp of waypoints) {
    const dist = this.calculateDistance(point, [wp.lat, wp.lng])
    if (dist < minDist) {
      minDist = dist
      closestWp = wp
    }
  }
  
  const fallbackPoint = [closestWp.lat, closestWp.lng]
  console.log(`🔄 Using waypoint fallback: ${closestWp.name} (${(minDist * 1000).toFixed(0)}m away)`)
  
  return {
    point: fallbackPoint,
    adjusted: true,
    originalPoint: point,
    fallback: true,
    distanceMoved: minDist
  }
}

/**
 * Adjust route endpoints if they're in restricted areas
 * Call this BEFORE calculating routes
 */
adjustRouteEndpoints(startPoint, endPoint) {
  console.log('\n=== CHECKING ROUTE ENDPOINTS ===')
  
  const startResult = this.findNearestSafePoint(startPoint)
  const endResult = this.findNearestSafePoint(endPoint)
  
  const adjusted = startResult.adjusted || endResult.adjusted
  
  if (adjusted) {
    console.log('📍 Endpoint adjustments made:')
    if (startResult.adjusted) {
      console.log(`  Start: moved ${(startResult.distanceMoved * 1000).toFixed(0)}m`)
    }
    if (endResult.adjusted) {
      console.log(`  End: moved ${(endResult.distanceMoved * 1000).toFixed(0)}m`)
    }
  } else {
    console.log('✅ Both endpoints are safe')
  }
  
  console.log('================================\n')
  
  return {
    start: startResult.point,
    end: endResult.point,
    adjusted,
    startAdjusted: startResult.adjusted,
    endAdjusted: endResult.adjusted,
    startOriginal: startPoint,
    endOriginal: endPoint
  }
}
  
}

export default RouteRestrictionChecker