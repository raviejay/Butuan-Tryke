import { supabase } from '@/composables/useSupabase'
import RouteRestrictionChecker from '@/utils/RouteRestrictionChecker'
import { restrictedPolyGeoJSON } from '@/utils/restrictedPolyData.js'


import greenIcon from '@/assets/green_icon.ico'
import redIcon from '@/assets/red_icon.ico'
import whiteIcon from '@/assets/white_icon.ico'
import yellowIcon from '@/assets/yellow_icon.ico'
import orangeIcon from '@/assets/orange_icon.ico'

export class RouteFinder {
  constructor() {
    this.loadedRoutes = []
    this.routeCache = new Map()
    this.cacheTTL = 3600000
    this.maxRetries = 3
    this.retryDelay = 1000
    this.loadedTerminals = []
    this.terminalCache = new Map()
    this.restrictionChecker = new RouteRestrictionChecker(restrictedPolyGeoJSON)
     this.connectivityGraphCache = new Map()
     this.maxPathsToEvaluate = 10 

     const PERFORMANCE_CONFIG = {
      MAX_PATHS_TO_EVALUATE: 10,
      MAX_PATHS_TO_FIND: 15,
      EARLY_STOP_THRESHOLD: 5,
      GRAPH_CACHE_ENABLED: true
    }

    this.zoneConfig = {
        orange: { name: 'Orange Zone Tricycle Route', color: '#ea580c' },
        red: { name: 'Red Zone Tricycle Route', color: '#dc2626' },
        white: { name: 'White Zone Tricycle Route', color: '#000' },
        green: { name: 'Green Zone Tricycle Route', color: '#16a34a' },
        yellow: { name: 'Yellow Zone Tricycle Route', color: '#eab308' },
      }

    this.fareMatrix = [
      { gasMin: 45.0, gasMax: 55.0, regularFare: 8.0, discountedFare: 6.0 },
      { gasMin: 56.0, gasMax: 65.0, regularFare: 9.0, discountedFare: 7.0 },
      { gasMin: 66.0, gasMax: 75.0, regularFare: 10.0, discountedFare: 8.0 },
      { gasMin: 76.0, gasMax: 85.0, regularFare: 11.0, discountedFare: 9.0 },
      { gasMin: 86.0, gasMax: 95.0, regularFare: 12.0, discountedFare: 10.0 },
      { gasMin: 96.0, gasMax: 105.0, regularFare: 13.0, discountedFare: 11.0 },
    ]

    this.currentGasPrice = 56.0
    this.userPreferences = {
      maxWalkDistance: 0.2, // km - maximum walking distance to/from routes
      maxTransferWalk: 0.08, // km - maximum walking distance between transfers
      maxTransfers: 4,
      preferCheapest: true,
      preferFastest: false
    }
    this.connectionThreshold = 0.10 // 150 meters for zone overlap detection
    this.customFareAdjustments = []

      // Terminal icon map - imported assets
    this.terminalIconMap = {
      'green': greenIcon,
      'red': redIcon,
      'white': whiteIcon,
      'yellow': yellowIcon,
      'orange': orangeIcon
    }

    this.butuanPlaces = [
      { name: 'Butuan City Hall', lat: 8.953775339827885, lng: 125.52922189368539 },
      { name: 'Robinsons Place Butuan', lat: 8.943025240692158, lng: 125.52002742041245 },
      { name: 'Gaisano Grand Mall Butuan', lat: 8.945767988899405, lng: 125.5253821714216 },
      { name: 'Butuan Airport', lat: 8.946059262592287, lng: 125.48259422894714 },
      { name: 'Butuan Port', lat: 8.95329704584716, lng: 125.54267120725197 },
      { name: 'Butuan National Museum', lat: 8.953421955407247, lng: 125.52717817838723 },
      { name: 'Guingona Park', lat: 8.947790666935324, lng: 125.5433043032038 },
      { name: 'Butuan Central Elementary School', lat: 8.94628926250755, lng: 125.54296913601452 },
      { name: 'Father Saturnino Urios University', lat: 8.947741228746285, lng: 125.54197135437067 },
      { name: 'Butuan Medical City', lat: 8.962105143955448, lng: 125.58608913601485 },
      { name: 'SM City Butuan', lat: 8.948119865042665, lng: 125.53313827314534 },
      { name: 'Banza Church', lat: 8.972692275958764, lng: 125.53839051705167 },
    ]

    // Zone connectivity matrix with validated transfer points
    this.zoneConnectivity = new Map()
    
    this.loadFareData()
  }

  // Initialize zone connectivity 
  initializeZoneConnectivity() {
    this.zoneConnectivity.clear()
    
    this.loadedRoutes.forEach(route1 => {
      const connections = new Map() // Store zone name -> best transfer points
      
      this.loadedRoutes.forEach(route2 => {
        if (route1.id !== route2.id) {
          const transferPoints = this.findTransferPoints(route1, route2, this.connectionThreshold)
          
          // Only add connection if valid transfer points exist
          if (transferPoints.length > 0) {
            // Filter to only reasonable walking distances
            const validTransfers = transferPoints.filter(tp => 
              tp.distance <= this.userPreferences.maxTransferWalk
            )
            
            if (validTransfers.length > 0) {
              connections.set(route2.zone, validTransfers)
            }
          }
        }
      })
      
      this.zoneConnectivity.set(route1.zone, connections)
    })
    
    console.log('Zone connectivity initialized:')
    this.zoneConnectivity.forEach((connections, zone) => {
      const connectedZones = Array.from(connections.keys())
      console.log(`  ${zone}: ${connectedZones.length > 0 ? connectedZones.join(', ') : 'No connections'}`)
    })
  }

  // Find zone paths with VALIDATION of actual connectivity
  // findZonePaths(startZone, endZone, maxTransfers = 3) {
  //   if (startZone === endZone) return [[startZone]]
    
  //   const paths = []
  //   const queue = [[startZone]]
  //   const visited = new Set()
    
  //   while (queue.length > 0) {
  //     const currentPath = queue.shift()
  //     const currentZone = currentPath[currentPath.length - 1]
      
  //     if (currentPath.length > maxTransfers + 1) continue
      
  //     const stateKey = currentPath.join('-')
  //     if (visited.has(stateKey)) continue
  //     visited.add(stateKey)
      
  //     if (currentZone === endZone) {
  //       paths.push(currentPath)
  //       continue
  //     }
      
  //     // Get VALIDATED connections 
  //     const connections = this.zoneConnectivity.get(currentZone)
  //     if (!connections) continue
      
  //     for (const [nextZone, transferPoints] of connections.entries()) {
  //       // Only proceed if we have valid transfer points
  //       if (transferPoints.length > 0 && !currentPath.includes(nextZone)) {
  //         queue.push([...currentPath, nextZone])
  //       }
  //     }
  //   }
    
  //   return paths
  // }


calculateMultiTransferRoute(startPoint, endPoint, zonePath, isDiscounted = false) {
  if (zonePath.length === 0) return null
  
  const zones = zonePath.map(zoneName => 
    this.loadedRoutes.find(r => r.zone === zoneName)
  ).filter(Boolean)
  
  if (zones.length !== zonePath.length) return null
  
  // Single zone direct route
  if (zones.length === 1) {
    const route = zones[0]
    const startDistance = this.calculateNearestDistance(startPoint, route)
    const endDistance = this.calculateNearestDistance(endPoint, route)
    
    if (startDistance > this.userPreferences.maxWalkDistance || 
        endDistance > this.userPreferences.maxWalkDistance) {
      return null
    }
    
    // CRITICAL: Verify points are actually connected on the route
    if (!this.arePointsConnected(startPoint, endPoint, route)) {
      return null
    }
    
    const totalDistance = this.calculateDistance(startPoint, endPoint)
    const fare = this.calculateFare(totalDistance, false)
    const discountedFare = this.calculateFare(totalDistance, true)
    
    return {
      type: 'direct',
      route: route.name,
      zone: route.zone,
      color: route.color,
      fare,
      discountedFare,
      totalFare: fare,
      totalDiscountedFare: discountedFare,
      transferCount: 0,
      zonePath: [route.zone],
      description: this.getRouteDescription(startDistance, endDistance),
      startDistance, // in km
      endDistance, // in km
      totalWalkDistance: Math.round((startDistance + endDistance) * 1000), // in meters
      distance: totalDistance, // in km
      routeData: route,
      gasPrice: this.currentGasPrice,
      isDiscounted
    }
  }
  
  // Multi-zone with strict validation
  const legs = []
  const transferPoints = []
  let totalFare = 0
  let totalDiscountedFare = 0
  let totalWalkDistance = 0
  let currentPoint = startPoint
  
  // Validate start point accessibility
  const firstZoneDistance = this.calculateNearestDistance(startPoint, zones[0])
  if (firstZoneDistance > this.userPreferences.maxWalkDistance) {
    console.log(`Start point too far from ${zones[0].zone}: ${(firstZoneDistance * 1000).toFixed(0)}m`)
    return null
  }
  totalWalkDistance += firstZoneDistance * 1000
  
  // Store start/end distances 
  const startDistance = firstZoneDistance
  let endDistance = 0
  
  // Find entry point on first zone
  const entryResult = this.findNearestPointOnRoute(startPoint, zones[0])
  currentPoint = entryResult.point
  
  
  if (zones.length > 1) {
    const nextZone = zones[1]
    const connections = this.zoneConnectivity.get(zones[0].zone)
    const validTransfers = connections?.get(nextZone.zone)
    
    if (!validTransfers || validTransfers.length === 0) {
      console.log(`No valid transfers from ${zones[0].zone} to ${nextZone.zone}`)
      return null
    }
    
    // Check if entry point can reach ANY of the transfer points
    let canReachTransfer = false
    for (const transfer of validTransfers) {
      if (this.arePointsConnected(currentPoint, transfer.route1Point, zones[0])) {
        canReachTransfer = true
        break
      }
    }
    
    if (!canReachTransfer) {
      console.log(`Entry point in ${zones[0].zone} cannot reach any transfer points (disconnected segment)`)
      return null
    }
  }
  
  // Build route through zones with validation
  for (let i = 0; i < zones.length; i++) {
    const currentZone = zones[i]
    const isLastZone = i === zones.length - 1
    
    if (!isLastZone) {
      const nextZone = zones[i + 1]
      
      // Get pre-validated transfer points from connectivity map
      const connections = this.zoneConnectivity.get(currentZone.zone)
      const validTransfers = connections?.get(nextZone.zone)
      
      if (!validTransfers || validTransfers.length === 0) {
        console.log(`No valid transfers between ${currentZone.zone} and ${nextZone.zone}`)
        return null
      }
      
      // Find best transfer point
      let bestTransfer = validTransfers[0]
      let bestScore = Infinity
      
      for (const transfer of validTransfers) {
        const distFromCurrent = this.calculateDistance(currentPoint, transfer.route1Point)
        const distToEnd = this.calculateDistance(transfer.route2Point, endPoint)
        const transferWalkPenalty = transfer.distance * 5
        
        const score = distFromCurrent + distToEnd + transferWalkPenalty
        if (score < bestScore) {
          bestScore = score
          bestTransfer = transfer
        }
      }
      
      // Validate transfer walking distance
      if (bestTransfer.distance > this.userPreferences.maxTransferWalk) {
        console.log(`Transfer walk too far: ${(bestTransfer.distance * 1000).toFixed(0)}m`)
        return null
      }
      
      // CRITICAL: Check if current point and transfer point are connected on the route
      if (!this.arePointsConnected(currentPoint, bestTransfer.route1Point, currentZone)) {
        console.log(`Points not connected within ${currentZone.zone} zone (disconnected segments)`)
        return null
      }
      
      // Calculate leg
      const legDistance = this.calculateDistance(currentPoint, bestTransfer.route1Point)
      const legFare = this.calculateFare(legDistance, false)
      const legDiscountedFare = this.calculateFare(legDistance, true)
      
      legs.push({
        zone: currentZone.zone,
        color: currentZone.color,
        fare: legFare,
        discountedFare: legDiscountedFare,
        description: `${currentZone.zone} Zone - ${legDistance.toFixed(1)}km`,
        startPoint: currentPoint,
        endPoint: bestTransfer.route1Point
      })
      
      totalFare += legFare
      totalDiscountedFare += legDiscountedFare
      totalWalkDistance += bestTransfer.distance * 1000
      
      // Format transfer point for UI (as string coordinate)
      transferPoints.push(`${bestTransfer.point[0].toFixed(4)}, ${bestTransfer.point[1].toFixed(4)}`)
      
      currentPoint = bestTransfer.route2Point
      
    } else {
      // Last zone - validate end point
      const exitDistance = this.calculateNearestDistance(endPoint, currentZone)
      if (exitDistance > this.userPreferences.maxWalkDistance) {
        console.log(`End point too far from ${currentZone.zone}: ${(exitDistance * 1000).toFixed(0)}m`)
        return null
      }
      
      endDistance = exitDistance // Store for UI
      
      // CRITICAL: Check if current point and end point are connected on the route
      if (!this.arePointsConnected(currentPoint, endPoint, currentZone)) {
        console.log(`Points not connected within ${currentZone.zone} zone (disconnected segments)`)
        return null
      }
      
      const legDistance = this.calculateDistance(currentPoint, endPoint)
      const legFare = this.calculateFare(legDistance, false)
      const legDiscountedFare = this.calculateFare(legDistance, true)
      
      legs.push({
        zone: currentZone.zone,
        color: currentZone.color,
        fare: legFare,
        discountedFare: legDiscountedFare,
        description: `${currentZone.zone} Zone - ${legDistance.toFixed(1)}km`,
        startPoint: currentPoint,
        endPoint: endPoint
      })
      
      totalFare += legFare
      totalDiscountedFare += legDiscountedFare
      totalWalkDistance += exitDistance * 1000
    }
  }
  
  // Final sanity check on total walking
  const maxTotalWalk = (this.userPreferences.maxWalkDistance * 1000 * 2) + 
                       (this.userPreferences.maxTransferWalk * 1000 * (zones.length - 1))
  if (totalWalkDistance > maxTotalWalk) {
    console.log(`Total walking excessive: ${totalWalkDistance.toFixed(0)}m`)
    return null
  }
  
  return {
    type: 'transfer', // CHANGED from 'multi-transfer' to match old code
    totalFare,
    totalDiscountedFare,
    totalWalkDistance: Math.round(totalWalkDistance),
    transferCount: zones.length - 1,
    zonePath: zonePath,
    legs,
    transferPoints, // Array of coordinate strings
    routeData: zones,
    // ADD THESE for UI compatibility:
    startDistance, // in km
    endDistance, // in km
    gasPrice: this.currentGasPrice,
    isDiscounted,
    description: `Route through ${zonePath.join(' → ')}`
  }
}

  // Main routing function
  // suggestTricycleRouteWithTransfers(startPoint, endPoint, isDiscounted = false) {
  //   console.log('\n========== ROUTE FINDING START ==========')
  //   console.log('Start Point:', startPoint)
  //   console.log('End Point:', endPoint)
  //   console.log('Discounted:', isDiscounted)
    
  //   if (this.loadedRoutes.length === 0) {
  //     console.log('❌ No routes loaded')
  //     return []
  //   }

  //   // Initialize connectivity if needed
  //   if (this.zoneConnectivity.size === 0) {
  //     console.log('Initializing zone connectivity...')
  //     this.initializeZoneConnectivity()
  //   }

  //   const cachedRoute = this.getCachedRoute(startPoint, endPoint, isDiscounted)
  //   if (cachedRoute) {
  //     console.log('✅ Returning cached route')
  //     return cachedRoute
  //   }

  //   const suggestions = []
    
  //   // Find accessible zones
  //   console.log('\n--- Finding Accessible Zones ---')
  //   const startZones = new Set()
  //   const endZones = new Set()
    
  //   this.loadedRoutes.forEach(route => {
  //     const startDistance = this.calculateNearestDistance(startPoint, route)
  //     const endDistance = this.calculateNearestDistance(endPoint, route)
      
  //     console.log(`${route.zone} Zone:`)
  //     console.log(`  Start distance: ${(startDistance * 1000).toFixed(0)}m`)
  //     console.log(`  End distance: ${(endDistance * 1000).toFixed(0)}m`)
      
  //     if (startDistance <= this.userPreferences.maxWalkDistance) {
  //       startZones.add(route.zone)
  //       console.log(`  ✅ Accessible from start`)
  //     }
  //     if (endDistance <= this.userPreferences.maxWalkDistance) {
  //       endZones.add(route.zone)
  //       console.log(`  ✅ Accessible to end`)
  //     }
  //   })
    
  //   console.log('\nStart-accessible zones:', Array.from(startZones))
  //   console.log('End-accessible zones:', Array.from(endZones))
    
  //   // Find all valid zone paths
  //   console.log('\n--- Finding Zone Paths ---')
  //   const allPaths = []
  //   for (const startZone of startZones) {
  //     for (const endZone of endZones) {
  //       const paths = this.findZonePaths(startZone, endZone, this.userPreferences.maxTransfers)
  //       console.log(`Paths from ${startZone} to ${endZone}:`, paths)
  //       allPaths.push(...paths)
  //     }
  //   }
    
  //   console.log('\nTotal paths found:', allPaths.length)
  //   allPaths.forEach((path, idx) => {
  //     console.log(`  Path ${idx + 1}: ${path.join(' → ')}`)
  //   })
    
  //   // Calculate routes for each path with validation
  //   console.log('\n--- Calculating Routes ---')
  //   for (const zonePath of allPaths) {
  //     console.log(`\nEvaluating path: ${zonePath.join(' → ')}`)
  //     const route = this.calculateMultiTransferRoute(startPoint, endPoint, zonePath, isDiscounted)
  //     if (route) {
  //       route.score = this.calculateRouteScore(route)
  //       suggestions.push(route)
  //       console.log(`✅ Valid route found:`)
  //       console.log(`   Type: ${route.type}`)
  //       console.log(`   Transfers: ${route.transferCount}`)
  //       console.log(`   Fare: ₱${route.totalFare.toFixed(2)} (₱${route.totalDiscountedFare.toFixed(2)} disc)`)
  //       console.log(`   Walk distance: ${route.totalWalkDistance}m`)
  //       console.log(`   Score: ${route.score.toFixed(2)}`)
  //     } else {
  //       console.log(`❌ Route rejected (see validation logs above)`)
  //     }
  //   }
    
  //   // Sort and return top suggestions
  //   console.log('\n--- Final Results ---')
  //   const sortedSuggestions = suggestions
  //     .sort((a, b) => {
  //       if (Math.abs(a.score - b.score) < 5) {
  //         return a.transferCount - b.transferCount
  //       }
  //       return b.score - a.score
  //     })
  //     .slice(0, 5)

  //   console.log(`Found ${sortedSuggestions.length} valid route(s)`)
  //   sortedSuggestions.forEach((route, idx) => {
  //     console.log(`\n${idx + 1}. ${route.type === 'direct' ? 'Direct' : 'Multi-transfer'} Route`)
  //     console.log(`   Path: ${route.zonePath?.join(' → ') || route.zone}`)
  //     console.log(`   Fare: ₱${route.totalFare.toFixed(2)}`)
  //     console.log(`   Transfers: ${route.transferCount}`)
  //     console.log(`   Score: ${route.score.toFixed(2)}`)
  //   })

  //   this.cacheRoute(startPoint, endPoint, isDiscounted, sortedSuggestions)
  //   console.log('\n========== ROUTE FINDING END ==========\n')
  //   return sortedSuggestions
  // }

  calculateRouteScore(route) {
    const { preferCheapest, preferFastest } = this.userPreferences
    let score = 100
    
    if (preferCheapest) {
      const fareScore = Math.max(0, 40 - route.totalFare * 2)
      score = score * 0.6 + fareScore
    }
    
    const transferPenalty = route.transferCount * 10
    score -= transferPenalty
    
    const walkPenalty = Math.min(30, route.totalWalkDistance / 100)
    score -= walkPenalty
    
    if (route.transferCount === 0) {
      score += 20
    }
    
    return Math.max(0, score)
  }

  // Keep all other methods from your old code unchanged
  setUserPreferences(preferences) {
    this.userPreferences = { ...this.userPreferences, ...preferences }
  }

  addCustomFareAdjustment(adjustment) {
    this.customFareAdjustments.push({
      ...adjustment,
      expiry: adjustment.expiry || Date.now() + 24 * 60 * 60 * 1000
    })
    this.customFareAdjustments = this.customFareAdjustments.filter(
      adj => adj.expiry > Date.now()
    )
  }

  async loadFareData() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { data: matrixData, error: matrixError } = await supabase
          .from('fare_matrix')
          .select('*')
          .eq('is_active', true)
          .order('gas_price_min', { ascending: true })

        if (!matrixError && matrixData && matrixData.length > 0) {
          this.fareMatrix = matrixData.map(item => ({
            gasMin: item.gas_price_min,
            gasMax: item.gas_price_max,
            regularFare: item.regular_fare,
            discountedFare: item.discounted_fare
          }))
        }

        const { data: settingsData, error: settingsError } = await supabase
          .from('fare_settings')
          .select('setting_value')
          .eq('setting_name', 'current_gas_price')
          .single()

        if (!settingsError && settingsData) {
          this.currentGasPrice = parseFloat(settingsData.setting_value)
        }

        console.log('Fare data loaded successfully')
        return
      } catch (error) {
        if (attempt === this.maxRetries) {
          console.warn('Failed to load fare data after retries:', error)
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
  }

  setGasPrice(price) {
    this.currentGasPrice = price
    this.clearCache()
  }

  getGasPrice() {
    return this.currentGasPrice
  }

  calculateFare(distance, isDiscounted = false) {
    let fareData = this.fareMatrix.find(
      bracket => this.currentGasPrice >= bracket.gasMin && this.currentGasPrice <= bracket.gasMax
    ) || (this.currentGasPrice < 45 ? this.fareMatrix[0] : this.fareMatrix[this.fareMatrix.length - 1])

    this.customFareAdjustments.forEach(adj => {
      if (adj.zone && adj.multiplier) {
        fareData = {
          ...fareData,
          regularFare: fareData.regularFare * adj.multiplier,
          discountedFare: fareData.discountedFare * adj.multiplier
        }
      }
    })

    const baseFare = isDiscounted ? fareData.discountedFare : fareData.regularFare
    return distance <= 4 ? baseFare : baseFare + Math.ceil(distance - 4) * (isDiscounted ? 0.8 : 1.0)
  }

//  async loadZoneData() {
//     try {
//         const { data: allZoneData, error } = await supabase.from('route_zones').select('*')
//         if (error) throw error

//         if (!allZoneData || allZoneData.length === 0) {
//           console.warn('No zone data found, using fallback')
//           return this.getFallbackRoutes()
//         }

//         const zoneGroups = allZoneData.reduce((acc, zone) => {
//           acc[zone.zone_type] = acc[zone.zone_type] || []
//           acc[zone.zone_type].push(zone)
//           return acc
//         }, {})

//         const routes = []
//         for (const [zoneType, zoneData] of Object.entries(zoneGroups)) {
//           if (zoneData.length > 0) {
//             const geojsonData = zoneData[0].geojson_data
//             routes.push(this.processGeoJSONRoutes(geojsonData, zoneType))
//           }
//         }

//         this.loadedRoutes = routes.length > 0 ? routes : this.getFallbackRoutes()
//         this.initializeZoneConnectivity()
//         return this.loadedRoutes
//       } catch (error) {
//         console.error('Failed to load zone data:', error)
//         return this.getFallbackRoutes()
//       }
//   }

  getFallbackRoutes() {
    const fallbackData = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { id: 1, color: '#ea580c' },
        geometry: {
          type: 'MultiLineString',
          coordinates: [[
            [125.540130448007886, 8.964374021382271],
            [125.540327462684658, 8.963585962675197],
            [125.531593145347912, 8.958857610432746],
            [125.530214042610524, 8.95806955172567],
            [125.52725882245899, 8.958397909520285],
            [125.528506582078535, 8.954785973779524],
          ]],
        },
      }],
    }
    const routes = [this.processGeoJSONRoutes(fallbackData, 'orange')]
    this.loadedRoutes = routes
    return routes
  }

  clearCache() {
    this.routeCache.clear()
  }

  getCachedRoute(startPoint, endPoint, isDiscounted) {
    const key = `${startPoint.join(',')}|${endPoint.join(',')}|${isDiscounted}`
    const cached = this.routeCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }
    return null
  }

  cacheRoute(startPoint, endPoint, isDiscounted, data) {
    const key = `${startPoint.join(',')}|${endPoint.join(',')}|${isDiscounted}`
    this.routeCache.set(key, { data, timestamp: Date.now() })
  }

  buildConnectivityGraph(routes) {
    const graph = {}
    const segments = []

    routes.forEach((path, pathIndex) => {
      for (let i = 0; i < path.length - 1; i++) {
        const segment = {
          pathIndex,
          segmentIndex: i,
          start: path[i],
          end: path[i + 1],
          id: `${pathIndex}-${i}`,
          length: this.calculateDistance(path[i], path[i + 1])
        }
        segments.push(segment)
        graph[segment.id] = []
      }
    })

    segments.forEach((segment1, i) => {
      segments.forEach((segment2, j) => {
        if (i !== j) {
          const d1 = this.distanceToLineSegment(segment1.start, segment2.start, segment2.end)
          const d2 = this.distanceToLineSegment(segment1.end, segment2.start, segment2.end)
          const d3 = this.distanceToLineSegment(segment2.start, segment1.start, segment1.end)
          const d4 = this.distanceToLineSegment(segment2.end, segment1.start, segment1.end)
          const minDist = Math.min(d1, d2, d3, d4)

          if (minDist <= this.connectionThreshold) {
            graph[segment1.id].push({
              id: segment2.id,
              distance: minDist,
              weight: minDist + segment2.length
            })
          }
        }
      })
    })

    return { graph, segments }
  }

  // arePointsConnected(point1, point2, route) {
  //   const { graph, segments } = this.buildConnectivityGraph(route.routes)
  //   const point1Segments = []
  //   const point2Segments = []

  //   segments.forEach(segment => {
  //     const distToStart1 = this.calculateDistance(point1, segment.start)
  //     const distToEnd1 = this.calculateDistance(point1, segment.end)
  //     const distToSegment1 = this.distanceToLineSegment(point1, segment.start, segment.end)

  //     if (Math.min(distToStart1, distToEnd1, distToSegment1) <= this.userPreferences.maxWalkDistance) {
  //       point1Segments.push(segment.id)
  //     }

  //     const distToStart2 = this.calculateDistance(point2, segment.start)
  //     const distToEnd2 = this.calculateDistance(point2, segment.end)
  //     const distToSegment2 = this.distanceToLineSegment(point2, segment.start, segment.end)

  //     if (Math.min(distToStart2, distToEnd2, distToSegment2) <= this.userPreferences.maxWalkDistance) {
  //       point2Segments.push(segment.id)
  //     }
  //   })

  //   if (point1Segments.length === 0 || point2Segments.length === 0) return false

  //   for (const startSegment of point1Segments) {
  //     if (point2Segments.includes(startSegment)) return true

  //     const visited = new Set()
  //     const queue = [{ id: startSegment, distance: 0 }]
  //     visited.add(startSegment)

  //     while (queue.length > 0) {
  //       const { id: currentSegment, distance } = queue.shift()
  //       if (distance > 10) break

  //       for (const neighbor of graph[currentSegment] || []) {
  //         if (point2Segments.includes(neighbor.id)) return true

  //         if (!visited.has(neighbor.id)) {
  //           visited.add(neighbor.id)
  //           queue.push({
  //             id: neighbor.id,
  //             distance: distance + neighbor.distance
  //           })
  //         }
  //       }
  //     }
  //   }

  //   return false
  // }

  distanceToLineSegment(point, lineStart, lineEnd) {
    const [px, py] = point
    const [x1, y1] = lineStart
    const [x2, y2] = lineEnd

    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const lenSq = C * C + D * D
    if (lenSq === 0) return this.calculateDistance(point, lineStart)

    let param = (A * C + B * D) / lenSq
    param = Math.max(0, Math.min(1, param))

    const xx = x1 + param * C
    const yy = y1 + param * D

    return this.calculateDistance(point, [xx, yy])
  }

  processGeoJSONRoutes(geojsonData, zoneType = 'orange') {
    const routePaths = []
    let minLat = Infinity, maxLat = -Infinity
    let minLng = Infinity, maxLng = -Infinity

    geojsonData.features.forEach(feature => {
      feature.geometry.coordinates.forEach(lineString => {
        const path = lineString.map(coord => [coord[1], coord[0]])
        routePaths.push(path)
        lineString.forEach(([lng, lat]) => {
          minLat = Math.min(minLat, lat)
          maxLat = Math.max(maxLat, lat)
          minLng = Math.min(minLng, lng)
          maxLng = Math.max(maxLng, lng)
        })
      })
    })

    let color = this.isValidColor(zoneType) ? zoneType : '#ea580c'
    if (color.toLowerCase().match(/white|#ffffff|#fff/)) color = '#000000'

    const zoneName = this.getZoneName(zoneType)

    return {
      id: `${zoneType}_zone_route`,
      name: zoneName,
      zone: zoneType.charAt(0).toUpperCase() + zoneType.slice(1),
      color,
      bounds: { north: maxLat, south: minLat, east: maxLng, west: minLng },
      routes: routePaths,
      properties: { combined: true, zoneType }
    }
  }

  isValidColor(color) {
    if (/^#[0-9A-F]{6}$/i.test(color)) return true
    const style = new Option().style
    style.color = color
    return style.color !== ''
  }

  getZoneName(zoneType) {
    return this.zoneConfig[zoneType]?.name || 
      `${zoneType.charAt(0).toUpperCase() + zoneType.slice(1)} Zone Tricycle Route`
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

  calculateNearestDistance(point, route) {
    let minDistance = Infinity
    route.routes.forEach(routePath => {
      routePath.forEach(pathPoint => {
        minDistance = Math.min(minDistance, this.calculateDistance(point, pathPoint))
      })
      for (let i = 0; i < routePath.length - 1; i++) {
        minDistance = Math.min(
          minDistance,
          this.distanceToLineSegment(point, routePath[i], routePath[i + 1])
        )
      }
    })
    return minDistance
  }

  findNearestPointOnRoute(point, route) {
    let minDistance = Infinity
    let nearestPoint = null

    route.routes.forEach(routePath => {
      routePath.forEach(pathPoint => {
        const distance = this.calculateDistance(point, pathPoint)
        if (distance < minDistance) {
          minDistance = distance
          nearestPoint = pathPoint
        }
      })
    })

    return { point: nearestPoint, distance: minDistance }
  }

  getRouteDescription(startDist, endDist) {
    if (startDist < 0.1 && endDist < 0.1) return 'Direct route available'
    const parts = []
    if (startDist > 0.1) parts.push(`${(startDist * 1000).toFixed(0)}m to start`)
    if (endDist > 0.1) parts.push(`${(endDist * 1000).toFixed(0)}m from end`)
    return `Walk ${parts.join(' and ')}`
  }

  findTransferPoints(route1, route2, maxDistance = 0.2) {
    const transferPoints = []
    route1.routes.forEach(path1 => {
      path1.forEach(point1 => {
        route2.routes.forEach(path2 => {
          path2.forEach(point2 => {
            const distance = this.calculateDistance(point1, point2)
            if (distance <= maxDistance) {
              transferPoints.push({
                point: point1,
                route1Point: point1,
                route2Point: point2,
                distance
              })
            }
          })
        })
      })
    })

    const uniqueTransfers = []
    transferPoints.forEach(transfer => {
      if (!uniqueTransfers.some(existing => 
        this.calculateDistance(transfer.point, existing.point) < 0.05
      )) {
        uniqueTransfers.push(transfer)
      }
    })

    return uniqueTransfers.sort((a, b) => a.distance - b.distance).slice(0, 10)
  }

  getFareMatrix() {
    return {
      currentGasPrice: this.currentGasPrice,
      matrix: this.fareMatrix,
      currentBracket: this.fareMatrix.find(
        bracket => this.currentGasPrice >= bracket.gasMin && this.currentGasPrice <= bracket.gasMax
      ) || this.fareMatrix[this.fareMatrix.length - 1],
      adjustments: this.customFareAdjustments
    }
  }

  async searchPlaces(query) {
    if (!query.trim()) return []

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
       const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+Butuan&format=json&limit=10`
      )

        if (!response.ok) throw new Error('Search API failed')
        
        const data = await response.json()
        return data.map(place => ({
          name: place.display_name,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        }))
      } catch (error) {
        if (attempt === this.maxRetries) {
          console.error('Error fetching places after retries:', error)
          return this.butuanPlaces.filter(place => 
            place.name.toLowerCase().includes(query.toLowerCase())
          )
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
  }

  async calculateRoutes(startCoords, destinationCoords) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const startCoord = `${startCoords[1]},${startCoords[0]}`
        const endCoord = `${destinationCoords[1]},${destinationCoords[0]}`
        const url = `https://router.project-osrm.org/route/v1/driving/${startCoord};${endCoord}?geometries=geojson&overview=full`

        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const data = await response.json()
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          return {
            coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
            distance: (route.distance / 1000).toFixed(2),
            duration: Math.round(route.duration / 60),
            success: true
          }
        }
        throw new Error('No route found')
      } catch (error) {
        if (attempt === this.maxRetries) {
          console.error('Error calculating route after retries:', error)
          return {
            coordinates: [startCoords, destinationCoords],
            distance: null,
            duration: null,
            success: false,
            fallback: true
          }
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
  }

  async reverseGeocode(lat, lng) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )

        if (!response.ok) throw new Error('Reverse geocode failed')
        
        const data = await response.json()
        return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      } catch (error) {
        if (attempt === this.maxRetries) {
          console.log('Reverse geocoding failed after retries, using coordinates')
          return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
  }

  // Debugging and visualization helpers
  debugZoneConnections() {
    console.log('=== Zone Connection Debug ===')
    this.loadedRoutes.forEach(route1 => {
      console.log(`\n${route1.zone} Zone:`)
      const connections = this.zoneConnectivity.get(route1.zone)
      if (connections && connections.size > 0) {
        connections.forEach((transfers, zone2) => {
          console.log(`  → ${zone2}: ${transfers.length} transfer points`)
          console.log(`    Best transfer: ${(transfers[0].distance * 1000).toFixed(0)}m`)
        })
      } else {
        console.log('  No connections')
      }
    })
  }

  formatRouteSuggestion(suggestion) {
    if (suggestion.type === 'direct') {
      return {
        title: `Direct Route via ${suggestion.zone} Zone`,
        subtitle: `₱${suggestion.fare.toFixed(2)} (₱${suggestion.discountedFare.toFixed(2)} discounted)`,
        description: suggestion.description,
        color: suggestion.color,
        walkDistance: `${suggestion.totalWalkDistance || 0}m walk total`
      }
    } else {
      const zones = suggestion.zonePath.join(' → ')
      return {
        title: `Multi-zone Route: ${zones}`,
        subtitle: `₱${suggestion.totalFare.toFixed(2)} (₱${suggestion.totalDiscountedFare.toFixed(2)} discounted)`,
        description: `${suggestion.transferCount} transfer${suggestion.transferCount > 1 ? 's' : ''}`,
        legs: suggestion.legs.map(leg => ({
          zone: leg.zone,
          color: leg.color,
          fare: `₱${leg.fare.toFixed(2)}`,
          description: leg.description
        })),
        transfers: suggestion.transferPoints?.map(tp => ({
          from: tp.from,
          to: tp.to,
          walkDistance: `${tp.walkDistance}m walk`
        })),
        walkDistance: `${suggestion.totalWalkDistance}m walk total`
      }
    }
  }

//Terminals
async loadTerminals() {
  try {
    const { data: terminals, error } = await supabase
      .from('terminals')
      .select('*')
      .eq('is_active', true)
      .order('zone_type', { ascending: true })
      .order('terminal_name', { ascending: true })

    if (error) {
      console.error('Error loading terminals:', error)
      return this.getFallbackTerminals()
    }

    if (!terminals || terminals.length === 0) {
      console.warn('No terminals found, using fallback data')
      return this.getFallbackTerminals()
    }

    // Process terminals with zone config
    this.loadedTerminals = terminals.map(terminal => ({
      id: terminal.id,
      zone: terminal.zone_type.charAt(0).toUpperCase() + terminal.zone_type.slice(1),
      zoneType: terminal.zone_type,
      name: terminal.terminal_name,
      coordinates: [terminal.latitude, terminal.longitude],
      description: terminal.description,
      color: this.zoneConfig[terminal.zone_type]?.color || '#ea580c',
      iconPath: this.getTerminalIcon(terminal.zone_type),
      isActive: terminal.is_active,
      createdAt: terminal.created_at,
      updatedAt: terminal.updated_at
    }))

    console.log(`Loaded ${this.loadedTerminals.length} terminals`)
    return this.loadedTerminals

  } catch (error) {
    console.error('Failed to load terminals:', error)
    return this.getFallbackTerminals()
  }
}


//Get fallback data 
getFallbackTerminals() {
  const fallbackData = [
    // Green terminals
    { zone: 'green', name: 'Mahogany Terminal', lat: 8.949618, lng: 125.543832, description: 'Green Zone - Mahogany' },
    { zone: 'green', name: 'Banza/Maug Terminal', lat: 8.950339, lng: 125.543490, description: 'Green Zone - Banza or Maug' },
    
    // Red terminals
    { zone: 'red', name: 'Bading/Pagatpatan Terminal', lat: 8.950792, lng: 125.543234, description: 'Red Zone - Bading, Pagatpatan and Pequeno' },
    { zone: 'red', name: 'Ambago/Doongna Terminal', lat: 8.958014, lng: 125.534602, description: 'Red Zone - Ambago, Doongna, Lumbucan' },
    
    // White terminals
    { zone: 'white', name: 'Libertad Terminal', lat: 8.960796, lng: 125.506823, description: 'White Zone - Libertad' },
    { zone: 'white', name: 'Ambago Terminal', lat: 8.944005, lng: 125.502074, description: 'White Zone - Ambago' },
    
    // Yellow terminals
    { zone: 'yellow', name: 'San Vicente/Villa Kananga Terminal', lat: 8.944604, lng: 125.533383, description: 'Yellow Zone - San Vicente, Villa Kananga' },
    { zone: 'yellow', name: 'San Vicente/Pangabugan Terminal', lat: 8.947136, lng: 125.541428, description: 'Yellow Zone - San Vicente, Pangabugan' },
    { zone: 'yellow', name: 'San Vicente Terminal', lat: 8.945340, lng: 125.540413, description: 'Yellow Zone - San Vicente' }
  ]

  this.loadedTerminals = fallbackData.map((terminal, index) => ({
    id: `fallback_${terminal.zone}_${index}`,
    zone: terminal.zone.charAt(0).toUpperCase() + terminal.zone.slice(1),
    zoneType: terminal.zone,
    name: terminal.name,
    coordinates: [terminal.lat, terminal.lng],
    description: terminal.description,
    color: this.zoneConfig[terminal.zone]?.color || '#ea580c',
    iconPath: this.getTerminalIcon(terminal.zone),
    isActive: true
  }))

  console.log('Using fallback terminal data')
  return this.loadedTerminals
}


getTerminalIcon(zoneType) {
  // Use imported icons instead of file paths
  return this.terminalIconMap[zoneType] || this.terminalIconMap['orange']
}


getTerminalsByZone(zoneType) {
  return this.loadedTerminals.filter(
    terminal => terminal.zoneType === zoneType.toLowerCase()
  )
}


getNearestTerminal(point, zoneType = null) {
  const terminals = zoneType 
    ? this.getTerminalsByZone(zoneType)
    : this.loadedTerminals

  if (terminals.length === 0) return null

  let nearestTerminal = null
  let minDistance = Infinity

  terminals.forEach(terminal => {
    const distance = this.calculateDistance(point, terminal.coordinates)
    if (distance < minDistance) {
      minDistance = distance
      nearestTerminal = { ...terminal, distance }
    }
  })

  return nearestTerminal
}

isNearTerminal(point, threshold = 0.1) {
  const nearest = this.getNearestTerminal(point)
  if (!nearest) return null
  
  return nearest.distance <= threshold ? nearest : null
}


getTerminalsGroupedByZone() {
  const grouped = {}
  
  this.loadedTerminals.forEach(terminal => {
    if (!grouped[terminal.zone]) {
      grouped[terminal.zone] = []
    }
    grouped[terminal.zone].push(terminal)
  })
  
  return grouped
}


async refreshTerminals() {
  this.terminalCache.clear()
  return await this.loadTerminals()
}


async calculateRouteWithWaypoints(waypoints) {
  for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
    try {
      // Convert waypoints to OSRM format: "lng,lat;lng,lat;..."
      const waypointStr = waypoints
        .map(coord => `${coord[1]},${coord[0]}`)
        .join(';')
      
      const url = `https://router.project-osrm.org/route/v1/driving/${waypointStr}?geometries=geojson&overview=full`

      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        return {
          coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
          distance: (route.distance / 1000).toFixed(2),
          duration: Math.round(route.duration / 60),
          success: true
        }
      }
      throw new Error('No route found')
    } catch (error) {
      if (attempt === this.maxRetries) {
        console.error('Error calculating route with waypoints:', error)
        // Fallback to straight lines between waypoints
        return {
          coordinates: waypoints,
          distance: null,
          duration: null,
          success: false,
          fallback: true
        }
      }
      await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
    }
  }
}


//RouteFinder new clas

// Update your calculateRouteAvoidingRestrictions method

async calculateRouteAvoidingRestrictions(startCoords, destinationCoords) {
  const maxAttempts = 2
  
  // Reset best route tracker
  this.bestRouteAttempt = null
  
  // STEP 1: Check and adjust endpoints if inside restricted areas
  let adjustedEndpoints = { start: startCoords, end: destinationCoords, adjusted: false }
  if (this.restrictionChecker) {
    adjustedEndpoints = this.restrictionChecker.adjustRouteEndpoints(
      startCoords, 
      destinationCoords
    )
    
    // If endpoints were adjusted, notify (you can show this in UI)
    if (adjustedEndpoints.adjusted) {
      console.log('🔄 Route endpoints adjusted to avoid restricted areas')
    }
  }
  
  // Use adjusted coordinates for routing
  const routeStart = adjustedEndpoints.start
  const routeEnd = adjustedEndpoints.end
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`\n--- Route Calculation Attempt ${attempt} ---`)
      
      // First try: Direct route
      let routeData
      if (attempt === 1) {
        console.log('Trying direct route...')
        routeData = await this.calculateDirectRoute(routeStart, routeEnd)
      } else {
        // Use waypoints from previous violation detection
        console.log('Trying waypoint-based route...')
        routeData = await this.calculateWaypointRoute(
          routeStart, 
          routeEnd, 
          this.lastViolations
        )
      }
      
      if (!routeData.success) {
        throw new Error('Route calculation failed')
      }
      
      // Check for restricted area violations
      const violationCheck = this.restrictionChecker.checkRouteIntersection(
        routeData.coordinates
      )
      
      console.log(`Violations found: ${violationCheck.violations.length}`)
      
      if (!violationCheck.hasViolation) {
        console.log('✅ Route is clear of restricted areas')
        return {
          ...routeData,
          routeType: attempt === 1 ? 'direct' : 'waypoint',
          waypointsUsed: routeData.waypoints || [],
          // Include adjustment info
          endpointsAdjusted: adjustedEndpoints.adjusted,
          originalStart: adjustedEndpoints.adjusted ? startCoords : null,
          originalEnd: adjustedEndpoints.adjusted ? destinationCoords : null,
          adjustedStart: adjustedEndpoints.startAdjusted ? routeStart : null,
          adjustedEnd: adjustedEndpoints.endAdjusted ? routeEnd : null,
          violationCount: 0
        }
      }
      
      // Store violations for next attempt
      this.lastViolations = violationCheck.violations
      console.log(`⚠️ Route intersects ${violationCheck.violations.length} restricted area(s)`)
      
      // Track best route (least violations)
      if (!this.bestRouteAttempt || violationCheck.violations.length < this.bestRouteAttempt.violationCount) {
        this.bestRouteAttempt = {
          ...routeData,
          violationCount: violationCheck.violations.length,
          violations: violationCheck.violations,
          attempt: attempt
        }
        console.log(`🏆 New best route: ${violationCheck.violations.length} violations (attempt ${attempt})`)
      }
      
      if (attempt === maxAttempts) {
        console.log('❌ Unable to find safe route after all attempts')
        console.log(`📊 Returning best route: ${this.bestRouteAttempt.violationCount} violations`)
        
        // Return the best attempt found
        return {
          ...this.bestRouteAttempt,
          routeType: 'best-effort',
          hasRestrictionViolation: true,
          warning: `Route has ${this.bestRouteAttempt.violationCount} restricted area crossings (best available)`,
          endpointsAdjusted: adjustedEndpoints.adjusted,
          originalStart: adjustedEndpoints.adjusted ? startCoords : null,
          originalEnd: adjustedEndpoints.adjusted ? destinationCoords : null
        }
      }
      
    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error)
      if (attempt === maxAttempts) {
        return {
          coordinates: [routeStart, routeEnd],
          distance: null,
          duration: null,
          success: false,
          fallback: true,
          error: error.message,
          endpointsAdjusted: adjustedEndpoints.adjusted
        }
      }
      await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
    }
  }
}



// Route with waypoints to avoid restrictions
async calculateWaypointRoute(startCoords, destinationCoords, violations) {
  console.log('Finding optimal waypoints...')
  
  // Get optimal waypoints
  const waypoints = await this.restrictionChecker.findOptimalWaypoints(
    startCoords, 
    destinationCoords,
    violations
  )
  
  console.log(`Using ${waypoints.length} waypoint(s):`, waypoints)
  
  // Build waypoint string for OSRM
  const waypointString = this.restrictionChecker.buildWaypointString(
    startCoords,
    destinationCoords,
    waypoints
  )
  
  const url = `https://router.project-osrm.org/route/v1/driving/${waypointString}?geometries=geojson&overview=full`
  
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

  const data = await response.json()
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0]
    return {
      coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
      distance: (route.distance / 1000).toFixed(2),
      duration: Math.round(route.duration / 60),
      success: true,
      waypoints: waypoints.map((wp, idx) => ({
        lat: wp[0],
        lng: wp[1],
        index: idx + 1
      }))
    }
  }
  throw new Error('No waypoint route found')
}

// Keep your original calculateRoute as fallback
async calculateRoute(startCoords, destinationCoords) {
  // Use the new method if restriction checker is available
  if (this.restrictionChecker) {
    return this.calculateRouteAvoidingRestrictions(startCoords, destinationCoords)
  }
  
  // Fallback to original direct route
  return this.calculateDirectRoute(startCoords, destinationCoords)
}


  async calculateDirectRoute(startCoords, destinationCoords) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const startCoord = `${startCoords[1]},${startCoords[0]}`
        const endCoord = `${destinationCoords[1]},${destinationCoords[0]}`
        const url = `https://router.project-osrm.org/route/v1/driving/${startCoord};${endCoord}?geometries=geojson&overview=full`

        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const data = await response.json()
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          return {
            coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]),
            distance: (route.distance / 1000).toFixed(2),
            duration: Math.round(route.duration / 60),
            success: true
          }
        }
        throw new Error('No route found')
      } catch (error) {
        if (attempt === this.maxRetries) {
          console.error('Error calculating route after retries:', error)
          return {
            coordinates: [startCoords, destinationCoords],
            distance: null,
            duration: null,
            success: false,
            fallback: true
          }
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
  }


  // new 

  getOrBuildConnectivityGraph(route) {
    const cacheKey = route.id
    
    if (this.connectivityGraphCache.has(cacheKey)) {
      return this.connectivityGraphCache.get(cacheKey)
    }
    
    console.log(`Building connectivity graph for ${route.zone}`)
    const graphData = this.buildConnectivityGraph(route.routes)
    this.connectivityGraphCache.set(cacheKey, graphData)
    
    return graphData
  }

  arePointsConnected(point1, point2, route) {
    // Use cached graph instead of rebuilding
    const { graph, segments } = this.getOrBuildConnectivityGraph(route)
    
    const point1Segments = []
    const point2Segments = []

    segments.forEach(segment => {
      const distToStart1 = this.calculateDistance(point1, segment.start)
      const distToEnd1 = this.calculateDistance(point1, segment.end)
      const distToSegment1 = this.distanceToLineSegment(point1, segment.start, segment.end)

      if (Math.min(distToStart1, distToEnd1, distToSegment1) <= this.userPreferences.maxWalkDistance) {
        point1Segments.push(segment.id)
      }

      const distToStart2 = this.calculateDistance(point2, segment.start)
      const distToEnd2 = this.calculateDistance(point2, segment.end)
      const distToSegment2 = this.distanceToLineSegment(point2, segment.start, segment.end)

      if (Math.min(distToStart2, distToEnd2, distToSegment2) <= this.userPreferences.maxWalkDistance) {
        point2Segments.push(segment.id)
      }
    })

    if (point1Segments.length === 0 || point2Segments.length === 0) return false

    for (const startSegment of point1Segments) {
      if (point2Segments.includes(startSegment)) return true

      const visited = new Set()
      const queue = [{ id: startSegment, distance: 0 }]
      visited.add(startSegment)

      while (queue.length > 0) {
        const { id: currentSegment, distance } = queue.shift()
        if (distance > 10) break

        for (const neighbor of graph[currentSegment] || []) {
          if (point2Segments.includes(neighbor.id)) return true

          if (!visited.has(neighbor.id)) {
            visited.add(neighbor.id)
            queue.push({
              id: neighbor.id,
              distance: distance + neighbor.distance
            })
          }
        }
      }
    }

    return false
  }

  findZonePaths(startZone, endZone, maxTransfers = 3) {
    if (startZone === endZone) return [[startZone]]
    
    const paths = []
    const queue = [[startZone]]
    const visited = new Set()
    
    // ADD: Stop after finding reasonable number of paths
    const maxPathsToFind = 15
    
    while (queue.length > 0 && paths.length < maxPathsToFind) {
      const currentPath = queue.shift()
      const currentZone = currentPath[currentPath.length - 1]
      
      if (currentPath.length > maxTransfers + 1) continue
      
      const stateKey = currentPath.join('-')
      if (visited.has(stateKey)) continue
      visited.add(stateKey)
      
      if (currentZone === endZone) {
        paths.push(currentPath)
        continue
      }
      
      const connections = this.zoneConnectivity.get(currentZone)
      if (!connections) continue
      
      for (const [nextZone, transferPoints] of connections.entries()) {
        if (transferPoints.length > 0 && !currentPath.includes(nextZone)) {
          queue.push([...currentPath, nextZone])
        }
      }
    }
    
    // Prioritize shorter paths
    return paths.sort((a, b) => a.length - b.length)
  }

  suggestTricycleRouteWithTransfers(startPoint, endPoint, isDiscounted = false) {
    console.log('\n========== ROUTE FINDING START ==========')
    console.log('Start Point:', startPoint)
    console.log('End Point:', endPoint)
    
    if (this.loadedRoutes.length === 0) {
      console.log('❌ No routes loaded')
      return []
    }

    // Initialize connectivity if needed
    if (this.zoneConnectivity.size === 0) {
      console.log('Initializing zone connectivity...')
      this.initializeZoneConnectivity()
    }

    // Check cache first
    const cachedRoute = this.getCachedRoute(startPoint, endPoint, isDiscounted)
    if (cachedRoute) {
      console.log('✅ Returning cached route')
      return cachedRoute
    }

    const suggestions = []
    
    // Find accessible zones
    console.log('\n--- Finding Accessible Zones ---')
    const startZones = new Set()
    const endZones = new Set()
    
    this.loadedRoutes.forEach(route => {
      const startDistance = this.calculateNearestDistance(startPoint, route)
      const endDistance = this.calculateNearestDistance(endPoint, route)
      
      if (startDistance <= this.userPreferences.maxWalkDistance) {
        startZones.add(route.zone)
      }
      if (endDistance <= this.userPreferences.maxWalkDistance) {
        endZones.add(route.zone)
      }
    })
    
    console.log('Start-accessible zones:', Array.from(startZones))
    console.log('End-accessible zones:', Array.from(endZones))
    
    // Find zone paths with limit
    console.log('\n--- Finding Zone Paths ---')
    const allPaths = []
    for (const startZone of startZones) {
      for (const endZone of endZones) {
        const paths = this.findZonePaths(startZone, endZone, this.userPreferences.maxTransfers)
        allPaths.push(...paths)
        
        // ADD: Early termination if we have enough paths
        if (allPaths.length >= this.maxPathsToEvaluate) {
          console.log(`Limiting to ${this.maxPathsToEvaluate} paths for performance`)
          break
        }
      }
      if (allPaths.length >= this.maxPathsToEvaluate) break
    }
    
    // Prioritize: direct routes first, then by path length
    const sortedPaths = allPaths
      .sort((a, b) => {
        if (a.length === 1 && b.length > 1) return -1
        if (b.length === 1 && a.length > 1) return 1
        return a.length - b.length
      })
      .slice(0, this.maxPathsToEvaluate)
    
    console.log(`Evaluating top ${sortedPaths.length} paths`)
    
    // Calculate routes with early success termination
    console.log('\n--- Calculating Routes ---')
    for (const zonePath of sortedPaths) {
      console.log(`Evaluating path: ${zonePath.join(' → ')}`)
      
      const route = this.calculateMultiTransferRoute(startPoint, endPoint, zonePath, isDiscounted)
      
      if (route) {
        route.score = this.calculateRouteScore(route)
        suggestions.push(route)
        console.log(`✅ Valid route found (score: ${route.score.toFixed(2)})`)
        
        // ADD: If we found a great direct route, consider stopping early
        if (route.type === 'direct' && route.score > 80 && suggestions.length >= 3) {
          console.log('Found excellent direct route, stopping search')
          break
        }
      }
      
      // ADD: Stop if we have enough good suggestions
      if (suggestions.length >= 5) {
        console.log('Found 5 valid routes, stopping search')
        break
      }
    }
    
    // Sort and return
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        if (Math.abs(a.score - b.score) < 5) {
          return a.transferCount - b.transferCount
        }
        return b.score - a.score
      })
      .slice(0, 5)

    console.log(`Returning ${sortedSuggestions.length} route(s)`)
    
    this.cacheRoute(startPoint, endPoint, isDiscounted, sortedSuggestions)
    console.log('========== ROUTE FINDING END ==========\n')
    
    return sortedSuggestions
  }

  async loadZoneData() {
    try {
      const { data: allZoneData, error } = await supabase.from('route_zones').select('*')
      if (error) throw error

      if (!allZoneData || allZoneData.length === 0) {
        console.warn('No zone data found, using fallback')
        return this.getFallbackRoutes()
      }

      const zoneGroups = allZoneData.reduce((acc, zone) => {
        acc[zone.zone_type] = acc[zone.zone_type] || []
        acc[zone.zone_type].push(zone)
        return acc
      }, {})

      const routes = []
      for (const [zoneType, zoneData] of Object.entries(zoneGroups)) {
        if (zoneData.length > 0) {
          const geojsonData = zoneData[0].geojson_data
          routes.push(this.processGeoJSONRoutes(geojsonData, zoneType))
        }
      }

      this.loadedRoutes = routes.length > 0 ? routes : this.getFallbackRoutes()
      
      // CLEAR: Clear connectivity caches when routes change
      this.connectivityGraphCache.clear()
      this.zoneConnectivity.clear()
      
      this.initializeZoneConnectivity()
      return this.loadedRoutes
    } catch (error) {
      console.error('Failed to load zone data:', error)
      return this.getFallbackRoutes()
    }
  }

   clearAllCaches() {
    this.routeCache.clear()
    this.connectivityGraphCache.clear()
    this.zoneConnectivity.clear()
    console.log('All caches cleared')
  }
}