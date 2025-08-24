<template>
  <div class="fixed inset-0 bg-white flex items-center justify-center z-50">
    <div class="text-center">
      <!-- Logo -->
      <div class="mb-8">
        <img
          src="../assets/orange_icon.ico"
          alt="TricycleNav Logo"
          class="w-24 h-24 mx-auto rounded-full shadow-lg object-cover"
        />
      </div>

      <!-- Progress Bar -->
      <div class="w-64 bg-gray-200 rounded-full h-3">
        <div
          class="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  progress: {
    type: Number,
    default: 0,
  },
})
</script>
