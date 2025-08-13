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
    console.log('Current URL:', window.location.href)

    // Handle the OAuth callback with the URL hash/search params
    const { data, error } = await supabase.auth.getSession()

    console.log('Session data:', data)
    console.log('Session error:', error)

    if (error) {
      console.error('Auth callback error:', error)
      // Redirect to home with error
      setTimeout(() => {
        window.location.href = '/?error=auth_failed'
      }, 2000)
      return
    }

    if (data.session) {
      console.log('Session found, redirecting to home')
      // Successfully authenticated, redirect to home
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } else {
      console.log('No session found, checking for auth code in URL')

      // Check if there's an auth code in the URL
      const urlParams = new URLSearchParams(window.location.search)
      const authCode = urlParams.get('code')

      if (authCode) {
        console.log('Auth code found, exchanging for session')
        // Exchange the auth code for a session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(authCode)

        if (sessionError) {
          console.error('Code exchange error:', sessionError)
          setTimeout(() => {
            window.location.href = '/?error=auth_failed'
          }, 2000)
          return
        }

        if (sessionData.session) {
          console.log('Session created successfully')
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
        } else {
          console.log('No session created')
          setTimeout(() => {
            window.location.href = '/'
          }, 2000)
        }
      } else {
        console.log('No auth code found, redirecting to home')
        // No session and no code, redirect to home
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      }
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    setTimeout(() => {
      window.location.href = '/?error=auth_failed'
    }, 2000)
  }
})
</script>
