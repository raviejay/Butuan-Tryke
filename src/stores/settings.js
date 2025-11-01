import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const mapStyle = ref(localStorage.getItem('mapStyle') || 'standard')
  const userPreferences = ref(JSON.parse(localStorage.getItem('userPreferences') || '{}'))

  // Getters
  const getMapStyle = computed(() => mapStyle.value)
  const getUserPreferences = computed(() => userPreferences.value)

  // Actions
  const setMapStyle = (style) => {
    mapStyle.value = style
    localStorage.setItem('mapStyle', style)
  }

  const setUserPreference = (key, value) => {
    userPreferences.value[key] = value
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences.value))
  }

  return {
    mapStyle,
    userPreferences,
    getMapStyle,
    getUserPreferences,
    setMapStyle,
    setUserPreference
  }
})