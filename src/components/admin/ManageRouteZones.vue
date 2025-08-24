<template>
  <div class="space-y-6">
    <!-- Header with Upload Button -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-xl font-semibold text-gray-800">Route Zone Management</h2>
        <p class="text-sm text-gray-600 mt-1">Upload and manage route zones by color</p>
      </div>
      <button
        @click="openUploadModal()"
        class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <span>Upload Route Zone</span>
      </button>
    </div>

    <!-- Zone Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="zone in routeZones"
        :key="zone.zone_type"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <div
              :style="{ backgroundColor: getZoneColor(zone.zone_type) }"
              class="w-4 h-4 rounded-full border border-gray-300"
            ></div>
            <h3 class="font-medium text-gray-800 capitalize">{{ getZoneName(zone.zone_type) }}</h3>
          </div>
          <div class="flex items-center space-x-1">
            <button
              @click="viewZoneOnMap(zone)"
              class="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              title="View on Map"
              :disabled="!zone.geojson_data"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <button
              @click="viewZone(zone)"
              class="p-1 text-gray-500 hover:text-green-600 transition-colors"
              title="View Details"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
            <button
              @click="openUploadModal(zone)"
              class="p-1 text-gray-500 hover:text-orange-600 transition-colors"
              title="Update Zone"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              @click="deleteZone(zone)"
              class="p-1 text-gray-500 hover:text-red-600 transition-colors"
              title="Delete Zone"
              :disabled="!zone.geojson_data"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="text-sm text-gray-600 space-y-1">
          <p><span class="font-medium">Features:</span> {{ zone.feature_count || 0 }}</p>
          <p><span class="font-medium">Last Updated:</span> {{ formatDate(zone.updated_at) }}</p>
          <p>
            <span class="font-medium">Status:</span>
            <span :class="zone.geojson_data ? 'text-green-600' : 'text-red-600'">
              {{ zone.geojson_data ? 'Active' : 'No Data' }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Upload/Update Modal -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="closeUploadModal"
    >
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">
              {{ isUpdating ? 'Update' : 'Upload' }} Route Zone
            </h3>
            <button @click="closeUploadModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleUpload" class="space-y-4">
            <!-- Zone Type Selection/Input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Zone Color</label>

              <!-- Existing Zones -->
              <div v-if="availableZoneTypes.length > 0" class="mb-3">
                <p class="text-xs text-gray-600 mb-2">Existing zones:</p>
                <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  <label
                    v-for="zoneType in availableZoneTypes"
                    :key="zoneType"
                    class="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                    :class="
                      selectedZoneType === zoneType
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200'
                    "
                  >
                    <input
                      type="radio"
                      :value="zoneType"
                      v-model="selectedZoneType"
                      @change="customZoneInput = ''"
                      class="text-orange-600"
                      :disabled="isUpdating"
                    />
                    <div
                      :style="{ backgroundColor: getZoneColor(zoneType) }"
                      class="w-3 h-3 rounded-full border border-gray-300"
                    ></div>
                    <span class="text-sm capitalize truncate">{{ getZoneName(zoneType) }}</span>
                  </label>
                </div>
              </div>

              <!-- Custom Zone Input -->
              <div v-if="!isUpdating">
                <p class="text-xs text-gray-600 mb-2">Or create new zone:</p>
                <div class="flex space-x-2">
                  <input
                    type="text"
                    v-model="customZoneInput"
                    @input="handleCustomZoneInput"
                    placeholder="Enter color (e.g., blue, #ff5733)"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <div
                    v-if="customZoneInput && isValidColor(customZoneInput)"
                    :style="{ backgroundColor: getDisplayColor(customZoneInput) }"
                    class="w-10 h-10 rounded border border-gray-300 flex-shrink-0"
                    :title="customZoneInput"
                  ></div>
                </div>
                <p
                  v-if="customZoneInput && !isValidColor(customZoneInput)"
                  class="text-xs text-red-500 mt-1"
                >
                  Please enter a valid color (hex code, color name, or rgb)
                </p>
              </div>

              <p v-if="isUpdating" class="text-xs text-gray-500 mt-2">
                Zone type cannot be changed during update
              </p>
            </div>

            <!-- Current Zone Info (for updates) -->
            <div v-if="isUpdating && updatingZone" class="bg-blue-50 p-3 rounded-lg">
              <h4 class="text-sm font-medium text-blue-800 mb-2">Current Zone Info:</h4>
              <div class="text-xs text-blue-700 space-y-1">
                <p>
                  <span class="font-medium">Features:</span> {{ updatingZone.feature_count || 0 }}
                </p>
                <p>
                  <span class="font-medium">Last Updated:</span>
                  {{ formatDate(updatingZone.updated_at) }}
                </p>
              </div>
            </div>

            <!-- File Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ isUpdating ? 'New GeoJSON File' : 'GeoJSON File' }}
              </label>
              <div class="relative">
                <input
                  type="file"
                  @change="handleFileSelect"
                  accept=".geojson,.json"
                  class="hidden"
                  ref="fileInput"
                  :required="!isUpdating"
                />
                <button
                  type="button"
                  @click="$refs.fileInput.click()"
                  class="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-orange-400 transition-colors"
                >
                  <svg
                    class="w-8 h-8 mx-auto mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4"
                    />
                  </svg>
                  <p class="text-sm text-gray-600">
                    {{ selectedFile ? selectedFile.name : 'Click to select GeoJSON file' }}
                  </p>
                </button>
              </div>
            </div>

            <!-- File Preview -->
            <div v-if="filePreview" class="bg-gray-50 p-3 rounded-lg">
              <h4 class="text-sm font-medium text-gray-700 mb-2">New File Preview:</h4>
              <div class="text-xs text-gray-600 space-y-1">
                <p>
                  <span class="font-medium">Features:</span> {{ filePreview.features?.length || 0 }}
                </p>
                <p><span class="font-medium">Type:</span> {{ filePreview.type }}</p>
              </div>

              <!-- Preview Map Button -->
              <button
                type="button"
                @click="previewOnMap"
                class="mt-2 w-full px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                :disabled="!getEffectiveZoneType()"
              >
                Preview on Map
              </button>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-3 pt-4">
              <button
                type="button"
                @click="closeUploadModal"
                class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="!getEffectiveZoneType() || (!selectedFile && !isUpdating) || uploading"
                class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{
                  uploading
                    ? isUpdating
                      ? 'Updating...'
                      : 'Uploading...'
                    : isUpdating
                      ? 'Update Zone'
                      : 'Upload Zone'
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Map Preview Modal -->
    <div v-if="showMapModal" class="fixed inset-0 z-50 overflow-y-auto" @click="closeMapModal">
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>

        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-4xl h-96" @click.stop>
          <div class="flex items-center justify-between p-4 border-b">
            <div class="flex items-center space-x-3">
              <h3 class="text-lg font-semibold text-gray-800">Route Preview</h3>
              <div v-if="previewZoneType" class="flex items-center space-x-2">
                <div
                  :style="{ backgroundColor: getDisplayColor(previewZoneType) }"
                  class="w-4 h-4 rounded-full border border-gray-300"
                ></div>
                <span class="text-sm text-gray-600 capitalize">{{
                  getZoneName(previewZoneType)
                }}</span>
              </div>
            </div>

            <!-- Zone Type Selector (for preview) -->
            <div v-if="isPreviewMode" class="flex items-center space-x-2">
              <label class="text-sm text-gray-600">Zone Type:</label>
              <select
                v-model="previewZoneType"
                @change="updatePreviewColor"
                class="text-sm border rounded px-2 py-1"
              >
                <option
                  v-for="zoneType in availableZoneTypes"
                  :key="zoneType"
                  :value="zoneType"
                  class="capitalize"
                >
                  {{ getZoneName(zoneType) }}
                </option>
              </select>
              <button
                @click="applyPreviewZoneType"
                class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Apply
              </button>
            </div>

            <button @click="closeMapModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Map Container -->
          <div id="preview-map" class="w-full h-80"></div>

          <div class="p-4 border-t bg-gray-50">
            <div class="flex justify-between items-center text-sm text-gray-600">
              <span>Features: {{ mapPreviewData?.features?.length || 0 }}</span>
              <span v-if="isPreviewMode" class="text-orange-600">
                Select zone type and click Apply to set the color
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Zone Modal -->
    <div
      v-if="showViewModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="showViewModal = false"
    >
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div
          class="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto"
          @click.stop
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">
              <span class="capitalize">{{ getZoneName(selectedZone?.zone_type) }}</span> Details
            </h3>
            <button @click="showViewModal = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div v-if="selectedZone" class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-gray-700">Zone Type:</span>
                <div class="flex items-center space-x-2 mt-1">
                  <div
                    :style="{ backgroundColor: getZoneColor(selectedZone.zone_type) }"
                    class="w-3 h-3 rounded-full border border-gray-300"
                  ></div>
                  <span class="capitalize">{{ getZoneName(selectedZone.zone_type) }}</span>
                </div>
              </div>
              <div>
                <span class="font-medium text-gray-700">Features:</span>
                <p>{{ selectedZone.feature_count || 0 }}</p>
              </div>
              <div>
                <span class="font-medium text-gray-700">Created:</span>
                <p>{{ formatDate(selectedZone.created_at) }}</p>
              </div>
              <div>
                <span class="font-medium text-gray-700">Updated:</span>
                <p>{{ formatDate(selectedZone.updated_at) }}</p>
              </div>
            </div>

            <div>
              <span class="font-medium text-gray-700">GeoJSON Preview:</span>
              <pre class="mt-2 bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto"
                >{{ JSON.stringify(selectedZone.geojson_data, null, 2).substring(0, 1000)
                }}{{
                  JSON.stringify(selectedZone.geojson_data, null, 2).length > 1000 ? '...' : ''
                }}</pre
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { supabase } from '@/composables/useSupabase'

// Props
defineProps({})

// Emits
const emit = defineEmits(['zone-updated'])

// Reactive state
const routeZones = ref([])
const showUploadModal = ref(false)
const showViewModal = ref(false)
const showMapModal = ref(false)
const selectedZoneType = ref('')
const customZoneInput = ref('')
const selectedFile = ref(null)
const filePreview = ref(null)
const uploading = ref(false)
const selectedZone = ref(null)
const isUpdating = ref(false)
const updatingZone = ref(null)
const mapPreviewData = ref(null)
const previewZoneType = ref('orange')
const isPreviewMode = ref(false)
let previewMap = null

// Computed properties
const availableZoneTypes = computed(() => {
  return [
    ...new Set(routeZones.value.filter((zone) => zone.geojson_data).map((zone) => zone.zone_type)),
  ]
})

// Methods
const getZoneColor = (zoneType) => {
  // Handle white color visibility
  if (
    zoneType.toLowerCase() === 'white' ||
    zoneType.toLowerCase() === '#ffffff' ||
    zoneType.toLowerCase() === '#fff'
  ) {
    return '#000000'
  }

  // If it's already a valid color, return it
  if (isValidColor(zoneType)) {
    return zoneType
  }

  // Default fallback
  return '#ea580c'
}

const getDisplayColor = (zoneType) => {
  return getZoneColor(zoneType)
}

const getZoneName = (zoneType) => {
  if (!zoneType) return 'Unknown Zone'

  // If it's a hex color, create a readable name
  if (zoneType.startsWith('#')) {
    return `${zoneType} Zone`
  }

  return `${zoneType.charAt(0).toUpperCase() + zoneType.slice(1)} Zone`
}

const isValidColor = (color) => {
  if (!color) return false

  // Check if it's a hex color
  if (/^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color)) return true

  // Check if it's a named color or rgb/rgba
  const style = new Option().style
  style.color = color
  return style.color !== ''
}

const getEffectiveZoneType = () => {
  if (customZoneInput.value && isValidColor(customZoneInput.value)) {
    return customZoneInput.value
  }
  return selectedZoneType.value
}

const handleCustomZoneInput = () => {
  if (customZoneInput.value && isValidColor(customZoneInput.value)) {
    selectedZoneType.value = ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const loadRouteZones = async () => {
  try {
    const { data, error } = await supabase.from('route_zones').select('*').order('zone_type')

    if (error) throw error

    // Use actual data from database
    routeZones.value = (data || []).map((zone) => ({
      ...zone,
      feature_count: zone.geojson_data?.features?.length || 0,
    }))
  } catch (error) {
    console.error('Error loading route zones:', error)
    routeZones.value = []
  }
}

const openUploadModal = (zone = null) => {
  if (zone && zone.geojson_data) {
    // Update mode
    isUpdating.value = true
    updatingZone.value = zone
    selectedZoneType.value = zone.zone_type
  } else {
    // Create mode
    isUpdating.value = false
    updatingZone.value = null
    selectedZoneType.value = zone?.zone_type || ''
  }

  customZoneInput.value = ''
  selectedFile.value = null
  filePreview.value = null
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
  selectedZoneType.value = ''
  customZoneInput.value = ''
  selectedFile.value = null
  filePreview.value = null
  isUpdating.value = false
  updatingZone.value = null
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const geojsonData = JSON.parse(e.target.result)
      filePreview.value = geojsonData
    } catch (error) {
      console.error('Invalid GeoJSON file:', error)
      alert('Invalid GeoJSON file. Please select a valid GeoJSON file.')
      selectedFile.value = null
      filePreview.value = null
    }
  }
  reader.readAsText(file)
}

const handleUpload = async () => {
  const effectiveZoneType = getEffectiveZoneType()

  if (
    !effectiveZoneType ||
    (!selectedFile.value && !isUpdating.value) ||
    (!filePreview.value && !isUpdating.value)
  )
    return

  // If updating but no new file selected, skip upload
  if (isUpdating.value && !filePreview.value) {
    alert('Please select a new GeoJSON file to update the zone.')
    return
  }

  uploading.value = true

  try {
    const dataToUpload = {
      zone_type: effectiveZoneType,
      updated_at: new Date().toISOString(),
    }

    // Only update geojson_data if we have new file data
    if (filePreview.value) {
      dataToUpload.geojson_data = filePreview.value
    }

    const { error } = await supabase.from('route_zones').upsert(dataToUpload)

    if (error) throw error

    alert(`Route zone ${isUpdating.value ? 'updated' : 'uploaded'} successfully!`)
    closeUploadModal()
    await loadRouteZones()
    emit('zone-updated', effectiveZoneType)
  } catch (error) {
    console.error(`Error ${isUpdating.value ? 'updating' : 'uploading'} route zone:`, error)
    alert(`Error ${isUpdating.value ? 'updating' : 'uploading'} route zone. Please try again.`)
  } finally {
    uploading.value = false
  }
}

const initializeMap = async () => {
  // Check if Leaflet is available
  if (typeof L === 'undefined') {
    // Load Leaflet dynamically
    await loadLeaflet()
  }

  // Remove existing map
  if (previewMap) {
    previewMap.remove()
  }

  // Initialize map
  previewMap = L.map('preview-map').setView([8.9472, 125.5407], 13) // Default to Butuan coordinates

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(previewMap)
}

const loadLeaflet = () => {
  return new Promise((resolve, reject) => {
    // Load CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css'
    document.head.appendChild(link)

    // Load JS
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

const displayGeoJSONOnMap = (geojsonData, zoneType) => {
  if (!previewMap || !geojsonData) return

  // Clear existing layers
  previewMap.eachLayer((layer) => {
    if (layer instanceof L.GeoJSON) {
      previewMap.removeLayer(layer)
    }
  })

  // Add GeoJSON layer
  const geoJsonLayer = L.geoJSON(geojsonData, {
    style: {
      color: getZoneColor(zoneType),
      weight: 3,
      opacity: 0.8,
      fillOpacity: 0.2,
    },
    onEachFeature: (feature, layer) => {
      if (feature.properties) {
        let popupContent = '<div class="text-sm">'
        Object.entries(feature.properties).forEach(([key, value]) => {
          popupContent += `<strong>${key}:</strong> ${value}<br>`
        })
        popupContent += '</div>'
        layer.bindPopup(popupContent)
      }
    },
  }).addTo(previewMap)

  // Fit map to bounds
  previewMap.fitBounds(geoJsonLayer.getBounds())
}

const previewOnMap = async () => {
  if (!filePreview.value) return

  const effectiveZoneType = getEffectiveZoneType()
  if (!effectiveZoneType) return

  mapPreviewData.value = filePreview.value
  previewZoneType.value = effectiveZoneType
  isPreviewMode.value = true
  showMapModal.value = true

  await nextTick()
  await initializeMap()
  displayGeoJSONOnMap(mapPreviewData.value, previewZoneType.value)
}

const viewZoneOnMap = async (zone) => {
  if (!zone.geojson_data) {
    alert('No GeoJSON data available for this zone.')
    return
  }

  mapPreviewData.value = zone.geojson_data
  previewZoneType.value = zone.zone_type
  isPreviewMode.value = false
  showMapModal.value = true

  await nextTick()
  await initializeMap()
  displayGeoJSONOnMap(mapPreviewData.value, previewZoneType.value)
}

const updatePreviewColor = () => {
  if (previewMap && mapPreviewData.value) {
    displayGeoJSONOnMap(mapPreviewData.value, previewZoneType.value)
  }
}

const applyPreviewZoneType = () => {
  selectedZoneType.value = previewZoneType.value
  customZoneInput.value = ''
  alert(`Zone type set to ${getZoneName(previewZoneType.value)}. You can now upload the zone.`)
  closeMapModal()
}

const closeMapModal = () => {
  showMapModal.value = false
  if (previewMap) {
    previewMap.remove()
    previewMap = null
  }
  mapPreviewData.value = null
  isPreviewMode.value = false
}

const viewZone = (zone) => {
  selectedZone.value = zone
  showViewModal.value = true
}

const deleteZone = async (zone) => {
  if (!zone.geojson_data) {
    alert('No data to delete for this zone.')
    return
  }

  if (!confirm(`Are you sure you want to delete the ${getZoneName(zone.zone_type)} data?`)) {
    return
  }

  try {
    const { error } = await supabase.from('route_zones').delete().eq('zone_type', zone.zone_type)

    if (error) throw error

    alert('Zone deleted successfully!')
    await loadRouteZones()
    emit('zone-updated', zone.zone_type)
  } catch (error) {
    console.error('Error deleting zone:', error)
    alert('Error deleting zone. Please try again.')
  }
}

// Lifecycle
onMounted(() => {
  loadRouteZones()
})
</script>
