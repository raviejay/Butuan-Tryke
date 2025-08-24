<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">Completing sign in...</h2>
        <p class="mt-2 text-sm text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { supabase } from '@/composables/useSupabase'

onMounted(async () => {
  try {
    console.log('Auth callback page loaded')

    // Handle the OAuth callback - check both hash and query parameters
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const queryParams = new URLSearchParams(window.location.search)

    // Check if we have token in hash (common for OAuth)
    if (window.location.hash.includes('access_token')) {
      console.log('OAuth response found in hash fragment')

      // Supabase should automatically handle this, but let's trigger a session refresh
      const { error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
        window.location.href = '/?error=auth_failed'
        return
      }

      // Redirect to home after successful auth
      window.location.href = '/'
      return
    }

    // Check for auth code in query parameters (alternative flow)
    const authCode = queryParams.get('code')
    if (authCode) {
      console.log('Auth code found, exchanging for session')
      const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)

      if (error) {
        console.error('Code exchange error:', error)
        window.location.href = '/?error=auth_failed'
        return
      }

      window.location.href = '/'
      return
    }

    // If no auth data found, check existing session
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session) {
      window.location.href = '/'
    } else {
      window.location.href = '/?error=no_auth_data'
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    window.location.href = '/?error=auth_failed'
  }
})
</script>
