<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" @click="handleBackdropClick">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md" @click.stop>
        <!-- Icon -->
        <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <!-- Title -->
        <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">
          {{ title }}
        </h3>

        <!-- Message -->
        <p class="text-sm text-gray-600 text-center mb-6">
          {{ message }}
        </p>

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <button
            @click="handleCancel"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {{ cancelText }}
          </button>
          <button
            @click="handleConfirm"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  icon: {
    type: String,
    default: 'warning'
  },
  duration: {
    type: Number,
    default: 0 // 0 means no auto-hide
  }
})

// Emits
const emit = defineEmits(['confirm', 'cancel', 'close'])

let timeoutId = null

// Watch for show changes
watch(() => props.show, (newShow) => {
  // Clear existing timeout when dialog is shown/hidden
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }

  // Auto-hide after duration if duration > 0 and dialog is shown
  if (newShow && props.duration > 0) {
    timeoutId = setTimeout(() => {
      handleCancel() // Auto-cancel on timeout
    }, props.duration)
  }
})

const handleConfirm = () => {
  emit('confirm')
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const handleBackdropClick = (event) => {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}

// Handle escape key
const handleKeyDown = (event) => {
  if (event.key === 'Escape' && props.show) {
    handleCancel()
  }
}

// Setup keyboard listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>