<template>
  <div class="space-y-6">
    <div
      class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 md:p-6 rounded-lg shadow-lg"
    >
      <h2 class="text-xl md:text-2xl font-bold mb-2">
        Welcome back, {{ currentUser?.user_metadata?.full_name || currentUser?.email }}!
      </h2>
      <p class="text-orange-100">Role: <span class="font-semibold">Administrator</span></p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div class="bg-white p-4 md:p-6 rounded-lg shadow border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-700">Total Users</h3>
            <p class="text-2xl md:text-3xl font-bold text-blue-600">{{ users.length }}</p>
          </div>
          <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <!-- Data Visualization Chart -->
    <div class="bg-white p-4 md:p-6 rounded-lg shadow">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 class="text-xl font-semibold text-gray-800">Data Analytics</h3>
        <div class="flex flex-wrap gap-2">
          <select
            v-model="selectedMetric"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Metrics</option>
            <option value="users">Users</option>
            <option value="reviews">Reviews</option>
            <option value="reports">Reports</option>
          </select>
          <select
            v-model="selectedTimeframe"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="30">Last 30 Days</option>
            <option value="7">Last 7 Days</option>
            <option value="90">Last 3 Months</option>
          </select>
        </div>
      </div>

      <div class="h-80">
        <canvas ref="chartCanvas"></canvas>
      </div>

      <!-- Chart Legend -->
      <div class="flex flex-wrap justify-center gap-4 mt-4" v-if="selectedMetric === 'all'">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="text-sm text-gray-600">Users</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span class="text-sm text-gray-600">Reviews</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span class="text-sm text-gray-600">Reports</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const props = defineProps({
  currentUser: {
    type: Object,
    required: true,
  },
  users: {
    type: Array,
    required: true,
  },
  reviews: {
    type: Array,
    required: true,
  },
  reports: {
    type: Array,
    required: true,
  },
})

const chartCanvas = ref(null)
const selectedMetric = ref('all')
const selectedTimeframe = ref('30')
let chartInstance = null

// Process actual data from props based on created_at timestamps
const generateChartData = computed(() => {
  const days = parseInt(selectedTimeframe.value)
  const dates = []
  const usersData = []
  const reviewsData = []
  const reportsData = []

  // Generate date range for the selected timeframe
  const dateMap = new Map()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD format
    const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    dates.push(displayDate)
    dateMap.set(dateKey, {
      users: 0,
      reviews: 0,
      reports: 0,
    })
  }

  // Helper function to count items by date
  const countByDate = (items, dateMap) => {
    items.forEach((item) => {
      if (item.created_at) {
        const itemDate = new Date(item.created_at).toISOString().split('T')[0]
        if (dateMap.has(itemDate)) {
          return itemDate
        }
      }
      return null
    })

    // Count items for each date
    items.forEach((item) => {
      if (item.created_at) {
        const itemDate = new Date(item.created_at).toISOString().split('T')[0]
        if (dateMap.has(itemDate)) {
          return itemDate
        }
      }
    })
  }

  // Count users by date (assuming users have created_at)
  props.users.forEach((user) => {
    if (user.created_at) {
      const userDate = new Date(user.created_at).toISOString().split('T')[0]
      if (dateMap.has(userDate)) {
        dateMap.get(userDate).users++
      }
    }
  })

  // Count reviews by date
  props.reviews.forEach((review) => {
    if (review.created_at) {
      const reviewDate = new Date(review.created_at).toISOString().split('T')[0]
      if (dateMap.has(reviewDate)) {
        dateMap.get(reviewDate).reviews++
      }
    }
  })

  // Count reports by date
  props.reports.forEach((report) => {
    if (report.created_at) {
      const reportDate = new Date(report.created_at).toISOString().split('T')[0]
      if (dateMap.has(reportDate)) {
        dateMap.get(reportDate).reports++
      }
    }
  })

  // Convert map to arrays for chart data
  Array.from(dateMap.values()).forEach((dayData) => {
    usersData.push(dayData.users)
    reviewsData.push(dayData.reviews)
    reportsData.push(dayData.reports)
  })

  return { dates, usersData, reviewsData, reportsData }
})

const chartConfig = computed(() => {
  const { dates, usersData, reviewsData, reportsData } = generateChartData.value

  const datasets = []

  if (selectedMetric.value === 'all' || selectedMetric.value === 'users') {
    datasets.push({
      label: 'Users',
      data: usersData,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: selectedMetric.value === 'users',
    })
  }

  if (selectedMetric.value === 'all' || selectedMetric.value === 'reviews') {
    datasets.push({
      label: 'Reviews',
      data: reviewsData,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.4,
      fill: selectedMetric.value === 'reviews',
    })
  }

  if (selectedMetric.value === 'all' || selectedMetric.value === 'reports') {
    datasets.push({
      label: 'Reports',
      data: reportsData,
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
      fill: selectedMetric.value === 'reports',
    })
  }

  return {
    type: 'line',
    data: {
      labels: dates,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: selectedMetric.value !== 'all',
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date',
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Count',
          },
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6,
        },
      },
    },
  }
})

const initChart = () => {
  if (!chartCanvas.value) return

  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  chartInstance = new ChartJS(ctx, chartConfig.value)
}

const updateChart = () => {
  if (chartInstance) {
    const config = chartConfig.value
    chartInstance.data = config.data
    chartInstance.options = config.options
    chartInstance.update('active')
  }
}

onMounted(async () => {
  await nextTick()
  initChart()
})

watch(
  [selectedMetric, selectedTimeframe],
  () => {
    updateChart()
  },
  { deep: true },
)

watch(
  () => [props.users, props.reviews, props.reports],
  () => {
    updateChart()
  },
  { deep: true },
)
</script>
