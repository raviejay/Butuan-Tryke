import precomputedGraph from './precomputed-graph.json' assert { type: 'json' };


class MinPriorityQueue {
  constructor() {

    this.elements = [];
  }
  
  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }
  
  dequeue() {
    return this.elements.shift();
  }
  
  isEmpty() {
    return this.elements.length === 0;
  }
}

class FastRouteRestrictionChecker {
  constructor(restrictedGeoJSON) {
    this.restrictedPolygons = this.parseGeoJSON(restrictedGeoJSON);
    this.precomputedGraph = precomputedGraph;
    
    this.osrmCache = new Map(); 
    this.cacheHits = 0;
    this.cacheMisses = 0;
    
    this.precomputedGraph.edges = this.precomputedGraph.edges.filter(edge => edge.violations === 0);
    
    this.adjacencyList = this.buildAdjacencyList();
    
  
    this.waypointMap = new Map();
    precomputedGraph.nodes.forEach(node => {
      this.waypointMap.set(node.id, node);
    });

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

        
      { id: 'S10', lat: 8.931793, lng: 125.548944, name: 'South Gap sub 10 (east)' },
      { id: 'S11', lat: 8.919436, lng: 125.551529, name: 'South Gap sub 11 (east)' },
      { id: 'S12', lat: 8.925532, lng: 125.539604, name: 'South Gap sub 12 (west)' },

      { id: 'S24', lat: 8.944680, lng: 125.543367, name: 'South Gap sub 24 (west)' },
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

    
    console.log(`🚀 FastRouteRestrictionChecker initialized with precomputed graph`);
    console.log(`   📍 ${precomputedGraph.nodes.length} waypoints`);
    console.log(`   🔗 ${this.precomputedGraph.edges.length} safe connections (violations filtered out)`);
    console.log(`   📅 Built: ${new Date(precomputedGraph.metadata.builtAt).toLocaleDateString()}`);
  }

  parseGeoJSON(geoJSON) {
    const polygons = [];
    geoJSON.features.forEach(feature => {
      if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => {
          const coords = polygon[0].map(coord => [coord[1], coord[0]]);
          polygons.push({
            id: feature.properties.id,
            coordinates: coords
          });
        });
      }
    });
    return polygons;
  }

  buildAdjacencyList() {
    const list = new Map();
    
  
    this.precomputedGraph.nodes.forEach(node => {
      list.set(node.id, []);
    });
    
   
    this.precomputedGraph.edges.forEach(edge => {
      if (edge.violations === 0) {
        list.get(edge.from).push({
          node: edge.to,
          cost: edge.distance + (edge.violations * 5000), 
          distance: edge.distance
        });
        
        list.get(edge.to).push({
          node: edge.from, 
          cost: edge.distance,
          distance: edge.distance
        });
      }
    });
    
    return list;
  }

async findOptimalWaypoints(startPoint, endPoint, violations = []) {
  console.log('\n=== FAST ROUTE OPTIMIZATION ===');
  
 
  console.log('🚀 PHASE 1: Using precomputed graph with ZERO-VIOLATION requirement...');
  
  const strictStartConnections = await this.findNearbyPrecomputedNodes(startPoint, 5, false);
  const strictEndConnections = await this.findNearbyPrecomputedNodes(endPoint, 5, false);
  
  if (strictStartConnections.length > 0 && strictEndConnections.length > 0) {
    console.log(`   ✅ Start has ${strictStartConnections.length} safe connections`);
    console.log(`   ✅ End has ${strictEndConnections.length} safe connections`);

    let bestStrictResult = { path: [], totalCost: Infinity, hopCount: Infinity };
    
    for (const startConn of strictStartConnections.slice(0, 3)) {
      for (const endConn of strictEndConnections.slice(0, 3)) {
        const enhancedList = this.buildEnhancedGraph(startPoint, endPoint, [startConn], [endConn]);
        const result = this.runDijkstra(enhancedList, 'start', 'end');
        
        if (result.path.length > 0) {
          const isPathSafe = await this.verifyCompletePathStrict(startPoint, result.path, endPoint);
          
          if (isPathSafe) {
            const costDiff = (result.totalCost - bestStrictResult.totalCost) / bestStrictResult.totalCost;
            if (result.totalCost < bestStrictResult.totalCost || 
                (Math.abs(costDiff) < 0.2 && result.hopCount < bestStrictResult.hopCount)) {
              bestStrictResult = result;
              console.log(`      ✅ Found violation-free path through ${result.path.length} waypoints`);
            }
          }
        }
      }
    }
    
    if (bestStrictResult.path.length > 0) {
      console.log(`🏆 Optimal violation-free path found!`);
      console.log(`   📍 Waypoints: ${bestStrictResult.path.length}`);
      console.log(`   🔢 Hops: ${bestStrictResult.hopCount}`);
      console.log(`   📏 Total distance: ${(bestStrictResult.totalCost / 1000).toFixed(2)}km`);
      return bestStrictResult.path;
    }
  }
  

  console.log('⚠️ PHASE 2: No zero-violation path found, using graph with minimal violations...');
  
  const fallbackStartConnections = await this.findNearbyPrecomputedNodes(startPoint, 7, true);
  const fallbackEndConnections = await this.findNearbyPrecomputedNodes(endPoint, 7, true);
  
  if (fallbackStartConnections.length === 0 || fallbackEndConnections.length === 0) {
    console.warn('⚠️ Could not find any connections from start/end points');
    return [];
  }

  console.log(`   ✅ Start has ${fallbackStartConnections.length} connections`);
  console.log(`   ✅ End has ${fallbackEndConnections.length} connections`);

 
  const enhancedList = this.buildEnhancedGraph(startPoint, endPoint, fallbackStartConnections, fallbackEndConnections);
  const dijkstraResult = this.runDijkstra(enhancedList, 'start', 'end');
  
  if (dijkstraResult.path.length > 0) {
    
    const pathViolations = await this.countPathViolations(startPoint, dijkstraResult.path, endPoint);
    
    console.log(`⚠️ Best graph path found (${pathViolations} violations):`);
    console.log(`   📍 Waypoints: ${dijkstraResult.path.length}`);
    console.log(`   🔢 Hops: ${dijkstraResult.hopCount}`);
    console.log(`   📏 Total distance: ${(dijkstraResult.totalCost / 1000).toFixed(2)}km`);
    
  
    const pathIds = dijkstraResult.path.map(point => this.findWaypointId(point)).join(' → ');
    console.log(`   🗺️ Path: START → ${pathIds} → END`);
    
    return dijkstraResult.path;
  }
  

  console.log('⚠️ No graph path found, trying single waypoint fallback...');
  let bestSingleResult = { path: [], totalCost: Infinity, violations: Infinity };
  
  for (const startConn of fallbackStartConnections.slice(0, 3)) {
    for (const endConn of fallbackEndConnections.slice(0, 3)) {
      // Test direct path: start → waypoint → end
      const testPath = [this.waypointMap.get(startConn.node)];
      const pathViolations = await this.countPathViolations(startPoint, testPath, endPoint);
      
      if (pathViolations < bestSingleResult.violations || 
          (pathViolations === bestSingleResult.violations && startConn.distance + endConn.distance < bestSingleResult.totalCost)) {
        bestSingleResult = {
          path: testPath,
          totalCost: startConn.distance + endConn.distance,
          violations: pathViolations
        };
        console.log(`      ⚠️ Single waypoint ${startConn.node}: ${pathViolations} violations`);
      }
    }
  }
  
  if (bestSingleResult.path.length > 0) {
    console.log(`⚠️ Best single waypoint (${bestSingleResult.violations} violations):`);
    console.log(`   📍 Waypoints: 1`);
    console.log(`   📏 Total distance: ${(bestSingleResult.totalCost / 1000).toFixed(2)}km`);
    return bestSingleResult.path;
  }
  
  console.log('❌ No viable path found');
  return [];
}

async verifyCompletePathStrict(startPoint, waypoints, endPoint) {
  const fullPath = [startPoint, ...waypoints, endPoint];
  
  for (let i = 0; i < fullPath.length - 1; i++) {
    const segmentTest = await this.testPathWithOSRM([fullPath[i], fullPath[i + 1]]);
    
    if (segmentTest.violations > 0) {
      const fromId = i === 0 ? 'START' : this.findWaypointId(fullPath[i]);
      const toId = i === fullPath.length - 2 ? 'END' : this.findWaypointId(fullPath[i + 1]);
      console.log(`      ❌ Strict: Segment ${fromId} → ${toId} has ${segmentTest.violations} violations - REJECTED`);
      return false;
    }
  }
  
  return true;
}


async countPathViolations(startPoint, waypoints, endPoint) {
  const fullPath = [startPoint, ...waypoints, endPoint];
  let totalViolations = 0;
  
  for (let i = 0; i < fullPath.length - 1; i++) {
    const segmentTest = await this.testPathWithOSRM([fullPath[i], fullPath[i + 1]]);
    totalViolations += segmentTest.violations;
  }
  
  return totalViolations;
}


// async verifyCompletePath(startPoint, waypoints, endPoint) {
//   const fullPath = [startPoint, ...waypoints, endPoint];
  
//   // Test each consecutive segment
//   for (let i = 0; i < fullPath.length - 1; i++) {
//     const segmentTest = await this.testPathWithOSRM([fullPath[i], fullPath[i + 1]]);
    
//     if (segmentTest.violations > 0) {
//       const fromId = i === 0 ? 'START' : this.findWaypointId(fullPath[i]);
//       const toId = i === fullPath.length - 2 ? 'END' : this.findWaypointId(fullPath[i + 1]);
//       console.log(`      ❌ Segment ${fromId} → ${toId}: ${segmentTest.violations} violations`);
//       return false;
//     }
//   }
  
//   return true;
// }

// Helper to find waypoint ID from coordinates
findWaypointId(coords) {
  for (const [id, node] of this.waypointMap.entries()) {
    if (Math.abs(node.lat - coords[0]) < 0.00001 && 
        Math.abs(node.lng - coords[1]) < 0.00001) {
      return id;
    }
  }
  return 'Unknown';
}
  buildEnhancedGraph(startPoint, endPoint, startConnections, endConnections) {
    const enhancedList = new Map(this.adjacencyList);
    enhancedList.set('start', startConnections);
    enhancedList.set('end', []);
    
    // Add reverse connections from precomputed nodes to start
    startConnections.forEach(conn => {
      if (enhancedList.has(conn.node)) {
        enhancedList.get(conn.node).push({ 
          node: 'start', 
          cost: conn.distance + (conn.violations * 5000),
          distance: conn.distance 
        });
      }
    });
    
    // Add connections from precomputed nodes to end
    endConnections.forEach(conn => {
      if (enhancedList.has(conn.node)) {
        enhancedList.get(conn.node).push({ 
          node: 'end', 
          cost: conn.distance + (conn.violations * 5000),
          distance: conn.distance 
        });
      }
    });
    
    return enhancedList;
  }

  // async findNearbyPrecomputedNodes(point, maxConnections = 5) {
  //   // Calculate straight-line distances to all precomputed nodes
  //   const nodesWithDistances = this.precomputedGraph.nodes.map(node => ({
  //     ...node,
  //     straightDistance: this.calculateDistance(point, [node.lat, node.lng])
  //   })).sort((a, b) => a.straightDistance - b.straightDistance);
    
  //   const connections = [];
    
  //   // Test routes to nearest nodes - ONLY accept zero-violation paths
  //   for (const node of nodesWithDistances.slice(0, maxConnections * 3)) {
  //     try {
  //       const test = await this.testPathWithOSRM([point, [node.lat, node.lng]]);
        
  //       // CRITICAL: Only accept paths with ZERO violations
  //       if (test.valid && !test.error && test.violations === 0) {
  //         connections.push({
  //           node: node.id,
  //           cost: test.distance,
  //           distance: test.distance,
  //           violations: 0
  //         });
          
  //         console.log(`      ✅ Safe connection to ${node.id}: ${(test.distance/1000).toFixed(2)}km`);
          
  //         if (connections.length >= maxConnections) break;
  //       } else if (test.violations > 0) {
  //         console.log(`      ❌ ${node.id} has ${test.violations} violations - rejected`);
  //       }
  //     } catch (error) {
  //       console.warn(`      ⚠️ Failed to test connection to ${node.id}:`, error.message);
  //     }
  //   }
    
  //   return connections;
  // }

  runDijkstra(adjacencyList, startId, endId) {
    const distances = new Map();
    const previous = new Map();
    const hops = new Map();
    const pq = new MinPriorityQueue();
    
    // Initialize
    for (const nodeId of adjacencyList.keys()) {
      distances.set(nodeId, Infinity);
      hops.set(nodeId, Infinity);
    }
    distances.set(startId, 0);
    hops.set(startId, 0);
    pq.enqueue(startId, 0);
    
    // Dijkstra's algorithm optimized for distance with hop count consideration
    while (!pq.isEmpty()) {
      const { element: currentId } = pq.dequeue();
      
      if (currentId === endId) break;
      
      const neighbors = adjacencyList.get(currentId) || [];
      const currentDistance = distances.get(currentId);
      const currentHops = hops.get(currentId);
      
      for (const neighbor of neighbors) {
        // Prefer direct routes - add small hop penalty
        const HOP_PENALTY = 50; // Small penalty per waypoint (50m equivalent)
        const newDistance = currentDistance + neighbor.cost + (HOP_PENALTY * currentHops);
        const newHops = currentHops + 1;
        
        if (newDistance < distances.get(neighbor.node)) {
          distances.set(neighbor.node, newDistance);
          hops.set(neighbor.node, newHops);
          previous.set(neighbor.node, currentId);
          pq.enqueue(neighbor.node, newDistance);
        }
      }
    }
    
    // Reconstruct path
    const pathIds = [];
    let currentId = endId;
    
    while (currentId !== startId) {
      pathIds.unshift(currentId);
      currentId = previous.get(currentId);
      if (!currentId) {
        return { path: [], totalCost: Infinity, hopCount: Infinity };
      }
    }
    
    // Convert to coordinates (exclude start and end)
    const waypoints = pathIds
      .filter(id => id !== 'start' && id !== 'end')
      .map(id => {
        const node = this.waypointMap.get(id);
        return node ? [node.lat, node.lng] : null;
      })
      .filter(point => point !== null);
    
    return {
      path: waypoints,
      totalCost: distances.get(endId),
      hopCount: hops.get(endId)
    };
  }

  // async testPathWithOSRM(waypoints) {
  //   try {
  //     const waypointString = waypoints.map(p => `${p[1]},${p[0]}`).join(';');
  //     const url = `https://router.project-osrm.org/route/v1/driving/${waypointString}?geometries=geojson&overview=full`;
      
  //     const response = await fetch(url);
  //     if (!response.ok) return { valid: false, error: 'OSRM failed' };
      
  //     const data = await response.json();
  //     if (!data.routes || data.routes.length === 0) {
  //       return { valid: false, error: 'No route found' };
  //     }
      
  //     const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
  //     const check = this.checkRouteIntersection(routeCoords);
      
  //     return { 
  //       valid: check.violations.length === 0, // Only valid if ZERO violations
  //       violations: check.violations.length,
  //       routeCoords,
  //       distance: data.routes[0].distance,
  //       duration: data.routes[0].duration
  //     };
  //   } catch (error) {
  //     console.error('OSRM test error:', error);
  //     return { valid: false, error: error.message };
  //   }
  // }



  // FIXED METHOD 1: Update verifyCompletePath with better logging
async verifyCompletePath(startPoint, waypoints, endPoint) {
  const fullPath = [startPoint, ...waypoints, endPoint];
  
  console.log(`\n🔍 Verifying complete path (${fullPath.length} points)...`);
  
  for (let i = 0; i < fullPath.length - 1; i++) {
    const segmentTest = await this.testPathWithOSRM([fullPath[i], fullPath[i + 1]]);
    
    // Identify segment type
    const isEntrySegment = i === 0;
    const isExitSegment = i === fullPath.length - 2;
    const segmentType = isEntrySegment ? 'ENTRY' : isExitSegment ? 'EXIT' : 'TRANSIT';
    
    const fromId = i === 0 ? 'START' : this.findWaypointId(fullPath[i]);
    const toId = i === fullPath.length - 2 ? 'END' : this.findWaypointId(fullPath[i + 1]);
    
    // Log segment details
    if (segmentTest.violations > 0) {
      if (!isEntrySegment && !isExitSegment) {
        console.log(`      ❌ ${segmentType} segment ${fromId} → ${toId}: ${segmentTest.violations} violations (NOT ALLOWED)`);
        return false;
      } else {
        console.log(`      ⚠️ ${segmentType} segment ${fromId} → ${toId}: ${segmentTest.violations} violations (ALLOWED)`);
      }
    } else {
      console.log(`      ✅ ${segmentType} segment ${fromId} → ${toId}: Clean`);
    }
  }
  
  console.log(`✅ Path verification complete: PASSED`);
  return true;
}


async findNearbyPrecomputedNodes(point, maxConnections = 5, allowViolations = false) {
  console.log(`\n🔎 Finding nearby nodes (allowViolations: ${allowViolations})...`);
  
  const VIOLATION_PENALTY = 5000; // Must match buildAdjacencyList
  
  const nodesWithDistances = this.precomputedGraph.nodes.map(node => ({
    ...node,
    straightDistance: this.calculateDistance(point, [node.lat, node.lng])
  })).sort((a, b) => a.straightDistance - b.straightDistance);
  
  const connections = [];
  const maxAttempts = maxConnections * 3;
  
  for (let i = 0; i < Math.min(maxAttempts, nodesWithDistances.length); i++) {
    const node = nodesWithDistances[i];
    
    try {
      const test = await this.testPathWithOSRM([point, [node.lat, node.lng]]);
      
      let isAcceptable = false;
      
      if (allowViolations) {
        isAcceptable = test.valid && !test.error;
      } else {
        isAcceptable = test.valid && !test.error && test.violations === 0;
      }
      
      if (isAcceptable) {
        connections.push({
          node: node.id,
          cost: test.distance + (test.violations * VIOLATION_PENALTY), // ✅ ADD PENALTY
          distance: test.distance,
          violations: test.violations
        });
        
        const distanceKm = (test.distance / 1000).toFixed(2);
        const effectiveCostKm = ((test.distance + (test.violations * VIOLATION_PENALTY)) / 1000).toFixed(2);
        
        if (test.violations > 0) {
          console.log(`      ⚠️ ${node.id}: ${distanceKm}km, ${test.violations} violations, effective cost: ${effectiveCostKm}km (${allowViolations ? 'ACCEPTED' : 'REJECTED'})`);
        } else {
          console.log(`      ✅ ${node.id}: ${distanceKm}km, clean route`);
        }
        
        if (connections.length >= maxConnections) {
          console.log(`   ✅ Found ${connections.length} connections`);
          break;
        }
      } else {
        if (test.error) {
          console.log(`      ❌ ${node.id}: ERROR - ${test.error}`);
        } else if (!allowViolations && test.violations > 0) {
          console.log(`      ❌ ${node.id}: ${test.violations} violations (strict mode)`);
        }
      }
    } catch (error) {
      console.warn(`      ⚠️ ${node.id}: Failed - ${error.message}`);
    }
  }
  
  if (connections.length === 0) {
    console.warn(`   ⚠️ No connections found! (tried ${maxAttempts} nodes)`);
  }
  
  return connections;
}


async testPathWithOSRM(waypoints) {
 
  const cacheKey = waypoints.map(p => `${p[0].toFixed(6)},${p[1].toFixed(6)}`).join('|');
  

  if (this.osrmCache.has(cacheKey)) {
    this.cacheHits++;
    return this.osrmCache.get(cacheKey);
  }
  
  this.cacheMisses++;
  
  try {
    const waypointString = waypoints.map(p => `${p[1]},${p[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${waypointString}?geometries=geojson&overview=full`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const result = { valid: false, error: `HTTP ${response.status}` };
      this.osrmCache.set(cacheKey, result);
      return result;
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0 || data.code !== 'Ok') {
      const result = { valid: false, error: data.code || 'No route found' };
      this.osrmCache.set(cacheKey, result);
      return result;
    }
    
    const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    const check = this.checkRouteIntersection(routeCoords);
    
    const result = { 
      valid: true,
      violations: check.violations.length,
      routeCoords,
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
      error: null
    };
    
    // Cache the result
    this.osrmCache.set(cacheKey, result);
    return result;
    
  } catch (error) {
    const result = { valid: false, error: error.message || 'Unknown error', violations: 0 };
    this.osrmCache.set(cacheKey, result);
    return result;
  }
}

  checkRouteIntersection(routeCoordinates) {
    const violations = [];
    
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const point1 = routeCoordinates[i];
      const point2 = routeCoordinates[i + 1];
      
      for (const polygon of this.restrictedPolygons) {
        if (this.lineIntersectsPolygon(point1, point2, polygon)) {
          violations.push({
            segmentStart: point1,
            segmentEnd: point2,
            polygonId: polygon.id,
            segmentIndex: i
          });
          break; // One violation per segment is enough
        }
      }
    }
    
    return {
      hasViolation: violations.length > 0,
      violations
    };
  }

  calculateDistance(point1, point2) {
    const [lat1, lng1] = point1;
    const [lat2, lng2] = point2;
    const R = 6371000; // meters

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) * 
              Math.cos((lat2 * Math.PI) / 180) * 
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  lineIntersectsPolygon(point1, point2, polygon) {
    const coords = polygon.coordinates;
    
    if (this.isPointInPolygon(point1, polygon) || 
        this.isPointInPolygon(point2, polygon)) {
      return true;
    }
    
    for (let i = 0; i < coords.length - 1; i++) {
      if (this.segmentsIntersect(point1, point2, coords[i], coords[i + 1])) {
        return true;
      }
    }
    
    return false;
  }

  isPointInPolygon(point, polygon) {
    const [lat, lng] = point;
    const coords = polygon.coordinates;
    let inside = false;
    
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const [lat1, lng1] = coords[i];
      const [lat2, lng2] = coords[j];
      
      const intersect = ((lng1 > lng) !== (lng2 > lng)) &&
        (lat < (lat2 - lat1) * (lng - lng1) / (lng2 - lng1) + lat1);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  segmentsIntersect(p1, p2, p3, p4) {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;
    const [x4, y4] = p4;
    
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;
    
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  adjustRouteEndpoints(startPoint, endPoint) {
    console.log('\n=== CHECKING ROUTE ENDPOINTS ===');
    
    const startResult = this.findNearestSafePoint(startPoint);
    const endResult = this.findNearestSafePoint(endPoint);
    
    const adjusted = startResult.adjusted || endResult.adjusted;
    
    if (adjusted) {
      console.log('📍 Endpoint adjustments made');
      if (startResult.adjusted) {
        console.log(`   🟢 Start moved ${(this.calculateDistance(startPoint, startResult.point)).toFixed(0)}m to safe point`);
      }
      if (endResult.adjusted) {
        console.log(`   🔴 End moved ${(this.calculateDistance(endPoint, endResult.point)).toFixed(0)}m to safe point`);
      }
    } else {
      console.log('✅ Both endpoints are safe');
    }
    
    console.log('================================\n');
    
    return {
      start: startResult.point,
      end: endResult.point,
      adjusted,
      startAdjusted: startResult.adjusted,
      endAdjusted: endResult.adjusted,
      startOriginal: startPoint,
      endOriginal: endPoint
    };
  }

  findNearestSafePoint(point, maxSearchRadius = 0.01) {
    const check = this.isPointInsideRestriction(point);
    if (!check.inside) {
      return { point, adjusted: false };
    }

    console.log(`   ⚠️ Point ${point} is inside restriction, searching for safe point...`);

    // Radial search with 8 directions
    const [lat, lng] = point;
    for (let r = 1; r <= 10; r++) {
      const radius = (maxSearchRadius / 10) * r;
      for (let i = 0; i < 8; i++) {
        const angle = (2 * Math.PI * i) / 8;
        const testLat = lat + (radius * Math.cos(angle));
        const testLng = lng + (radius * Math.sin(angle));
        const testPoint = [testLat, testLng];

        const testCheck = this.isPointInsideRestriction(testPoint);
        if (!testCheck.inside) {
          console.log(`   ✅ Found safe point at ${(this.calculateDistance(point, testPoint)).toFixed(0)}m away`);
          return { 
            point: testPoint, 
            adjusted: true,
            originalPoint: point
          };
        }
      }
    }

    console.warn(`   ⚠️ Could not find safe point within ${maxSearchRadius * 111000}m`);
    return { point, adjusted: false };
  }

  isPointInsideRestriction(point) {
    for (const polygon of this.restrictedPolygons) {
      if (this.isPointInPolygon(point, polygon)) {
        return {
          inside: true,
          polygonId: polygon.id,
          polygon: polygon
        };
      }
    }
    return { inside: false };
  }

  getAllWaypointMarkers() {
    return this.precomputedGraph.nodes.map(node => ({
      lat: node.lat,
      lng: node.lng,
      name: node.name,
      id: node.id,
      side: node.side,
      isSafe: true
    }));
  }

  getGraphStats() {
    const safeEdges = this.precomputedGraph.edges.filter(e => e.violations === 0).length;
    return {
      nodes: this.precomputedGraph.nodes.length,    
      edges: this.precomputedGraph.edges.length,
      safeEdges: safeEdges,
      builtAt: this.precomputedGraph.metadata.builtAt,
      version: this.precomputedGraph.metadata.version
    };
  }
}
  
export default FastRouteRestrictionChecker;