<template>
  <div class="fixed inset-0 bg-white flex items-center justify-center z-50">
    <div class="flex flex-col items-center">
      <!-- Logo -->
      <div class="mb-16 flex justify-center">
        <img
          src="../assets/logo4.png"
          alt="TricycleNav Logo"
          class="w-30 h-30"
        />
      </div>

      <!-- Progress Bar -->
      <div class="w-64 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          class="h-3 rounded-full transition-all duration-500 ease-out progress-bar"
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

<style scoped>
.progress-bar {
  background: repeating-linear-gradient(
    45deg,
    #f97a00,
    #f97a00 10px,
    #ff9c40 10px,
    #ff9c40 20px
  );
  animation: move 1s linear infinite;
}

@keyframes move {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 20px 0;
  }
}
</style>
