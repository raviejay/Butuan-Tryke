<template>
  <div class="fixed inset-0 bg-gray-100 z-50">
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { supabase } from '@/composables/useSupabase'
import AdminSidebar from './AdminSidebar.vue'
import DashboardOverview from './DashboardOverview.vue'
import ManageUsers from './ManageUsers.vue'
import ManageReviews from './ManageReviews.vue'
import ManageReports from './ManageReports.vue'
import AdminModal from './AdminModal.vue'
import ManageRouteZones from './ManageRouteZones.vue'
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

// Computed
const isMobile = computed(() => screenWidth.value < 768)

// Methods
const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth
  if (screenWidth.value >= 768) {
    sidebarCollapsed.value = false
  }
}

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
      }
    } else if (usersData) {
      users.value = usersData
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
    alert('Error saving changes. Please try again.')
  }
}

const handleUserAction = async (action, userId, data) => {
  try {
    if (action === 'create') {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        user_metadata: {
          full_name: data.full_name,
        },
      })

      if (authError) throw authError

      // Create profile with role
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            role: data.role,
          },
        ])

        if (profileError) throw profileError
      }
    } else if (action === 'update') {
      // Update user role in profiles table
      const { error } = await supabase.from('profiles').update({ role: data.role }).eq('id', userId)

      if (error) throw error
    } else if (action === 'delete') {
      if (confirm('Are you sure you want to delete this user?')) {
        // Delete user profile
        const { error } = await supabase.from('profiles').delete().eq('id', userId)

        if (error) throw error
        await loadData()
      }
    }
  } catch (error) {
    console.error(`Error ${action} user:`, error)
    alert(`Error ${action} user: ${error.message}`)
  }
}

const handleReviewAction = async (action, reviewId) => {
  try {
    if (action === 'delete') {
      if (confirm('Are you sure you want to delete this review?')) {
        const { error } = await supabase.from('reviews').delete().eq('id', reviewId)

        if (error) throw error
        await loadData()
      }
    }
  } catch (error) {
    console.error(`Error ${action} review:`, error)
    alert(`Error ${action} review: ${error.message}`)
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
    }
  } catch (error) {
    console.error(`Error ${action} report:`, error)
    alert(`Error ${action} report: ${error.message}`)
  }
}

const handleZoneUpdated = (zoneType) => {
  console.log(`Zone ${zoneType} was updated`)
  // You can add any additional logic here, such as:
  // - Refreshing other data that depends on route zones
  // - Showing a success notification
  // - Updating the map if you have one
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
