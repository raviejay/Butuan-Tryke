<template>
  <div class="fixed inset-0 bg-gray-100 z-[9999]">
    <div class="flex h-full">
      <!-- Sidebar -->
      <AdminSidebar
        :active-section="activeSection"
        :collapsed="sidebarCollapsed"
        :is-mobile="isMobile"
        @toggle="toggleSidebar"
        @section-change="activeSection = $event"
      />

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header -->
        <div class="bg-white shadow-sm px-4 md:px-4 py-4 flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <h1 class="text-sm md:text-lg font-semibold text-gray-800">
              {{ getSectionTitle() }}
            </h1>
          </div>

          <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 p-0">
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

        <!-- Alert Notifications -->
        <div v-if="alerts.length > 0" class="px-4 md:px-6 pt-4">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            :class="[
              'p-4 rounded-lg border-l-4 shadow-sm mb-3 flex items-start justify-between',
              alert.type === 'success' ? 'bg-green-50 border-green-400 text-green-700' : '',
              alert.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' : '',
              alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : '',
              alert.type === 'info' ? 'bg-blue-50 border-blue-400 text-blue-700' : '',
            ]"
          >
            <div class="flex items-start">
              <!-- Icon -->
              <div class="flex-shrink-0 mr-3">
                <!-- Success Icon -->
                <svg
                  v-if="alert.type === 'success'"
                  class="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <!-- Error Icon -->
                <svg
                  v-else-if="alert.type === 'error'"
                  class="w-5 h-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
                <!-- Warning Icon -->
                <svg
                  v-else-if="alert.type === 'warning'"
                  class="w-5 h-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                <!-- Info Icon -->
                <svg v-else class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <!-- Message -->
              <div>
                <p class="text-sm font-medium">{{ alert.title }}</p>
                <p v-if="alert.message" class="text-sm mt-1">{{ alert.message }}</p>
              </div>
            </div>
            <!-- Close Button -->
            <button
              @click="removeAlert(alert.id)"
              class="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
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

        <!-- Content -->
        <div class="flex-1 p-4 md:p-6 overflow-y-auto">
          <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
          <div v-else>
            <!-- Overview Section -->
            <DashboardOverview
              v-if="activeSection === 'overview'"
              :current-user="currentUser"
              :users="users"
              :reviews="reviews"
              :reports="reports"
            />

            <!-- Users Section -->
            <ManageUsers
              v-if="activeSection === 'users'"
              :users="users"
              @create-user="openModal('create-user')"
              @view-user="openModal('view-user', $event)"
              @edit-user="openModal('edit-user', $event)"
              @delete-user="handleUserAction('delete', $event)"
            />

            <!-- Reviews Section -->
            <ManageReviews
              v-if="activeSection === 'reviews'"
              :reviews="reviews"
              @view-review="openModal('view-review', $event)"
              @delete-review="handleReviewAction('delete', $event)"
            />

            <!-- Reports Section -->
            <ManageReports
              v-if="activeSection === 'reports'"
              :reports="reports"
              @view-report="openModal('view-report', $event)"
              @edit-report="openModal('edit-report', $event)"
            />

            <!-- Route Zones Section -->
            <ManageRouteZones v-if="activeSection === 'routes'" @zone-updated="handleZoneUpdated" />

            <!-- Fare Management Section -->
            <ManageFare 
              v-if="activeSection === 'fare-management'" 
              @show-alert="showAlert"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <AdminModal
      :show-modal="showModal"
      :modal-type="modalType"
      :selected-item="selectedItem"
      :form-data="formData"
      @close="closeModal"
      @save="saveChanges"
    />

    <!-- Custom Confirmation Dialog -->
    <div
      v-if="confirmDialog.show"
      class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60]"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <div class="flex items-center mb-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4"
            >
              <svg
                class="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">{{ confirmDialog.title }}</h3>
          </div>
          <p class="text-sm text-gray-500 mb-6">{{ confirmDialog.message }}</p>
          <div class="flex justify-end space-x-3">
            <button
              @click="handleConfirmCancel"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleConfirmAccept"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { supabase } from '@/composables/useSupabase'
import { supabaseAdmin } from '@/composables/useSupabaseAdmin'
import AdminSidebar from './AdminSidebar.vue'
import DashboardOverview from './DashboardOverview.vue'
import ManageUsers from './ManageUsers.vue'
import ManageReviews from './ManageReviews.vue'
import ManageReports from './ManageReports.vue'
import AdminModal from './AdminModal.vue'
import ManageRouteZones from './ManageRouteZones.vue'
import ManageFare from './ManageFare.vue'


// Props
const props = defineProps({
  currentUser: {
    type: Object,
    required: true,
  },
})

// Emits
const emit = defineEmits(['close'])

// Reactive state
const activeSection = ref('overview')
const users = ref([])
const reviews = ref([])
const reports = ref([])
const loading = ref(false)
const showModal = ref(false)
const modalType = ref('')
const selectedItem = ref(null)
const formData = ref({})
const sidebarCollapsed = ref(false)
const screenWidth = ref(window.innerWidth)

// Alert system
const alerts = ref([])
const alertIdCounter = ref(0)

// Confirmation dialog
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  resolve: null,
})

// Computed
const isMobile = computed(() => screenWidth.value < 768)

// Alert Methods
const showAlert = (type, title, message = null, duration = 4000) => {
  const alert = {
    id: alertIdCounter.value++,
    type,
    title,
    message,
    timestamp: Date.now(),
  }

  alerts.value.push(alert)

  // Auto-remove alert after duration
  if (duration > 0) {
    setTimeout(() => {
      removeAlert(alert.id)
    }, duration)
  }
}

const removeAlert = (alertId) => {
  const index = alerts.value.findIndex((alert) => alert.id === alertId)
  if (index > -1) {
    alerts.value.splice(index, 1)
  }
}

// Custom confirm dialog
const customConfirm = (title, message) => {
  return new Promise((resolve) => {
    confirmDialog.value = {
      show: true,
      title,
      message,
      resolve,
    }
  })
}

// Confirmation dialog handlers
const handleConfirmCancel = () => {
  confirmDialog.value.resolve(false)
  confirmDialog.value.show = false
}

const handleConfirmAccept = () => {
  confirmDialog.value.resolve(true)
  confirmDialog.value.show = false
}

// Methods
const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth
  if (screenWidth.value >= 768) {
    sidebarCollapsed.value = false
  }
}

console.log(props.currentUser)
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const getSectionTitle = () => {
  const titles = {
    overview: 'Dashboard Overview',
    users: 'User Management',
    reviews: 'Review Management',
    reports: 'Report Management',
    routes: 'Route Zone Management',
    'fare-management': 'Fare Management',
  }
  return titles[activeSection.value] || 'Dashboard'
}

const loadData = async () => {
  loading.value = true
  try {
    // Load Users - Fixed query to properly join with auth.users
    const { data: usersData, error: usersError } = await supabase.rpc('get_users_with_profiles')

    if (usersError) {
      console.warn('RPC function not available, using fallback query')
      // Fallback: Load profiles and try to match with current user info
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')

      if (!profilesError && profilesData) {
        users.value = profilesData.map((profile) => ({
          id: profile.id,
          email: profile.id === props.currentUser?.id ? props.currentUser.email : 'N/A',
          full_name:
            profile.id === props.currentUser?.id
              ? props.currentUser.user_metadata?.full_name || 'N/A'
              : 'N/A',
          role: profile.role || 'user',
          created_at: profile.created_at,
        }))

        if (profilesData.length > 0) {
          showAlert('success', 'Data loaded successfully', 'User profiles have been loaded')
        }
      }
    } else if (usersData) {
      users.value = usersData
      showAlert('success', 'Data loaded successfully', 'All user data has been loaded')
    }

    // Load Reviews
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (!reviewsError && reviewsData) {
      reviews.value = reviewsData
    }

    // Load Reports
    const { data: reportsData, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (!reportsError && reportsData) {
      reports.value = reportsData
    }
  } catch (error) {
    console.error('Error loading data:', error)
    showAlert('warning', 'Using demo data', 'Could not connect to database, showing sample data')

    // Provide more realistic fallback data for development
    users.value = [
      {
        id: props.currentUser?.id || '1',
        email: props.currentUser?.email || 'admin@example.com',
        full_name: props.currentUser?.user_metadata?.full_name || 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        email: 'user@example.com',
        full_name: 'Regular User',
        role: 'user',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]

    reviews.value = [
      {
        id: 1,
        user_id: '2',
        zone: 'red',
        rating: 5,
        subject: 'Excellent Service',
        description: 'The driver was very courteous and the ride was smooth.',
        location: 'Baguio Market',
        datetime: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]

    reports.value = [
      {
        id: 1,
        user_id: '2',
        body_number: 'B123',
        zone: 'red',
        category: 'driver_behavior',
        subject: 'Rude Driver',
        description: 'Driver was being rude to passengers.',
        location: 'Session Road',
        datetime: new Date().toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  } finally {
    loading.value = false
  }
}

const openModal = (type, item = null) => {
  modalType.value = type
  selectedItem.value = item

  // Initialize form data based on modal type
  if (type === 'create-user') {
    formData.value = {
      full_name: '',
      email: '',
      role: 'user',
      password: '',
    }
  } else if (type === 'edit-user' && item) {
    formData.value = {
      full_name: item.full_name,
      email: item.email,
      role: item.role,
    }
  } else if (type === 'edit-report' && item) {
    formData.value = {
      status: item.status,
    }
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalType.value = ''
  selectedItem.value = null
  formData.value = {}
}

const saveChanges = async (data) => {
  try {
    if (modalType.value === 'create-user') {
      await handleUserAction('create', null, data)
    } else if (modalType.value === 'edit-user') {
      await handleUserAction('update', selectedItem.value.id, data)
    } else if (modalType.value === 'edit-report') {
      await handleReportAction('update', selectedItem.value.id, data)
    }

    closeModal()
    await loadData() // Refresh data
  } catch (error) {
    console.error('Error saving changes:', error)
    showAlert('error', 'Save failed', 'There was an error saving your changes. Please try again.')
  }
}

const handleUserAction = async (action, userId, data) => {
  try {
    if (action === 'create') {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name,
        },
      })

      if (authError) throw authError

      // Create profile with role
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').upsert([
          {
            id: authData.user.id,
            role: data.role,
          },
        ])

        if (profileError) throw profileError
        showAlert('success', 'User created', `Successfully created user: ${data.full_name}`)
      }
    } else if (action === 'update') {
      // Update user role in profiles table
      const { error } = await supabase.from('profiles').update({ role: data.role }).eq('id', userId)

      if (error) throw error
      showAlert('success', 'User updated', 'User role has been successfully updated')
    } else if (action === 'delete') {
      const confirmed = await customConfirm(
        'Delete User',
        'Are you sure you want to delete this user? This action cannot be undone.',
      )

      if (confirmed) {
        // Delete user profile
        const { error } = await supabaseAdmin.from('profiles').delete().eq('id', userId)
        if (error) throw error

        // Delete user from Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (authError) throw authError

        showAlert('success', 'User deleted', 'User has been successfully deleted')
        await loadData()
      }
    }
  } catch (error) {
    console.error(`Error ${action} user:`, error)
    showAlert('error', `Failed to ${action} user`, error.message)
  }
}

const handleReviewAction = async (action, reviewId) => {
  try {
    if (action === 'delete') {
      const confirmed = await customConfirm(
        'Delete Review',
        'Are you sure you want to delete this review? This action cannot be undone.',
      )

      if (confirmed) {
        const { error } = await supabase.from('reviews').delete().eq('id', reviewId)

        if (error) throw error
        showAlert('success', 'Review deleted', 'Review has been successfully deleted')
        await loadData()
      }
    }
  } catch (error) {
    console.error(`Error ${action} review:`, error)
    showAlert('error', `Failed to ${action} review`, error.message)
  }
}

const handleReportAction = async (action, reportId, data) => {
  try {
    if (action === 'update') {
      const { error } = await supabase
        .from('reports')
        .update({
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)

      if (error) throw error
      showAlert('success', 'Report updated', 'Report status has been successfully updated')
    }
  } catch (error) {
    console.error(`Error ${action} report:`, error)
    showAlert('error', `Failed to ${action} report`, error.message)
  }
}

const handleZoneUpdated = (zoneType) => {
  console.log(`Zone ${zoneType} was updated`)
  showAlert('success', 'Zone updated', `Route zone ${zoneType} has been successfully updated`)
}

// Lifecycle hooks
onMounted(() => {
  loadData()
  updateScreenWidth()
  window.addEventListener('resize', updateScreenWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenWidth)
})
</script>