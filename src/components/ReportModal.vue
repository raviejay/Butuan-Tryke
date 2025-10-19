<template>
  <!-- Review/Report Modal -->
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black/30 backdrop-blur-sm md:bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4"
    @click.self="closeModal"
  >
    <div
      class="bg-gradient-to-br from-white via-gray-50 to-white w-full h-full md:rounded-2xl md:w-full md:max-w-2xl md:h-auto md:max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col"
    >
      <div class="p-6 md:p-6 flex-1 overflow-y-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-5">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <svg
                class="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900">Submit Feedback</h2>
              <p class="text-xs text-gray-500">Share your experience with our service</p>
            </div>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
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

        <!-- Alert -->
        <div
          v-if="alert.show"
          class="mb-6 p-4 rounded-lg border-l-4 transition-all duration-300 ease-in-out animate-fade-in"
          :class="alertClasses"
        >
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                v-if="alert.type === 'success'"
                class="w-5 h-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="alert.type === 'error'"
                class="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg v-else class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <p
                class="text-sm font-medium"
                :class="
                  alert.type === 'success'
                    ? 'text-green-800'
                    : alert.type === 'error'
                      ? 'text-red-800'
                      : 'text-blue-800'
                "
              >
                {{ alert.message }}
              </p>
            </div>
            <button
              @click="hideAlert"
              class="inline-flex rounded-md p-1.5 transition-colors"
              :class="
                alert.type === 'success'
                  ? 'text-green-500 hover:bg-green-100'
                  : alert.type === 'error'
                    ? 'text-red-500 hover:bg-red-100'
                    : 'text-blue-500 hover:bg-blue-100'
              "
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <form @submit.prevent="submitReport" class="space-y-4">
          <!-- Type Selection with better styling -->
          <div>
            <label class="block text-xs font-semibold text-gray-900 mb-2">Feedback Type</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="relative flex items-center p-2.5 border-2 rounded-lg cursor-pointer transition-all"
                :class="reportForm.type === 'review' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'">
                <input
                  v-model="reportForm.type"
                  type="radio"
                  value="review"
                  class="sr-only"
                />
                <div class="flex items-center w-full">
                  <div class="w-4 h-4 rounded-full border-2 flex-shrink-0" :class="reportForm.type === 'review' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'"></div>
                  <span class="ml-2 font-medium text-sm text-gray-700">Review</span>
                </div>
              </label>
              <label class="relative flex items-center p-2.5 border-2 rounded-lg cursor-pointer transition-all"
                :class="reportForm.type === 'report' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'">
                <input
                  v-model="reportForm.type"
                  type="radio"
                  value="report"
                  class="sr-only"
                />
                <div class="flex items-center w-full">
                  <div class="w-4 h-4 rounded-full border-2 flex-shrink-0" :class="reportForm.type === 'report' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'"></div>
                  <span class="ml-2 font-medium text-sm text-gray-700">Report Issue</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Two Column Layout -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Body Number (for both review and report) -->
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-gray-900 mb-1">Tricycle Body Number</label>
              <input
                v-model="reportForm.bodyNumber"
                type="text"
                required
                maxlength="20"
                placeholder="e.g., TRY-001-2024"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-gray-400"
              />
            </div>

            <!-- Zone Selection -->
            <div>
              <label class="block text-xs font-semibold text-gray-900 mb-1">Zone/Route</label>
              <select
                v-model="reportForm.zone"
                required
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="">Select a zone/route</option>
                <option value="red">Red Zone</option>
                <option value="orange">Orange Zone</option>
                <option value="yellow">Yellow Zone</option>
                <option value="green">Green Zone</option>
                <option value="white">White Zone</option>
                <option value="general">General/Multiple Zones</option>
              </select>
            </div>

            <!-- Rating (Only for reviews) -->
            <div v-if="reportForm.type === 'review'">
              <label class="block text-xs font-semibold text-gray-900 mb-1">Rating</label>
              <div class="flex items-center space-x-1">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  @click="setRating(star)"
                  class="p-1 rounded-lg transition-all transform hover:scale-105"
                  :class="star <= reportForm.rating ? 'text-yellow-400 bg-yellow-50' : 'text-gray-300 hover:text-gray-400'"
                >
                  <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                </button>
                <span class="ml-1 text-xs font-medium text-gray-600">
                  {{
                    reportForm.rating
                      ? `${reportForm.rating}`
                      : 'No rating'
                  }}
                </span>
              </div>
            </div>

            <!-- Issue Category (Only for reports) -->
            <div v-if="reportForm.type === 'report'">
              <label class="block text-xs font-semibold text-gray-900 mb-1">Issue Category</label>
              <select
                v-model="reportForm.category"
                required
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="">Select category</option>
                <option value="driver_behavior">Driver Behavior</option>
                <option value="vehicle_condition">Vehicle Condition</option>
                <option value="route_issues">Route Issues</option>
                <option value="fare_disputes">Fare Disputes</option>
                <option value="safety_concerns">Safety Concerns</option>
                <option value="service_quality">Service Quality</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <!-- Subject/Title -->
          <div>
            <label class="block text-xs font-semibold text-gray-900 mb-1">
              {{ reportForm.type === 'review' ? 'Review Title' : 'Issue Summary' }}
            </label>
            <input
              v-model="reportForm.subject"
              type="text"
              required
              maxlength="100"
              :placeholder="
                reportForm.type === 'review'
                  ? 'e.g., Great service'
                  : 'e.g., Driver took wrong route'
              "
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-gray-400"
            />
            <p class="text-xs text-gray-500 mt-0.5">{{ reportForm.subject.length }}/100</p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-semibold text-gray-900 mb-1">
              {{ reportForm.type === 'review' ? 'Review Details' : 'Detailed Description' }}
            </label>
            <textarea
              v-model="reportForm.description"
              required
              rows="3"
              maxlength="500"
              :placeholder="
                reportForm.type === 'review'
                  ? 'Share your experience...'
                  : 'Please provide details...'
              "
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none placeholder-gray-400"
            ></textarea>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ reportForm.description.length }}/500
            </p>
          </div>

          <!-- Location & DateTime -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-900 mb-1">Location (Optional)</label>
              <input
                v-model="reportForm.location"
                type="text"
                :placeholder="reportForm.type === 'review' ? 'Where?' : 'Where?'"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-900 mb-1">Date & Time (Optional)</label>
              <input
                v-model="reportForm.datetime"
                type="datetime-local"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 px-4 py-2 text-sm border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              <span v-if="isSubmitting" class="flex items-center justify-center">
                <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
              <span v-else>Submit {{ reportForm.type === 'review' ? 'Review' : 'Report' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { supabase } from '@/composables/useSupabase'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
})

// Emits
const emit = defineEmits(['close', 'submit'])

// Reactive state
const showModal = ref(props.show)
const isSubmitting = ref(false)

// Alert state
const alert = ref({
  show: false,
  type: 'info',
  message: '',
})

// Form data
const reportForm = ref({
  type: 'review',
  zone: '',
  bodyNumber: '',
  rating: 0,
  category: '',
  subject: '',
  description: '',
  location: '',
  datetime: '',
})

// Computed properties
const alertClasses = computed(() => {
  const baseClasses = 'border-l-4'
  switch (alert.value.type) {
    case 'success':
      return `${baseClasses} border-green-500 bg-green-50`
    case 'error':
      return `${baseClasses} border-red-500 bg-red-50`
    default:
      return `${baseClasses} border-blue-500 bg-blue-50`
  }
})

// Watch for prop changes
watch(
  () => props.show,
  (newVal) => {
    showModal.value = newVal
    if (newVal) {
      resetForm()
      hideAlert()
    }
  },
)

// Alert methods
const showAlert = (type, message, duration = 5000) => {
  alert.value = {
    show: true,
    type,
    message,
  }

  if (duration > 0) {
    setTimeout(() => {
      hideAlert()
    }, duration)
  }
}

const hideAlert = () => {
  alert.value.show = false
}

// Methods
const closeModal = () => {
  showModal.value = false
  hideAlert()
  emit('close')
}

const setRating = (stars) => {
  reportForm.value.rating = stars
}

const resetForm = () => {
  reportForm.value = {
    type: 'review',
    zone: '',
    bodyNumber: '',
    rating: 0,
    category: '',
    subject: '',
    description: '',
    location: '',
    datetime: '',
  }
}

const submitReport = async () => {
  if (!props.user?.isLoggedIn?.()) {
    showAlert('error', 'Please login to submit a review or report')
    return
  }

  // Validate form
  if (!reportForm.value.subject.trim()) {
    showAlert('error', 'Please enter a title/summary')
    return
  }

  if (!reportForm.value.description.trim()) {
    showAlert('error', 'Please enter a description')
    return
  }

  if (!reportForm.value.zone) {
    showAlert('error', 'Please select a zone/route')
    return
  }

  if (!reportForm.value.bodyNumber.trim()) {
    showAlert('error', 'Please enter the tricycle body number')
    return
  }

  if (reportForm.value.type === 'review' && reportForm.value.rating === 0) {
    showAlert('error', 'Please select a rating')
    return
  }

  if (reportForm.value.type === 'report' && !reportForm.value.category) {
    showAlert('error', 'Please select an issue category')
    return
  }

  isSubmitting.value = true
  hideAlert()

  try {
    const submissionData = {
      user_id: props.user.currentUser().id,
      zone: reportForm.value.zone,
      body_number: reportForm.value.bodyNumber,
      subject: reportForm.value.subject,
      description: reportForm.value.description,
      location: reportForm.value.location || null,
      datetime: reportForm.value.datetime || null,
      created_at: new Date().toISOString(),
    }

    console.log('Submitting report:', submissionData)

    if (reportForm.value.type === 'review') {
      // Insert into reviews table
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            ...submissionData,
            rating: reportForm.value.rating,
          },
        ])
        .select()

      if (error) throw error
    } else {
      // Insert into reports table
      const { data, error } = await supabase
        .from('reports')
        .insert([
          {
            ...submissionData,
            category: reportForm.value.category,
            status: 'pending',
          },
        ])
        .select()

      if (error) throw error
    }

    // Show success message
    showAlert(
      'success',
      `${reportForm.value.type === 'review' ? 'Review' : 'Report'} submitted successfully! Thank you for your feedback.`,
      0, // Set to 0 so it doesn't auto-hide
    )

    // Close modal after alert is shown
    setTimeout(() => {
      isSubmitting.value = false
      emit('submit')
      closeModal()
    }, 1500) // Shorter delay since we're managing the alert manually
  } catch (error) {
    console.error('Submission failed:', error)
    console.error('Error code:', error.code)
    console.error('Error details:', JSON.stringify(error, null, 2))
    showAlert('error', `Failed to submit: ${error.message}`)
    isSubmitting.value = false
  }
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in-out;
}
</style>