<template>
  <div>
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
          @click="$emit('highlight-route', suggestion)"
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
        @click="$emit('clear-suggestions')"
        class="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
      >
        Clear suggestions
      </button>
    </div>

    <!-- Search Input Container: Desktop -->
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

        <div class="relative mb-2">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              class="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 15l7-7 7 7"
              ></path>
            </svg>
          </div>
          <input
            v-model="localStart"
            @input="handleInputChange($event.target.value, 'start')"
            @focus="setActiveField('start')"
            type="text"
            placeholder="Start location (click map or search)"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div class="relative mb-3">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              class="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
          <input
            v-model="localDestination"
            @input="handleInputChange($event.target.value, 'destination')"
            @focus="setActiveField('destination')"
            type="text"
            placeholder="Destination (click map or search)"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <button
          @click="$emit('find-route')"
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
          v-model="localStart"
          @input="handleInputChange($event.target.value, 'start')"
          @focus="setActiveField('start')"
          type="text"
          placeholder="Start location (tap map or search)"
          class="w-full mb-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <input
          v-model="localDestination"
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
              @click="$emit('highlight-route', suggestion)"
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
            @click="$emit('clear-suggestions')"
            class="w-full mt-3 text-xs text-gray-500 hover:text-gray-700"
          >
            Clear suggestions
          </button>
        </div>

        <button
          @click="$emit('find-route')"
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
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  start: {
    type: String,
    default: '',
  },
  destination: {
    type: String,
    default: '',
  },
  activeField: {
    type: String,
    default: 'start',
  },
  startCoords: {
    type: Array,
    default: null,
  },
  destinationCoords: {
    type: Array,
    default: null,
  },
  routeSuggestions: {
    type: Array,
    default: () => [],
  },
  searchSuggestions: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits([
  'update:start',
  'update:destination',
  'update:activeField',
  'input-change',
  'place-selected',
  'find-route',
  'highlight-route',
  'clear-suggestions',
])

// Local reactive values
const localStart = ref(props.start)
const localDestination = ref(props.destination)
const showSuggestions = ref(false)
const isOpen = ref(true)

// Watch for prop changes
watch(
  () => props.start,
  (newVal) => {
    localStart.value = newVal
  },
)

watch(
  () => props.destination,
  (newVal) => {
    localDestination.value = newVal
  },
)

// Handle input changes
const handleInputChange = (value, field) => {
  if (field === 'start') {
    localStart.value = value
    emit('update:start', value)
  } else {
    localDestination.value = value
    emit('update:destination', value)
  }

  emit('input-change', { value, field })
  showSuggestions.value = value.trim().length > 0 && props.searchSuggestions.length > 0
}

// Set active field
const setActiveField = (field) => {
  emit('update:activeField', field)
}

// Select a suggestion
const selectSuggestion = (place) => {
  showSuggestions.value = false
  emit('place-selected', { place, activeField: props.activeField })
}

// Draggable bottom sheet logic for mobile
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

// Watch for suggestions to show/hide suggestions dropdown
watch(
  () => props.searchSuggestions,
  (newSuggestions) => {
    showSuggestions.value = newSuggestions.length > 0
  },
)
</script>

<style scoped>
/* Any component-specific styles can be added here */
</style>
