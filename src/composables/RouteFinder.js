// Main route suggestion logic with fare calculation options and connectivity check
import { supabase } from '@/composables/useSupabase'
// composables/RouteFinder.js
export class RouteFinder {
  constructor() {
    this.loadedRoutes = []
    this.zoneConfig = {
      orange: { name: 'Orange Zone Tricycle Route', color: '#ea580c' },
      red: { name: 'Red Zone Tricycle Route', color: '#dc2626' },
      white: { name: 'White Zone Tricycle Route', color: '#000' },
      green: { name: 'Green Zone Tricycle Route', color: '#16a34a' },
    }

    // Official Butuan City Tricycle Fare Matrix
    this.fareMatrix = [
      { gasMin: 45.0, gasMax: 55.0, regularFare: 8.0, discountedFare: 6.0 },
      { gasMin: 56.0, gasMax: 65.0, regularFare: 9.0, discountedFare: 7.0 },
      { gasMin: 66.0, gasMax: 75.0, regularFare: 10.0, discountedFare: 8.0 },
      { gasMin: 76.0, gasMax: 85.0, regularFare: 11.0, discountedFare: 9.0 },
      { gasMin: 86.0, gasMax: 95.0, regularFare: 12.0, discountedFare: 10.0 },
      { gasMin: 96.0, gasMax: 105.0, regularFare: 13.0, discountedFare: 11.0 },
    ]

    // Current gas price (this should be updated regularly or fetched from an API)
    this.currentGasPrice = 56.0 // Default to mid-range, should be configurable

    this.butuanPlaces = [
      { name: 'Butuan City Hall', lat: 8.953775339827885, lng: 125.52922189368539 },
      { name: 'Robinsons Place Butuan', lat: 8.943025240692158, lng: 125.52002742041245 },
      { name: 'Gaisano Grand Mall Butuan', lat: 8.945767988899405, lng: 125.5253821714216 },
      { name: 'Butuan Airport', lat: 8.946059262592287, lng: 125.48259422894714 },
      { name: 'Butuan Port', lat: 8.95329704584716, lng: 125.54267120725197 },
      { name: 'Butuan National Museum', lat: 8.953421955407247, lng: 125.52717817838723 },
      { name: 'Guingona Park', lat: 8.947790666935324, lng: 125.5433043032038 },
      { name: 'Butuan Central Elementary School', lat: 8.94628926250755, lng: 125.54296913601452 },
      {
        name: 'Father Saturnino Urios University',
        lat: 8.947741228746285,
        lng: 125.54197135437067,
      },
      { name: 'Butuan Medical City', lat: 8.962105143955448, lng: 125.58608913601485 },
      { name: 'SM City Butuan', lat: 8.948119865042665, lng: 125.53313827314534 },
      { name: 'Banza Church', lat: 8.972692275958764, lng: 125.53839051705167 },
    ]

    // Connectivity threshold for connecting route segments (in km)
    this.connectionThreshold = 0.05 // 50 meters
  }

  // Set current gas price (should be called when gas price updates)
  setGasPrice(price) {
    this.currentGasPrice = price
  }

  // Get current gas price
  getGasPrice() {
    return this.currentGasPrice
  }

  // Calculate fare based on official Butuan City fare matrix
  calculateFare(distance, isDiscounted = false) {
    // Find the appropriate fare bracket based on current gas price
    const fareData = this.fareMatrix.find(
      (bracket) => this.currentGasPrice >= bracket.gasMin && this.currentGasPrice <= bracket.gasMax,
    )

    // If gas price is outside known range, use the closest bracket
    const selectedFare =
      fareData ||
      (this.currentGasPrice < 45 ? this.fareMatrix[0] : this.fareMatrix[this.fareMatrix.length - 1])

    // Base fare for first 4km
    const baseFare = isDiscounted ? selectedFare.discountedFare : selectedFare.regularFare

    // Additional fare calculation
    if (distance <= 4) {
      return baseFare
    } else {
      // Additional fare per km after first 4km
      const additionalKm = distance - 4
      const additionalFarePerKm = isDiscounted ? 0.8 : 1.0
      return baseFare + Math.ceil(additionalKm) * additionalFarePerKm
    }
  }

  // Load zone data from predefined files
  async loadZoneData() {
    const routes = []

    try {
      // Get all route zones data in one query
      const { data: allZoneData, error } = await supabase.from('route_zones').select('*')

      if (error) throw error

      if (!allZoneData || allZoneData.length === 0) {
        console.warn('No zone data found in database, using fallback')
        return this.getFallbackRoutes()
      }

      // Group data by zone_type
      const zoneGroups = allZoneData.reduce((acc, zone) => {
        if (!acc[zone.zone_type]) {
          acc[zone.zone_type] = []
        }
        acc[zone.zone_type].push(zone)
        return acc
      }, {})

      // Process each zone type
      for (const [zoneType, zoneData] of Object.entries(zoneGroups)) {
        try {
          if (zoneData.length > 0) {
            const geojsonData = zoneData[0].geojson_data
            routes.push(this.processGeoJSONRoutes(geojsonData, zoneType))
          }
        } catch (error) {
          console.warn(`Failed to process ${zoneType} zone data:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to load zone data:', error)
      return this.getFallbackRoutes()
    }

    // Fallback if no routes loaded
    if (routes.length === 0) {
      return this.getFallbackRoutes()
    }

    this.loadedRoutes = routes
    return routes
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

  // Build connectivity graph for route segments
  buildConnectivityGraph(routes) {
    const graph = {}
    const segments = []

    // Extract all segments with their endpoints
    routes.forEach((path, pathIndex) => {
      for (let i = 0; i < path.length - 1; i++) {
        const segment = {
          pathIndex: pathIndex,
          segmentIndex: i,
          start: path[i],
          end: path[i + 1],
          id: `${pathIndex}-${i}`,
        }
        segments.push(segment)
        graph[segment.id] = []
      }
    })

    // Find connections between segments
    segments.forEach((segment1, i) => {
      segments.forEach((segment2, j) => {
        if (i !== j) {
          // Check if segments are connected (share endpoints or are very close)
          const connections = [
            { p1: segment1.start, p2: segment2.start },
            { p1: segment1.start, p2: segment2.end },
            { p1: segment1.end, p2: segment2.start },
            { p1: segment1.end, p2: segment2.end },
          ]

          for (const conn of connections) {
            const distance = this.calculateDistance(conn.p1, conn.p2)
            if (distance <= this.connectionThreshold) {
              if (!graph[segment1.id].includes(segment2.id)) {
                graph[segment1.id].push(segment2.id)
              }
              break
            }
          }
        }
      })
    })

    return { graph, segments }
  }

  // Check if two points are on connected segments using BFS
  arePointsConnected(point1, point2, route) {
    const { graph, segments } = this.buildConnectivityGraph(route.routes)

    // Find segments closest to each point
    const point1Segments = []
    const point2Segments = []

    segments.forEach((segment) => {
      const distToStart1 = this.calculateDistance(point1, segment.start)
      const distToEnd1 = this.calculateDistance(point1, segment.end)
      const distToSegment1 = this.distanceToLineSegment(point1, segment.start, segment.end)

      if (Math.min(distToStart1, distToEnd1, distToSegment1) <= 0.5) {
        // 500m threshold
        point1Segments.push(segment.id)
      }

      const distToStart2 = this.calculateDistance(point2, segment.start)
      const distToEnd2 = this.calculateDistance(point2, segment.end)
      const distToSegment2 = this.distanceToLineSegment(point2, segment.start, segment.end)

      if (Math.min(distToStart2, distToEnd2, distToSegment2) <= 0.5) {
        // 500m threshold
        point2Segments.push(segment.id)
      }
    })

    if (point1Segments.length === 0 || point2Segments.length === 0) {
      return false
    }

    // Use BFS to check connectivity between any segments of point1 and point2
    for (const startSegment of point1Segments) {
      if (point2Segments.includes(startSegment)) {
        return true // Same segment
      }

      const visited = new Set()
      const queue = [startSegment]
      visited.add(startSegment)

      while (queue.length > 0) {
        const currentSegment = queue.shift()

        for (const neighbor of graph[currentSegment] || []) {
          if (point2Segments.includes(neighbor)) {
            return true // Found connection
          }

          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            queue.push(neighbor)
          }
        }
      }
    }

    return false
  }

  // Calculate distance from point to line segment
  distanceToLineSegment(point, lineStart, lineEnd) {
    const [px, py] = point
    const [x1, y1] = lineStart
    const [x2, y2] = lineEnd

    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D

    if (lenSq === 0) {
      return this.calculateDistance(point, lineStart)
    }

    let param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    return this.calculateDistance(point, [xx, yy])
  }

  // Process GeoJSON data for routes
  processGeoJSONRoutes(geojsonData, zoneType = 'orange') {
    const routePaths = []
    let minLat = Infinity,
      maxLat = -Infinity
    let minLng = Infinity,
      maxLng = -Infinity

    geojsonData.features.forEach((feature) => {
      feature.geometry.coordinates.forEach((lineString) => {
        const path = lineString.map((coord) => [coord[1], coord[0]]) // Convert to [lat,lng]
        routePaths.push(path)

        lineString.forEach(([lng, lat]) => {
          minLat = Math.min(minLat, lat)
          maxLat = Math.max(maxLat, lat)
          minLng = Math.min(minLng, lng)
          maxLng = Math.max(maxLng, lng)
        })
      })
    })

    // Use zoneType as color if it's a valid color, otherwise use fallback
    let color = this.isValidColor(zoneType) ? zoneType : '#ea580c'

    // Convert white to black for visibility
    if (
      color.toLowerCase() === 'white' ||
      color.toLowerCase() === '#ffffff' ||
      color.toLowerCase() === '#fff'
    ) {
      color = '#000000'
    }

    const zoneName = this.getZoneName(zoneType)

    return {
      id: `${zoneType}_zone_route`,
      name: zoneName,
      zone: zoneType.charAt(0).toUpperCase() + zoneType.slice(1),
      color: color,
      bounds: { north: maxLat, south: minLat, east: maxLng, west: minLng },
      routes: routePaths,
      properties: { combined: true, zoneType },
    }
  }

  // Helper method to validate if string is a valid color
  isValidColor(color) {
    // Check if it's a hex color
    if (/^#[0-9A-F]{6}$/i.test(color)) return true
    // Check if it's a named color or rgb/rgba
    const style = new Option().style
    style.color = color
    return style.color !== ''
  }

  // Generate zone name based on color or use default naming
  getZoneName(zoneType) {
    // If it's a known zone type, use existing config
    if (this.zoneConfig[zoneType]) {
      return this.zoneConfig[zoneType].name
    }
    // Otherwise generate a name based on the color/zone type
    return `${zoneType.charAt(0).toUpperCase() + zoneType.slice(1)} Zone Tricycle Route`
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(point1, point2) {
    const [lat1, lng1] = point1
    const [lat2, lng2] = point2
    const R = 6371 // Earth's radius in kilometers

    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Calculate nearest distance to any point on the route
  calculateNearestDistance(point, route) {
    let minDistance = Infinity
    route.routes.forEach((routePath) => {
      routePath.forEach((pathPoint) => {
        const distance = this.calculateDistance(point, pathPoint)
        minDistance = Math.min(minDistance, distance)
      })

      // Also check distance to line segments
      for (let i = 0; i < routePath.length - 1; i++) {
        const segmentDistance = this.distanceToLineSegment(point, routePath[i], routePath[i + 1])
        minDistance = Math.min(minDistance, segmentDistance)
      }
    })
    return minDistance
  }

  // Find nearest point on route
  findNearestPointOnRoute(point, route) {
    let minDistance = Infinity
    let nearestPoint = null

    route.routes.forEach((routePath) => {
      routePath.forEach((pathPoint) => {
        const distance = this.calculateDistance(point, pathPoint)
        if (distance < minDistance) {
          minDistance = distance
          nearestPoint = pathPoint
        }
      })
    })

    return { point: nearestPoint, distance: minDistance }
  }

  // Get route description based on walking distances
  getRouteDescription(startDist, endDist) {
    if (startDist < 0.1 && endDist < 0.1) return 'Direct route available'
    const parts = []
    if (startDist > 0.1) parts.push(`${(startDist * 1000).toFixed(0)}m to start`)
    if (endDist > 0.1) parts.push(`${(endDist * 1000).toFixed(0)}m from end`)
    return `Walk ${parts.join(' and ')}`
  }

  // Find intersection points between routes (for transfers)
  findTransferPoints(route1, route2, maxDistance = 0.2) {
    const transferPoints = []

    route1.routes.forEach((path1) => {
      path1.forEach((point1) => {
        route2.routes.forEach((path2) => {
          path2.forEach((point2) => {
            const distance = this.calculateDistance(point1, point2)
            if (distance <= maxDistance) {
              transferPoints.push({
                point: point1,
                route1Point: point1,
                route2Point: point2,
                distance: distance,
              })
            }
          })
        })
      })
    })

    // Remove duplicate transfer points that are too close to each other
    const uniqueTransfers = []
    transferPoints.forEach((transfer) => {
      const isDuplicate = uniqueTransfers.some(
        (existing) => this.calculateDistance(transfer.point, existing.point) < 0.1,
      )
      if (!isDuplicate) {
        uniqueTransfers.push(transfer)
      }
    })

    return uniqueTransfers.slice(0, 3) // Limit to 3 transfer points
  }

  // Find best transfer combinations
  findBestTransfers(startPoint, endPoint, transferOptions, isDiscounted = false) {
    const transfers = []

    const startRoutes = transferOptions.filter((opt) => opt.startAccessible)
    const endRoutes = transferOptions.filter((opt) => opt.endAccessible)

    startRoutes.forEach((startRoute) => {
      endRoutes.forEach((endRoute) => {
        if (startRoute.route.id !== endRoute.route.id) {
          const transferPoints = this.findTransferPoints(startRoute.route, endRoute.route)

          if (transferPoints.length > 0) {
            const bestTransfer = transferPoints.sort((a, b) => a.distance - b.distance)[0]

            const leg1Distance = this.calculateDistance(startPoint, bestTransfer.route1Point)
            const leg2Distance = this.calculateDistance(bestTransfer.route2Point, endPoint)
            const transferWalkDistance = bestTransfer.distance * 1000

            const leg1Fare = this.calculateFare(leg1Distance, false)
            const leg2Fare = this.calculateFare(leg2Distance, false)
            const leg1DiscountedFare = this.calculateFare(leg1Distance, true)
            const leg2DiscountedFare = this.calculateFare(leg2Distance, true)
            const totalFare = leg1Fare + leg2Fare
            const totalDiscountedFare = leg1DiscountedFare + leg2DiscountedFare

            const totalWalkDistance =
              startRoute.startDistance * 1000 + transferWalkDistance + endRoute.endDistance * 1000

            if (totalWalkDistance < 1000) {
              transfers.push({
                type: 'transfer',
                totalFare: totalFare,
                totalDiscountedFare: totalDiscountedFare,
                totalWalkDistance: Math.round(totalWalkDistance),
                transferCount: 1,
                legs: [
                  {
                    zone: startRoute.route.zone,
                    color: startRoute.route.color,
                    fare: leg1Fare,
                    discountedFare: leg1DiscountedFare,
                    description: `${startRoute.route.zone} Zone - ${leg1Distance.toFixed(1)}km`,
                  },
                  {
                    zone: endRoute.route.zone,
                    color: endRoute.route.color,
                    fare: leg2Fare,
                    discountedFare: leg2DiscountedFare,
                    description: `${endRoute.route.zone} Zone - ${leg2Distance.toFixed(1)}km`,
                  },
                ],
                transferPoints: [
                  `${bestTransfer.point[0].toFixed(4)}, ${bestTransfer.point[1].toFixed(4)}`,
                ],
                routeData: [startRoute.route, endRoute.route],
                transferPoint: bestTransfer.point,
                gasPrice: this.currentGasPrice,
                isDiscounted: isDiscounted,
              })
            }
          }
        }
      })
    })

    return transfers
  }

  // Main route suggestion logic with fare calculation options and connectivity check
  suggestTricycleRouteWithTransfers(startPoint, endPoint, isDiscounted = false) {
    if (this.loadedRoutes.length === 0) return []

    const suggestions = []
    const directRoutes = []
    const transferOptions = []

    // Check each zone for direct routes with connectivity validation
    this.loadedRoutes.forEach((route) => {
      const startDistance = this.calculateNearestDistance(startPoint, route)
      const endDistance = this.calculateNearestDistance(endPoint, route)
      const totalDistance = this.calculateDistance(startPoint, endPoint)

      // Direct route within same zone (walking distance < 500m)
      if (startDistance < 0.5 && endDistance < 0.5) {
        // NEW: Check if points are on connected segments
        const isConnected = this.arePointsConnected(startPoint, endPoint, route)

        if (isConnected) {
          const fare = this.calculateFare(totalDistance, false)
          const discountedFare = this.calculateFare(totalDistance, true)

          directRoutes.push({
            type: 'direct',
            route: route.name,
            zone: route.zone,
            color: route.color,
            fare: fare,
            discountedFare: discountedFare,
            description: this.getRouteDescription(startDistance, endDistance),
            startDistance: startDistance,
            endDistance: endDistance,
            routeData: route,
            totalFare: fare,
            totalDiscountedFare: discountedFare,
            transferCount: 0,
            distance: totalDistance,
            gasPrice: this.currentGasPrice,
            isDiscounted: isDiscounted,
          })
        }
      }

      // Potential transfer points (start or end accessible)
      if (startDistance < 0.8 || endDistance < 0.8) {
        transferOptions.push({
          route: route,
          startAccessible: startDistance < 0.8,
          endAccessible: endDistance < 0.8,
          startDistance: startDistance,
          endDistance: endDistance,
        })
      }
    })

    // Add direct routes first
    suggestions.push(...directRoutes)

    // Find transfer routes if no direct routes or if we have multiple zones
    if (directRoutes.length === 0 && transferOptions.length > 1) {
      const transfers = this.findBestTransfers(startPoint, endPoint, transferOptions, isDiscounted)
      suggestions.push(...transfers)
    }

    // Sort by total fare and convenience
    return suggestions
      .sort((a, b) => {
        if (a.transferCount !== b.transferCount) {
          return a.transferCount - b.transferCount
        }
        return a.totalFare - b.totalFare
      })
      .slice(0, 5)
  }

  // Get current fare matrix information
  getFareMatrix() {
    return {
      currentGasPrice: this.currentGasPrice,
      matrix: this.fareMatrix,
      currentBracket:
        this.fareMatrix.find(
          (bracket) =>
            this.currentGasPrice >= bracket.gasMin && this.currentGasPrice <= bracket.gasMax,
        ) || this.fareMatrix[this.fareMatrix.length - 1],
    }
  }

  // Search places by query
  // searchPlaces(query) {
  //   if (!query.trim()) return []

  //   return this.butuanPlaces.filter((place) =>
  //     place.name.toLowerCase().includes(query.toLowerCase()),
  //   )
  // }

  async searchPlaces(query) {
    if (!query.trim()) return []

    try {
      const response = await fetch(
        `/api/nominatim//search?q=${encodeURIComponent(query)}+Butuan&format=json&limit=10`,
      )

      const data = await response.json()

      return data.map((place) => ({
        name: place.display_name,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
      }))
    } catch (error) {
      console.error('Error fetching places:', error)
      // Fallback to local data if needed
      return this.butuanPlaces.filter((place) =>
        place.name.toLowerCase().includes(query.toLowerCase()),
      )
    }
  }

  // Calculate route using OSRM
  async calculateRoute(startCoords, destinationCoords) {
    try {
      const startCoord = `${startCoords[1]},${startCoords[0]}`
      const endCoord = `${destinationCoords[1]},${destinationCoords[0]}`
      const url = `https://router.project-osrm.org/route/v1/driving/${startCoord};${endCoord}?geometries=geojson&overview=full`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const coordinates = route.geometry.coordinates
        const leafletCoords = coordinates.map((coord) => [coord[1], coord[0]])

        return {
          coordinates: leafletCoords,
          distance: (route.distance / 1000).toFixed(2),
          duration: Math.round(route.duration / 60),
          success: true,
        }
      } else {
        throw new Error('No route found')
      }
    } catch (error) {
      console.error('Error calculating route:', error)
      return {
        coordinates: [startCoords, destinationCoords],
        distance: null,
        duration: null,
        success: false,
        fallback: true,
      }
    }
  }

  // Reverse geocoding
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(`/api/nominatim/reverse?lat=${lat}&lon=${lng}&format=json`)
      const data = await response.json()
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch (error) {
      console.log('Reverse geocoding failed, using coordinates')
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }
}
