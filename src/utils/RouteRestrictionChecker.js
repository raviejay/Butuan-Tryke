class RouteRestrictionChecker {
  constructor(restrictedGeoJSON) {
    this.restrictedPolygons = this.parseGeoJSON(restrictedGeoJSON)
    
    this.northWaypoints = [
      { id: 'N1', lat: 8.948823, lng: 125.530714, name: 'North Gap 1 (west)' },
      { id: 'N2', lat: 8.950436, lng: 125.534950, name: 'North Gap 2 (mid)' },
      { id: 'N3', lat: 8.950918, lng: 125.540935, name: 'North Gap 3 (east)' },
      { id: 'N4', lat: 8.958513, lng: 125.527187, name: 'North Gap SUB 1 (East)' },
      { id: 'N5', lat: 8.948280, lng: 125.546785, name: 'North Gap mid 1 (mid)' },
       { id: 'N6', lat: 8.949248203494681, lng: 125.54365235221756, name: 'North Gap mid 2 (mid)' },
      { id: 'N7', lat: 8.951750, lng: 125.537656, name: 'North Gap mid 3 (mid)' },
      { id: 'N10', lat: 8.948201, lng: 125.542222, name: 'North Gap sub 6 (west)' },
      
      { id: 'N8', lat: 8.956175, lng: 125.504998, name: 'North Gap mid 4 (mid)' },
      { id: 'N9', lat: 8.960337, lng: 125.515402, name: 'North Gap sub 5 (west)' },
      { id: 'N11',lat: 8.948635, lng: 125.502378, name: 'North Gap mid 11 (mid)' },
      { id: 'N12', lat: 8.947477, lng:  125.543557, name: 'North Gap mid 12 (mid)' },
      { id: 'N13', lat: 8.945881, lng:  125.500538, name: 'North Gap mid 13 (mid)' },
      { id: 'N14', lat: 8.950832, lng:  125.542432, name: 'North Gap mid 14 (mid)' },
      { id: 'N15', lat: 8.951813, lng:  125.502273, name: 'North Gap mid 15 (mid)' },
      { id: 'N16', lat: 8.955031, lng:  125.536584, name: 'North Gap mid 16 (mid)' },


      { id: 'N17', lat: 8.952008, lng:  125.506684, name: 'North Gap mid 17 (mid)' },
      { id: 'N18', lat: 8.950440, lng:  125.511560, name: 'North Gap mid 18 (mid)' },
      { id: 'N19', lat: 8.947711, lng:  125.504796, name: 'North Gap mid 19 (mid)' }
    ]
    
    this.southWaypoints = [
      { id: 'S1', lat: 8.941320, lng: 125.533488, name: 'South Gap 1 (west)' },
      { id: 'S2', lat: 8.943665, lng: 125.537128, name: 'South Gap 2 (mid)' },
      { id: 'S3', lat: 8.944648, lng: 125.540361, name: 'South Gap 3 (east)' },
      { id: 'S4', lat: 8.940970, lng: 125.532428, name: 'South Gap sub 4 (east)' },
      { id: 'S5', lat: 8.945942, lng: 125.544160, name: 'South Gap sub 5 (east)' },
      { id: 'S6', lat: 8.940305, lng: 125.525923, name: 'South Gap sub 6 (west)' },
      { id: 'S9', lat: 8.947525, lng: 125.552867, name: 'South Gap sub 9 (east)' },
      { id: 'S8', lat: 8.935942, lng: 125.555209, name: 'South Gap sub 8 (east)' },
      { id: 'S7', lat: 8.927561, lng: 125.557032, name: 'South Gap sub 7 (west)' },
      
      { id: 'S24', lat: 8.944680, lng: 125.543367, name: 'South Gap sub 24 (west)' },
        
      { id: 'S10', lat: 8.931793, lng: 125.548944, name: 'South Gap sub 10 (east)' },
      { id: 'S11', lat: 8.919436, lng: 125.551529, name: 'South Gap sub 11 (east)' },
      { id: 'S12', lat: 8.925532, lng: 125.539604, name: 'South Gap sub 12 (west)' },

   
       { id: 'S20', lat: 8.909333, lng: 125.545842, name: 'South Gap sub 20 (east)' },
      { id: 'S13', lat:  8.903923, lng: 125.554850, name: 'South Gap sub 13 (east)' },
       { id: 'S14', lat: 8.914116, lng: 125.561223, name: 'South Gap sub 14 (east)' },
      { id: 'S15', lat:  8.914956, lng: 125.566260, name: 'South Gap sub 15 (east)' },
       { id: 'S16', lat: 8.930484, lng: 125.560737, name: 'South Gap sub 16 (east)' },
     

      { id: 'S17', lat:  8.903851, lng: 125.562948, name: 'South Gap sub 17 (east)' },
       { id: 'S18', lat: 8.893598, lng: 125.557847, name: 'South Gap sub 18 (east)' },
       { id: 'S19', lat: 8.939874, lng: 125.522571, name: 'South Gap sub 19 (east)' },
       { id: 'S21', lat: 8.938498, lng: 125.539557, name: 'South Gap sub 21 (east)' },
      { id: 'S22', lat: 8.921951, lng: 125.558273, name: 'South Gap sub 22 (east)' },
      { id: 'S23', lat: 8.924467, lng: 125.562108, name: 'South Gap sub 23 (east)' }
     
    ]

    this.highwayCenterLine = [
      [125.508836, 8.943283],
      [125.519338, 8.943069], 
      [125.530741, 8.945172],  
      [125.536227, 8.947275],  
      [125.543083, 8.947382],
    ]
    
    this.bufferDistance = 0.00005
    
    // Pre-validate waypoints to exclude those inside restricted areas
    this.validateWaypoints()
  }

  /**
   * Validates all waypoints and marks those that are safe to use
   * Waypoints inside restricted areas are flagged but kept for reference
   */
  validateWaypoints() {
    console.log('🔍 Validating waypoints against restricted areas...')
    
    const validate = (waypoints) => {
      waypoints.forEach(wp => {
        const check = this.isPointInsideRestriction([wp.lat, wp.lng])
        wp.isSafe = !check.inside
        if (!wp.isSafe) {
          console.log(`⚠️ Waypoint ${wp.name} is inside restricted area ${check.polygonId}`)
        }
      })
    }
    
    validate(this.northWaypoints)
    validate(this.southWaypoints)
    
    const safeNorth = this.northWaypoints.filter(wp => wp.isSafe).length
    const safeSouth = this.southWaypoints.filter(wp => wp.isSafe).length
    console.log(`✅ Safe waypoints: ${safeNorth} north, ${safeSouth} south`)
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

  /**
   * Enhanced route intersection check with detailed violation info
   * Checks every segment of the route for polygon intersections
   */
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

  /**
   * Tests a path using OSRM and validates it doesn't intersect restricted areas
   * Returns route validity, violation count, and actual route coordinates
   */
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
        routeCoords,
        distance: data.routes[0].distance,
        duration: data.routes[0].duration
      }
    } catch (error) {
      console.error('OSRM test error:', error)
      return { valid: false, error: error.message }
    }
  }

  /**
   * ENHANCED OPTIMAL WAYPOINT FINDER WITH TARGETED BEAM SEARCH
   * Uses violations to prioritize waypoints near problem areas
   * Sorts waypoints by longitude based on travel direction
   * Beam search for efficient multi-waypoint combinations up to 6
   */
/**
   * Finds the optimal, restriction-free path by treating all waypoints
   * as a graph and finding the lowest-cost path using Dijkstra's algorithm.
   *
   * This is smarter, more flexible, and replaces the complex combination-testing logic.
   *
   * @param {number[]} startPoint - [lat, lng]
   * @param {number[]} endPoint - [lat, lng]
   * @returns {Promise<number[][]>} A promise that resolves to the array of 
   * optimal intermediate waypoints [[lat, lng], ...].
   */
  async findOptimalWaypoints(startPoint, endPoint) {
    console.log('\n=== GRAPH-BASED ROUTE OPTIMIZATION (DIJKSTRA) ===')
    console.log('🔍 Finding optimal path...')

    // 1. Define all nodes in our graph
    const safeWaypoints = [
      ...this.northWaypoints,
      ...this.southWaypoints
    ].filter(wp => wp.isSafe !== false)

    const allNodes = [
      { id: 'start', point: startPoint, name: 'Start' },
      { id: 'end', point: endPoint, name: 'End' },
      ...safeWaypoints.map(wp => ({
        id: wp.id,
        point: [wp.lat, wp.lng],
        name: wp.name
      }))
    ]
    
    // Helper map to get node data by ID
    const nodeMap = new Map(allNodes.map(n => [n.id, n]))
    
    // 2. Build the graph by finding the "cost" between all pairs of nodes
    const adjacencyList = new Map(allNodes.map(n => [n.id, []]))
    const VIOLATION_PENALTY = 1000000 // 1,000,000 meters (1000 km)
    const osrmPromises = []

    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const nodeA = allNodes[i]
        const nodeB = allNodes[j]

        // Create a function that, when called, will fetch the OSRM data.
        // This lets us run them concurrently later.
        osrmPromises.push(async () => {
          const test = await this.testPathWithOSRM([nodeA.point, nodeB.point])
          
          // Cost is distance + a massive penalty for any violations
          const cost = test.error ? 
            Infinity : 
            test.distance + (test.violations * VIOLATION_PENALTY)
            
          return {
            from: nodeA.id,
            to: nodeB.id,
            cost: cost
          }
        })
      }
    }

    // Helper to run promises with a concurrency limit to avoid OSRM rate-limiting
    async function runWithConcurrency(promiseFns, limit) {
      const results = []
      const executing = []
      for (const pFn of promiseFns) {
        const p = pFn().then(res => {
          executing.splice(executing.indexOf(p), 1)
          return res
        })
        executing.push(p)
        results.push(p)
        if (executing.length >= limit) {
          await Promise.race(executing)
        }
      }
      return Promise.all(results)
    }

    console.log(`Building path graph: ${osrmPromises.length} segments to check...`)
    const allEdges = await runWithConcurrency(osrmPromises, 10) // Concurrency of 10

    // Populate the adjacency list with the costs
    for (const edge of allEdges) {
      if (edge.cost === Infinity) continue // Skip failed or invalid routes
      adjacencyList.get(edge.from).push({ node: edge.to, cost: edge.cost })
      adjacencyList.get(edge.to).push({ node: edge.from, cost: edge.cost })
    }
    console.log('✅ Graph built.')

    // 3. Run Dijkstra's algorithm to find the shortest path
    const distances = new Map()
    const previous = new Map()
    const pq = new Map() // Using a Map as a simple Priority Queue

    allNodes.forEach(n => {
      distances.set(n.id, Infinity)
      pq.set(n.id, Infinity)
    })

    distances.set('start', 0)
    pq.set('start', 0)

    while (pq.size > 0) {
      // Find the node with the smallest distance in the "queue"
      let minCost = Infinity
      let currentId = null
      for (const [id, cost] of pq.entries()) {
        if (cost < minCost) {
          minCost = cost
          currentId = id
        }
      }

      if (currentId === null) break // No path
      pq.delete(currentId) // "Remove" from queue
      
      if (currentId === 'end') {
        console.log('🏁 Path found!')
        break // We found the shortest path to the end
      }

      for (const neighbor of adjacencyList.get(currentId)) {
        const newCost = distances.get(currentId) + neighbor.cost
        
        if (newCost < distances.get(neighbor.node)) {
          distances.set(neighbor.node, newCost)
          previous.set(neighbor.node, currentId)
          pq.set(neighbor.node, newCost) // Update priority in queue
        }
      }
    }

    // 4. Reconstruct the path
    const totalCost = distances.get('end')
    
    if (totalCost === Infinity || totalCost >= VIOLATION_PENALTY) {
      console.log('❌ No safe route found.')
      console.log('========================================\n')
      // Fallback: return the direct path (no waypoints)
      return []
    }

    const pathIds = []
    let currentId = 'end'
    while (currentId !== 'start') {
      pathIds.unshift(currentId)
      currentId = previous.get(currentId)
    }

    // We only want the *intermediate* waypoints, not 'start' or 'end'
    const waypointIds = pathIds.filter(id => id !== 'start' && id !== 'end')
    const finalWaypoints = waypointIds.map(id => nodeMap.get(id).point)
    const pathNames = waypointIds.map(id => nodeMap.get(id).name).join(' -> ')

    console.log(`🏆 Optimal Path: Start -> ${pathNames.length > 0 ? pathNames : '(direct)'} -> End`)
    console.log(`   Distance: ${(totalCost / 1000).toFixed(1)}km`)
    console.log('========================================\n')

    return finalWaypoints
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
      side: wp.id.startsWith('N') ? 'north' : 'south',
      isSafe: wp.isSafe
    }))
  }

  analyzeRoute(startPoint, endPoint) {
    console.log('\n=== ROUTE ANALYSIS ===')
    console.log('Start:', startPoint, `(${this.getPointSide(startPoint)} side)`)
    console.log('End:', endPoint, `(${this.getPointSide(endPoint)} side)`)
    console.log('=====================\n')
  }

  /**
   * Check if a point is inside any restricted polygon
   * Returns the first polygon containing the point, or indicates safe
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
   * ENHANCED SAFE POINT FINDER
   * Uses multi-directional radial search to find nearest point outside restrictions
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
    const steps = 32
    const radiusSteps = 30

    // RADIAL SEARCH
    for (let r = 1; r <= radiusSteps; r++) {
      const radius = (maxSearchRadius / radiusSteps) * r

      for (let i = 0; i < steps; i++) {
        const angle = (2 * Math.PI * i) / steps
        const testLat = lat + (radius * Math.cos(angle))
        const testLng = lng + (radius * Math.sin(angle))
        const testPoint = [testLat, testLng]

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

    // FALLBACK: Use nearest safe waypoint
    console.log('⚠️ No safe point in radial search, trying waypoints...')
    const side = this.getPointSide(point)
    const sameWaypoints = side === 'north' ? this.northWaypoints : this.southWaypoints
    const oppositeWaypoints = side === 'north' ? this.southWaypoints : this.northWaypoints
    
    const allWaypoints = [...sameWaypoints, ...oppositeWaypoints].filter(wp => wp.isSafe)
    
    if (allWaypoints.length === 0) {
      console.error('❌ No safe waypoints available!')
      return { point, adjusted: false, error: 'No safe waypoints' }
    }
    
    let closestWp = allWaypoints[0]
    let minDist = this.calculateDistance(point, [allWaypoints[0].lat, allWaypoints[0].lng])
    
    for (const wp of allWaypoints) {
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
   * ENDPOINT ADJUSTER
   * Automatically moves route start/end points outside restricted areas
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



