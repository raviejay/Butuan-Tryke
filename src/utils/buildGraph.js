// buildGraph.js - Fixed version
import RouteRestrictionChecker from './RouteRestrictionChecker.js';

import { restrictedPolyGeoJSON } from './restrictedPolyData.js'

async function buildAndExportGraph() {
  console.log('🔄 Building precomputed route graph...');
  
  try {
    const checker = new RouteRestrictionChecker(restrictedPolyGeoJSON);
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ RouteRestrictionChecker initialized');

    const graph = {
      metadata: {
        builtAt: new Date().toISOString(),
        version: "1.0",
        description: "Precomputed route graph for fast path finding"
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

    // Precompute edges between waypoints
    const totalConnections = safeWaypoints.length * (safeWaypoints.length - 1) / 2;
    console.log(`🔗 Precomputing ${totalConnections} connections...`);
    
    let computedCount = 0;
    const VIOLATION_PENALTY = 1000000;

    // Process in smaller batches for reliability
    const batchSize = 2;
    
    for (let i = 0; i < safeWaypoints.length; i++) {
      for (let j = i + 1; j < safeWaypoints.length; j++) {
        const wpA = safeWaypoints[i];
        const wpB = safeWaypoints[j];
        
        try {
          console.log(`Testing connection: ${wpA.id} -> ${wpB.id}`);
          const test = await checker.testPathWithOSRM([[wpA.lat, wpA.lng], [wpB.lat, wpB.lng]]);
          
          if (!test.error && test.distance && test.valid) {
            const cost = test.distance + (test.violations * VIOLATION_PENALTY);
            
            graph.edges.push({
              from: wpA.id,
              to: wpB.id,
              distance: test.distance,
              duration: test.duration,
              violations: test.violations,
              cost: cost
            });
            console.log(`✅ ${wpA.id} -> ${wpB.id}: ${(test.distance/1000).toFixed(1)}km, ${test.violations} violations`);
          } else {
            console.log(`❌ ${wpA.id} -> ${wpB.id}: Invalid route`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed ${wpA.id} -> ${wpB.id}:`, error.message);
        }
        
        computedCount++;
        if (computedCount % 5 === 0) {
          console.log(`📊 Progress: ${computedCount}/${totalConnections} (${Math.round(computedCount/totalConnections*100)}%)`);
        }
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Save to file
    const fs = await import('fs');
    fs.writeFileSync('./src/utils/precomputed-graph.json', JSON.stringify(graph, null, 2));
    console.log(`✅ Graph exported successfully!`);
    console.log(`   📍 Nodes: ${graph.nodes.length}`);
    console.log(`   🔗 Edges: ${graph.edges.length}`);
    console.log(`   💾 File: src/utils/precomputed-graph.json`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
  }
}

// Run the build
buildAndExportGraph().catch(console.error);