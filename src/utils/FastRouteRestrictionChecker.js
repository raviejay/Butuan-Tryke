import precomputedGraph from './precomputed-graph.json' assert { type: 'json' };

// Simple priority queue implementation
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
    
    // CRITICAL: Filter out edges with violations during initialization
    this.precomputedGraph.edges = this.precomputedGraph.edges.filter(edge => edge.violations === 0);
    
    this.adjacencyList = this.buildAdjacencyList();
    
    // Store waypoint information for reference
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
      { id: 'N6', lat: 8.949574, lng: 125.543668, name: 'North Gap mid 2 (mid)' },
      { id: 'N7', lat: 8.951750, lng: 125.537656, name: 'North Gap mid 3 (mid)' },
      { id: 'N10', lat: 8.948201, lng: 125.542222, name: 'North Gap sub 6 (west)' },
      
      { id: 'N8', lat: 8.956175, lng: 125.504998, name: 'North Gap mid 4 (mid)' },
      { id: 'N9', lat: 8.960337, lng: 125.515402, name: 'North Gap sub 5 (west)' },
      { id: 'N11', lat: 8.948680, lng: 125.502426, name: 'North Gap mid 11 (mid)' },
      { id: 'N12', lat: 8.947477, lng:  125.543557, name: 'North Gap mid 12 (mid)' },
      { id: 'N13', lat: 8.945715, lng:  125.500617, name: 'North Gap mid 13 (mid)' },
      { id: 'N14', lat: 8.950832, lng:  125.542432, name: 'North Gap mid 14 (mid)' },
      { id: 'N15', lat: 8.950910, lng:  125.501874, name: 'North Gap mid 15 (mid)' }
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
    
    // Initialize all nodes
    this.precomputedGraph.nodes.forEach(node => {
      list.set(node.id, []);
    });
    
    // Add ONLY safe edges (violations === 0)
    this.precomputedGraph.edges.forEach(edge => {
      if (edge.violations === 0) {
        list.get(edge.from).push({
          node: edge.to,
          cost: edge.distance, // Use pure distance as cost
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
  console.log('🚀 Using precomputed graph with ZERO-VIOLATION requirement...');

  // Find connections
  const startConnections = await this.findNearbyPrecomputedNodes(startPoint, 5);
  const endConnections = await this.findNearbyPrecomputedNodes(endPoint, 5);
  
  if (startConnections.length === 0 || endConnections.length === 0) {
    console.warn('⚠️ Could not find safe connections from start/end points');
    return [];
  }

  console.log(`   ✅ Start has ${startConnections.length} safe connections`);
  console.log(`   ✅ End has ${endConnections.length} safe connections`);

  // Try multiple start-end combinations
  let bestResult = { path: [], totalCost: Infinity, hopCount: Infinity };
  
  for (const startConn of startConnections.slice(0, 3)) {
    for (const endConn of endConnections.slice(0, 3)) {
      const enhancedList = this.buildEnhancedGraph(startPoint, endPoint, [startConn], [endConn]);
      const result = this.runDijkstra(enhancedList, 'start', 'end');
      
      // ⚠️ CRITICAL: Verify the complete path before accepting it
      if (result.path.length > 0) {
        const isPathSafe = await this.verifyCompletePath(startPoint, result.path, endPoint);
        
        if (isPathSafe) {
          const costDiff = (result.totalCost - bestResult.totalCost) / bestResult.totalCost;
          if (result.totalCost < bestResult.totalCost || 
              (Math.abs(costDiff) < 0.2 && result.hopCount < bestResult.hopCount)) {
            bestResult = result;
          }
        } else {
          console.log(`      ❌ Path through ${result.path.map(p => this.findWaypointId(p)).join(' → ')} has violations in final segments`);
        }
      }
    }
  }
  
  if (bestResult.path.length > 0) {
    console.log(`🏆 Optimal violation-free path found!`);
    console.log(`   📍 Waypoints: ${bestResult.path.length}`);
    console.log(`   🔢 Hops: ${bestResult.hopCount}`);
    console.log(`   📏 Total distance: ${(bestResult.totalCost / 1000).toFixed(2)}km`);
  } else {
    console.log('❌ No violation-free path found');
  }
  
  return bestResult.path;
}

// NEW METHOD: Verify the complete path including all segments
async verifyCompletePath(startPoint, waypoints, endPoint) {
  const fullPath = [startPoint, ...waypoints, endPoint];
  
  // Test each consecutive segment
  for (let i = 0; i < fullPath.length - 1; i++) {
    const segmentTest = await this.testPathWithOSRM([fullPath[i], fullPath[i + 1]]);
    
    if (segmentTest.violations > 0) {
      const fromId = i === 0 ? 'START' : this.findWaypointId(fullPath[i]);
      const toId = i === fullPath.length - 2 ? 'END' : this.findWaypointId(fullPath[i + 1]);
      console.log(`      ❌ Segment ${fromId} → ${toId}: ${segmentTest.violations} violations`);
      return false;
    }
  }
  
  return true;
}

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
          cost: conn.cost,
          distance: conn.distance 
        });
      }
    });
    
    // Add connections from precomputed nodes to end
    endConnections.forEach(conn => {
      if (enhancedList.has(conn.node)) {
        enhancedList.get(conn.node).push({ 
          node: 'end', 
          cost: conn.cost,
          distance: conn.distance 
        });
      }
    });
    
    return enhancedList;
  }

  async findNearbyPrecomputedNodes(point, maxConnections = 5) {
    // Calculate straight-line distances to all precomputed nodes
    const nodesWithDistances = this.precomputedGraph.nodes.map(node => ({
      ...node,
      straightDistance: this.calculateDistance(point, [node.lat, node.lng])
    })).sort((a, b) => a.straightDistance - b.straightDistance);
    
    const connections = [];
    
    // Test routes to nearest nodes - ONLY accept zero-violation paths
    for (const node of nodesWithDistances.slice(0, maxConnections * 3)) {
      try {
        const test = await this.testPathWithOSRM([point, [node.lat, node.lng]]);
        
        // CRITICAL: Only accept paths with ZERO violations
        if (test.valid && !test.error && test.violations === 0) {
          connections.push({
            node: node.id,
            cost: test.distance,
            distance: test.distance,
            violations: 0
          });
          
          console.log(`      ✅ Safe connection to ${node.id}: ${(test.distance/1000).toFixed(2)}km`);
          
          if (connections.length >= maxConnections) break;
        } else if (test.violations > 0) {
          console.log(`      ❌ ${node.id} has ${test.violations} violations - rejected`);
        }
      } catch (error) {
        console.warn(`      ⚠️ Failed to test connection to ${node.id}:`, error.message);
      }
    }
    
    return connections;
  }

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

  async testPathWithOSRM(waypoints) {
    try {
      const waypointString = waypoints.map(p => `${p[1]},${p[0]}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${waypointString}?geometries=geojson&overview=full`;
      
      const response = await fetch(url);
      if (!response.ok) return { valid: false, error: 'OSRM failed' };
      
      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
        return { valid: false, error: 'No route found' };
      }
      
      const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      const check = this.checkRouteIntersection(routeCoords);
      
      return { 
        valid: check.violations.length === 0, // Only valid if ZERO violations
        violations: check.violations.length,
        routeCoords,
        distance: data.routes[0].distance,
        duration: data.routes[0].duration
      };
    } catch (error) {
      console.error('OSRM test error:', error);
      return { valid: false, error: error.message };
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