<template>
  <div class="relative w-screen h-screen">
    <!-- Splash Screen - Show while loading -->
    <SplashScreen
      v-if="isLoading || loadingError"
      :is-loading="isLoading"
      :error="loadingError"
      :progress="loadingProgress"
      @retry="retryLoading"
    />

    <!-- Main App Content - Show after loading completes -->
    <template v-else>
      <!-- Map Display Component -->
      <MapDisplay
        ref="mapComponent"

        :active-field="activeField"
        :route-suggestions="routeSuggestions"
        :loaded-routes="loadedRoutes"
        :is-loading="isLoading"
        :loading-error="loadingError"
        @map-click="handleMapClick"
        @routes-loaded="initializeRoutes"
      />

      <!-- Route Search Component -->
      <RouteSearch
        v-model:start="start"
        v-model:destination="destination"
        v-model:active-field="activeField"
        :start-coords="startCoords"
        :destination-coords="destinationCoords"
        :route-suggestions="routeSuggestions"
        :search-suggestions="searchSuggestions"
        :is-loading="isProcessing"
        @input-change="handleInputChange"
        @place-selected="handlePlaceSelected"
        @find-route="findTricycleRoute"
        @highlight-route="highlightRoute"
        @clear-suggestions="clearSuggestions"
        @current-location-selected="handleCurrentLocationSelected"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MapDisplay from '@/components/MapDisplay.vue'
import RouteSearch from '@/components/RouteSearch.vue'
import SplashScreen from './Splashscreen.vue'
import { RouteFinder } from '@/composables/RouteFinder.js'

// Reactive state
const start = ref('')
const destination = ref('')
const activeField = ref('start')
const searchSuggestions = ref([])
const routeSuggestions = ref([])
const loadedRoutes = ref([])
const isLoading = ref(true) // Start with loading true
const isProcessing = ref(false)
const loadingError = ref(null)
const loadingProgress = ref(0)

// Coordinates for routing
const startCoords = ref(null)
const destinationCoords = ref(null)

// Component refs
const mapComponent = ref(null)

// Initialize RouteFinder
const routeFinder = new RouteFinder()

// Handle map style changes from settings
const handleMapStyleChange = (newStyle) => {
  if (mapComponent.value) {
    mapComponent.value.updateMapStyle(newStyle)
  }
}

// Handle current location selection
const handleCurrentLocationSelected = async ({ lat, lng, field }) => {
  // Immediately update coordinates and show marker for better UX
  const tempLocationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`

  if (field === 'start') {
    start.value = 'Getting current location...'
    startCoords.value = [lat, lng]
    mapComponent.value?.addMarker([lat, lng], true)
    mapComponent.value?.setView([lat, lng], 16)
  } else if (field === 'destination') {
    destination.value = 'Getting current location...'
    destinationCoords.value = [lat, lng]
    mapComponent.value?.addMarker([lat, lng], false)
    mapComponent.value?.setView([lat, lng], 16)
  }

  // Asynchronously get the real address name
  try {
    const locationName = await routeFinder.reverseGeocode(lat, lng)
    
    if (field === 'start' && startCoords.value && 
        startCoords.value[0] === lat && startCoords.value[1] === lng) {
      start.value = locationName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } else if (field === 'destination' && destinationCoords.value && 
               destinationCoords.value[0] === lat && destinationCoords.value[1] === lng) {
      destination.value = locationName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  } catch (error) {
    // Keep the coordinate format if reverse geocoding fails
    console.log('Reverse geocoding failed, keeping coordinate format')
    if (field === 'start') {
      start.value = tempLocationName
    } else if (field === 'destination') {
      destination.value = tempLocationName
    }
  }
}

// Handle map click events
const handleMapClick = async ({ lat, lng, activeField: field }) => {
  // Immediately update coordinates and show marker for better UX
  const tempLocationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`

  if (field === 'start') {
    start.value = tempLocationName
    startCoords.value = [lat, lng]
    mapComponent.value?.addMarker([lat, lng], true)
  } else {
    destination.value = tempLocationName
    destinationCoords.value = [lat, lng]
    mapComponent.value?.addMarker([lat, lng], false)
  }

  // Asynchronously get the real address name without blocking UI
  routeFinder
    .reverseGeocode(lat, lng)
    .then((locationName) => {
      if (
        field === 'start' &&
        startCoords.value &&
        startCoords.value[0] === lat &&
        startCoords.value[1] === lng
      ) {
        start.value = locationName
      } else if (
        field === 'destination' &&
        destinationCoords.value &&
        destinationCoords.value[0] === lat &&
        destinationCoords.value[1] === lng
      ) {
        destination.value = locationName
      }
    })
    .catch(() => {
      // Keep the coordinate format if reverse geocoding fails
      console.log('Reverse geocoding failed, keeping coordinate format')
    })
}

// Handle input changes for search
const handleInputChange = async ({ value, field }) => {
  activeField.value = field

  try {
    const suggestions = await routeFinder.searchPlaces(value)
    searchSuggestions.value = suggestions
  } catch (error) {
    console.error('Error getting suggestions:', error)
    searchSuggestions.value = []
  }
}

// Handle place selection from suggestions
const handlePlaceSelected = async ({ place, activeField: field }) => {
  if (field === 'start') {
    start.value = place.name
    startCoords.value = [place.lat, place.lng]
    mapComponent.value?.addMarker([place.lat, place.lng], true)
    mapComponent.value?.setView([place.lat, place.lng], 16)
  } else {
    destination.value = place.name
    destinationCoords.value = [place.lat, place.lng]
    mapComponent.value?.addMarker([place.lat, place.lng], false)
    mapComponent.value?.setView([place.lat, place.lng], 16)
  }

  searchSuggestions.value = []

  // Removed auto-triggering - now only triggers when "Find Ride" button is clicked
}

// Main function to find tricycle route
const findTricycleRoute = async () => {
  if (!startCoords.value || !destinationCoords.value) {
    alert('Please select both start and destination locations')
    return
  }

  if (loadedRoutes.value.length === 0) {
    alert('No tricycle routes loaded. Please wait for the routes to load.')
    return
  }

  isProcessing.value = true

  try {
    // Clear previous suggestions and highlights first
    clearSuggestions()

    // Get route suggestions
    const suggestions = routeFinder.suggestTricycleRouteWithTransfers(
      startCoords.value,
      destinationCoords.value,
    )
    routeSuggestions.value = suggestions

    if (suggestions.length === 0) {
      alert(
        'No tricycle routes found for your selected locations. Try selecting points closer to the route areas.',
      )
      return
    }

    // Calculate and draw the actual route
    const routeData = await routeFinder.calculateRoute(startCoords.value, destinationCoords.value)

    // Update suggestions with actual route data
    if (routeData.success && routeData.distance && routeData.duration) {
      routeSuggestions.value.forEach((suggestion) => {
        if (suggestion.type !== 'transfer') {
          suggestion.actualDistance = routeData.distance
          suggestion.actualDuration = routeData.duration
        }
      })
    }

    // Draw route on map
    mapComponent.value?.drawRoute(routeData)
  } catch (error) {
    console.error('Error finding route:', error)
    alert('Error finding route. Please try again.')
  } finally {
    isProcessing.value = false
  }
}

// Highlight a specific route suggestion
const highlightRoute = (suggestion) => {
  mapComponent.value?.highlightRoute(suggestion)
}

// Clear all suggestions and highlights
const clearSuggestions = () => {
  routeSuggestions.value = []
  mapComponent.value?.clearHighlights()
}

// Initialize routes when map is ready
const initializeRoutes = async () => {
  // This can be called from MapDisplay component if needed
  // But main loading should be handled in onMounted
}

// Retry loading function for splash screen
const retryLoading = async () => {
  loadingError.value = null
  loadingProgress.value = 0
  await loadAppData()
}

// Main loading function
const loadAppData = async () => {
  isLoading.value = true
  loadingError.value = null
  loadingProgress.value = 0

  try {
    // Simulate loading steps with progress
    loadingProgress.value = 25

    // Load zone data
    const routes = await routeFinder.loadZoneData()
    loadedRoutes.value = routes
    loadingProgress.value = 75

    // Additional initialization if needed
    await new Promise((resolve) => setTimeout(resolve, 500)) // Small delay for UX
    loadingProgress.value = 100

    // Small delay before hiding splash screen
    await new Promise((resolve) => setTimeout(resolve, 300))
  } catch (error) {
    console.error('Error loading app data:', error)
    loadingError.value = error.message || 'Failed to load application data'
    loadingProgress.value = 0
  } finally {
    if (!loadingError.value) {
      isLoading.value = false
    }
  }
}

onMounted(async () => {
  // Load all app data on mount
  await loadAppData()
})
</script>