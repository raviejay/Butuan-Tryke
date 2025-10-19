import { supabase } from '@/composables/useSupabase'

export class RouteFinder {
  constructor() {
    this.loadedRoutes = []
    this.routeCache = new Map() // Cache for route calculations
    this.cacheTTL = 3600000 // Cache TTL: 1 hour in milliseconds
    this.maxRetries = 3 // Max retries for API calls
    this.retryDelay = 1000 // Retry delay in milliseconds
    
    this.zoneConfig = {
      orange: { name: 'Orange Zone Tricycle Route', color: '#ea580c' },
      red: { name: 'Red Zone Tricycle Route', color: '#dc2626' },
      white: { name: 'White Zone Tricycle Route', color: '#000' },
      green: { name: 'Green Zone Tricycle Route', color: '#16a34a' },
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
      maxWalkDistance: 0.2, // km
      maxTransfers: 3,
      preferCheapest: true,
      preferFastest: false
    }
    this.connectionThreshold = 0.1 // Increased to 100 meters for better connectivity detection
    this.customFareAdjustments = [] // For temporary fare modifications

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

    this.loadFareData()
  }

  // Set user preferences
  setUserPreferences(preferences) {
    this.userPreferences = {
      ...this.userPreferences,
      ...preferences
    }
  }

  // Add temporary fare adjustment
  addCustomFareAdjustment(adjustment) {
    this.customFareAdjustments.push({
      ...adjustment,
      expiry: adjustment.expiry || Date.now() + 24 * 60 * 60 * 1000 // Default 24h
    });
    // Clean up expired adjustments
    this.customFareAdjustments = this.customFareAdjustments.filter(
      adj => adj.expiry > Date.now()
    );
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
    this.clearCache() // Clear cache when gas price changes
  }

  getGasPrice() {
    return this.currentGasPrice
  }

  calculateFare(distance, isDiscounted = false) {
    let fareData = this.fareMatrix.find(
      bracket => this.currentGasPrice >= bracket.gasMin && this.currentGasPrice <= bracket.gasMax
    ) || (this.currentGasPrice < 45 ? this.fareMatrix[0] : this.fareMatrix[this.fareMatrix.length - 1])

    // Apply custom fare adjustments
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
      return this.loadedRoutes
    } catch (error) {
      console.error('Failed to load zone data:', error)
      return this.getFallbackRoutes()
    }
  }

  getFallbackRoutes() {
    const fallbackData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: 1, color: '#ea580c' },
          geometry: {
            type: 'MultiLineString',
            coordinates: [
              [
                [125.540130448007886, 8.964374021382271],
                [125.540327462684658, 8.963585962675197],
                [125.531593145347912, 8.958857610432746],
                [125.530214042610524, 8.95806955172567],
                [125.52725882245899, 8.958397909520285],
                [125.528506582078535, 8.954785973779524],
              ],
            ],
          },
        },
      ],
    }

    const routes = [this.processGeoJSONRoutes(fallbackData, 'orange')]
    this.loadedRoutes = routes
    return routes
  }

  // Cache management
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
    this.routeCache.set(key, {
      data,
      timestamp: Date.now()
    })
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
          // Enhanced: Use minimum distance between segments instead of just endpoints
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

  arePointsConnected(point1, point2, route) {
    const { graph, segments } = this.buildConnectivityGraph(route.routes)
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
        if (distance > 10) break // Limit search to 10km

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
        this.calculateDistance(transfer.point, existing.point) < 0.1
      )) {
        uniqueTransfers.push(transfer)
      }
    })

    return uniqueTransfers.slice(0, 3)
  }

  calculateRouteScore(route) {
    const { preferCheapest, preferFastest } = this.userPreferences
    let score = 0

    if (preferCheapest) {
      score += (100 - route.totalFare * 10) * 0.6
    }
    if (preferFastest) {
      score += (100 - route.transferCount * 20) * 0.3
      score += (100 - route.totalWalkDistance / 100) * 0.1
    } else {
      score += (100 - route.totalWalkDistance / 50) * 0.4
    }

    return score
  }

  findBestTransfers(startPoint, endPoint, transferOptions, isDiscounted = false) {
    const transfers = []
    const startRoutes = transferOptions.filter(opt => opt.startAccessible)
    const endRoutes = transferOptions.filter(opt => opt.endAccessible)

    startRoutes.forEach(startRoute => {
      endRoutes.forEach(endRoute => {
        if (startRoute.route.id !== endRoute.route.id) {
          const transferPoints = this.findTransferPoints(startRoute.route, endRoute.route)
          
          if (transferPoints.length > 0 && transfers.length < this.userPreferences.maxTransfers) {
            const bestTransfer = transferPoints.sort((a, b) => a.distance - b.distance)[0]
            const leg1Distance = this.calculateDistance(startPoint, bestTransfer.route1Point)
            const leg2Distance = this.calculateDistance(bestTransfer.route2Point, endPoint)
            const transferWalkDistance = bestTransfer.distance * 1000

            const leg1Fare = this.calculateFare(leg1Distance, false)
            const leg2Fare = this.calculateFare(leg2Distance, false)
            const leg1DiscountedFare = this.calculateFare(leg1Distance, true)
            const leg2DiscountedFare = this.calculateFare(leg2Distance, true)

            const totalWalkDistance = 
              startRoute.startDistance * 1000 + 
              transferWalkDistance + 
              endRoute.endDistance * 1000

            if (totalWalkDistance < this.userPreferences.maxWalkDistance * 1000) {
              const transferObj = {
                type: 'transfer',
                totalFare: leg1Fare + leg2Fare,
                totalDiscountedFare: leg1DiscountedFare + leg2DiscountedFare,
                totalWalkDistance: Math.round(totalWalkDistance),
                transferCount: 1,
                legs: [
                  {
                    zone: startRoute.route.zone,
                    color: startRoute.route.color,
                    fare: leg1Fare,
                    discountedFare: leg1DiscountedFare,
                    description: `${startRoute.route.zone} Zone - ${leg1Distance.toFixed(1)}km`
                  },
                  {
                    zone: endRoute.route.zone,
                    color: endRoute.route.color,
                    fare: leg2Fare,
                    discountedFare: leg2DiscountedFare,
                    description: `${endRoute.route.zone} Zone - ${leg2Distance.toFixed(1)}km`
                  }
                ],
                transferPoints: [
                  `${bestTransfer.point[0].toFixed(4)}, ${bestTransfer.point[1].toFixed(4)}`
                ],
                routeData: [startRoute.route, endRoute.route],
                transferPoint: bestTransfer.point,
                gasPrice: this.currentGasPrice,
                isDiscounted
              }
              transferObj.score = this.calculateRouteScore(transferObj)
              transfers.push(transferObj)
            }
          }
        }
      })
    })

    return transfers
  }

  suggestTricycleRouteWithTransfers(startPoint, endPoint, isDiscounted = false) {
    if (this.loadedRoutes.length === 0) return []

    // Check cache first
    const cachedRoute = this.getCachedRoute(startPoint, endPoint, isDiscounted)
    if (cachedRoute) return cachedRoute

    const suggestions = []
    const directRoutes = []
    const transferOptions = []

    this.loadedRoutes.forEach(route => {
      const startDistance = this.calculateNearestDistance(startPoint, route)
      const endDistance = this.calculateNearestDistance(endPoint, route)
      const totalDistance = this.calculateDistance(startPoint, endPoint)

      if (startDistance < this.userPreferences.maxWalkDistance && 
          endDistance < this.userPreferences.maxWalkDistance) {
        if (this.arePointsConnected(startPoint, endPoint, route)) {
          const fare = this.calculateFare(totalDistance, false)
          const discountedFare = this.calculateFare(totalDistance, true)

          const routeObj = {
            type: 'direct',
            route: route.name,
            zone: route.zone,
            color: route.color,
            fare,
            discountedFare,
            description: this.getRouteDescription(startDistance, endDistance),
            startDistance,
            endDistance,
            routeData: route,
            totalFare: fare,
            totalDiscountedFare: discountedFare,
            transferCount: 0,
            distance: totalDistance,
            gasPrice: this.currentGasPrice,
            isDiscounted
          }
          routeObj.score = this.calculateRouteScore(routeObj)
          directRoutes.push(routeObj)
        }
      }

      if (startDistance < 0.8 || endDistance < 0.8) {
        transferOptions.push({
          route,
          startAccessible: startDistance < 0.8,
          endAccessible: endDistance < 0.8,
          startDistance,
          endDistance
        })
      }
    })

    suggestions.push(...directRoutes)

    if (directRoutes.length === 0 && transferOptions.length > 1) {
      const transfers = this.findBestTransfers(startPoint, endPoint, transferOptions, isDiscounted)
      suggestions.push(...transfers)
    }

    const sortedSuggestions = suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    this.cacheRoute(startPoint, endPoint, isDiscounted, sortedSuggestions)
    return sortedSuggestions
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
          `/api/nominatim/search?q=${encodeURIComponent(query)}+Butuan&format=json&limit=10`
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

  async calculateRoute(startCoords, destinationCoords) {
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
        const response = await fetch(`/api/nominatim/reverse?lat=${lat}&lon=${lng}&format=json`)
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
}