<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="transform -translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-full opacity-0"
  >
    <div
      v-if="visible"
      class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white text-[#f97a00] px-4 sm:px-6 py-3 sm:py-3 rounded-lg shadow-lg border-l-4 border-[#f97a00] w-[calc(100vw-2rem)] sm:max-w-md mx-auto font-medium"
    >
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-xl flex-shrink-0">{{ icon }}</span>
        <span class="text-sm sm:text-base leading-relaxed flex-1">{{ message }}</span>
        <!-- Optional close button for mobile -->
        <button 
          @click="hide"
          class="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200 flex-shrink-0 sm:hidden"
          aria-label="Close alert"
        >
          <span class="material-symbols-outlined text-lg text-gray-500">close</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'info'
  },
  duration: {
    type: Number,
    default: 3000
  },
  showCloseButton: {
    type: Boolean,
    default: false // Set to true if you always want the close button
  }
})

const emit = defineEmits(['hide'])

const visible = ref(false)
let timeoutId = null

// Show alert when message changes
watch(() => props.message, (newMessage) => {
  if (newMessage) {
    show()
  }
})

const show = () => {
  visible.value = true
  
  // Clear existing timeout
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  
  // Auto-hide after duration (longer on mobile for readability)
  const mobileDuration = window.innerWidth < 640 ? props.duration + 1000 : props.duration
  timeoutId = setTimeout(() => {
    hide()
  }, mobileDuration)
}

const hide = () => {
  visible.value = false
  emit('hide')
  
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

// Expose methods for manual control
defineExpose({
  show,
  hide
})
</script>