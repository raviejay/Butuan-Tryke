<template>
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="closeSettings">
    <div class="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-orange-600">Settings</h2>
        <button @click="closeSettings" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- User Profile Section -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Profile Information</h3>
        
        <!-- Profile Picture -->
        <div class="flex items-center mb-4">
          <div>
            <img
              v-if="userProfilePicture"
              :src="userProfilePicture"
              :alt="currentUser?.user_metadata?.full_name || 'User'"
              class="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              @error="handleImageError"
            />
            <div v-else class="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xl">
              {{ userInitials }}
            </div>
          </div>
          
          <div class="ml-4">
            <p class="font-medium text-gray-900">{{ currentUser.user_metadata?.full_name || currentUser.email }}</p>
            <p class="text-sm text-gray-500">{{ currentUser.email }}</p>
            <p v-if="userRole" class="text-xs text-orange-600 font-medium capitalize">{{ userRole }}</p>
          </div>
        </div>
      </div>

      <!-- Map Settings Section -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Map Preferences</h3>
        
        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-700">Map Style</label>
          <select v-model="selectedMapStyle" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            <option value="standard">Standard (OpenStreetMap)</option>
            <option value="minimal">Minimal (Light)</option>
            <option value="satellite">Satellite</option>
          </select>
          <p class="text-xs text-gray-500">Choose how the map appears in the application</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button @click="saveSettings" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
          Save Changes
        </button>
        <button @click="closeSettings" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors duration-200">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/composables/useSupabase'
import { useSettingsStore } from '@/stores/settings'

// Props
const props = defineProps({
  currentUser: {
    type: Object,
    required: true
  },
  userRole: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['close', 'map-style-changed'])

// Store
const settingsStore = useSettingsStore()

// Reactive state
const userProfilePicture = ref(null)
const selectedMapStyle = ref(localStorage.getItem('mapStyle') || 'standard') // Read from localStorage

// Computed
const userInitials = computed(() => {
  if (!props.currentUser) return ''
  const name = props.currentUser.user_metadata?.full_name || props.currentUser.email
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// Get user profile picture from user metadata
const getUserProfilePicture = (user) => {
  if (!user) return null
  return (
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    user.identities?.[0]?.identity_data?.avatar_url ||
    null
  )
}

// Handle profile picture error
const handleImageError = () => {
  userProfilePicture.value = null
}

// Load user settings
const loadUserSettings = async () => {
  try {
    // Load saved map style preference
    const savedStyle = localStorage.getItem('mapStyle')
    if (savedStyle) {
      selectedMapStyle.value = savedStyle
    }

    // Get user profile picture
    userProfilePicture.value = getUserProfilePicture(props.currentUser)
  } catch (error) {
    console.error('Error loading user settings:', error)
  }
}

// Save settings
const saveSettings = async () => {
  try {
    // Save map style preference to localStorage
    localStorage.setItem('mapStyle', selectedMapStyle.value)
    
    // Dispatch a storage event to sync across components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'mapStyle',
      newValue: selectedMapStyle.value
    }))
    
    // Emit event to parent to change map style
    emit('map-style-changed', selectedMapStyle.value)
    
    // Show success message (you can use your alert system here)
    console.log('Settings saved successfully')
    
    closeSettings()
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

// Close settings modal
const closeSettings = () => {
  emit('close')
}

onMounted(() => {
  loadUserSettings()
})
</script>