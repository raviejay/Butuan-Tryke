<template>
  <div class="fixed inset-0 bg-gray-100 z-50">
    <div class="flex h-full">
      <!-- Sidebar -->
      <div
        :class="[
          'bg-white shadow-lg transition-all duration-300 ease-in-out relative',
          sidebarCollapsed ? 'w-16' : 'w-64',
          'md:relative md:translate-x-0',
          isMobile && !sidebarCollapsed ? 'fixed inset-y-0 left-0 z-50' : '',
          isMobile && sidebarCollapsed ? 'translate-x-0' : '',
        ]"
      >
        <!-- Mobile overlay -->
        <div
          v-if="isMobile && !sidebarCollapsed"
          class="fixed inset-0 z-40 md:hidden"
          @click="toggleSidebar"
        ></div>

        <!-- Sidebar header -->
        <div class="p-4 flex items-center justify-between">
          <h1
            :class="[
              'font-bold text-orange-600 transition-all duration-300',
              sidebarCollapsed ? 'text-4xl opacity-0 mb-2' : 'text-xl opacity-100',
            ]"
          >
            <span v-if="!sidebarCollapsed">Admin Dashboard</span>
          </h1>
          <button @click="toggleSidebar" class="p-0 rounded-lg hover:bg-gray-100 transition-colors">
            <svg
              class="w-5 h-5 text-gray-600 transition-transform duration-300"
              :class="sidebarCollapsed ? 'rotate-180 m-2' : ''"
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
              @click="activeSection = 'overview'"
              :class="[
                'w-full text-left px-4 py-2 rounded-lg flex items-center transition-all duration-300',
                activeSection === 'overview'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-700 hover:bg-gray-50',
                sidebarCollapsed ? 'justify-center' : 'space-x-3',
              ]"
              :title="sidebarCollapsed ? 'Overview' : ''"
            >
              <div class="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0"></div>
              <span v-if="!sidebarCollapsed" class="transition-opacity duration-300">
                Overview
              </span>
            </button>

            <button
              @click="activeSection = 'users'"
              :class="[
                'w-full text-left px-4 py-2 rounded-lg flex items-center transition-all duration-300',
                activeSection === 'users'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-700 hover:bg-gray-50',
                sidebarCollapsed ? 'justify-center' : 'space-x-3',
              ]"
              :title="sidebarCollapsed ? 'Manage Users' : ''"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <span v-if="!sidebarCollapsed" class="transition-opacity duration-300">
                Manage Users
              </span>
            </button>

            <button
              @click="activeSection = 'reviews'"
              :class="[
                'w-full text-left px-4 py-2 rounded-lg flex items-center transition-all duration-300',
                activeSection === 'reviews'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-700 hover:bg-gray-50',
                sidebarCollapsed ? 'justify-center' : 'space-x-3',
              ]"
              :title="sidebarCollapsed ? 'Manage Reviews' : ''"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span v-if="!sidebarCollapsed" class="transition-opacity duration-300">
                Manage Reviews
              </span>
            </button>

            <button
              @click="activeSection = 'reports'"
              :class="[
                'w-full text-left px-4 py-2 rounded-lg flex items-center transition-all duration-300',
                activeSection === 'reports'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-700 hover:bg-gray-50',
                sidebarCollapsed ? 'justify-center' : 'space-x-3',
              ]"
              :title="sidebarCollapsed ? 'Manage Reports' : ''"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span v-if="!sidebarCollapsed" class="transition-opacity duration-300">
                Manage Reports
              </span>
            </button>
          </div>
        </nav>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Header -->
        <div class="bg-white shadow-sm px-4 md:px-4 py-4 flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <!-- Mobile hamburger menu -->
            <!-- <button
              v-if="isMobile"
              @click="toggleSidebar"
              class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                class="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button> -->

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
            <div v-if="activeSection === 'overview'" class="space-y-6">
              <div
                class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 md:p-6 rounded-lg shadow-lg"
              >
                <h2 class="text-xl md:text-2xl font-bold mb-2">
                  Welcome back, {{ currentUser?.user_metadata?.full_name || currentUser?.email }}!
                </h2>
                <p class="text-orange-100">
                  Role: <span class="font-semibold">Administrator</span>
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div class="bg-white p-4 md:p-6 rounded-lg shadow border-l-4 border-blue-500">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-700">Total Users</h3>
                      <p class="text-2xl md:text-3xl font-bold text-blue-600">{{ users.length }}</p>
                    </div>
                    <svg
                      class="w-8 h-8 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div class="bg-white p-4 md:p-6 rounded-lg shadow border-l-4 border-green-500">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-700">Total Reviews</h3>
                      <p class="text-2xl md:text-3xl font-bold text-green-600">
                        {{ reviews.length }}
                      </p>
                    </div>
                    <svg
                      class="w-8 h-8 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                </div>

                <div class="bg-white p-4 md:p-6 rounded-lg shadow border-l-4 border-red-500">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-700">Total Reports</h3>
                      <p class="text-2xl md:text-3xl font-bold text-red-600">
                        {{ reports.length }}
                      </p>
                    </div>
                    <svg
                      class="w-8 h-8 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Users Section -->
            <div v-if="activeSection === 'users'" class="space-y-6">
              <div
                class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <h2 class="text-2xl font-bold text-gray-800">Manage Users</h2>
                <button
                  @click="openModal('create-user')"
                  class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>Add User</span>
                </button>
              </div>

              <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          User
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Email
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Role
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Created
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm font-medium text-gray-900">{{ user.full_name }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-900">{{ user.email }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span
                            :class="[
                              'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                              user.role === 'admin'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800',
                            ]"
                          >
                            {{ user.role }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ formatDate(user.created_at) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div class="flex space-x-2">
                            <button
                              @click="openModal('view-user', user)"
                              class="text-blue-600 hover:text-blue-900"
                              title="View User"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              @click="openModal('edit-user', user)"
                              class="text-orange-600 hover:text-orange-900"
                              title="Edit User"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              @click="handleUserAction('delete', user.id)"
                              class="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Reviews Section -->
            <div v-if="activeSection === 'reviews'" class="space-y-6">
              <h2 class="text-2xl font-bold text-gray-800">Manage Reviews</h2>

              <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Subject
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Zone
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Rating
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Location
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="review in reviews" :key="review.id" class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm font-medium text-gray-900">{{ review.subject }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-900">{{ review.zone }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex">
                            <span
                              v-for="i in 5"
                              :key="i"
                              :class="[
                                'text-sm',
                                i <= review.rating ? 'text-yellow-400' : 'text-gray-300',
                              ]"
                            >
                              ★
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {{ review.location }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ formatDate(review.datetime) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div class="flex space-x-2">
                            <button
                              @click="openModal('view-review', review)"
                              class="text-blue-600 hover:text-blue-900"
                              title="View Review"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              @click="handleReviewAction('delete', review.id)"
                              class="text-red-600 hover:text-red-900"
                              title="Delete Review"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Reports Section -->
            <div v-if="activeSection === 'reports'" class="space-y-6">
              <h2 class="text-2xl font-bold text-gray-800">Manage Reports</h2>

              <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Subject
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Zone
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Category
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="report in reports" :key="report.id" class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm font-medium text-gray-900">{{ report.subject }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-900">{{ report.zone }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="text-sm text-gray-900">{{ report.category }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span :class="getStatusClass(report.status)">
                            {{ report.status }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ formatDate(report.datetime) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div class="flex space-x-2">
                            <button
                              @click="openModal('view-report', report)"
                              class="text-blue-600 hover:text-blue-900"
                              title="View Report"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              @click="openModal('edit-report', report)"
                              class="text-orange-600 hover:text-orange-900"
                              title="Edit Report Status"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ getModalTitle() }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
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

        <div class="space-y-4">
          <!-- User Modal Content -->
          <div v-if="modalType.includes('user')" class="space-y-4">
            <div v-if="modalType === 'create-user'">
              <label class="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                v-model="formData.full_name"
                type="text"
                required
                class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div v-if="modalType === 'create-user'">
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input
                v-model="formData.email"
                type="email"
                required
                class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div v-if="modalType === 'create-user'">
              <label class="block text-sm font-medium text-gray-700">Password</label>
              <input
                v-model="formData.password"
                type="password"
                required
                class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div v-if="modalType.includes('user')">
              <label class="block text-sm font-medium text-gray-700">Role</label>
              <select
                v-if="modalType === 'edit-user' || modalType === 'create-user'"
                v-model="formData.role"
                class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <p v-else class="mt-1 text-sm text-gray-900 capitalize">{{ selectedItem.role }}</p>
            </div>
            <div v-if="modalType === 'view-user'">
              <label class="block text-sm font-medium text-gray-700">Full Name</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedItem.full_name }}</p>
            </div>
            <div v-if="modalType === 'view-user'">
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedItem.email }}</p>
            </div>
            <div v-if="modalType === 'view-user'">
              <label class="block text-sm font-medium text-gray-700">Created</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedItem.created_at) }}</p>
            </div>
          </div>

          <!-- Review Modal Content -->
          <div v-if="modalType.includes('review')" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Subject</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedItem.subject }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Zone</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedItem.zone }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Rating</label>
              <div class="flex mt-1">
                <span
                  v-for="i in 5"
                  :key="i"
                  :class="[
                    'text-lg',
                    i <= selectedItem.rating ? 'text-yellow-400' : 'text-gray-300',
                  ]"
                >
                  ★
                </span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedItem.description }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Location</label>
              <p class="mt-1 text-sm text-gray-900">
                {{ selectedItem.location || 'Not specified' }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Date</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedItem.datetime) }}</p>
            </div>
          </div>

          <!-- Report Modal Content -->
          <div v-if="modalType.includes('report')" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Subject</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedItem.subject }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedItem.description }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Category</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedItem.category }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Zone</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedItem.zone }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Body Number</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedItem.body_number }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <select
                v-if="modalType === 'edit-report'"
                v-model="formData.status"
                class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
              <p v-else class="mt-1 text-sm text-gray-900 capitalize">{{ selectedItem.status }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Location</label>
              <p class="mt-1 text-sm text-gray-900">
                {{ selectedItem.location || 'Not specified' }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Date</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedItem.datetime) }}</p>
            </div>
          </div>
        </div>

        <div v-if="!modalType.includes('view')" class="flex justify-end space-x-3 mt-6">
          <button
            @click="closeModal"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="saveChanges"
            class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            {{ modalType.includes('create') ? 'Create' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { supabase } from '@/composables/useSupabase'

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
  }
  return titles[activeSection.value] || 'Dashboard'
}

const getModalTitle = () => {
  const titles = {
    'create-user': 'Create New User',
    'edit-user': 'Edit User',
    'view-user': 'User Details',
    'view-review': 'Review Details',
    'view-report': 'Report Details',
    'edit-report': 'Edit Report Status',
  }
  return titles[modalType.value] || 'Details'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const getStatusClass = (status) => {
  const classes = {
    pending:
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800',
    'in-progress':
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800',
    resolved:
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800',
    rejected: 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800',
  }
  return (
    classes[status] ||
    'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'
  )
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

const saveChanges = async () => {
  try {
    if (modalType.value === 'create-user') {
      await handleUserAction('create', null, formData.value)
    } else if (modalType.value === 'edit-user') {
      await handleUserAction('update', selectedItem.value.id, formData.value)
    } else if (modalType.value === 'edit-report') {
      await handleReportAction('update', selectedItem.value.id, formData.value)
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
