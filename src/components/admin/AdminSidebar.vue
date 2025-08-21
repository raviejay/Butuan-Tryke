<template>
  <div
    :class="[
      'bg-white shadow-lg transition-all duration-300 ease-in-out relative',
      collapsed ? 'w-16' : 'w-64',
      'md:relative md:translate-x-0',
      isMobile && !collapsed ? 'fixed inset-y-0 left-0 z-50' : '',
      isMobile && collapsed ? 'translate-x-0' : '',
    ]"
  >
    <!-- Mobile overlay -->
    <div
      v-if="isMobile && !collapsed"
      class="fixed inset-0 z-40 md:hidden"
      @click="$emit('toggle')"
    ></div>

    <!-- Sidebar header -->
    <div class="p-4 flex items-center justify-between">
      <h1
        :class="[
          'font-bold text-orange-600 transition-all duration-300',
          collapsed ? 'text-4xl opacity-0 mb-2' : 'text-xl opacity-100',
        ]"
      >
        <span v-if="!collapsed">Admin Dashboard</span>
      </h1>
      <button @click="$emit('toggle')" class="p-0 rounded-lg hover:bg-gray-100 transition-colors">
        <svg
          class="w-5 h-5 text-gray-600 transition-transform duration-300"
          :class="collapsed ? 'rotate-180 m-2' : ''"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="mt-6">
      <div class="px-4 space-y-2">
        <button
          @click="$emit('section-change', 'overview')"
          :class="[
            'w-full text-left px-4 py-2 rounded-lg flex items-center transition-all duration-300',
            activeSection === 'overview'
              ? 'bg-orange-50 text-orange-600'
              : 'text-gray-700 hover:bg-gray-50',
            collapsed ? 'justify-center' : 'space-x-3',
          ]"
          :title="collapsed ? 'Overview' : ''"
        >
          <div class="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0"></div>
          <span v-if="!collapsed" class="transition-opacity duration-300"> Overview </span>
        </button>

        <button
          @click="$emit('section-change', 'users')"
          :class="[
            'w-full text-left px-4 py-2 rounded-lg flex items-center transition-all duration-300',
            activeSection === 'users'
              ? 'bg-orange-50 text-orange-600'
              : 'text-gray-700 hover:bg-gray-50',
            collapsed ? 'justify-center' : 'space-x-3',
          ]"
          :title="collapsed ? 'Manage Users' : ''"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
          <span v-if="!collapsed" class="transition-opacity duration-300"> Manage Users </span>
        </button>

        <button
          @click="$emit('section-change', 'reviews')"
          :class="[
            'w-full text-left px-4 py-2 rounded-lg flex items-center transition-all duration-300',
            activeSection === 'reviews'
              ? 'bg-orange-50 text-orange-600'
              : 'text-gray-700 hover:bg-gray-50',
            collapsed ? 'justify-center' : 'space-x-3',
          ]"
          :title="collapsed ? 'Manage Reviews' : ''"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span v-if="!collapsed" class="transition-opacity duration-300"> Manage Reviews </span>
        </button>

        <button
          @click="$emit('section-change', 'reports')"
          :class="[
            'w-full text-left px-4 py-2 rounded-lg flex items-center transition-all duration-300',
            activeSection === 'reports'
              ? 'bg-orange-50 text-orange-600'
              : 'text-gray-700 hover:bg-gray-50',
            collapsed ? 'justify-center' : 'space-x-3',
          ]"
          :title="collapsed ? 'Manage Reports' : ''"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span v-if="!collapsed" class="transition-opacity duration-300"> Manage Reports </span>
        </button>

        <button
          @click="$emit('section-change', 'routes')"
          :class="[
            'w-full text-left px-4 py-2 rounded-lg flex items-center transition-all duration-300',
            activeSection === 'routes'
              ? 'bg-orange-50 text-orange-600'
              : 'text-gray-700 hover:bg-gray-50',
            collapsed ? 'justify-center' : 'space-x-3',
          ]"
          :title="collapsed ? 'Route Zones' : ''"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span v-if="!collapsed" class="transition-opacity duration-300"> Route Zones </span>
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup>
defineProps({
  activeSection: {
    type: String,
    required: true,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggle', 'section-change'])
</script>
