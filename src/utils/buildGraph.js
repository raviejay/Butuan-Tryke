// buildGraph.js - Complete graph with all connections
import RouteRestrictionChecker from './RouteRestrictionChecker.js';
import { restrictedPolyGeoJSON } from './restrictedPolyData.js';

async function buildAndExportGraph() {
  console.log('🔄 Building complete precomputed route graph...');
  
  try {
    const checker = new RouteRestrictionChecker(restrictedPolyGeoJSON);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ RouteRestrictionChecker initialized');

    const graph = {
      metadata: {
        builtAt: new Date().toISOString(),
        version: "2.0",
        description: "Complete precomputed route graph with all waypoint connections"
      },
      nodes: [],
      edges: []
    };

    // Add all safe waypoints as nodes
    const safeWaypoints = [
      ...checker.northWaypoints,
      ...checker.southWaypoints
    ].filter(wp => wp.isSafe);

    console.log(`📍 Found ${safeWaypoints.length} safe waypoints`);

    safeWaypoints.forEach(wp => {
      graph.nodes.push({
        id: wp.id,
        lat: wp.lat,
        lng: wp.lng,
        name: wp.name,
        side: wp.id.startsWith('N') ? 'north' : 'south'
      });
    });

    // **KEY FIX**: Test ALL pairs (not just i < j)
    const totalConnections = safeWaypoints.length * safeWaypoints.length;
    console.log(`🔗 Testing ${totalConnections} directed connections...`);
    
    let computedCount = 0;
    let validCount = 0;
    const VIOLATION_PENALTY = 1000000;
    const MAX_VIOLATIONS_THRESHOLD = 100; // Skip paths with too many violations

    for (let i = 0; i < safeWaypoints.length; i++) {
      const wpA = safeWaypoints[i];
      
      console.log(`\n--- Processing ${wpA.id} ---`);
      
      for (let j = 0; j < safeWaypoints.length; j++) {
        if (i === j) continue; // Skip self-loops
        
        const wpB = safeWaypoints[j];
        
        try {
          const test = await checker.testPathWithOSRM([
            [wpA.lat, wpA.lng], 
            [wpB.lat, wpB.lng]
          ]);
          
          if (!test.error && test.distance && test.valid !== false) {
            // **IMPORTANT**: Include routes even with violations
            // The Dijkstra algorithm will choose the best combination
            if (test.violations < MAX_VIOLATIONS_THRESHOLD) {
              const cost = test.distance + (test.violations * VIOLATION_PENALTY);
              
              graph.edges.push({
                from: wpA.id,
                to: wpB.id,
                distance: test.distance,
                duration: test.duration,
                violations: test.violations,
                cost: cost
              });
              
              validCount++;
              console.log(`  ✅ ${wpA.id} → ${wpB.id}: ${(test.distance/1000).toFixed(1)}km, ${test.violations} violations`);
            } else {
              console.log(`  ⚠️ ${wpA.id} → ${wpB.id}: Too many violations (${test.violations})`);
            }
          } else {
            console.log(`  ❌ ${wpA.id} → ${wpB.id}: Invalid route`);
          }
        } catch (error) {
          console.warn(`  ⚠️ ${wpA.id} → ${wpB.id}: ${error.message}`);
        }
        
        computedCount++;
        
        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`📊 Progress: ${computedCount}/${totalConnections} (${Math.round(computedCount/totalConnections*100)}%), Valid: ${validCount}`);
    }

    // **NEW**: Analyze graph connectivity
    console.log('\n=== GRAPH ANALYSIS ===');
    const nodeConnections = new Map();
    safeWaypoints.forEach(wp => nodeConnections.set(wp.id, 0));
    
    graph.edges.forEach(edge => {
      nodeConnections.set(edge.from, nodeConnections.get(edge.from) + 1);
    });
    
    console.log('Node connectivity:');
    for (const [nodeId, count] of nodeConnections.entries()) {
      console.log(`  ${nodeId}: ${count} outgoing connections`);
    }

    // Save to file
    const fs = await import('fs');
    fs.writeFileSync('./src/utils/precomputed-graph.json', JSON.stringify(graph, null, 2));
    console.log(`\n✅ Graph exported successfully!`);
    console.log(`   📍 Nodes: ${graph.nodes.length}`);
    console.log(`   🔗 Edges: ${graph.edges.length} (${validCount} valid)`);
    console.log(`   📈 Avg connections per node: ${(graph.edges.length / graph.nodes.length).toFixed(1)}`);
    console.log(`   💾 File: src/utils/precomputed-graph.json`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
  }
}

// Run the build
buildAndExportGraph().catch(console.error);