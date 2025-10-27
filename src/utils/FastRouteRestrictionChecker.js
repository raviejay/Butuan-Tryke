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
    this.adjacencyList = this.buildAdjacencyList();
    
    // Store waypoint information for reference
    this.waypointMap = new Map();
    precomputedGraph.nodes.forEach(node => {
      this.waypointMap.set(node.id, node);
    });
    
    // Keep your original waypoints for reference
    this.northWaypoints = [];
    this.southWaypoints = [];
    this.highwayCenterLine = [];
    
    console.log(`🚀 FastRouteRestrictionChecker initialized with precomputed graph`);
    console.log(`   📍 ${precomputedGraph.nodes.length} waypoints`);
    console.log(`   🔗 ${precomputedGraph.edges.length} precomputed connections`);
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
    
    // Add all precomputed edges
    this.precomputedGraph.edges.forEach(edge => {
      list.get(edge.from).push({
        node: edge.to,
        cost: edge.cost,
        distance: edge.distance,
        violations: edge.violations
      });
      
      list.get(edge.to).push({
        node: edge.from, 
        cost: edge.cost,
        distance: edge.distance,
        violations: edge.violations
      });
    });
    
    return list;
  }

  async findOptimalWaypoints(startPoint, endPoint, violations = []) {
  console.log('\n=== FINDING MULTIPLE ROUTE OPTIONS ===');
  
  // Find nearby nodes
  const startConnections = await this.findNearbyPrecomputedNodes(startPoint, 3);
  const endConnections = await this.findNearbyPrecomputedNodes(endPoint, 3);
  
  if (startConnections.length === 0 || endConnections.length === 0) {
    console.warn('⚠️ Could not find safe connections');
    return [];
  }

  // Create enhanced graph
  const enhancedList = new Map(this.adjacencyList);
  enhancedList.set('start', startConnections);
  enhancedList.set('end', endConnections);
  
  startConnections.forEach(conn => {
    if (enhancedList.has(conn.node)) {
      enhancedList.get(conn.node).push({ 
        node: 'start', 
        cost: conn.cost,
        distance: conn.distance,
        violations: conn.violations || 0
      });
    }
  });
  
  endConnections.forEach(conn => {
    if (enhancedList.has(conn.node)) {
      enhancedList.get(conn.node).push({ 
        node: 'end', 
        cost: conn.cost,
        distance: conn.distance,
        violations: conn.violations || 0
      });
    }
  });

  // Run improved Dijkstra
  const result = this.runDijkstra(enhancedList, 'start', 'end');
  
  if (result.path.length > 0) {
    console.log(`🏆 Optimal path found!`);
    console.log(`   📍 Waypoints: ${result.path.length}`);
    console.log(`   ⚠️ Total violations: ${result.totalViolations}`);
    console.log(`   📏 Total distance: ${(result.totalCost / 1000).toFixed(1)}km`);
  } else {
    console.log('❌ No safe path found');
  }
  
  console.log('========================================\n');
  return result.path;
}

// Helper: Check if intermediate waypoints would help
async findIntermediateWaypoints(segmentStart, segmentEnd, maxIntermediatePoints = 3) {
  console.log(`🔍 Finding intermediate waypoints between segments...`);
  
  // Get all nodes that are "between" the two points
  const candidates = Array.from(this.waypointMap.values()).filter(node => {
    const nodePoint = [node.lat, node.lng];
    const distToStart = this.calculateDistance(segmentStart, nodePoint);
    const distToEnd = this.calculateDistance(nodePoint, segmentEnd);
    const directDist = this.calculateDistance(segmentStart, segmentEnd);
    
    // Node should be roughly between start and end (not too far off the path)
    const totalDist = distToStart + distToEnd;
    const detourRatio = totalDist / directDist;
    
    return detourRatio < 1.5; // Allow 50% detour
  });
  
  console.log(`   Found ${candidates.length} candidate waypoints`);
  
  // Test each candidate
  const validIntermediates = [];
  for (const candidate of candidates.slice(0, maxIntermediatePoints * 2)) {
    const test = await this.testPathWithOSRM([
      segmentStart,
      [candidate.lat, candidate.lng],
      segmentEnd
    ]);
    
    if (test.valid && test.violations < 10) { // Much better than direct
      validIntermediates.push({
        node: candidate,
        violations: test.violations,
        distance: test.distance
      });
    }
    
    if (validIntermediates.length >= maxIntermediatePoints) break;
  }
  
  // Sort by violations
  validIntermediates.sort((a, b) => a.violations - b.violations);
  
  console.log(`   ✅ Found ${validIntermediates.length} valid intermediate points`);
  
  return validIntermediates.map(v => [v.node.lat, v.node.lng]);
}
  async findNearbyPrecomputedNodes(point, maxConnections = 3) {
    const VIOLATION_PENALTY = 1000000;
    
    // Calculate straight-line distances to all precomputed nodes
    const nodesWithDistances = this.precomputedGraph.nodes.map(node => ({
      ...node,
      straightDistance: this.calculateDistance(point, [node.lat, node.lng])
    })).sort((a, b) => a.straightDistance - b.straightDistance);
    
    const connections = [];
    
    // Test routes to nearest nodes
    for (const node of nodesWithDistances.slice(0, maxConnections * 2)) {
      try {
        const test = await this.testPathWithOSRM([point, [node.lat, node.lng]]);
        
        if (test.valid && !test.error) {
          connections.push({
            node: node.id,
            cost: test.distance + (test.violations * VIOLATION_PENALTY),
            distance: test.distance,
            violations: test.violations
          });
          
          if (connections.length >= maxConnections) break;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to test connection to ${node.id}:`, error.message);
      }
    }
    
    console.log(`   🔌 Connected to ${connections.length} precomputed nodes`);
    return connections;
  }

runDijkstra(adjacencyList, startId, endId) {
  const distances = new Map();
  const previous = new Map();
  const violations = new Map();
  const visited = new Set(); // CRITICAL: Track visited nodes to prevent infinite loops
  const pq = new MinPriorityQueue();
  
  // Initialize
  for (const nodeId of adjacencyList.keys()) {
    distances.set(nodeId, Infinity);
    violations.set(nodeId, Infinity);
  }
  distances.set(startId, 0);
  violations.set(startId, 0);
  pq.enqueue(startId, 0);
  
  console.log(`🎯 Running Dijkstra from ${startId} to ${endId}...`);
  let iterations = 0;
  const MAX_ITERATIONS = 10000; // Safety limit
  
  while (!pq.isEmpty() && iterations < MAX_ITERATIONS) {
    iterations++;
    const { element: currentId } = pq.dequeue();
    
    // Skip if already visited
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    if (currentId === endId) {
      console.log(`✅ Found path in ${iterations} iterations`);
      break;
    }
    
    const neighbors = adjacencyList.get(currentId) || [];
    const currentViolations = violations.get(currentId);
    const currentDist = distances.get(currentId);
    
    for (const neighbor of neighbors) {
      // Skip if already visited
      if (visited.has(neighbor.node)) continue;
      
      const newViolations = currentViolations + (neighbor.violations || 0);
      
      // **FIXED COST CALCULATION**
      // Priority: violations > distance
      const VIOLATION_WEIGHT = 100000000; // 100 million per violation
      const DISTANCE_WEIGHT = 1; // Normal distance cost
      
      const newCost = (newViolations * VIOLATION_WEIGHT) + (neighbor.cost * DISTANCE_WEIGHT);
      const neighborCost = distances.get(neighbor.node);
      
      // **SIMPLE UPDATE RULE**: Only update if new cost is strictly better
      if (newCost < neighborCost) {
        distances.set(neighbor.node, newCost);
        violations.set(neighbor.node, newViolations);
        previous.set(neighbor.node, currentId);
        pq.enqueue(neighbor.node, newCost);
      }
    }
  }
  
  if (iterations >= MAX_ITERATIONS) {
    console.error(`❌ Dijkstra exceeded max iterations (${MAX_ITERATIONS})`);
    return { 
      path: [], 
      totalCost: Infinity, 
      totalViolations: Infinity 
    };
  }
  
  // Reconstruct path
  const pathIds = [];
  let currentId = endId;
  
  while (currentId && currentId !== startId) {
    pathIds.unshift(currentId);
    currentId = previous.get(currentId);
  }
  
  if (currentId !== startId) {
    console.warn('⚠️ Could not reconstruct complete path');
    return { 
      path: [], 
      totalCost: Infinity, 
      totalViolations: Infinity 
    };
  }
  
  // Convert to coordinates
  const waypoints = pathIds
    .filter(id => id !== 'start' && id !== 'end')
    .map(id => {
      const node = this.waypointMap.get(id);
      return node ? [node.lat, node.lng] : null;
    })
    .filter(point => point !== null);
  
  const finalViolations = violations.get(endId);
  console.log(`🎯 Path: ${waypoints.length} waypoints, ${finalViolations} violations, ${iterations} iterations`);
  
  return {
    path: waypoints,
    totalCost: distances.get(endId),
    totalViolations: finalViolations
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
        valid: !check.hasViolation, 
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
    const R = 6371;

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


  buildWaypointString(startPoint, endPoint, waypoints) {
    const allPoints = [startPoint, ...waypoints, endPoint];
    return allPoints.map(p => `${p[1]},${p[0]}`).join(';');
  }


  adjustRouteEndpoints(startPoint, endPoint) {
    console.log('\n=== CHECKING ROUTE ENDPOINTS ===');
    
    // Simple adjustment - in real implementation, use your radial search
    const startResult = this.findNearestSafePoint(startPoint);
    const endResult = this.findNearestSafePoint(endPoint);
    
    const adjusted = startResult.adjusted || endResult.adjusted;
    
    if (adjusted) {
      console.log('📍 Endpoint adjustments made');
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

    // Simple radial search implementation
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
          return { 
            point: testPoint, 
            adjusted: true,
            originalPoint: point
          };
        }
      }
    }

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
      isSafe: true // All nodes in precomputed graph are safe
    }));
  }


  getGraphStats() {
    return {
      nodes: this.precomputedGraph.nodes.length,    
      edges: this.precomputedGraph.edges.length,
      builtAt: this.precomputedGraph.metadata.builtAt,
      version: this.precomputedGraph.metadata.version
    };
  }
}

export default FastRouteRestrictionChecker;