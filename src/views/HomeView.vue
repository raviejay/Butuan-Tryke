<template>
  <div class="relative w-screen h-screen">
    <!-- Fullscreen Map -->
    <div id="map" class="w-full h-full z-0"></div>

    <div class="absolute top-4 left-4 z-20 w-40 h-24 md:w-40 md:h-24 object-contain">
      <img src="@/assets/logo3.png" alt="Butuan Tryke" />
    </div>

    <!-- Floating Logo and File Upload -->
    <div class="absolute top-28 left-4 z-20">
      <div class="bg-white rounded-lg shadow-lg px-3 py-2 mb-2">
        <h1 class="text-lg font-bold text-orange-600">Butuan Tryke</h1>
        <p class="text-xs text-gray-500">Multi-Zone Routes</p>
      </div>

      <!-- File Upload for Multiple GeoJSON -->
      <div class="bg-white rounded-lg shadow-lg p-3">
        <label class="block text-xs font-medium text-gray-700 mb-1"> Load Zone Routes </label>
        <input
          type="file"
          accept=".json,.geojson"
          multiple
          @change="handleFileUpload"
          class="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
        />
        <div v-if="isLoading" class="flex items-center mt-2 text-xs text-orange-600">
          <div class="loading-spinner mr-2"></div>
          Loading routes...
        </div>
        <div v-if="loadingError" class="mt-2 text-xs text-red-600">
          {{ loadingError }}
        </div>
        <div v-if="loadedRoutes.length > 0" class="mt-2 text-xs text-green-600">
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
    <div class="absolute top-4 right-4 z-20 bg-white rounded-lg shadow-lg px-3 py-2">
      <div class="text-sm font-medium text-gray-700">
        Click map for:
        <span
          :class="activeField === 'start' ? 'text-green-600' : 'text-red-600'"
          class="font-bold"
        >
          {{ activeField === 'start' ? 'Start' : 'End' }}
        </span>
      </div>
    </div>

    <!-- Route Suggestions Panel (Desktop Only) -->
    <div
      v-if="routeSuggestions.length > 0"
      class="hidden md:block absolute top-20 right-4 z-20 bg-white rounded-lg shadow-lg p-4 max-w-sm max-h-96 overflow-y-auto"
    >
      <h3 class="font-bold text-gray-800 mb-3 flex items-center">
        <svg
          class="w-5 h-5 text-blue-600 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        Route Suggestions ({{ routeSuggestions.length }})
      </h3>
      <div class="space-y-3">
        <div
          v-for="(suggestion, index) in routeSuggestions"
          :key="index"
          class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
          :class="
            suggestion.type === 'transfer' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
          "
          @click="highlightRoute(suggestion)"
        >
          <!-- Transfer Route Display -->
          <div v-if="suggestion.type === 'transfer'" class="space-y-2">
            <div class="flex items-center text-yellow-600 font-semibold text-sm">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"
                />
              </svg>
              Transfer Route ({{ suggestion.legs.length }} rides)
            </div>

            <div v-for="(leg, legIndex) in suggestion.legs" :key="legIndex" class="ml-4 text-sm">
              <div class="flex items-center">
                <span
                  class="w-2 h-2 rounded-full mr-2"
                  :style="{ backgroundColor: leg.color }"
                ></span>
                <span class="font-medium">{{ leg.zone }} Zone</span>
                <span class="ml-2 text-gray-600">₱{{ leg.fare }}</span>
              </div>
              <div class="text-xs text-gray-500 ml-4">{{ leg.description }}</div>
            </div>

            <div class="border-t pt-2 text-sm">
              <div class="flex justify-between items-center">
                <span class="font-semibold text-green-600">Total: ₱{{ suggestion.totalFare }}</span>
                <span class="text-xs text-gray-500"
                  >{{ suggestion.totalWalkDistance }}m total walk</span
                >
              </div>
              <div v-if="suggestion.transferPoints" class="text-xs text-blue-600 mt-1">
                Transfer at: {{ suggestion.transferPoints.join(', ') }}
              </div>
            </div>
          </div>

          <!-- Direct Route Display -->
          <div v-else>
            <div class="font-semibold text-blue-600">{{ suggestion.route }}</div>
            <div class="text-sm text-gray-600">{{ suggestion.description }}</div>
            <div
              v-if="suggestion.actualDistance && suggestion.actualDuration"
              class="text-xs text-blue-600 mt-1"
            >
              📍 Route: {{ suggestion.actualDistance }}km • {{ suggestion.actualDuration }} min
            </div>
            <div class="text-sm text-gray-600 mt-1">
              <span
                class="inline-block px-2 py-1 rounded text-xs"
                :style="{ backgroundColor: suggestion.color + '20', color: suggestion.color }"
              >
                {{ suggestion.zone }} Zone
              </span>
              <span class="ml-2 text-green-600 font-medium">₱{{ suggestion.fare }}</span>
              <div class="text-xs text-gray-400 mt-1">
                <span v-if="suggestion.startDistance > 0.1">
                  Start: {{ (suggestion.startDistance * 1000).toFixed(0) }}m walk
                </span>
                <span v-if="suggestion.endDistance > 0.1" class="ml-2">
                  End: {{ (suggestion.endDistance * 1000).toFixed(0) }}m walk
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        @click="clearSuggestions"
        class="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
      >
        Clear suggestions
      </button>
    </div>

    <!-- Inputs: Desktop (visible only on md and up) -->
    <div class="hidden md:block absolute bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-10">
      <div class="bg-white shadow-xl rounded-xl p-4 relative">
        <!-- Search Suggestions -->
        <div
          v-if="showSuggestions && searchSuggestions.length > 0"
          class="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          <div
            v-for="(place, index) in searchSuggestions"
            :key="index"
            @click="selectSuggestion(place)"
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
          >
            <svg
              class="w-4 h-4 text-gray-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            {{ place.name }}
          </div>
        </div>

        <input
          v-model="start"
          @input="handleInputChange($event.target.value, 'start')"
          @focus="setActiveField('start')"
          type="text"
          placeholder="Start location (click map or search)"
          class="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <input
          v-model="destination"
          @input="handleInputChange($event.target.value, 'destination')"
          @focus="setActiveField('destination')"
          type="text"
          placeholder="Destination (click map or search)"
          class="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          @click="findTricycleRoute"
          :disabled="!startCoords || !destinationCoords"
          class="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <svg
            v-if="isLoading"
            class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Find Ride
        </button>
      </div>
    </div>

    <!-- Bottom Sheet (Mobile Only) -->
    <div
      class="md:hidden fixed bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-lg transition-transform duration-300 z-20"
      :class="{
        'translate-y-[70%]': !isOpen && routeSuggestions.length === 0,
        'translate-y-0': isOpen || routeSuggestions.length > 0,
      }"
      @touchstart="startDrag"
      @touchmove="onDrag"
      @touchend="endDrag"
    >
      <!-- Drag Handle -->
      <div class="w-full flex justify-center py-2">
        <div class="h-1.5 w-12 bg-gray-400 rounded-full"></div>
      </div>

      <div class="p-4 relative max-h-[80vh] overflow-y-auto">
        <!-- Search Suggestions for Mobile -->
        <div
          v-if="showSuggestions && searchSuggestions.length > 0"
          class="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          <div
            v-for="(place, index) in searchSuggestions"
            :key="index"
            @click="selectSuggestion(place)"
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
          >
            <svg
              class="w-4 h-4 text-gray-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            {{ place.name }}
          </div>
        </div>

        <input
          v-model="start"
          @input="handleInputChange($event.target.value, 'start')"
          @focus="setActiveField('start')"
          type="text"
          placeholder="Start location (tap map or search)"
          class="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <input
          v-model="destination"
          @input="handleInputChange($event.target.value, 'destination')"
          @focus="setActiveField('destination')"
          type="text"
          placeholder="Destination (tap map or search)"
          class="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />

        <!-- Route Suggestions Panel (Mobile - Inside Bottom Sheet) -->
        <div v-if="routeSuggestions.length > 0" class="mb-4">
          <h3 class="font-bold text-gray-800 mb-3 flex items-center text-sm">
            <svg
              class="w-4 h-4 text-blue-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            Route Suggestions ({{ routeSuggestions.length }})
          </h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(suggestion, index) in routeSuggestions"
              :key="index"
              class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              :class="
                suggestion.type === 'transfer'
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-200'
              "
              @click="highlightRoute(suggestion)"
            >
              <!-- Transfer Route Display -->
              <div v-if="suggestion.type === 'transfer'" class="space-y-2">
                <div class="flex items-center text-yellow-600 font-semibold text-xs">
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"
                    />
                  </svg>
                  Transfer Route ({{ suggestion.legs.length }} rides)
                </div>

                <div
                  v-for="(leg, legIndex) in suggestion.legs"
                  :key="legIndex"
                  class="ml-3 text-xs"
                >
                  <div class="flex items-center">
                    <span
                      class="w-2 h-2 rounded-full mr-2"
                      :style="{ backgroundColor: leg.color }"
                    ></span>
                    <span class="font-medium">{{ leg.zone }} Zone</span>
                    <span class="ml-2 text-gray-600">₱{{ leg.fare }}</span>
                  </div>
                  <div class="text-xs text-gray-500 ml-4">{{ leg.description }}</div>
                </div>

                <div class="border-t pt-2 text-xs">
                  <div class="flex justify-between items-center">
                    <span class="font-semibold text-green-600"
                      >Total: ₱{{ suggestion.totalFare }}</span
                    >
                    <span class="text-xs text-gray-500"
                      >{{ suggestion.totalWalkDistance }}m walk</span
                    >
                  </div>
                  <div v-if="suggestion.transferPoints" class="text-xs text-blue-600 mt-1">
                    Transfer at: {{ suggestion.transferPoints.join(', ') }}
                  </div>
                </div>
              </div>

              <!-- Direct Route Display -->
              <div v-else>
                <div class="font-semibold text-blue-600 text-sm">{{ suggestion.route }}</div>
                <div class="text-xs text-gray-600">{{ suggestion.description }}</div>
                <div
                  v-if="suggestion.actualDistance && suggestion.actualDuration"
                  class="text-xs text-blue-600 mt-1"
                >
                  📍 Route: {{ suggestion.actualDistance }}km • {{ suggestion.actualDuration }} min
                </div>
                <div class="text-xs text-gray-600 mt-1">
                  <span
                    class="inline-block px-2 py-1 rounded text-xs"
                    :style="{ backgroundColor: suggestion.color + '20', color: suggestion.color }"
                  >
                    {{ suggestion.zone }} Zone
                  </span>
                  <span class="ml-2 text-green-600 font-medium">₱{{ suggestion.fare }}</span>
                  <div class="text-xs text-gray-400 mt-1">
                    <span v-if="suggestion.startDistance > 0.1">
                      Start: {{ (suggestion.startDistance * 1000).toFixed(0) }}m walk
                    </span>
                    <span v-if="suggestion.endDistance > 0.1" class="ml-2">
                      End: {{ (suggestion.endDistance * 1000).toFixed(0) }}m walk
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            @click="clearSuggestions"
            class="w-full mt-3 text-xs text-gray-500 hover:text-gray-700"
          >
            Clear suggestions
          </button>
        </div>

        <button
          @click="findTricycleRoute"
          :disabled="!startCoords || !destinationCoords"
          class="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <svg
            v-if="isLoading"
            class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Find Ride
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import L from 'leaflet'

const start = ref('')
const destination = ref('')
const map = ref(null)
const activeField = ref('start')
const searchSuggestions = ref([])
const showSuggestions = ref(false)
const routeSuggestions = ref([])

// Marker references
const startMarker = ref(null)
const destinationMarker = ref(null)
const routePolyline = ref(null)
const highlightedRoutes = ref([])

// Coordinates for routing
const startCoords = ref(null)
const destinationCoords = ref(null)

// Butuan places database
const butuanPlaces = [
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

// Multiple zone GeoJSON data loading
const loadedRoutes = ref([])
const isLoading = ref(false)
const loadingError = ref(null)

// Zone configuration
const zoneConfig = {
  orange: { name: 'Orange Zone Tricycle Route', color: '#ea580c', baseFare: 15 },
  red: { name: 'Red Zone Tricycle Route', color: '#dc2626', baseFare: 12 },
  blue: { name: 'Blue Zone Tricycle Route', color: '#2563eb', baseFare: 18 },
  green: { name: 'Green Zone Tricycle Route', color: '#16a34a', baseFare: 14 },
}

// Helper functions
const detectZoneType = (filename) => {
  const name = filename.toLowerCase()
  if (name.includes('red')) return 'red'
  if (name.includes('blue')) return 'blue'
  if (name.includes('green')) return 'green'
  return 'orange' // default
}

const readFileAsJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Process GeoJSON data for multiple zones
const processGeoJSONRoutes = (geojsonData, zoneType = 'orange') => {
  const routePaths = []
  let minLat = Infinity,
    maxLat = -Infinity
  let minLng = Infinity,
    maxLng = -Infinity

  // Combine all features into one route
  geojsonData.features.forEach((feature) => {
    feature.geometry.coordinates.forEach((lineString) => {
      const path = lineString.map((coord) => [coord[1], coord[0]]) // Convert to [lat,lng]
      routePaths.push(path)

      // Update bounds
      lineString.forEach(([lng, lat]) => {
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
        minLng = Math.min(minLng, lng)
        maxLng = Math.max(maxLng, lng)
      })
    })
  })

  const config = zoneConfig[zoneType] || zoneConfig.orange

  // Create route object
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

// Load multiple zone data
const loadMultipleZoneData = async (files = null) => {
  isLoading.value = true
  loadingError.value = null

  try {
    const routes = []

    if (files && files.length > 0) {
      // Load from uploaded files
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const zoneType = detectZoneType(file.name)
        const geojsonData = await readFileAsJSON(file)
        routes.push(processGeoJSONRoutes(geojsonData, zoneType))
      }
    } else {
      // Load from default files
      const zoneFiles = [
        { url: '/data/orange_routes_final.geojson', type: 'orange' },
        { url: '/data/red_tricycle_zone.geojson', type: 'red' },
        // Add more zones as needed
      ]

      for (const { url, type } of zoneFiles) {
        try {
          const response = await fetch(url)
          if (response.ok) {
            const geojsonData = await response.json()
            routes.push(processGeoJSONRoutes(geojsonData, type))
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
        routes.push(processGeoJSONRoutes(fallbackData, 'orange'))
      }
    }

    loadedRoutes.value = routes
  } catch (error) {
    console.error('Error loading zone data:', error)
    loadingError.value = error.message
  } finally {
    isLoading.value = false
  }
}

// Function to handle file upload
const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  loadMultipleZoneData(files)
}

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

// Function to calculate distance between two points (Haversine formula)
const calculateDistance = (point1, point2) => {
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
const calculateNearestDistance = (point, route) => {
  let minDistance = Infinity
  route.routes.forEach((routePath) => {
    routePath.forEach((pathPoint) => {
      const distance = calculateDistance(point, pathPoint)
      minDistance = Math.min(minDistance, distance)
    })
  })
  return minDistance
}

// Find nearest point on route
const findNearestPointOnRoute = (point, route) => {
  let minDistance = Infinity
  let nearestPoint = null

  route.routes.forEach((routePath) => {
    routePath.forEach((pathPoint) => {
      const distance = calculateDistance(point, pathPoint)
      if (distance < minDistance) {
        minDistance = distance
        nearestPoint = pathPoint
      }
    })
  })

  return { point: nearestPoint, distance: minDistance }
}

// Calculate fare based on distance
const calculateFare = (distance, baseFare) => {
  return baseFare + Math.max(0, Math.floor((distance - 1) * 5)) // ₱5 per km after first km
}

// Get route description based on walking distances
const getRouteDescription = (startDist, endDist) => {
  if (startDist < 0.1 && endDist < 0.1) return 'Direct route available'
  const parts = []
  if (startDist > 0.1) parts.push(`${(startDist * 1000).toFixed(0)}m to start`)
  if (endDist > 0.1) parts.push(`${(endDist * 1000).toFixed(0)}m from end`)
  return `Walk ${parts.join(' and ')}`
}

// Find intersection points between routes (for transfers)
const findTransferPoints = (route1, route2, maxDistance = 0.2) => {
  const transferPoints = []

  route1.routes.forEach((path1) => {
    path1.forEach((point1) => {
      route2.routes.forEach((path2) => {
        path2.forEach((point2) => {
          const distance = calculateDistance(point1, point2)
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
      (existing) => calculateDistance(transfer.point, existing.point) < 0.1,
    )
    if (!isDuplicate) {
      uniqueTransfers.push(transfer)
    }
  })

  return uniqueTransfers.slice(0, 3) // Limit to 3 transfer points
}

// Find best transfer combinations
const findBestTransfers = (startPoint, endPoint, transferOptions) => {
  const transfers = []

  // Find routes accessible from start
  const startRoutes = transferOptions.filter((opt) => opt.startAccessible)
  // Find routes accessible to end
  const endRoutes = transferOptions.filter((opt) => opt.endAccessible)

  // Look for transfer combinations
  startRoutes.forEach((startRoute) => {
    endRoutes.forEach((endRoute) => {
      if (startRoute.route.id !== endRoute.route.id) {
        // Find transfer points between these two routes
        const transferPoints = findTransferPoints(startRoute.route, endRoute.route)

        if (transferPoints.length > 0) {
          // Use the best transfer point (closest to both routes)
          const bestTransfer = transferPoints.sort((a, b) => a.distance - b.distance)[0]

          // Calculate distances and fares for each leg
          const leg1Distance = calculateDistance(startPoint, bestTransfer.route1Point)
          const leg2Distance = calculateDistance(bestTransfer.route2Point, endPoint)
          const transferWalkDistance = bestTransfer.distance * 1000 // Convert to meters

          const leg1Fare = calculateFare(leg1Distance, startRoute.route.baseFare)
          const leg2Fare = calculateFare(leg2Distance, endRoute.route.baseFare)
          const totalFare = leg1Fare + leg2Fare

          const totalWalkDistance =
            startRoute.startDistance * 1000 + transferWalkDistance + endRoute.endDistance * 1000

          // Only suggest if total walk distance is reasonable (< 1km)
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

// Enhanced route suggestion with transfer logic
const suggestTricycleRouteWithTransfers = (startPoint, endPoint) => {
  if (loadedRoutes.value.length === 0) return []

  const suggestions = []
  const directRoutes = []
  const transferOptions = []

  // Check each zone for direct routes
  loadedRoutes.value.forEach((route) => {
    const startDistance = calculateNearestDistance(startPoint, route)
    const endDistance = calculateNearestDistance(endPoint, route)
    const totalDistance = calculateDistance(startPoint, endPoint)

    // Direct route within same zone (walking distance < 500m)
    if (startDistance < 0.5 && endDistance < 0.5) {
      const fare = calculateFare(totalDistance, route.baseFare)

      directRoutes.push({
        type: 'direct',
        route: route.name,
        zone: route.zone,
        color: route.color,
        fare: fare,
        description: getRouteDescription(startDistance, endDistance),
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
    const transfers = findBestTransfers(startPoint, endPoint, transferOptions)
    suggestions.push(...transfers)
  }

  // Sort by total fare and convenience
  return suggestions
    .sort((a, b) => {
      // Prioritize direct routes
      if (a.transferCount !== b.transferCount) {
        return a.transferCount - b.transferCount
      }
      // Then by total fare
      return a.totalFare - b.totalFare
    })
    .slice(0, 5) // Limit to top 5 suggestions
}

// Function to highlight the route on the map
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
          dashArray: index === 0 ? '0' : '10, 5', // Solid for first route, dashed for second
        }).addTo(map.value)
        highlightedRoutes.value.push(polyline)
      })
    })

    // Add transfer point marker
    if (suggestion.transferPoint) {
      const transferMarker = L.marker(suggestion.transferPoint, {
        icon: createCustomIcon('#fbbf24'), // Yellow for transfer point
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

// Function to clear suggestions and highlights
const clearSuggestions = () => {
  routeSuggestions.value = []
  highlightedRoutes.value.forEach((layer) => {
    map.value.removeLayer(layer)
  })
  highlightedRoutes.value = []
  map.value.closePopup()
}

const calculateAndDrawRoute = async () => {
  if (!startCoords.value || !destinationCoords.value) {
    alert('Please select both start and destination locations')
    return
  }

  try {
    // Remove existing route if any
    if (routePolyline.value) {
      map.value.removeLayer(routePolyline.value)
    }

    // Using OSRM (Open Source Routing Machine) for actual route calculation
    const startCoord = `${startCoords.value[1]},${startCoords.value[0]}`
    const endCoord = `${destinationCoords.value[1]},${destinationCoords.value[0]}`
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoord};${endCoord}?geometries=geojson&overview=full`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      const coordinates = route.geometry.coordinates

      // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
      const leafletCoords = coordinates.map((coord) => [coord[1], coord[0]])

      // Draw the route polyline
      routePolyline.value = L.polyline(leafletCoords, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1,
      }).addTo(map.value)

      // Fit map to show the entire route
      const bounds = L.latLngBounds(leafletCoords)
      map.value.fitBounds(bounds.pad(0.1))

      // Show route info
      const distance = (route.distance / 1000).toFixed(2)
      const duration = Math.round(route.duration / 60)

      // Update the route info in suggestions if available
      if (routeSuggestions.value.length > 0) {
        routeSuggestions.value.forEach((suggestion) => {
          if (suggestion.type !== 'transfer') {
            suggestion.actualDistance = distance
            suggestion.actualDuration = duration
          }
        })
      }
    } else {
      throw new Error('No route found')
    }
  } catch (error) {
    console.error('Error calculating route:', error)

    // Fallback: draw a straight line between points
    if (routePolyline.value) {
      map.value.removeLayer(routePolyline.value)
    }

    routePolyline.value = L.polyline([startCoords.value, destinationCoords.value], {
      color: '#ef4444',
      weight: 3,
      opacity: 0.7,
      dashArray: '10, 10',
    }).addTo(map.value)
  }
}

// Main function to find tricycle route
const findTricycleRoute = async () => {
  if (!startCoords.value || !destinationCoords.value) {
    alert('Please select both start and destination locations by clicking on the map')
    return
  }

  if (loadedRoutes.value.length === 0) {
    alert(
      'No tricycle routes loaded. Please upload zone GeoJSON files or check if the default data is available.',
    )
    return
  }

  // Use the enhanced suggestion function that includes transfers
  const suggestions = suggestTricycleRouteWithTransfers(startCoords.value, destinationCoords.value)
  routeSuggestions.value = suggestions

  if (suggestions.length === 0) {
    alert(
      'No tricycle routes found for your selected locations. Try selecting points closer to the route areas or check if multiple zones are loaded for transfer options.',
    )
  }

  await calculateAndDrawRoute()
}

onMounted(async () => {
  // Load multiple zone data
  await loadMultipleZoneData()

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

  // Add all zone tricycle routes to map
  loadedRoutes.value.forEach((route) => {
    route.routes.forEach((routePath) => {
      L.polyline(routePath, {
        color: route.color,
        weight: 3,
        opacity: 0.7,
        dashArray: '8, 12',
      }).addTo(map.value)
    })
  })

  // Add click handler to map
  map.value.on('click', handleMapClick)

  // Handle zoom events
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
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.off('click', handleMapClick)
    map.value.off('zoomend')
    map.value.off('drag')
    map.value.remove()
  }
})

const handleMapClick = async (e) => {
  const { lat, lng } = e.latlng
  const locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`

  if (activeField.value === 'start') {
    start.value = locationName
    startCoords.value = [lat, lng]
    safeAddMarker([lat, lng], '#10b981', true).bindPopup('Start Location')
  } else {
    destination.value = locationName
    destinationCoords.value = [lat, lng]
    safeAddMarker([lat, lng], '#ef4444', false).bindPopup('Destination')
  }

  // Try to get address from coordinates (reverse geocoding)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    )
    const data = await response.json()
    if (data.display_name) {
      if (activeField.value === 'start') {
        start.value = data.display_name
      } else {
        destination.value = data.display_name
      }
    }
  } catch (error) {
    console.log('Reverse geocoding failed, using coordinates')
  }

  // Auto-find tricycle route and draw route line if both points are set
  if (startCoords.value && destinationCoords.value) {
    findTricycleRoute()
  }
}

const searchPlaces = (query) => {
  if (!query.trim()) {
    searchSuggestions.value = []
    showSuggestions.value = false
    return
  }

  const filtered = butuanPlaces.filter((place) =>
    place.name.toLowerCase().includes(query.toLowerCase()),
  )

  searchSuggestions.value = filtered
  showSuggestions.value = true
}

const handleInputChange = (value, field) => {
  if (field === 'start') {
    start.value = value
    activeField.value = 'start'
  } else {
    destination.value = value
    activeField.value = 'destination'
  }
  searchPlaces(value)
}

const setActiveField = (field) => {
  activeField.value = field
}

const selectSuggestion = async (place) => {
  if (activeField.value === 'start') {
    start.value = place.name
    startCoords.value = [place.lat, place.lng]
    safeAddMarker([place.lat, place.lng], '#10b981', true).bindPopup(place.name)
    map.value.setView([place.lat, place.lng], 16)
  } else {
    destination.value = place.name
    destinationCoords.value = [place.lat, place.lng]
    safeAddMarker([place.lat, place.lng], '#ef4444', false).bindPopup(place.name)
    map.value.setView([place.lat, place.lng], 16)
  }
  showSuggestions.value = false

  if (startCoords.value && destinationCoords.value) {
    findTricycleRoute()
  }
}

// Draggable bottom sheet logic
const isOpen = ref(true)
let startY = 0
let currentY = 0
let dragDiff = 0

const startDrag = (e) => {
  startY = e.touches[0].clientY
}

const onDrag = (e) => {
  currentY = e.touches[0].clientY
  dragDiff = currentY - startY
}

const endDrag = () => {
  if (dragDiff > 50) {
    isOpen.value = false
  } else if (dragDiff < -50) {
    isOpen.value = true
  }
  dragDiff = 0
}
</script>

<style>
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

/* Ensure map container fills its parent */
#map {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* Improve cursor behavior */
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
