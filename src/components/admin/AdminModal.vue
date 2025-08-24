<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ getModalTitle() }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
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

      <div class="space-y-4">
        <!-- User Modal Content -->
        <div v-if="modalType.includes('user')" class="space-y-4">
          <div v-if="modalType === 'create-user'">
            <label class="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              v-model="formData.full_name"
              type="text"
              required
              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div v-if="modalType === 'create-user'">
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="formData.email"
              type="email"
              required
              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div v-if="modalType === 'create-user'">
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <input
              v-model="formData.password"
              type="password"
              required
              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div v-if="modalType.includes('user')">
            <label class="block text-sm font-medium text-gray-700">Role</label>
            <select
              v-if="modalType === 'edit-user' || modalType === 'create-user'"
              v-model="formData.role"
              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <p v-else class="mt-1 text-sm text-gray-900 capitalize">{{ selectedItem.role }}</p>
          </div>
          <div v-if="modalType === 'view-user'">
            <label class="block text-sm font-medium text-gray-700">Full Name</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedItem.full_name }}</p>
          </div>
          <div v-if="modalType === 'view-user'">
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedItem.email }}</p>
          </div>
          <div v-if="modalType === 'view-user'">
            <label class="block text-sm font-medium text-gray-700">Created</label>
            <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedItem.created_at) }}</p>
          </div>
        </div>

        <!-- Review Modal Content -->
        <div v-if="modalType.includes('review')" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Subject</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedItem.subject }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Zone</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedItem.zone }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Rating</label>
            <div class="flex mt-1">
              <span
                v-for="i in 5"
                :key="i"
                :class="['text-lg', i <= selectedItem.rating ? 'text-yellow-400' : 'text-gray-300']"
              >
                ★
              </span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedItem.description }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Location</label>
            <p class="mt-1 text-sm text-gray-900">
              {{ selectedItem.location || 'Not specified' }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Date</label>
            <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedItem.datetime) }}</p>
          </div>
        </div>

        <!-- Report Modal Content -->
        <div v-if="modalType.includes('report')" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Subject</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedItem.subject }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedItem.description }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Category</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedItem.category }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Zone</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedItem.zone }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Body Number</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedItem.body_number }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <select
              v-if="modalType === 'edit-report'"
              v-model="formData.status"
              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
            <p v-else class="mt-1 text-sm text-gray-900 capitalize">{{ selectedItem.status }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Location</label>
            <p class="mt-1 text-sm text-gray-900">
              {{ selectedItem.location || 'Not specified' }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Date</label>
            <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedItem.datetime) }}</p>
          </div>
        </div>
      </div>

      <div v-if="!modalType.includes('view')" class="flex justify-end space-x-3 mt-6">
        <button
          @click="$emit('close')"
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          @click="$emit('save', formData)"
          class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          {{ modalType.includes('create') ? 'Create' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'

const props = defineProps({
  showModal: {
    type: Boolean,
    default: false,
  },
  modalType: {
    type: String,
    default: '',
  },
  selectedItem: {
    type: Object,
    default: null,
  },
  formData: {
    type: Object,
    default: () => ({}),
  },
})

defineEmits(['close', 'save'])

const getModalTitle = () => {
  const titles = {
    'create-user': 'Create New User',
    'edit-user': 'Edit User',
    'view-user': 'User Details',
    'view-review': 'Review Details',
    'view-report': 'Report Details',
    'edit-report': 'Edit Report Status',
  }
  return titles[props.modalType] || 'Details'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
