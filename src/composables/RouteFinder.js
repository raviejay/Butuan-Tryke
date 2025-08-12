// composables/RouteFinder.js
export class RouteFinder {
  constructor() {
    this.loadedRoutes = []
    this.zoneConfig = {
      orange: { name: 'Orange Zone Tricycle Route', color: '#ea580c', baseFare: 15 },
      red: { name: 'Red Zone Tricycle Route', color: '#dc2626', baseFare: 12 },
      white: { name: 'White Zone Tricycle Route', color: '#000', baseFare: 18 },
      green: { name: 'Green Zone Tricycle Route', color: '#16a34a', baseFare: 14 },
    }

    this.butuanPlaces = [
      { name: 'Butuan City Hall', lat: 8.953775339827885, lng: 125.52922189368539 },
      { name: 'Robinsons Place Butuan', lat: 8.9587, lng: 125.5439 },
      { name: 'Gaisano Grand Mall Butuan', lat: 8.9534, lng: 125.5387 },
      { name: 'Butuan Airport', lat: 8.9514, lng: 125.4789 },
      { name: 'Butuan Port', lat: 8.9445, lng: 125.5523 },
      { name: 'Butuan National Museum', lat: 8.9489, lng: 125.5425 },
      { name: 'Guingona Park', lat: 8.947790666935324, lng: 125.5433043032038 },
      { name: 'Butuan Central Elementary School', lat: 8.9478, lng: 125.5398 },
      { name: 'Father Saturnino Urios University', lat: 8.9523, lng: 125.5445 },
      { name: 'Butuan Medical City', lat: 8.9456, lng: 125.5389 },
      { name: 'SM City Butuan', lat: 8.9612, lng: 125.5456 },
      { name: 'Liberty Shrine', lat: 8.9567, lng: 125.5423 },
      { name: 'Banza Church', lat: 8.9534, lng: 125.5367 },
      { name: 'Butuan Bridge', lat: 8.9489, lng: 125.5478 },
      { name: 'RTR Plaza', lat: 8.9487, lng: 125.5421 },
    ]
  }

  // Load zone data from predefined files
  async loadZoneData() {
    const zoneFiles = [
      { url: '/data/orange_routes_final.geojson', type: 'orange' },
      { url: '/data/red_tricycle_zone.geojson', type: 'red' },
      { url: '/data/white_routes.geojson', type: 'white' },
      { url: '/data/green_routes.geojson', type: 'green' },
    ]

    const routes = []

    for (const { url, type } of zoneFiles) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          const geojsonData = await response.json()
          routes.push(this.processGeoJSONRoutes(geojsonData, type))
        }
      } catch (error) {
        console.warn(`Failed to load ${type} zone:`, error)
      }
    }

    // Fallback data if no files load
    if (routes.length === 0) {
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
      routes.push(this.processGeoJSONRoutes(fallbackData, 'orange'))
    }

    this.loadedRoutes = routes
    return routes
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

    const config = this.zoneConfig[zoneType] || this.zoneConfig.orange

    return {
      id: `${zoneType}_zone_route`,
      name: config.name,
      zone: zoneType.charAt(0).toUpperCase() + zoneType.slice(1),
      color: config.color,
      baseFare: config.baseFare,
      bounds: { north: maxLat, south: minLat, east: maxLng, west: minLng },
      routes: routePaths,
      properties: { combined: true, zoneType },
    }
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

  // Calculate fare based on distance
  calculateFare(distance, baseFare) {
    return baseFare + Math.max(0, Math.floor((distance - 1) * 5)) // ₱5 per km after first km
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
  findBestTransfers(startPoint, endPoint, transferOptions) {
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

            const leg1Fare = this.calculateFare(leg1Distance, startRoute.route.baseFare)
            const leg2Fare = this.calculateFare(leg2Distance, endRoute.route.baseFare)
            const totalFare = leg1Fare + leg2Fare

            const totalWalkDistance =
              startRoute.startDistance * 1000 + transferWalkDistance + endRoute.endDistance * 1000

            if (totalWalkDistance < 1000) {
              transfers.push({
                type: 'transfer',
                totalFare: totalFare,
                totalWalkDistance: Math.round(totalWalkDistance),
                transferCount: 1,
                legs: [
                  {
                    zone: startRoute.route.zone,
                    color: startRoute.route.color,
                    fare: leg1Fare,
                    description: `${startRoute.route.zone} Zone - ${leg1Distance.toFixed(1)}km`,
                  },
                  {
                    zone: endRoute.route.zone,
                    color: endRoute.route.color,
                    fare: leg2Fare,
                    description: `${endRoute.route.zone} Zone - ${leg2Distance.toFixed(1)}km`,
                  },
                ],
                transferPoints: [
                  `${bestTransfer.point[0].toFixed(4)}, ${bestTransfer.point[1].toFixed(4)}`,
                ],
                routeData: [startRoute.route, endRoute.route],
                transferPoint: bestTransfer.point,
              })
            }
          }
        }
      })
    })

    return transfers
  }

  // Main route suggestion logic
  suggestTricycleRouteWithTransfers(startPoint, endPoint) {
    if (this.loadedRoutes.length === 0) return []

    const suggestions = []
    const directRoutes = []
    const transferOptions = []

    // Check each zone for direct routes
    this.loadedRoutes.forEach((route) => {
      const startDistance = this.calculateNearestDistance(startPoint, route)
      const endDistance = this.calculateNearestDistance(endPoint, route)
      const totalDistance = this.calculateDistance(startPoint, endPoint)

      // Direct route within same zone (walking distance < 500m)
      if (startDistance < 0.5 && endDistance < 0.5) {
        const fare = this.calculateFare(totalDistance, route.baseFare)

        directRoutes.push({
          type: 'direct',
          route: route.name,
          zone: route.zone,
          color: route.color,
          fare: fare,
          description: this.getRouteDescription(startDistance, endDistance),
          startDistance: startDistance,
          endDistance: endDistance,
          routeData: route,
          totalFare: fare,
          transferCount: 0,
        })
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
      const transfers = this.findBestTransfers(startPoint, endPoint, transferOptions)
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

  // Search places by query
  searchPlaces(query) {
    if (!query.trim()) return []

    return this.butuanPlaces.filter((place) =>
      place.name.toLowerCase().includes(query.toLowerCase()),
    )
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      )
      const data = await response.json()
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch (error) {
      console.log('Reverse geocoding failed, using coordinates')
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }
}
