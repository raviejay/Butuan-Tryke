<template>
  <!-- Review/Report Modal -->
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center z-50 p-4"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-900 flex items-center">
          <svg
            class="w-6 h-6 text-orange-600 mr-2"
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
          Submit Review/Report
        </h2>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
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

      <form @submit.prevent="submitReport">
        <!-- Report Type -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div class="flex gap-3">
            <label class="flex items-center">
              <input
                v-model="reportForm.type"
                type="radio"
                value="review"
                class="text-orange-600 focus:ring-orange-500"
              />
              <span class="ml-2 text-sm text-gray-700">Review</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="reportForm.type"
                type="radio"
                value="report"
                class="text-orange-600 focus:ring-orange-500"
              />
              <span class="ml-2 text-sm text-gray-700">Report Issue</span>
            </label>
          </div>
        </div>

        <!-- Zone Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Zone/Route</label>
          <select
            v-model="reportForm.zone"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
        <div v-if="reportForm.type === 'review'" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
          <div class="flex items-center space-x-1">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              @click="setRating(star)"
              class="p-1 rounded transition-colors"
              :class="star <= reportForm.rating ? 'text-yellow-400' : 'text-gray-300'"
            >
              <svg class="w-6 h-6 fill-current" viewBox="0 0 20 20">
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
            </button>
            <span class="ml-2 text-sm text-gray-600">
              {{
                reportForm.rating
                  ? `${reportForm.rating} star${reportForm.rating !== 1 ? 's' : ''}`
                  : 'No rating'
              }}
            </span>
          </div>
        </div>

        <!-- Issue Category (Only for reports) -->
        <div v-if="reportForm.type === 'report'" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Issue Category</label>
          <select
            v-model="reportForm.category"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Select issue category</option>
            <option value="driver_behavior">Driver Behavior</option>
            <option value="vehicle_condition">Vehicle Condition</option>
            <option value="route_issues">Route Issues</option>
            <option value="fare_disputes">Fare Disputes</option>
            <option value="safety_concerns">Safety Concerns</option>
            <option value="service_quality">Service Quality</option>
            <option value="other">Other</option>
          </select>
        </div>

        <!-- Subject/Title -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ reportForm.type === 'review' ? 'Review Title' : 'Issue Summary' }}
          </label>
          <input
            v-model="reportForm.subject"
            type="text"
            required
            maxlength="100"
            :placeholder="
              reportForm.type === 'review'
                ? 'Brief title for your review'
                : 'Brief summary of the issue'
            "
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p class="text-xs text-gray-500 mt-1">{{ reportForm.subject.length }}/100 characters</p>
        </div>

        <!-- Description -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ reportForm.type === 'review' ? 'Review Details' : 'Detailed Description' }}
          </label>
          <textarea
            v-model="reportForm.description"
            required
            rows="4"
            maxlength="500"
            :placeholder="
              reportForm.type === 'review'
                ? 'Share your experience with this tricycle service...'
                : 'Please provide detailed information about the issue...'
            "
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            {{ reportForm.description.length }}/500 characters
          </p>
        </div>

        <!-- Location (Optional) -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
          <input
            v-model="reportForm.location"
            type="text"
            :placeholder="
              reportForm.type === 'review'
                ? 'Where did this experience happen?'
                : 'Where did this issue occur?'
            "
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <!-- Date/Time (Optional) -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Date & Time (Optional)</label>
          <input
            v-model="reportForm.datetime"
            type="datetime-local"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            type="button"
            @click="closeModal"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            <span v-if="isSubmitting">Submitting...</span>
            <span v-else>Submit {{ reportForm.type === 'review' ? 'Review' : 'Report' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

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

// Form data
const reportForm = ref({
  type: 'review',
  zone: '',
  rating: 0,
  category: '',
  subject: '',
  description: '',
  location: '',
  datetime: '',
})

// Watch for prop changes
watch(
  () => props.show,
  (newVal) => {
    showModal.value = newVal
    if (newVal) {
      resetForm()
    }
  },
)

// Methods
const closeModal = () => {
  showModal.value = false
  emit('close')
}

const setRating = (stars) => {
  reportForm.value.rating = stars
}

const resetForm = () => {
  reportForm.value = {
    type: 'review',
    zone: '',
    rating: 0,
    category: '',
    subject: '',
    description: '',
    location: '',
    datetime: '',
  }
}

const submitReport = async () => {
  isSubmitting.value = true

  try {
    // Simulate API submission
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Prepare submission data
    const submissionData = {
      ...reportForm.value,
      user: props.user,
      timestamp: new Date().toISOString(),
      id: Date.now(),
    }

    // For demo purposes, just log the data
    console.log('Submitted report/review:', submissionData)

    // Show success message
    alert(
      `${reportForm.value.type === 'review' ? 'Review' : 'Report'} submitted successfully! Thank you for your feedback.`,
    )

    emit('submit', submissionData)
    closeModal()
  } catch (error) {
    console.error('Submission failed:', error)
    alert('Failed to submit. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
