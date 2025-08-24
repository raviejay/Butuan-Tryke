<template>
  <div class="relative w-full h-full">
    <!-- Fullscreen Map -->
    <div id="map" class="w-full h-full z-0"></div>

    <!-- Logo -->
    <div class="absolute top-4 left-4 z-20 w-40 h-24 md:w-40 md:h-24 object-contain">
      <img src="@/assets/logo3.png" alt="Butuan Tryke" />
    </div>

    <!-- Zone Info -->
    <div class="absolute top-28 left-4 z-20">
      <div class="bg-white rounded-lg shadow-lg px-3 py-2 mb-2">
        <h1 class="text-lg font-bold text-orange-600">Butuan Tryke</h1>
        <p class="text-xs text-gray-500">Multi-Zone Routes</p>
      </div>

      <!-- Loading Status sa mga routes debugging purposes -->
      <div class="bg-white rounded-lg shadow-lg p-3">
        <label class="block text-xs font-medium text-gray-700 mb-1">Zone Status</label>
        <div v-if="isLoading" class="flex items-center text-xs text-orange-600">
          <div class="loading-spinner mr-2"></div>
          Loading routes...
        </div>
        <div v-if="loadingError" class="text-xs text-red-600">
          {{ loadingError }}
        </div>
        <div v-if="loadedRoutes.length > 0" class="text-xs text-green-600">
          ✓ {{ loadedRoutes.length }} zone(s) loaded
          <div class="flex flex-wrap gap-1 mt-1">
            <span
              v-for="route in loadedRoutes"
              :key="route.id"
              class="inline-block px-2 py-0.5 rounded text-xs"
              :style="{ backgroundColor: route.color + '20', color: route.color }"
            >
              {{ route.zone }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Field Indicator -->
    <!-- <div class="absolute top-4 right-4 z-20 bg-white rounded-lg shadow-lg px-3 py-2">
      <div class="text-sm font-medium text-gray-700">
        Click map for:
        <span
          :class="activeField === 'start' ? 'text-green-600' : 'text-red-600'"
          class="font-bold"
        >
          {{ activeField === 'start' ? 'Start' : 'End' }}
        </span>
      </div>
    </div> -->
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'

// Props
const props = defineProps({
  activeField: {
    type: String,
    default: 'start',
  },
  routeSuggestions: {
    type: Array,
    default: () => [],
  },
  loadedRoutes: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  loadingError: {
    type: String,
    default: null,
  },
})

// Emits
const emit = defineEmits(['map-click', 'routes-loaded'])

// Refs
const map = ref(null)
const startMarker = ref(null)
const destinationMarker = ref(null)
const routePolyline = ref(null)
const highlightedRoutes = ref([])
const routeLayerGroup = ref(null)

// Create custom icon function
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

// Safe marker creation function
const safeAddMarker = (coords, color, isStart) => {
  try {
    const marker = L.marker(coords, {
      icon: createCustomIcon(color),
      zIndexOffset: 1000,
    }).addTo(map.value)

    if (isStart) {
      if (startMarker.value) map.value.removeLayer(startMarker.value)
      startMarker.value = marker
    } else {
      if (destinationMarker.value) map.value.removeLayer(destinationMarker.value)
      destinationMarker.value = marker
    }
    return marker
  } catch (error) {
    console.error('Marker creation failed:', error)
    return null
  }
}

// Handle map click
const handleMapClick = (e) => {
  const { lat, lng } = e.latlng
  emit('map-click', { lat, lng, activeField: props.activeField })
}

// Add markers for start/end points
const addMarker = (coords, isStart) => {
  const color = isStart ? '#10b981' : '#ef4444'
  const label = isStart ? 'Start Location' : 'Destination'
  return safeAddMarker(coords, color, isStart)?.bindPopup(label)
}

// Draw route on map
const drawRoute = (routeData) => {
  // Remove existing route if naa na to draw another
  if (routePolyline.value) {
    map.value.removeLayer(routePolyline.value)
  }

  const style = routeData.fallback
    ? { color: '#ef4444', weight: 3, opacity: 0.7, dashArray: '10, 10' }
    : { color: '#3b82f6', weight: 5, opacity: 0.8, smoothFactor: 1 }

  routePolyline.value = L.polyline(routeData.coordinates, style).addTo(map.value)

  // Clip nato ang map para sa butuan lang dili kaayo mak zoom out
  const bounds = L.latLngBounds(routeData.coordinates)
  map.value.fitBounds(bounds.pad(0.1))
}

// Highlight route suggestions
const highlightRoute = (suggestion) => {
  // Clear previous highlights
  highlightedRoutes.value.forEach((layer) => map.value.removeLayer(layer))
  highlightedRoutes.value = []

  if (suggestion.type === 'transfer') {
    // Highlight transfer routes
    suggestion.routeData.forEach((route, index) => {
      route.routes.forEach((routePath) => {
        const polyline = L.polyline(routePath, {
          color: route.color,
          weight: 6,
          opacity: 0.9,
          dashArray: index === 0 ? '0' : '10, 5',
        }).addTo(map.value)
        highlightedRoutes.value.push(polyline)
      })
    })

    // Add transfer point marker
    if (suggestion.transferPoint) {
      const transferMarker = L.marker(suggestion.transferPoint, {
        icon: createCustomIcon('#fbbf24'),
        zIndexOffset: 2000,
      }).addTo(map.value)
      highlightedRoutes.value.push(transferMarker)

      // Show transfer popup
      L.popup()
        .setLatLng(suggestion.transferPoint)
        .setContent(
          `
          <div class="text-sm">
            <div class="font-bold text-yellow-600">Transfer Point</div>
            <div>Total Fare: ₱${suggestion.totalFare}</div>
            <div>Walk Distance: ${suggestion.totalWalkDistance}m</div>
            <div class="text-xs mt-1">
              ${suggestion.legs.map((leg) => `${leg.zone}: ₱${leg.fare}`).join(' + ')}
            </div>
          </div>
        `,
        )
        .openOn(map.value)
    }
  } else {
    // Highlight single direct route
    suggestion.routeData.routes.forEach((routePath) => {
      const polyline = L.polyline(routePath, {
        color: suggestion.routeData.color,
        weight: 6,
        opacity: 0.9,
      }).addTo(map.value)
      highlightedRoutes.value.push(polyline)
    })

    // Show popup near the midpoint of the first segment
    const firstSegment = suggestion.routeData.routes[0]
    const midpoint = firstSegment[Math.floor(firstSegment.length / 2)]
    L.popup()
      .setLatLng(midpoint)
      .setContent(
        `
        <div class="text-sm">
          <div class="font-bold">${suggestion.route}</div>
          <div>Fare: ₱${suggestion.fare}</div>
          <div>${suggestion.description}</div>
        </div>
      `,
      )
      .openOn(map.value)
  }
}

// Clear all highlights
const clearHighlights = () => {
  highlightedRoutes.value.forEach((layer) => {
    map.value.removeLayer(layer)
  })
  highlightedRoutes.value = []
  map.value.closePopup()
}

// Add route layers to map
const addRouteLayersToMap = () => {
  if (routeLayerGroup.value) {
    map.value.removeLayer(routeLayerGroup.value)
  }

  routeLayerGroup.value = L.layerGroup()

  props.loadedRoutes.forEach((route) => {
    route.routes.forEach((routePath) => {
      const polyline = L.polyline(routePath, {
        color: route.color,
        weight: 3,
        opacity: 0,
        dashArray: '8, 12',
      })
      routeLayerGroup.value.addLayer(polyline)
    })
  })

  routeLayerGroup.value.addTo(map.value)
}

// Watch for loaded routes changes
watch(
  () => props.loadedRoutes,
  () => {
    addRouteLayersToMap()
  },
  { deep: true },
)

onMounted(() => {
  // Define Butuan City bounds
  const butuanBounds = L.latLngBounds(
    L.latLng(8.85, 125.45), // Southwest corner
    L.latLng(9.05, 125.65), // Northeast corner
  )

  map.value = L.map('map', {
    zoomControl: false,
    preferCanvas: true,
    maxBounds: butuanBounds,
    maxBoundsViscosity: 1.0,
    minZoom: 12,
    maxZoom: 18,
  }).setView([8.9495, 125.5436], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map.value)

  if (props.loadedRoutes.length > 0) {
    addRouteLayersToMap()
  }

  // Add click handler to map
  map.value.on('click', handleMapClick)

  // paras zoom para mo stick ang marker
  map.value.on('zoomend', () => {
    if (startMarker.value) startMarker.value.update()
    if (destinationMarker.value) destinationMarker.value.update()
  })

  // Enforce bounds when panning
  map.value.on('drag', () => {
    if (!butuanBounds.contains(map.value.getCenter())) {
      map.value.panInsideBounds(butuanBounds, { animate: true })
    }
  })

  // Emit that map is ready
  emit('routes-loaded')
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.off('click', handleMapClick)
    map.value.off('zoomend')
    map.value.off('drag')
    map.value.remove()
  }
})

// Expose methods to parent
defineExpose({
  addMarker,
  drawRoute,
  highlightRoute,
  clearHighlights,
  setView: (coords, zoom = 16) => map.value?.setView(coords, zoom),
})
</script>

<style scoped>
.custom-div-icon {
  position: relative;
  text-align: center;
}

.custom-div-icon div {
  position: absolute;
  left: 0;
  right: 0;
  margin: 0 auto;
  transform: translateY(-50%);
}

#map {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.leaflet-container {
  cursor: default !important;
}

.leaflet-dragging .leaflet-container {
  cursor: move !important;
}

.leaflet-interactive {
  cursor: crosshair !important;
}

.loading-spinner {
  border: 2px solid rgba(249, 115, 22, 0.2);
  border-radius: 50%;
  border-top: 2px solid #f97316;
  width: 12px;
  height: 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
