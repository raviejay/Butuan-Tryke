<template>
  <div class="relative w-full h-full">
    <!-- Fullscreen Map -->
    <div id="map" class="w-full h-full z-0"></div>

    <!-- Logo -->
    <div class="absolute hidden md:block top-4 left-4 z-20 w-40 h-24 md:w-40 md:h-24 object-contain">
      <img src="@/assets/logo3.png" alt="Butuan Tryke" />
  
    </div>
    <div class="absolute block md:hidden top-4 left-4 z-20 w-18 h-22 md:w-18 md:h-24 object-contain">
      <img src="@/assets/logo4.png" alt="Butuan Tryke" />
  
    </div>

    <!-- Zone Info -->
    <!-- <div class="absolute top-28 left-4 z-20">
      <div class="bg-white rounded-lg shadow-lg px-3 py-2 mb-2">
        <h1 class="text-lg font-bold text-orange-600">Butuan Tryke</h1>
        <p class="text-xs text-gray-500">Multi-Zone Routes</p>
      </div> -->

      <!-- Loading Status sa mga routes debugging purposes -->
      <!-- <div class="bg-white rounded-lg shadow-lg p-3">
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
    </div> -->


    
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import { useSettingsStore } from '@/stores/settings'

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

// Store
const settingsStore = useSettingsStore()


// Refs
const map = ref(null)
const startMarker = ref(null)
const destinationMarker = ref(null)
const routePolyline = ref(null)
const highlightedRoutes = ref([])
const routeLayerGroup = ref(null)
const currentMapStyle = ref(localStorage.getItem('mapStyle') || 'standard')
// Create custom location icon function
const createLocationIcon = (color) => {
  // decide the icon name based on color
  const iconName = color === '#ef4444' ? 'location_on' : 'distance';

  return L.divIcon({
    className: 'custom-location-icon',
    html: `
      <div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <span class="material-symbols-outlined" 
              style="font-size: 32px; line-height: 1; font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;">
          ${iconName}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}



// Create transfer point icon
const createTransferIcon = (color) => {
  return L.divIcon({
    className: 'custom-transfer-icon',
    html: `
      <div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <span class="material-symbols-outlined" style="font-size: 28px; line-height: 1;">
          swap_horiz
        </span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

// Safe marker creation function
const safeAddMarker = (coords, color, isStart) => {
  try {
    const marker = L.marker(coords, {
      icon: createLocationIcon(color),
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
    ? { color: '#ff8800', weight: 3, opacity: 0.7, dashArray: '10, 10' } // Orange for fallback
    : { color: '#ff8800', weight: 5, opacity: 1, smoothFactor: 1 }     // Green for normal route

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
        icon: createTransferIcon('#fbbf24'),
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

  updateMapStyle(currentMapStyle.value)



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


const updateMapStyle = (style) => {
  const maptilerApiKey = "SBAyjg2QZffT0exJjurD" // Replace with your actual API key
  
  // Remove existing tile layers
  map.value.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) {
      map.value.removeLayer(layer)
    }
  })

  // Add the selected tile layer
  switch (style) {
    case "standard":
      // Default OpenStreetMap style
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map.value)
      break

    case "minimal":
      // MapTiler Positron style
      L.tileLayer(
        `https://api.maptiler.com/maps/bright-v2/{z}/{x}/{y}.png?key=${maptilerApiKey}`,
        {
          attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          tileSize: 512,
          zoomOffset: -1,
        }
      ).addTo(map.value)
      break

    case "satellite":
      // MapTiler Satellite style
      L.tileLayer(
        `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${maptilerApiKey}`,
        {
          attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
          tileSize: 512,
          zoomOffset: -1,
        }
      ).addTo(map.value)
      break
  }
}

// Add a new function to handle map style changes from settings
const handleMapStyleChange = (newStyle) => {
  currentMapStyle.value = newStyle
  if (map.value) {
    updateMapStyle(newStyle)
  }
}

// Listen for storage events to sync across tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'mapStyle') {
    handleMapStyleChange(e.newValue || 'standard')
  }
})



watch(
  () => settingsStore.getMapStyle,
  (newStyle) => {
    if (map.value) {
      updateMapStyle(newStyle)
    }
  }
)


// Expose methods to parent
defineExpose({
  addMarker,
  drawRoute,
  highlightRoute,
  clearHighlights,
  setView: (coords, zoom = 16) => map.value?.setView(coords, zoom),
  updateMapStyle: handleMapStyleChange // Expose this method
})
</script>

<style scoped>
.custom-location-icon {
  background: transparent;
  border: none;
}

.custom-transfer-icon {
  background: transparent;
  border: none;
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