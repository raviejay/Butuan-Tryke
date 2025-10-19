<template>
  <div class="relative w-full h-full">
    <!-- Fullscreen Map -->
    <div id="map" class="w-full h-full z-0"></div>

    <!-- Logo (Desktop Only) -->
    <div class="absolute hidden md:block top-4 left-4 z-20 w-40 h-24 md:w-40 md:h-24 object-contain">
      <img src="@/assets/logo3.png" alt="Butuan Tryke" />
    </div>

    <!-- Mobile Burger Menu -->
    <div class="absolute block md:hidden top-4 left-4 z-[100]">
      <button
        @click="toggleMobileMenu"
        class="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
        :class="{ 'bg-orange-50': isMobileMenuOpen }"
      >
        <svg 
          class="w-6 h-6 text-orange-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            v-if="!isMobileMenuOpen"
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M4 6h16M4 12h16M4 18h16"
          />
          <path 
            v-else
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Mobile Menu Panel -->
    <Transition name="slide-fade">
      <div 
        v-if="isMobileMenuOpen"
        class="absolute block md:hidden top-20 left-4 right-4 z-[100] bg-white rounded-lg shadow-2xl max-h-[70vh] overflow-y-auto"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 rounded-t-lg">
          <div class="flex items-center space-x-2">
            <img :src="orangeIconUrl" class="w-8 h-8" alt="Butuan Tryke">
            <div>
              <h2 class="text-white font-bold text-sm">Butuan Tryke</h2>
              <p class="text-orange-100 text-xs">Multi-Zone Routes</p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4">
          <!-- Status -->
          <div v-if="isLoading" class="flex items-center text-xs text-orange-600 mb-3">
            <div class="loading-spinner mr-2"></div>
            Loading routes...
          </div>
          
          <div v-if="loadingError" class="text-xs text-red-600 mb-3">
            {{ loadingError }}
          </div>
          
          <div v-if="loadedRoutes.length > 0" class="flex items-center justify-between mb-3">
            <span class="text-xs text-green-600">
              ✓ {{ loadedRoutes.length }} zone(s) loaded
            </span>
            <button
              @click="toggleAllZones"
              class="text-xs px-3 py-1.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors font-medium"
            >
              {{ allZonesVisible ? 'Hide All' : 'Show All' }}
            </button>
          </div>

          <!-- Zone Cards -->
          <div v-if="loadedRoutes.length > 0" class="space-y-2">
            <button
              v-for="route in loadedRoutes"
              :key="route.id"
              @click="toggleZoneVisibility(route.id)"
              class="w-full text-left p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
              :style="{
                backgroundColor: visibleZones.has(route.id) ? route.color + '10' : '#ffffff',
                borderColor: visibleZones.has(route.id) ? route.color : '#e5e7eb'
              }"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div 
                    class="w-10 h-10 rounded-full flex items-center justify-center"
                    :style="{ backgroundColor: route.color + '20' }"
                  >
                    <span 
                      class="text-lg font-bold"
                      :style="{ color: route.color }"
                    >
                      {{ route.zone.charAt(0) }}
                    </span>
                  </div>
                  <div>
                    <div 
                      class="font-semibold text-sm"
                      :style="{ color: route.color }"
                    >
                      {{ route.zone }} Zone
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ route.routes ? route.routes.length : 0 }} path(s)
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <span 
                    class="material-symbols-outlined text-xl"
                    :style="{ color: visibleZones.has(route.id) ? route.color : '#9ca3af' }"
                  >
                    {{ visibleZones.has(route.id) ? 'visibility' : 'visibility_off' }}
                  </span>
                </div>
              </div>
            </button>
          </div>

          <!-- Visible Routes Summary -->
          <div v-if="visibleZones.size > 0" class="mt-4 pt-4 border-t border-gray-200">
            <div class="text-xs font-medium text-gray-700 mb-2">Currently Visible:</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="route in visibleRoutesInfo"
                :key="route.id"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :style="{
                  backgroundColor: route.color + '20',
                  color: route.color
                }"
              >
                {{ route.zone }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Desktop Zone Info -->
    <div class="absolute hidden md:block top-28 left-4 z-20">
      <div class="bg-white rounded-lg shadow-lg px-3 py-2 mb-2">
        <h1 class="text-lg font-bold text-orange-600">Butuan Tryke</h1>
        <p class="text-xs text-gray-500">Multi-Zone Routes</p>
      </div> 

      <!-- Zone Status with Clickable Routes -->
      <div class="bg-white rounded-lg shadow-lg p-3">
        <!-- Panel Header with Minimize Button -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <img :src="orangeIconUrl" class="w-6 h-6" alt="Zone Status Icon">
            <label class="text-sm font-medium text-orange-600">Zone available</label>
          </div>

          <div class="flex items-center gap-2">
            <!-- Minimize/Expand Button (Mobile Only) -->
            <button
              @click="togglePanelMinimized"
              class="md:hidden text-xs p-1 rounded hover:bg-gray-100 transition-colors"
              :title="isPanelMinimized ? 'Expand panel' : 'Minimize panel'"
            >
              <span class="material-symbols-outlined" style="font-size: 14px;">
                {{ isPanelMinimized ? 'expand_more' : 'expand_less' }}
              </span>
            </button>
            
            <!-- Show/Hide All Button -->
            <button
              v-if="loadedRoutes.length > 0 && !isPanelMinimized"
              @click="toggleAllZones"
              class="text-xs px-2 py-1 rounded bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
            >
              {{ allZonesVisible ? 'Hide All' : 'Show All' }}
            </button>
          </div>
        </div>
        
        <!-- Panel Content (collapsible on mobile) -->
        <div 
          class="transition-all duration-300 ease-in-out overflow-hidden"
          :class="{
            'md:block': true,
            'block': !isPanelMinimized,
            'hidden': isPanelMinimized
          }"
        >
          <div v-if="isLoading" class="flex items-center text-xs text-orange-600">
            <div class="loading-spinner mr-2"></div>
            Loading routes...
          </div>
          
          <div v-if="loadingError" class="text-xs text-red-600">
            {{ loadingError }}
          </div>
          
          <div v-if="loadedRoutes.length > 0" class="text-xs text-green-600 mb-2">
            ✓ {{ loadedRoutes.length }} zone(s) loaded
          </div>
          
          <!-- Clickable Zone Pills -->
          <div v-if="loadedRoutes.length > 0" class="flex flex-wrap gap-0.5">
            <button
              v-for="route in loadedRoutes"
              :key="route.id"
              @click="toggleZoneVisibility(route.id)"
              class="inline-block px-1 py-0.5 rounded-sm text-xs transition-all duration-200 border cursor-pointer hover:scale-105"
              :style="getZoneButtonStyle(route)"
              :title="`Click to ${visibleZones.has(route.id) ? 'hide' : 'show'} ${route.zone} route`"
            >
              <span class="flex items-center gap-0.5">
                <span class="text-xs">{{ route.zone }}</span>
                <span class="material-symbols-outlined" style="font-size: 8px; line-height: 1;">
                  {{ visibleZones.has(route.id) ? 'visibility' : 'visibility_off' }}
                </span>
              </span>
            </button>
          </div>
          
          <!-- Zone Legend (when zones are visible) -->
          <div v-if="loadedRoutes.length > 0 && visibleZones.size > 0" class="mt-2 pt-2 border-t border-gray-200">
            <div class="text-xs text-gray-500 mb-1">Visible Routes:</div>
            <div class="text-xs space-y-1">
              <div
                v-for="route in visibleRoutesInfo"
                :key="route.id"
                class="flex items-center justify-between"
              >
                <span :style="{ color: route.color }">● {{ route.zone }}</span>
                <span class="text-gray-400">{{ route.routeCount }} path(s)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Minimized State - Show Zone Icons Only (Mobile) -->
        <div 
          v-if="isPanelMinimized && loadedRoutes.length > 0"
          class="md:hidden flex flex-wrap gap-1 mt-2"
        >
          <button
            v-for="route in loadedRoutes"
            :key="`mini-${route.id}`"
            @click="toggleZoneVisibility(route.id)"
            class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110"
            :style="getMinimizedZoneStyle(route)"
            :title="`${route.zone} - Click to ${visibleZones.has(route.id) ? 'hide' : 'show'} route`"
          >
            <span 
              class="text-xs font-bold"
              :style="{ color: visibleZones.has(route.id) ? route.color : '#9ca3af' }"
            >
              {{ route.zone.charAt(0) }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Zone Image Popup (appears on viewport center for 5 seconds) -->
    <div
      v-if="selectedZoneImage"
      class="fixed top-1/2 left-1/2 transform -translate-x-5 -translate-y-1/2 z-50 animate-fade-in-out"
    >
      <div class="">
        <div class="flex flex-col items-center">
          <img
            :src="selectedZoneImage.imagePath"
            :alt="selectedZoneImage.zoneName"
            class="w-24 h-24 object-contain mb-3 opacity-90"
          />
          <h3 class="text-lg font-bold text-orange-600">{{ selectedZoneImage.zoneName }}</h3>
          <p class="text-xs text-gray-500 mt-1">Zone Route</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import L from 'leaflet'
import { useSettingsStore } from '@/stores/settings'
import RouteRestrictionChecker from '@/utils/RouteRestrictionChecker'
import { restrictedPolyGeoJSON } from '@/utils/restrictedPolyData.js'

// Import zone icons
import whiteIcon from '@/assets/white_icon.ico'
import greenIcon from '@/assets/green_icon.ico'
import orangeIcon from '@/assets/orange_icon.ico'
import redIcon from '@/assets/red_icon.ico'
import yellowIcon from '@/assets/yellow_icon.ico'

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
  loadedTerminals: {
    type: Array,
    default: () => [],
  },
})

// Emits
const emit = defineEmits(['map-click', 'routes-loaded', 'zone-visibility-changed'])

// Store
const settingsStore = useSettingsStore()

// Refs
const map = ref(null)
const startMarker = ref(null)
const destinationMarker = ref(null)
const routePolyline = ref(null)
const highlightedRoutes = ref([])
const routeLayerGroups = ref(new Map())
const visibleZones = ref(new Set())
const currentMapStyle = ref(localStorage.getItem('mapStyle') || 'standard')
const isPanelMinimized = ref(false)
const selectedZoneImage = ref(null)
const terminalMarkers = ref(new Map())
const terminalLayerGroup = ref(null)
const showTerminals = ref(true)
const isMobileMenuOpen = ref(false)

// Make orange icon accessible for template
const orangeIconUrl = orangeIcon

// Zone image mapping based on zone name using imported icons
const zoneImageMap = {
  'White': whiteIcon,
  'Green': greenIcon,
  'Orange': orangeIcon,
  'Red': redIcon,
  'Yellow': yellowIcon,
}

const colorImageMap = {
  '#ef4444': redIcon,
  '#dc2626': redIcon,
  '#10b981': greenIcon,
  '#16a34a': greenIcon,
  '#f59e0b': orangeIcon,
  '#ea580c': orangeIcon,
  '#fbbf24': yellowIcon,
  '#eab308': yellowIcon,
  '#000': whiteIcon,
  '#000000': whiteIcon,
}

const getZoneImage = (zoneName, color) => {
  // Try zone name first, then fallback to color-based mapping
  if (zoneImageMap[zoneName]) {
    return zoneImageMap[zoneName]
  }
  
  return colorImageMap[color] || orangeIcon
}

// Computed properties
const allZonesVisible = computed(() => {
  return props.loadedRoutes.length > 0 && visibleZones.value.size === props.loadedRoutes.length
})

const visibleRoutesInfo = computed(() => {
  return props.loadedRoutes
    .filter(route => visibleZones.value.has(route.id))
    .map(route => ({
      ...route,
      routeCount: route.routes ? route.routes.length : 0
    }))
})

// Panel minimize functions
const togglePanelMinimized = () => {
  isPanelMinimized.value = !isPanelMinimized.value
}

// Toggle mobile menu
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Close mobile menu when zone is toggled
const toggleZoneVisibilityMobile = (zoneId) => {
  toggleZoneVisibility(zoneId)
  // Keep menu open for easy multiple selections
}

// Show zone image
const showZoneImage = (route) => {
  const imagePath = getZoneImage(route.zone, route.color)
  if (imagePath) {
    selectedZoneImage.value = {
      zoneName: route.zone,
      imagePath: imagePath
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      selectedZoneImage.value = null
    }, 5000)
  } else {
    console.warn(`No image found for zone: ${route.zone}`)
  }
}

// Zone visibility functions
const toggleZoneVisibility = (zoneId) => {
  const zone = props.loadedRoutes.find(route => route.id === zoneId)
  if (!zone) return

  if (visibleZones.value.has(zoneId)) {
    // Hide zone
    visibleZones.value.delete(zoneId)
    hideZoneOnMap(zoneId)
  } else {
    // Show zone
    visibleZones.value.add(zoneId)
    showZoneOnMap(zone)
    // Show zone image when a zone is made visible
    showZoneImage(zone)
  }
  
  // Emit event for parent component
  emit('zone-visibility-changed', {
    zoneId,
    zoneName: zone.zone,
    visible: visibleZones.value.has(zoneId),
    visibleZones: Array.from(visibleZones.value)
  })
}

const toggleAllZones = () => {
  if (allZonesVisible.value) {
    // Hide all zones
    visibleZones.value.clear()
    hideAllZonesOnMap()
  } else {
    // Show all zones
    props.loadedRoutes.forEach(route => {
      visibleZones.value.add(route.id)
      showZoneOnMap(route)
    })
    // Show image of first zone
    if (props.loadedRoutes.length > 0) {
      showZoneImage(props.loadedRoutes[0])
    }
  }
}

const getZoneButtonStyle = (route) => {
  const isVisible = visibleZones.value.has(route.id)
  return {
    backgroundColor: isVisible ? route.color + '20' : '#f3f4f6',
    color: isVisible ? route.color : '#6b7280',
    borderColor: isVisible ? route.color : '#d1d5db',
    fontWeight: isVisible ? '600' : '400'
  }
}

const getMinimizedZoneStyle = (route) => {
  const isVisible = visibleZones.value.has(route.id)
  return {
    backgroundColor: isVisible ? route.color + '15' : '#f9fafb',
    borderColor: isVisible ? route.color : '#e5e7eb',
    transform: isVisible ? 'scale(1.05)' : 'scale(1)'
  }
}

// Map zone layer management
const showZoneOnMap = (route) => {
  if (!map.value || !route.routes) return

  if (routeLayerGroups.value.has(route.id)) {
    map.value.removeLayer(routeLayerGroups.value.get(route.id))
  }

  const layerGroup = L.layerGroup()

  route.routes.forEach((routePath) => {
    const polyline = L.polyline(routePath, {
      color: route.color,
      weight: 4,
      opacity: 0.7,
      dashArray: '8, 12',
    })
    
    polyline.on('click', (e) => {
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`
          <div class="text-sm">
            <div class="font-bold" style="color: ${route.color}">${route.zone}</div>
            <div class="text-xs text-gray-600 mt-1">Click zone button to hide this route</div>
          </div>
        `)
        .openOn(map.value)
    })
    
    layerGroup.addLayer(polyline)
  })

  routeLayerGroups.value.set(route.id, layerGroup)
  layerGroup.addTo(map.value)
}

const hideZoneOnMap = (zoneId) => {
  if (!map.value) return

  const layerGroup = routeLayerGroups.value.get(zoneId)
  if (layerGroup) {
    map.value.removeLayer(layerGroup)
  }
}

const hideAllZonesOnMap = () => {
  routeLayerGroups.value.forEach((layerGroup) => {
    if (map.value) {
      map.value.removeLayer(layerGroup)
    }
  })
}

// Create custom location icon
const createLocationIcon = (color) => {
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

// Safe marker creation
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

// Add markers
const addMarker = (coords, isStart) => {
  const color = isStart ? '#10b981' : '#ef4444'
  const label = isStart ? 'Start Location' : 'Destination'
  return safeAddMarker(coords, color, isStart)?.bindPopup(label)
}

const drawRoute = (routeData, color = '#ff8800') => {
  if (routePolyline.value) {
    map.value.removeLayer(routePolyline.value)
  }

  const style = routeData.fallback
    ? { color: color, weight: 3, opacity: 0.7, dashArray: '10, 10' }
    : { color: color, weight: 5, opacity: 1, smoothFactor: 1 }

  routePolyline.value = L.polyline(routeData.coordinates, style).addTo(map.value)
  const bounds = L.latLngBounds(routeData.coordinates)
  map.value.fitBounds(bounds.pad(0.1))
}

// Highlight route suggestions
const highlightRoute = (suggestion) => {
  highlightedRoutes.value.forEach((layer) => map.value.removeLayer(layer))
  highlightedRoutes.value = []

  if (suggestion.type === 'transfer') {
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

    if (suggestion.transferPoint) {
      const transferMarker = L.marker(suggestion.transferPoint, {
        icon: createTransferIcon('#fbbf24'),
        zIndexOffset: 2000,
      }).addTo(map.value)
      highlightedRoutes.value.push(transferMarker)

      L.popup()
        .setLatLng(suggestion.transferPoint)
        .setContent(`
          <div class="text-sm">
            <div class="font-bold text-yellow-600">Transfer Point</div>
            <div>Total Fare: ₱${suggestion.totalFare}</div>
            <div>Walk Distance: ${suggestion.totalWalkDistance}m</div>
            <div class="text-xs mt-1">
              ${suggestion.legs.map((leg) => `${leg.zone}: ₱${leg.fare}`).join(' + ')}
            </div>
          </div>
        `)
        .openOn(map.value)
    }
  } else {
    suggestion.routeData.routes.forEach((routePath) => {
      const polyline = L.polyline(routePath, {
        color: suggestion.routeData.color,
        weight: 6,
        opacity: 0.9,
      }).addTo(map.value)
      highlightedRoutes.value.push(polyline)
    })

    const firstSegment = suggestion.routeData.routes[0]
    const midpoint = firstSegment[Math.floor(firstSegment.length / 2)]
    L.popup()
      .setLatLng(midpoint)
      .setContent(`
        <div class="text-sm">
          <div class="font-bold">${suggestion.route}</div>
          <div>Fare: ₱${suggestion.fare}</div>
          <div>${suggestion.description}</div>
        </div>
      `)
      .openOn(map.value)
  }
}

// Clear highlights
const clearHighlights = () => {
  highlightedRoutes.value.forEach((layer) => {
    map.value.removeLayer(layer)
  })
  highlightedRoutes.value = []
  map.value.closePopup()
}

// Create custom terminal icon
const createTerminalIcon = (iconPath, color) => {
  return L.divIcon({
    className: 'custom-terminal-icon',
    html: `
      <div class="terminal-marker" style="position: relative;">
        <div class="terminal-pin" style="
          width: 40px;
          height: 40px;
          background: white;
          border: 3px solid ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img 
            src="${iconPath}" 
            style="
              width: 24px;
              height: 24px;
              transform: rotate(45deg);
              object-fit: contain;
            "
            alt="Terminal"
          />
        </div>
        <div class="terminal-pulse" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 40px;
          height: 40px;
          border: 2px solid ${color};
          border-radius: 50%;
          opacity: 0;
          animation: pulse 2s infinite;
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  })
}

// Display terminals on map
const displayTerminals = () => {
  if (!map.value || !props.loadedTerminals) return

  // Clear existing terminal markers
  clearTerminals()

  // Create layer group for terminals
  terminalLayerGroup.value = L.layerGroup()

  props.loadedTerminals.forEach((terminal) => {
    const marker = L.marker(terminal.coordinates, {
      icon: createTerminalIcon(terminal.iconPath, terminal.color),
      zIndexOffset: 500,
      title: terminal.name,
    })

    // Create popup content
    const popupContent = `
      <div class="terminal-popup" style="min-width: 200px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <img src="${terminal.iconPath}" style="width: 24px; height: 24px;" alt="${terminal.zone}">
          <div>
            <div style="font-weight: bold; color: ${terminal.color}; font-size: 14px;">
              ${terminal.zone} Zone
            </div>
            <div style="font-size: 12px; color: #666;">
              ${terminal.name}
            </div>
          </div>
        </div>
        ${terminal.description ? `
          <div style="font-size: 11px; color: #888; margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee;">
            ${terminal.description}
          </div>
        ` : ''}
        <div style="font-size: 10px; color: #aaa; margin-top: 6px;">
          📍 ${terminal.coordinates[0].toFixed(6)}, ${terminal.coordinates[1].toFixed(6)}
        </div>
      </div>
    `

    marker.bindPopup(popupContent)

    marker.on('mouseover', function() {
      this.openPopup()
    })

    terminalMarkers.value.set(terminal.id, marker)
    terminalLayerGroup.value.addLayer(marker)
  })

  if (showTerminals.value) {
    terminalLayerGroup.value.addTo(map.value)
  }

  console.log(`Displayed ${terminalMarkers.value.size} terminal markers`)
}

// Clear terminal markers
const clearTerminals = () => {
  if (terminalLayerGroup.value && map.value) {
    map.value.removeLayer(terminalLayerGroup.value)
  }
  terminalMarkers.value.clear()
  terminalLayerGroup.value = null
}

// Watch for terminal data changes
watch(
  () => props.loadedTerminals,
  (newTerminals) => {
    if (newTerminals && newTerminals.length > 0 && map.value) {
      displayTerminals()
    }
  },
  { deep: true, immediate: true }
)

// Watch for loaded routes changes
watch(
  () => props.loadedRoutes,
  (newRoutes) => {
    visibleZones.value.clear()
    hideAllZonesOnMap()
    routeLayerGroups.value.clear()
  },
  { deep: true }
)

const updateMapStyle = (style) => {
  const maptilerApiKey = "SBAyjg2QZffT0exJjurD"
  
  map.value.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) {
      map.value.removeLayer(layer)
    }
  })

  switch (style) {
    case "standard":
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map.value)
      break

    case "minimal":
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

const handleMapStyleChange = (newStyle) => {
  currentMapStyle.value = newStyle
  if (map.value) {
    updateMapStyle(newStyle)
  }
}

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

onMounted(() => {
  const butuanBounds = L.latLngBounds(
    L.latLng(8.85, 125.45),
    L.latLng(9.05, 125.65)
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

  map.value.on('click', handleMapClick)

  map.value.on('zoomend', () => {
    if (startMarker.value) startMarker.value.update()
    if (destinationMarker.value) destinationMarker.value.update()
  })

  map.value.on('drag', () => {
    if (!butuanBounds.contains(map.value.getCenter())) {
      map.value.panInsideBounds(butuanBounds, { animate: true })
    }
  })

  if (props.loadedTerminals && props.loadedTerminals.length > 0) {
    setTimeout(() => {
      displayTerminals()
    }, 500)
  }

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

// Expose methods
defineExpose({
  addMarker,
  drawRoute,
  highlightRoute,
  clearHighlights,
  clearRoute: () => { 
    if (routePolyline.value && map.value) {
      map.value.removeLayer(routePolyline.value)
      routePolyline.value = null
    }
  },
  setView: (coords, zoom = 16) => map.value?.setView(coords, zoom),
  updateMapStyle: handleMapStyleChange,
  toggleZoneVisibility,
  showZone: (zoneId) => {
    const zone = props.loadedRoutes.find(route => route.id === zoneId)
    if (zone && !visibleZones.value.has(zoneId)) {
      toggleZoneVisibility(zoneId)
    }
  },
  hideZone: (zoneId) => {
    if (visibleZones.value.has(zoneId)) {
      toggleZoneVisibility(zoneId)
    }
  },
  togglePanelMinimized,
  setPanelMinimized: (minimized) => {
    isPanelMinimized.value = minimized
  },
  isTerminalsVisible: () => showTerminals.value,
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

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  10% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  90% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
}

.animate-fade-in-out {
  animation: fadeInOut 5s ease-in-out forwards;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Terminal marker styles */
.custom-terminal-icon {
  background: transparent !important;
  border: none !important;
}

.terminal-marker {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.terminal-pin {
  transition: transform 0.3s ease;
}

.custom-terminal-icon:hover .terminal-pin {
  transform: rotate(-45deg) scale(1.1);
}

/* Pulse animation */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.3;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.terminal-pulse {
  animation: pulse 2s infinite;
}

/* Terminal popup styles */
.terminal-popup {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.leaflet-popup-content {
  margin: 12px !important;
}

/* Mobile menu transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>