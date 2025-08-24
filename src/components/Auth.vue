<template>
  <div class="relative">
    <!-- User Profile Circle -->
    <button
      @click="toggleDropdown"
      class="w-10 h-10 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      <svg v-if="!isLoggedIn" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <span v-else class="text-sm font-bold">{{ userInitials }}</span>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="showDropdown"
      class="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
      @click.stop
    >
      <!-- Not logged in options -->
      <template v-if="!isLoggedIn">
        <button
          @click="openLoginModal"
          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          Login
        </button>
        <button
          @click="openSignupModal"
          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          Sign Up
        </button>
      </template>

      <!-- Logged in options -->
      <template v-else>
        <div class="px-4 py-2 border-b border-gray-200">
          <p class="text-sm font-medium text-gray-900">
            {{ currentUser.user_metadata?.full_name || currentUser.email }}
            <span v-if="userRole" class="text-xs pl-0.5 text-orange-600 font-medium capitalize">
              {{ userRole }}
            </span>
          </p>
          <p class="text-xs text-gray-500">{{ currentUser.email }}</p>
        </div>

        <!-- Admin-only options -->
        <template v-if="isAdmin">
          <button
            @click="handleDashboard"
            class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Dashboard
          </button>

          <div class="border-t border-gray-200 my-2"></div>
        </template>

        <button
          @click="logout"
          class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </template>
    </div>

    <!-- Login Modal -->
    <div
      v-if="showLoginModal"
      class="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeLoginModal"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-10">
          <h1 class="text-2xl font-bold text-orange-600">Login</h1>
          <button @click="closeLoginModal" class="text-gray-400 hover:text-gray-600">
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

        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                v-model="loginForm.email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                v-model="loginForm.password"
                type="password"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div class="flex items-center mt-4 mb-4">
            <div class="flex-1 border-t border-gray-300"></div>
            <span class="px-4 text-sm text-gray-500">or</span>
            <div class="flex-1 border-t border-gray-300"></div>
          </div>
          <!-- Google Login Button -->
          <button
            @click="signInWithGoogle"
            :disabled="isLoading"
            class="w-full mb-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full mt-6 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            <span v-if="isLoading">Logging in...</span>
            <span v-else>Login</span>
          </button>
        </form>

        <p class="text-center text-sm text-gray-600 mt-4">
          Don't have an account?
          <button @click="switchToSignup" class="text-orange-600 hover:text-orange-700 font-medium">
            Sign up
          </button>
        </p>
      </div>
    </div>

    <!-- Signup Modal -->
    <div
      v-if="showSignupModal"
      class="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeSignupModal"
    >
      <div class="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-orange-600">Sign up</h2>
          <button @click="closeSignupModal" class="text-gray-400 hover:text-gray-600">
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

        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <form @submit.prevent="handleSignup">
          <div class="space-y-2">
            <div>
              <label class="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                v-model="signupForm.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input
                v-model="signupForm.email"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Password</label>
              <input
                v-model="signupForm.password"
                type="password"
                required
                minlength="6"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your password (min. 6 characters)"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                v-model="signupForm.confirmPassword"
                type="password"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div class="flex items-center mb-2 mt-2">
            <div class="flex-1 border-t border-gray-300"></div>
            <span class="px-4 text-sm text-gray-500">or</span>
            <div class="flex-1 border-t border-gray-300"></div>
          </div>

          <!-- Google Signup Button -->
          <button
            @click="signInWithGoogle"
            :disabled="isLoading"
            class="w-full mb-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </button>

          <button
            type="submit"
            :disabled="isLoading || signupForm.password !== signupForm.confirmPassword"
            class="w-full mt-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            <span v-if="isLoading">Creating account...</span>
            <span v-else>Sign Up</span>
          </button>
        </form>

        <p class="text-center text-sm text-gray-600 mt-4">
          Already have an account?
          <button @click="switchToLogin" class="text-orange-600 hover:text-orange-700 font-medium">
            Login
          </button>
        </p>
      </div>
    </div>
    <AdminDashboard v-if="showDashboard" :currentUser="currentUser" @close="closeDashboard" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/composables/useSupabase'
import AdminDashboard from '@/components/admin/Dashboard.vue'
// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update:modelValue', 'login', 'logout', 'dashboard'])

// Reactive state
const showDropdown = ref(false)
const showLoginModal = ref(false)
const showSignupModal = ref(false)
const isLoading = ref(false)
const isLoggedIn = ref(false)
const currentUser = ref(null)
const userRole = ref('')
const errorMessage = ref('')
const showDashboard = ref(false)

// Form data
const loginForm = ref({
  email: '',
  password: '',
})

const signupForm = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// Computed
const userInitials = computed(() => {
  if (!currentUser.value) return ''
  const name = currentUser.value.user_metadata?.full_name || currentUser.value.email

  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const isAdmin = computed(() => {
  return userRole.value === 'admin'
})

// Methods
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const openLoginModal = () => {
  showDropdown.value = false
  showLoginModal.value = true
  errorMessage.value = ''
}

const closeLoginModal = () => {
  showLoginModal.value = false
  resetLoginForm()
  errorMessage.value = ''
}

const openSignupModal = () => {
  showDropdown.value = false
  showSignupModal.value = true
  errorMessage.value = ''
}

const closeSignupModal = () => {
  showSignupModal.value = false
  resetSignupForm()
  errorMessage.value = ''
}

const switchToSignup = () => {
  closeLoginModal()
  openSignupModal()
}

const switchToLogin = () => {
  closeSignupModal()
  openLoginModal()
}

const resetLoginForm = () => {
  loginForm.value = {
    email: '',
    password: '',
  }
}

const resetSignupForm = () => {
  signupForm.value = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  }
}

// Fetch user role from profiles table
const fetchUserRole = async (userId) => {
  try {
    const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).single()

    if (error) throw error

    userRole.value = data?.role || 'user'
  } catch (error) {
    console.error('Error fetching user role:', error)
    userRole.value = 'user' // Default to user role
  }
}

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.value.email,
      password: loginForm.value.password,
    })

    if (error) throw error

    currentUser.value = data.user
    isLoggedIn.value = true
    await fetchUserRole(data.user.id)
    closeLoginModal()
    emit('login', data.user)
  } catch (error) {
    console.error('Login failed:', error)
    errorMessage.value = error.message || 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleSignup = async () => {
  if (signupForm.value.password !== signupForm.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match!'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase.auth.signUp({
      email: signupForm.value.email,
      password: signupForm.value.password,
      options: {
        data: {
          full_name: signupForm.value.name,
        },
      },
    })

    if (error) throw error

    if (data.user) {
      // Check if email confirmation is required
      if (data.user.email_confirmed_at) {
        currentUser.value = data.user
        isLoggedIn.value = true
        await fetchUserRole(data.user.id)
        closeSignupModal()
        emit('login', data.user)
      } else {
        errorMessage.value = 'Please check your email to confirm your account.'
      }
    }
  } catch (error) {
    console.error('Signup failed:', error)
    errorMessage.value = error.message || 'Signup failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const signInWithGoogle = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
  } catch (error) {
    console.error('Google login failed:', error)
    errorMessage.value = error.message || 'Google login failed. Please try again.'
    isLoading.value = false
  }
}

const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    currentUser.value = null
    isLoggedIn.value = false
    userRole.value = ''
    showDropdown.value = false
    emit('logout')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Admin action handlers

const handleDashboard = () => {
  showDropdown.value = false
  showDashboard.value = true
  emit('dashboard')
}

const closeDashboard = () => {
  showDashboard.value = false
}

// Click outside handler
const handleClickOutside = (event) => {
  if (showDropdown.value && !event.target.closest('.relative')) {
    showDropdown.value = false
  }
}

// Check for existing session on mount
onMounted(async () => {
  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session) {
    currentUser.value = session.user
    isLoggedIn.value = true
    await fetchUserRole(session.user.id)
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser.value = session.user
      isLoggedIn.value = true
      await fetchUserRole(session.user.id)
      closeLoginModal()
      closeSignupModal()
      emit('login', session.user)
    } else if (event === 'SIGNED_OUT') {
      currentUser.value = null
      isLoggedIn.value = false
      userRole.value = ''
      emit('logout')
    }
  })

  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Expose login status for parent components
defineExpose({
  isLoggedIn: () => isLoggedIn.value,
  currentUser: () => currentUser.value,
  userRole: () => userRole.value,
  isAdmin: () => isAdmin.value,
  openLoginModal: () => openLoginModal(),
})
</script>
