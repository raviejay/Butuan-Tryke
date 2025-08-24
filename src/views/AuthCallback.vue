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
import { useRouter } from 'vue-router'
import { supabase } from '@/composables/useSupabase'

const router = useRouter()

onMounted(async () => {
  try {
    console.log('Auth callback processing...')

    // Handle the OAuth callback - Supabase automatically processes hash fragments
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Error getting session:', error)
      router.push('/?error=auth_failed')
      return
    }

    if (session) {
      console.log('User authenticated successfully:', session.user.email)
      // Redirect to home or intended destination
      router.push('/')
    } else {
      console.log('No session found, redirecting to home')
      router.push('/')
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    router.push('/?error=auth_failed')
  }
})
</script>
