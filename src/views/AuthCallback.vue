<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">Completing sign in...</h2>
        <p class="mt-2 text-sm text-gray-600">Please wait while we redirect you.</p>
        <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/composables/useSupabase'

const router = useRouter()
const error = ref('')

onMounted(async () => {
  try {
    console.log('Auth callback processing...')

    // Get the hash from the URL
    const hash = window.location.hash.substring(1)
    console.log('Hash fragment:', hash)

    // Check if we have authentication data in the hash
    if (hash.includes('access_token')) {
      console.log('OAuth response detected in hash')

      // Parse the hash parameters
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        // Set the session manually
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) {
          console.error('Session error:', sessionError)
          error.value = 'Authentication failed. Please try again.'
          setTimeout(() => router.push('/'), 3000)
          return
        }

        if (session) {
          console.log('User authenticated successfully:', session.user.email)
          // Redirect to home after successful auth
          setTimeout(() => router.push('/'), 1000)
          return
        }
      }
    }

    // Fallback: try to get existing session
    const {
      data: { session },
      error: getSessionError,
    } = await supabase.auth.getSession()

    if (getSessionError) {
      console.error('Get session error:', getSessionError)
      error.value = 'Session error. Please try logging in again.'
      setTimeout(() => router.push('/'), 3000)
      return
    }

    if (session) {
      console.log('Session found, redirecting to home')
      setTimeout(() => router.push('/'), 1000)
    } else {
      console.log('No session found, redirecting to home')
      error.value = 'No authentication data found. Please try logging in again.'
      setTimeout(() => router.push('/'), 3000)
    }
  } catch (err) {
    console.error('Auth callback error:', err)
    error.value = 'An unexpected error occurred. Please try again.'
    setTimeout(() => router.push('/'), 3000)
  }
})
</script>
