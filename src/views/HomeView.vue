<template>
  <div class="relative w-screen h-screen">
    <!-- Custom Alert Component -->
    <SimpleAlert
      :message="alertMessage"
      :icon="alertIcon"
      @hide="alertMessage = ''"
    />

    <!-- Splash Screen - Show while loading -->
    <SplashScreen
      v-if="isLoading || loadingError"
      :is-loading="isLoading"
      :error="loadingError"
      :progress="loadingProgress"
      @retry="retryLoading"
    />

    <template v-else>
      <!-- Map Display Component -->
      <MapDisplay
        ref="mapComponent"
        :active-field="activeField"
        :route-suggestions="routeSuggestions"
        :loaded-routes="loadedRoutes"
        :loaded-terminals="loadedTerminals"
        :is-loading="isLoading"
        :loading-error="loadingError"
        @map-click="handleMapClick"
        
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

    <!-- Processing Overlay - Show during route calculation (outside v-else so it always renders) -->
    <Transition name="fade">
      <div
        v-if="isProcessing"
        class="fixed inset-0 bg-white bg-opacity-50 z-[9999] flex items-center justify-center backdrop-blur-sm"
        style="pointer-events: auto;"
      >
        <div class="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 max-w-sm mx-4">
          <!-- Animated Tricycle Icon -->
          <div class="relative">
            <div class="animate-bounce">
              <img 
                src="@/assets/orange_icon.ico" 
                alt="Tricycle" 
                class="w-16 h-16 object-contain"
              />
            </div>
            <!-- Spinning loader ring -->
            <!-- <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            </div> -->
          </div>
          
          <!-- Loading Text -->
          <div class="text-center">
            <h3 class="text-xl font-bold text-gray-800 mb-1">Finding Your Route</h3>
            <p class="text-sm text-gray-600">Calculating the best tricycle path...</p>
          </div>
          
          <!-- Progress Dots -->
          <div class="flex space-x-2">
            <div class="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
            <div class="w-2 h-2 bg-orange-600 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-orange-600 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch  } from 'vue'
import MapDisplay from '@/components/MapDisplay.vue'
import RouteSearch from '@/components/RouteSearch.vue'
import SplashScreen from './Splashscreen.vue'
import SimpleAlert from '@/components/CustomAlert.vue'
import { RouteFinder } from '@/composables/RouteFinder.js'

// Reactive state
const start = ref('')
const destination = ref('')
const activeField = ref('start')
const searchSuggestions = ref([])
const routeSuggestions = ref([])
const loadedRoutes = ref([])
const isLoading = ref(true) 
const isProcessing = ref(false)
const loadingError = ref(null)
const loadingProgress = ref(0)
const alertMessage = ref('')
const alertIcon = ref('info')
const startCoords = ref(null)
const destinationCoords = ref(null)
const mapComponent = ref(null)
const loadedTerminals = ref([])

// Initialize RouteFinder
const routeFinder = new RouteFinder()

const showAlert = (message, icon = 'info') => {
  alertMessage.value = message
  alertIcon.value = icon
}


const handleMapStyleChange = (newStyle) => {
  if (mapComponent.value) {
    mapComponent.value.updateMapStyle(newStyle)
  }
}

const handleCurrentLocationSelected = async ({ lat, lng, field }) => {
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


}







const findTricycleRoute = async () => {
  if (!startCoords.value || !destinationCoords.value) {
    showAlert('Please select both start and destination locations', 'location_on')
    return
  }

  if (loadedRoutes.value.length === 0) {
    showAlert('No tricycle routes loaded. Please wait for the routes to load.', 'hourglass_empty')
    return
  }

  isProcessing.value = true
  console.log('isProcessing set to:', isProcessing.value) // Debug log

  try {
    // Clear previous suggestions and highlights first
    clearSuggestions()
    
    // Force UI update by waiting for next tick - this allows the loading overlay to render
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Wrap synchronous heavy computation in setTimeout to not block UI
    const suggestions = await new Promise((resolve) => {
      setTimeout(() => {
        const result = routeFinder.suggestTricycleRouteWithTransfers(
          startCoords.value,
          destinationCoords.value,
        )
        resolve(result)
      }, 0)
    })

    // Format ALL suggestions, not just the first one
    routeSuggestions.value = suggestions

    if (suggestions.length === 0) {
      showAlert('No Routes Available.', 'route')
      return
    }

    // Calculate and draw the actual route
    const routeData = await routeFinder.calculateRoute(
      startCoords.value,
      destinationCoords.value
    )

    // const routeData = await routeFinder.calculateRouteAvoidingHighway(
    //   startCoords.value, destinationCoords.value, restrictedHighway
    //   )
      
   
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
    showAlert('Error finding route. Please try again.', 'error')
  } finally {
    isProcessing.value = false
    console.log('isProcessing set to:', isProcessing.value) // Debug log
  }
}





const highlightRoute = (suggestion) => {
  mapComponent.value?.highlightRoute(suggestion)
}

// Clear all suggestions and highlights
const clearSuggestions = () => {
  routeSuggestions.value = []
  mapComponent.value?.clearHighlights()
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
  
    loadingProgress.value = 25

    // Load zone data
    const routes = await routeFinder.loadZoneData()
    loadedRoutes.value = routes
    loadingProgress.value = 75

    //Paras terminal
    const terminals = await routeFinder.loadTerminals()
    loadedTerminals.value = terminals
    loadingProgress.value = 75
 

    
    await new Promise((resolve) => setTimeout(resolve, 500)) 
    loadingProgress.value = 100

    // delay for splashsreen
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
watch(
  () => startCoords.value,
  (newCoords, oldCoords) => {
   //e clear ang route
    if (oldCoords !== null && newCoords !== null) {
      routeSuggestions.value = []
      mapComponent.value?.clearRoute()
    }
  },
  { deep: true }
)

// Watch for destination coordinate changes
watch(
  () => destinationCoords.value,
  (newCoords, oldCoords) => {
  
    if (oldCoords !== null && newCoords !== null) {
      routeSuggestions.value = []
      mapComponent.value?.clearRoute()
    }
  },
  { deep: true }
)


onMounted(async () => {
  // Load all app data on mount
  await loadAppData()
})
</script>

<style scoped>
/* Fade transition for loading overlay */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>