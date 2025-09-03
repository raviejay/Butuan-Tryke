<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Fare Management</h2>
        <p class="text-gray-600 mt-1">Manage tricycle fare rates and pricing configuration</p>
      </div>
      <button
        @click="refreshData"
        class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>Refresh</span>
      </button>
    </div>

    <!-- Current Settings Card -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Current Settings</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="setting in fareSettings"
          :key="setting.setting_name"
          class="bg-gray-50 rounded-lg p-4"
        >
          <label class="block text-sm font-medium text-gray-700 mb-2">{{
            formatSettingName(setting.setting_name)
          }}</label>
          <div class="flex items-center space-x-2">
            <input
              v-model="setting.setting_value"
              type="number"
              step="0.01"
              min="0"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              @click="updateSetting(setting)"
              class="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ setting.description }}</p>
        </div>
      </div>
    </div>

    <!-- Fare Matrix Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">Fare Matrix</h3>
        <button
          @click="addFareRange"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Range</span>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gas Price Range (₱)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Regular Fare (₱)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discounted Fare (₱)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Additional Rate (₱/km)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="fare in fareMatrix" :key="fare.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <input
                    v-model="fare.gas_price_min"
                    type="number"
                    step="0.01"
                    class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <span class="text-gray-500">-</span>
                  <input
                    v-model="fare.gas_price_max"
                    type="number"
                    step="0.01"
                    class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model="fare.regular_fare"
                  type="number"
                  step="0.01"
                  class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model="fare.discounted_fare"
                  type="number"
                  step="0.01"
                  class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="space-y-1">
                  <div class="text-xs text-gray-600">
                    Regular: ₱{{ fare.additional_rate_regular }}
                  </div>
                  <div class="text-xs text-gray-600">
                    Discounted: ₱{{ fare.additional_rate_discounted }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    fare.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
                  ]"
                >
                  {{ fare.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap space-x-2">
                <button
                  @click="updateFareRange(fare)"
                  class="text-orange-600 hover:text-orange-900 transition-colors"
                  title="Save Changes"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
                <button
                  @click="toggleFareStatus(fare)"
                  :class="[
                    'transition-colors',
                    fare.is_active ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900',
                  ]"
                  :title="fare.is_active ? 'Deactivate' : 'Activate'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      v-if="fare.is_active"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <button
                  @click="deleteFareRange(fare)"
                  class="text-red-600 hover:text-red-900 transition-colors"
                  title="Delete Range"
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Current Active Rate Display -->
    <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-orange-900 mb-4">Current Active Rate</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg p-4 border border-orange-200">
          <div class="text-sm text-orange-700 font-medium">Current Gas Price</div>
          <div class="text-2xl font-bold text-orange-900">
            ₱{{ currentGasPrice?.toFixed(2) || '0.00' }}
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 border border-orange-200">
          <div class="text-sm text-orange-700 font-medium">Regular Fare (First 4km)</div>
          <div class="text-2xl font-bold text-orange-900">
            ₱{{ currentFare?.regular_fare?.toFixed(2) || '0.00' }}
          </div>
        </div>
        <div class="bg-white rounded-lg p-4 border border-orange-200">
          <div class="text-sm text-orange-700 font-medium">Discounted Fare (First 4km)</div>
          <div class="text-2xl font-bold text-orange-900">
            ₱{{ currentFare?.discounted_fare?.toFixed(2) || '0.00' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/composables/useSupabase'

// Props and Emits
const emit = defineEmits(['show-alert'])

// Reactive state
const fareMatrix = ref([])
const fareSettings = ref([])
const loading = ref(false)

// Computed properties
const currentGasPrice = computed(() => {
  const setting = fareSettings.value.find(s => s.setting_name === 'current_gas_price')
  return setting ? parseFloat(setting.setting_value) : 0
})

const currentFare = computed(() => {
  const gasPrice = currentGasPrice.value
  return fareMatrix.value.find(fare => 
    fare.is_active && 
    gasPrice >= fare.gas_price_min && 
    gasPrice <= fare.gas_price_max
  )
})

// Methods
const formatSettingName = (name) => {
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const loadFareData = async () => {
  loading.value = true
  try {
    // Load fare matrix
    const { data: matrixData, error: matrixError } = await supabase
      .from('fare_matrix')
      .select('*')
      .order('gas_price_min', { ascending: true })

    if (matrixError) throw matrixError
    fareMatrix.value = matrixData || []

    // Load fare settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('fare_settings')
      .select('*')
      .order('setting_name')

    if (settingsError) throw settingsError
    fareSettings.value = settingsData || []

    emit('show-alert', 'success', 'Fare data loaded successfully')
  } catch (error) {
    console.error('Error loading fare data:', error)
    emit('show-alert', 'error', 'Failed to load fare data', error.message)
    
    // Fallback demo data
    fareMatrix.value = [
      { id: 1, gas_price_min: 45.00, gas_price_max: 55.00, regular_fare: 8.00, discounted_fare: 6.00, additional_rate_regular: 1.00, additional_rate_discounted: 0.80, is_active: true },
      { id: 2, gas_price_min: 56.00, gas_price_max: 65.00, regular_fare: 9.00, discounted_fare: 7.00, additional_rate_regular: 1.00, additional_rate_discounted: 0.80, is_active: true },
      { id: 3, gas_price_min: 66.00, gas_price_max: 75.00, regular_fare: 10.00, discounted_fare: 8.00, additional_rate_regular: 1.00, additional_rate_discounted: 0.80, is_active: true },
    ]
    
    fareSettings.value = [
      { setting_name: 'current_gas_price', setting_value: 56.00, description: 'Current gas price in PHP per liter' },
      { setting_name: 'base_distance_km', setting_value: 4.00, description: 'Base distance in kilometers for regular fare' },
      { setting_name: 'additional_rate_regular', setting_value: 1.00, description: 'Additional rate per km for regular passengers' },
      { setting_name: 'additional_rate_discounted', setting_value: 0.80, description: 'Additional rate per km for students, senior citizens, and PWDs' },
    ]
  } finally {
    loading.value = false
  }
}

const updateSetting = async (setting) => {
  try {
    const { error } = await supabase
      .from('fare_settings')
      .update({ 
        setting_value: setting.setting_value,
        updated_at: new Date().toISOString()
      })
      .eq('setting_name', setting.setting_name)

    if (error) throw error
    emit('show-alert', 'success', 'Setting updated', `${formatSettingName(setting.setting_name)} has been updated`)
  } catch (error) {
    console.error('Error updating setting:', error)
    emit('show-alert', 'error', 'Update failed', error.message)
  }
}

const updateFareRange = async (fare) => {
  try {
    const { error } = await supabase
      .from('fare_matrix')
      .update({
        gas_price_min: parseFloat(fare.gas_price_min),
        gas_price_max: parseFloat(fare.gas_price_max),
        regular_fare: parseFloat(fare.regular_fare),
        discounted_fare: parseFloat(fare.discounted_fare),
        updated_at: new Date().toISOString()
      })
      .eq('id', fare.id)

    if (error) throw error
    emit('show-alert', 'success', 'Fare range updated', 'Fare range has been successfully updated')
  } catch (error) {
    console.error('Error updating fare range:', error)
    emit('show-alert', 'error', 'Update failed', error.message)
  }
}

const toggleFareStatus = async (fare) => {
  try {
    const { error } = await supabase
      .from('fare_matrix')
      .update({
        is_active: !fare.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', fare.id)

    if (error) throw error
    fare.is_active = !fare.is_active
    emit('show-alert', 'success', 'Status updated', `Fare range ${fare.is_active ? 'activated' : 'deactivated'}`)
  } catch (error) {
    console.error('Error toggling fare status:', error)
    emit('show-alert', 'error', 'Update failed', error.message)
  }
}

const addFareRange = () => {
  const newFare = {
    id: Date.now(), // Temporary ID for UI
    gas_price_min: 0,
    gas_price_max: 0,
    regular_fare: 0,
    discounted_fare: 0,
    additional_rate_regular: 1.00,
    additional_rate_discounted: 0.80,
    is_active: true
  }
  fareMatrix.value.push(newFare)
}

const deleteFareRange = async (fare) => {
  if (!confirm('Are you sure you want to delete this fare range?')) return

  try {
    if (fare.id && typeof fare.id === 'number' && fare.id > 1000000000) {
      // Remove from UI only (new unsaved item)
      const index = fareMatrix.value.findIndex(f => f.id === fare.id)
      if (index > -1) fareMatrix.value.splice(index, 1)
      return
    }

    const { error } = await supabase
      .from('fare_matrix')
      .delete()
      .eq('id', fare.id)

    if (error) throw error
    
    const index = fareMatrix.value.findIndex(f => f.id === fare.id)
    if (index > -1) fareMatrix.value.splice(index, 1)
    
    emit('show-alert', 'success', 'Fare range deleted', 'Fare range has been successfully deleted')
  } catch (error) {
    console.error('Error deleting fare range:', error)
    emit('show-alert', 'error', 'Delete failed', error.message)
  }
}

const refreshData = () => {
  loadFareData()
}

// Lifecycle
onMounted(() => {
  loadFareData()
})
</script>