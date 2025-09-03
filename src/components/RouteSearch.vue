<template>
    <div>
      <!-- Route Suggestions Panel (Desktop Only) -->
      <div
  v-if="routeSuggestions.length > 0"
  class="hidden md:block absolute z-20 bg-white rounded-lg shadow-lg p-4 max-w-sm max-h-96 overflow-y-auto"
  :style="{
    top: panelPosition.y + 'px',
    left: panelPosition.x + 'px'
  }"
  @mousedown="startDragPanel"
  ref="draggablePanel"
>
  <!-- Drag handle area -->
  <div class="flex justify-between items-center mb-3 cursor-move select-none drag-handle">
    <h3 class="font-bold text-gray-800 flex items-center">
      <svg
        class="w-5 h-5 text-blue-600 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      Route Suggestions ({{ routeSuggestions.length }})
    </h3>
    <svg 
      class="w-4 h-4 text-gray-400" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        stroke-width="2" 
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
      ></path>
    </svg>
  </div>
        <div class="space-y-3">
          <div
            v-for="(suggestion, index) in routeSuggestions"
            :key="index"
            class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
            :class="
              suggestion.type === 'transfer' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
            "
            @click="$emit('highlight-route', suggestion)"
          >
            <!-- Transfer Route Display -->
            <div v-if="suggestion.type === 'transfer'" class="space-y-2">
                  <div class="flex items-center text-yellow-600 font-semibold text-sm">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"
                      />
                    </svg>
                    Transfer Route ({{ suggestion.legs.length }} rides)
                  </div>

                  <div
                    v-if="suggestion.actualDistance && suggestion.actualDuration"
                    class="text-xs text-blue-600 mt-1 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 text-blue-500 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Route: {{ suggestion.actualDistance }}km • {{ suggestion.actualDuration }} min
                  </div>

                  <!-- Fare Type Toggle for Transfer Routes -->
                  <div class="flex border-b border-gray-300 mt-2 mb-4">
                    <button
                      @click.stop="activeFareType = 'regular'"
                      class="flex-1 py-2 text-sm font-medium text-center relative transition-colors duration-200"
                      :class="
                        activeFareType === 'regular'
                          ? 'text-green-600'
                          : 'text-gray-500 hover:text-gray-700'
                      "
                    >
                      Regular
                      <span
                        v-if="activeFareType === 'regular'"
                        class="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded transition-all duration-200"
                      ></span>
                    </button>

                    <button
                      @click.stop="activeFareType = 'discounted'"
                      class="flex-1 py-2 text-sm font-medium text-center relative transition-colors duration-200"
                      :class="
                        activeFareType === 'discounted'
                          ? 'text-green-600'
                          : 'text-gray-500 hover:text-gray-700'
                      "
                    >
                      Discounted
                      <span
                        v-if="activeFareType === 'discounted'"
                        class="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded transition-all duration-200"
                      ></span>
                    </button>
                  </div>

                  <!-- Transfer Route Legs with Icons -->
                  <div v-for="(leg, legIndex) in suggestion.legs" :key="legIndex" class="text-sm text-gray-600 mt-1">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <span
                          class="inline-block px-1 py-1 rounded text-xs mr-2"
                          :style="{ backgroundColor: leg.color + '20', color: leg.color }"
                        >
                          <img
                            :src="zoneIcons[leg.zone.toLowerCase()]"
                            alt="Zone icon"
                            class="w-8 h-8"
                          />
                        </span>
                        <div>
                            <span class="text-yellow-600 font-semibold">
                          {{ leg.zone }} Zone
                        </span>
                        <br />
                        <span class="text-gray-500">
                          {{ leg.description.split('-')[1]?.trim() }}
                        </span>
                        </div>
                        

                      </div>
                      <div class="text-right">
                        <div
                          :class="activeFareType === 'regular' ? 'text-green-600' : 'text-blue-600'"
                          class="font-medium"
                        >
                          ₱{{ activeFareType === 'regular' ? leg.fare : leg.discountedFare }}
                        </div>
                        <!-- <div class="text-xs text-gray-500">
                          {{ activeFareType === 'regular' ? 'Regular fare' : 'PWD/Student/Senior' }}
                        </div> -->
                      </div>
                    </div>
                    
                  </div>

                  <!-- Total fare and walking distance -->
                  <div class="border-t pt-2 text-sm">
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-500"
                        >{{ suggestion.totalWalkDistance }}m total walk</span
                      >
                      <div class="text-right">
                        <div
                          class="font-semibold"
                          :class="activeFareType === 'regular' ? 'text-green-600' : 'text-blue-600'"
                        >
                          Total: ₱{{
                            activeFareType === 'regular'
                              ? suggestion.totalFare
                              : suggestion.totalDiscountedFare
                          }}
                        </div>
                      </div>
                    </div>
                    <div v-if="suggestion.transferPoints" class="text-xs text-blue-600 mt-1">
                      Transfer at: {{ suggestion.transferPoints.join(', ') }}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      <span v-if="suggestion.startDistance > 0.1">
                        Start: {{ (suggestion.startDistance * 1000).toFixed(0) }}m walk
                      </span>
                      <span v-if="suggestion.endDistance > 0.1" class="ml-2">
                        End: {{ (suggestion.endDistance * 1000).toFixed(0) }}m walk
                      </span>
                    </div>
                  </div>
                </div>

            <!-- Direct Route Display -->
            <div v-else>
              <div class="font-semibold text-blue-600">{{ suggestion.route }}</div>
              <div class="text-sm text-gray-600">{{ suggestion.description }}</div>
              <div
                v-if="suggestion.actualDistance && suggestion.actualDuration"
                class="text-xs text-blue-600 mt-1 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-blue-500 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Route: {{ suggestion.actualDistance }}km • {{ suggestion.actualDuration }} min
              </div>

              <!-- Fare Type Toggle -->
              <div class="flex border-b border-gray-300 mt-2 mb-4">
                <button
                  @click.stop="activeFareType = 'regular'"
                  class="flex-1 py-2 text-sm font-medium text-center relative transition-colors duration-200"
                  :class="
                    activeFareType === 'regular'
                      ? 'text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  "
                >
                  Regular
                  <span
                    v-if="activeFareType === 'regular'"
                    class="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded transition-all duration-200"
                  ></span>
                </button>

                <button
                  @click.stop="activeFareType = 'discounted'"
                  class="flex-1 py-2 text-sm font-medium text-center relative transition-colors duration-200"
                  :class="
                    activeFareType === 'discounted'
                      ? 'text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  "
                >
                  Discounted
                  <span
                    v-if="activeFareType === 'discounted'"
                    class="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded transition-all duration-200"
                  ></span>
                </button>
              </div>

              <div class="text-sm text-gray-600 mt-1">
                <div class="flex items-center justify-between">
                  <span
                    class="inline-block px-1 py-1 rounded text-xs"
                    :style="{ backgroundColor: suggestion.color + '20', color: suggestion.color }"
                  >
                    <img
                      :src="zoneIcons[suggestion.zone.toLowerCase()]"
                      alt="Zone icon"
                      class="w-10 h-10"
                    />
                  </span>
                  <div class="text-right">
                    <div
                      :class="activeFareType === 'regular' ? 'text-green-600' : 'text-blue-600'"
                      class="font-medium"
                    >
                      ₱{{
                        activeFareType === 'regular' ? suggestion.fare : suggestion.discountedFare
                      }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ activeFareType === 'regular' ? 'Regular fare' : 'PWD/Student/Senior' }}
                    </div>
                  </div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  <span v-if="suggestion.startDistance > 0.1">
                    Start: {{ (suggestion.startDistance * 1000).toFixed(0) }}m walk
                  </span>
                  <span v-if="suggestion.endDistance > 0.1" class="ml-2">
                    End: {{ (suggestion.endDistance * 1000).toFixed(0) }}m walk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button
            @click="$emit('clear-suggestions')"
            class="flex-1 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear suggestions
          </button>
          <button
            @click="handleReviewReportClick"
            class="flex-1 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Review/Report
          </button>
        </div>
      </div>

      <!-- Active Field Indicator with Auth Dropdown -->
      <div class="absolute top-4 right-4 z-20 flex items-center gap-3">
        <!-- Active Field Indicator -->
        <div class="bg-white rounded-lg shadow-lg px-3 py-2">
          <div class="text-sm font-medium text-gray-700">
            Click map for:
            <span
              :class="activeField === 'start' ? 'text-green-600' : 'text-red-600'"
              class="font-bold"
            >
              {{ activeField === 'start' ? 'Start' : 'End' }}
            </span>
          </div>
        </div>

        <!-- Auth Dropdown to be remove the login and handleUSerlogin-->
        <AuthDropdown ref="authComponent" @login="handleUserLogin" @logout="handleUserLogout" />
      </div>

      <!-- Search Input Container: Desktop -->
      <div class="hidden md:block absolute bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-10">
        <div class="bg-white shadow-xl rounded-xl p-4 relative">
          <!-- Search Suggestions -->
          <div
            v-if="showSuggestions && searchSuggestions.length > 0"
            class="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            <div
              v-for="(place, index) in searchSuggestions"
              :key="index"
              @click="selectSuggestion(place)"
              class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            >
              <svg
                class="w-4 h-4 text-gray-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              {{ place.name }}
            </div>
          </div>

          <div class="relative flex flex-col gap-3">
            <!-- SVG Road Path -->
            <svg
              class="absolute left-0 top-6 h-[55%] w-7 pointer-events-none"
              viewBox="0 0 50 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- Road shape -->
              <path
                d="M25 0 C25 40, 5 60, 25 100 C45 140, 25 160, 25 200"
                stroke="#9CA3AF"
                stroke-width="8"
                stroke-linecap="round"
              />
              <!-- Road center line -->
              <path
                d="M25 0 C25 40, 5 60, 25 100 C45 140, 25 160, 25 200"
                stroke="white"
                stroke-width="2"
                stroke-dasharray="6 6"
                stroke-linecap="round"
              />
            </svg>

            <!-- Start -->
            <div class="flex items-center">
              <span class="material-symbols-outlined text-green-500 text-3xl z-10 material-fill"> distance </span>
              <div class="relative flex-1 ml-3">
                <input
                  v-model="localStart"
                  @input="handleInputChange($event.target.value, 'start')"
                  @focus="setActiveField('start')"
                  type="text"
                  placeholder="Start location (click map or search)"
                  class="w-full py-2 px-2 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none"
                />
                <!-- Current Location Button for Desktop Start -->
                <button
                  @click="getCurrentLocation"
                  :disabled="gettingLocation"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
                  title="Use current location"
                >
                  <!-- Spinner when loading -->
                  <svg
                    v-if="gettingLocation"
                    class="w-5 h-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="m15.84 10.2c0 1-.12 2.1-.36 3.12a5.94 5.94 0 0 1-1.08 2.64 4.63 4.63 0 0 1-1.8 1.8c-.72.48-1.56.72-2.52.72-.84 0-1.56-.24-2.16-.72a4.63 4.63 0 0 1-1.8-1.8 5.94 5.94 0 0 1-1.08-2.64c-.24-1.02-.36-2.12-.36-3.12s.12-2.1.36-3.12a5.94 5.94 0 0 1 1.08-2.64 4.63 4.63 0 0 1 1.8-1.8c.6-.48 1.32-.72 2.16-.72.96 0 1.8.24 2.52.72.72.48 1.32 1.08 1.8 1.8.48.72.84 1.62 1.08 2.64.24 1.02.36 2.12.36 3.12z"
                    ></path>
                  </svg>

                  <!-- My Location icon when idle -->
                  <span v-else class="material-symbols-outlined text-xl">
                    my_location
                  </span>
                </button>

              </div>
            </div>

            <!-- Destination -->
            <div class="flex items-center mb-2">
              <span class="material-icons text-orange-500 text-3xl z-10"> location_on </span>
              <input
                v-model="localDestination"
                @input="handleInputChange($event.target.value, 'destination')"
                @focus="setActiveField('destination')"
                type="text"
                placeholder="Destination (click map or search)"
                class="ml-3 flex-1 py-2 px-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 outline-none"
              />
            </div>
          </div>

          <button
            @click="$emit('find-route')"
            :disabled="!startCoords || !destinationCoords"
            class="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center mt-2"
          >
            <svg
              v-if="isLoading"
              class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span class="material-icons text-custom-green text-3xl z-10 mr-1"> directions </span>Find
            Ride
          </button>
        </div>
      </div>

      <!-- Bottom Sheet (Mobile Only) -->
      <div
        class="md:hidden fixed bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-lg transition-transform duration-300 z-10"
       :class="[
        isOpen
          ? 'translate-y-0'
          : (routeSuggestions.length > 0 ? 'translate-y-[90%]' : 'translate-y-[76%]')
      ]"
      >
        <!-- Drag Handle -->
        <div
          class="w-full flex justify-center py-2 select-none"
          @touchstart.stop.prevent="startDrag"
          @touchmove.stop.prevent="onDrag"
          @touchend.stop="endDrag"
          @touchcancel.stop="endDrag"
        >
          <div class="h-1.5 w-12 bg-gray-400 rounded-full"></div>
        </div>

        <div class="p-4 relative max-h-[80vh]">
          <!-- Search Suggestions for Mobile -->
          <div
  v-if="showSuggestions && searchSuggestions.length > 0"
  class="absolute bottom-full left-4 right-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
>
            <div
              v-for="(place, index) in searchSuggestions"
              :key="index"
              @click="selectSuggestion(place)"
              class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            >
              <svg
                class="w-4 h-4 text-gray-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              {{ place.name }}
            </div>
          </div>

          <div class="relative flex flex-col gap-3 mb-3">
            <!-- SVG Road Path for Mobile -->
            <svg
              class="absolute left-0 top-6 h-[55%] w-7 pointer-events-none"
              viewBox="0 0 50 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25 0 C25 40, 5 60, 25 100 C45 140, 25 160, 25 200"
                stroke="#9CA3AF"
                stroke-width="8"
                stroke-linecap="round"
              />
              <path
                d="M25 0 C25 40, 5 60, 25 100 C45 140, 25 160, 25 200"
                stroke="white"
                stroke-width="2"
                stroke-dasharray="6 6"
                stroke-linecap="round"
              />
            </svg>

            <!-- Start Input for Mobile -->
            <div class="flex items-center">
              <span class="material-icons text-green-500 text-3xl z-10"> location_on </span>
              <div class="relative flex-1 ml-3">
                <input
                  v-model="localStart"
                  @input="handleInputChange($event.target.value, 'start')"
                  @focus="setActiveField('start')"
                  type="text"
                  placeholder="Start location (tap map or search)"
                  class="w-full py-2 px-2 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none"
                />
                <!-- Current Location Button for Mobile Start -->
                <button
                  @click="getCurrentLocation"
                  :disabled="gettingLocation"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
                  title="Use current location"
                >
                  <svg
                    v-if="gettingLocation"
                    class="w-5 h-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="m15.84 10.2c0 1-.12 2.1-.36 3.12a5.94 5.94 0 0 1-1.08 2.64 4.63 4.63 0 0 1-1.8 1.8c-.72.48-1.56.72-2.52.72-.84 0-1.56-.24-2.16-.72a4.63 4.63 0 0 1-1.8-1.8 5.94 5.94 0 0 1-1.08-2.64c-.24-1.02-.36-2.12-.36-3.12s.12-2.1.36-3.12a5.94 5.94 0 0 1 1.08-2.64 4.63 4.63 0 0 1 1.8-1.8c.6-.48 1.32-.72 2.16-.72.96 0 1.8.24 2.52.72.72.48 1.32 1.08 1.8 1.8.48.72.84 1.62 1.08 2.64.24 1.02.36 2.12.36 3.12z"
                    ></path>
                  </svg>
                  <svg
                    v-else
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    ></path>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Destination Input for Mobile -->
            <div class="flex items-center">
              <span class="material-icons text-orange-500 text-3xl z-10"> location_on </span>
              <input
                v-model="localDestination"
                @input="handleInputChange($event.target.value, 'destination')"
                @focus="setActiveField('destination')"
                type="text"
                placeholder="Destination (tap map or search)"
                class="ml-3 flex-1 py-2 px-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 outline-none"
              />
            </div>
          </div>

          <!-- Route Suggestions Panel (Mobile - Inside Bottom Sheet) -->
          <div v-if="routeSuggestions.length > 0" class="mb-4">
            <h3 class="font-bold text-gray-800 mb-3 flex items-center text-sm">
              <svg
                class="w-4 h-4 text-blue-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              Route Suggestions ({{ routeSuggestions.length }})
            </h3>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="(suggestion, index) in routeSuggestions"
                :key="index"
                class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                :class="
                  suggestion.type === 'transfer'
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-200'
                "
                @click="$emit('highlight-route', suggestion)"
              >
                <!-- Transfer Route Display -->
                <div v-if="suggestion.type === 'transfer'" class="space-y-2">
                  <div class="flex items-center text-yellow-600 font-semibold text-sm">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"
                      />
                    </svg>
                    Transfer Route ({{ suggestion.legs.length }} rides)
                  </div>

                  <div
                    v-if="suggestion.actualDistance && suggestion.actualDuration"
                    class="text-xs text-blue-600 mt-1 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 text-blue-500 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Route: {{ suggestion.actualDistance }}km • {{ suggestion.actualDuration }} min
                  </div>

                  <!-- Fare Type Toggle for Transfer Routes -->
                  <div class="flex border-b border-gray-300 mt-2 mb-4">
                    <button
                      @click.stop="activeFareType = 'regular'"
                      class="flex-1 py-2 text-sm font-medium text-center relative transition-colors duration-200"
                      :class="
                        activeFareType === 'regular'
                          ? 'text-green-600'
                          : 'text-gray-500 hover:text-gray-700'
                      "
                    >
                      Regular
                      <span
                        v-if="activeFareType === 'regular'"
                        class="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded transition-all duration-200"
                      ></span>
                    </button>

                    <button
                      @click.stop="activeFareType = 'discounted'"
                      class="flex-1 py-2 text-sm font-medium text-center relative transition-colors duration-200"
                      :class="
                        activeFareType === 'discounted'
                          ? 'text-green-600'
                          : 'text-gray-500 hover:text-gray-700'
                      "
                    >
                      Discounted
                      <span
                        v-if="activeFareType === 'discounted'"
                        class="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded transition-all duration-200"
                      ></span>
                    </button>
                  </div>

                  <!-- Transfer Route Legs with Icons -->
                  <div v-for="(leg, legIndex) in suggestion.legs" :key="legIndex" class="text-sm text-gray-600 mt-1">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <span
                          class="inline-block px-1 py-1 rounded text-xs mr-2"
                          :style="{ backgroundColor: leg.color + '20', color: leg.color }"
                        >
                          <img
                            :src="zoneIcons[leg.zone.toLowerCase()]"
                            alt="Zone icon"
                            class="w-8 h-8"
                          />
                        </span>
                        <div>
                            <span class="text-yellow-600 font-semibold">
                          {{ leg.zone }} Zone
                        </span>
                        <br />
                        <span class="text-gray-500">
                          {{ leg.description.split('-')[1]?.trim() }}
                        </span>
                        </div>
                        

                      </div>
                      <div class="text-right">
                        <div
                          :class="activeFareType === 'regular' ? 'text-green-600' : 'text-blue-600'"
                          class="font-medium"
                        >
                          ₱{{ activeFareType === 'regular' ? leg.fare : leg.discountedFare }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ activeFareType === 'regular' ? 'Regular fare' : 'PWD/Student/Senior' }}
                        </div>
                      </div>
                    </div>
                    
                  </div>

                  <!-- Total fare and walking distance -->
                  <div class="border-t pt-2 text-sm">
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-500"
                        >{{ suggestion.totalWalkDistance }}m total walk</span
                      >
                      <div class="text-right">
                        <div
                          class="font-semibold"
                          :class="activeFareType === 'regular' ? 'text-green-600' : 'text-blue-600'"
                        >
                          Total: ₱{{
                            activeFareType === 'regular'
                              ? suggestion.totalFare
                              : suggestion.totalDiscountedFare
                          }}
                        </div>
                      </div>
                    </div>
                    <div v-if="suggestion.transferPoints" class="text-xs text-blue-600 mt-1">
                      Transfer at: {{ suggestion.transferPoints.join(', ') }}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      <span v-if="suggestion.startDistance > 0.1">
                        Start: {{ (suggestion.startDistance * 1000).toFixed(0) }}m walk
                      </span>
                      <span v-if="suggestion.endDistance > 0.1" class="ml-2">
                        End: {{ (suggestion.endDistance * 1000).toFixed(0) }}m walk
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else>
                  <div class="font-semibold text-blue-600">{{ suggestion.route }}</div>
                  <div class="text-sm text-gray-600">{{ suggestion.description }}</div>
                  <div
                    v-if="suggestion.actualDistance && suggestion.actualDuration"
                    class="text-xs text-blue-600 mt-1 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 text-blue-500 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Route: {{ suggestion.actualDistance }}km • {{ suggestion.actualDuration }} min
                  </div>

                  <!-- Fare Type Toggle -->
                  <div class="flex border-b border-gray-300 mt-2 mb-4">
                    <button
                      @click.stop="activeFareType = 'regular'"
                      class="flex-1 py-2 text-sm font-medium text-center relative transition-colors duration-200"
                      :class="
                        activeFareType === 'regular'
                          ? 'text-green-600'
                          : 'text-gray-500 hover:text-gray-700'
                      "
                    >
                      Regular
                      <span
                        v-if="activeFareType === 'regular'"
                        class="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded transition-all duration-200"
                      ></span>
                    </button>

                    <button
                      @click.stop="activeFareType = 'discounted'"
                      class="flex-1 py-2 text-sm font-medium text-center relative transition-colors duration-200"
                      :class="
                        activeFareType === 'discounted'
                          ? 'text-green-600'
                          : 'text-gray-500 hover:text-gray-700'
                      "
                    >
                      Discounted
                      <span
                        v-if="activeFareType === 'discounted'"
                        class="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded transition-all duration-200"
                      ></span>
                    </button>
                  </div>

                  <div class="text-sm text-gray-600 mt-1">
                    <div class="flex items-center justify-between">
                      <span
                        class="inline-block px-1 py-1 rounded text-xs"
                        :style="{ backgroundColor: suggestion.color + '20', color: suggestion.color }"
                      >
                        <img
                          :src="zoneIcons[suggestion.zone.toLowerCase()]"
                          alt="Zone icon"
                          class="w-10 h-10"
                        />
                      </span>
                      <div class="text-right">
                        <div
                          :class="activeFareType === 'regular' ? 'text-green-600' : 'text-blue-600'"
                          class="font-medium"
                        >
                          ₱{{
                            activeFareType === 'regular' ? suggestion.fare : suggestion.discountedFare
                          }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ activeFareType === 'regular' ? 'Regular fare' : 'PWD/Student/Senior' }}
                        </div>
                      </div>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                      <span v-if="suggestion.startDistance > 0.1">
                        Start: {{ (suggestion.startDistance * 1000).toFixed(0) }}m walk
                      </span>
                      <span v-if="suggestion.endDistance > 0.1" class="ml-2">
                        End: {{ (suggestion.endDistance * 1000).toFixed(0) }}m walk
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex gap-2 mt-3">
              <button
                @click="$emit('clear-suggestions')"
                class="flex-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear suggestions
              </button>
              <button
                @click="handleReviewReportClick"
                class="flex-1 text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center"
              >
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Review/Report
              </button>
            </div>
          </div>

          <button
            @click="$emit('find-route')"
            :disabled="!startCoords || !destinationCoords"
            class="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg
              v-if="isLoading"
              class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg><span class="material-icons text-custom-green text-3xl z-10 mr-1"> directions </span>
            Find Ride
          </button>
        </div>
      </div>

      <!-- Review/Report Modal -->
      <ReviewReportModal
        :show="showReviewModal"
        :user="authComponent"
        @close="showReviewModal = false"
        @submit="handleReviewSubmitted"
      />
    </div>
  </template>

  <script setup>
  import { ref, watch, computed, onUnmounted, } from 'vue'
  import AuthDropdown from './Auth.vue'
  import ReviewReportModal from './ReportModal.vue'

  import redIcon from '@/assets/red_icon.ico'
  import orangeIcon from '@/assets/orange_icon.ico'
  import yellowIcon from '@/assets/yellow_icon.ico'
  import whiteIcon from '@/assets/white_icon.ico'
  import greenIcon from '@/assets/green_icon.ico'

  const zoneIcons = {
    red: redIcon,
    orange: orangeIcon,
    yellow: yellowIcon,
    white: whiteIcon,
    green: greenIcon,
  }

  // Props
  const props = defineProps({
    start: {
      type: String,
      default: '',
    },
    destination: {
      type: String,
      default: '',
    },
    activeField: {
      type: String,
      default: 'start',
    },
    startCoords: {
      type: Array,
      default: null,
    },
    destinationCoords: {
      type: Array,
      default: null,
    },
    routeSuggestions: {
      type: Array,
      default: () => [],
    },
    searchSuggestions: {
      type: Array,
      default: () => [],
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  })

  // Emits
  const emit = defineEmits([
    'update:start',
    'update:destination',
    'update:activeField',
    'input-change',
    'place-selected',
    'find-route',
    'highlight-route',
    'clear-suggestions',
    'current-location-selected',
  ])

  // Local reactive values
  const localStart = ref(props.start)
  const localDestination = ref(props.destination)
  const showSuggestions = ref(false)
  const isOpen = ref(true)
  const activeFareType = ref('regular')
  const showReviewModal = ref(false)
  const currentUser = ref(null)
  const gettingLocation = ref(false)

  // Component refs
  const authComponent = ref(null)

  // Watch for prop changes
  watch(
    () => props.start,
    (newVal) => {
      localStart.value = newVal
    },
  )

  watch(
    () => props.destination,
    (newVal) => {
      localDestination.value = newVal
    },
  )

  // Handle input changes
  const handleInputChange = (value, field) => {
    if (field === 'start') {
      localStart.value = value
      emit('update:start', value)
    } else {
      localDestination.value = value
      emit('update:destination', value)
    }

    emit('input-change', { value, field })
    showSuggestions.value = value.trim().length > 0 && props.searchSuggestions.length > 0
  }

  // Set active field
  const setActiveField = (field) => {
    emit('update:activeField', field)
  }

  // Select a suggestion
  const selectSuggestion = (place) => {
    showSuggestions.value = false
    emit('place-selected', { place, activeField: props.activeField })
  }

  // Get current location function
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    gettingLocation.value = true

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 600000 // 10 minutes cache
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        // Set as start location
        emit('current-location-selected', {
          lat: latitude,
          lng: longitude,
          field: 'start'
        })
        
        gettingLocation.value = false
      },
      (error) => {
        gettingLocation.value = false
        
        let errorMessage = 'Unable to get your location. '
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.'
            break
          default:
            errorMessage += 'An unknown error occurred.'
            break
        }
        
        alert(errorMessage)
      },
      options
    )
  }

  // Handle user login
  const handleUserLogin = (userData) => {
    currentUser.value = userData
    console.log('User logged in:', userData)
  }

  // Handle user logout
  const handleUserLogout = () => {
    currentUser.value = null
    console.log('User logged out')
  }

  // Handle review/report button click
  const handleReviewReportClick = () => {
    // Check if user is logged in
    const isLoggedIn = authComponent.value?.isLoggedIn()

    if (isLoggedIn) {
      // User is logged in, show the review/report modal
      showReviewModal.value = true
    } else {
      // User is not logged in, show login modal
      authComponent.value?.openLoginModal()
      // Show a message to inform user they need to login
      setTimeout(() => {
        alert('Please login or sign up to submit a review or report.')
      }, 100)
    }
  }

  // Handle review submission
  const handleReviewSubmitted = (reviewData) => {
    console.log('Review/Report submitted:', reviewData)
  }

  // Draggable bottom sheet logic for mobile
  let startY = 0
  let dragDiff = 0

  const startDrag = (e) => {
    startY = e.touches?.[0]?.clientY ?? e.clientY
  }

  const onDrag = (e) => {
    const currentY = e.touches?.[0]?.clientY ?? e.clientY
    dragDiff = currentY - startY
  }

  const endDrag = () => {
    if (dragDiff > 50) {
      isOpen.value = false
    } else if (dragDiff < -50) {
      isOpen.value = true
    }
    dragDiff = 0
  }

  const bottomSheetClass = computed(() => {
  if (isOpen.value) {
    return 'translate-y-0'
  } else {
    return showSuggestions.value ? 'translate-y-[90%]' : 'translate-y-[76%]'
  }
})

  // Optional: auto-open when suggestions first appear, but don't force it
  watch(
    () => props.routeSuggestions.length,
    (len, prev) => {
      if (len > 0 && prev === 0) isOpen.value = true
    },
  )

  // Watch for suggestions to show/hide suggestions dropdown
  watch(
    () => props.searchSuggestions,
    (newSuggestions) => {
      showSuggestions.value = newSuggestions.length > 0
    },
  )



// Add these to your reactive state
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const panelPosition = ref({ x: 16, y: 80 }) // Default position (left-4 = 16px, top-20 = 80px)
const draggablePanel = ref(null)

// Drag methods
const startDragPanel = (e) => {
  // Only start drag if clicking on the header/drag handle
  if (!e.target.closest('.drag-handle') && e.target !== draggablePanel.value) return
  
  isDragging.value = true
  dragStartX.value = e.clientX - panelPosition.value.x
  dragStartY.value = e.clientY - panelPosition.value.y
  
  // Add event listeners
  document.addEventListener('mousemove', onDragPanel)
  document.addEventListener('mouseup', stopDragPanel)
  
  // Prevent text selection during drag
  e.preventDefault()
}

const onDragPanel = (e) => {
  if (!isDragging.value) return
  
  // Calculate new position
  const newX = e.clientX - dragStartX.value
  const newY = e.clientY - dragStartY.value
  
  // Get viewport dimensions
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Get panel dimensions (estimate if ref not available)
  const panelWidth = draggablePanel.value ? draggablePanel.value.offsetWidth : 384 // max-w-sm ≈ 384px
  const panelHeight = draggablePanel.value ? draggablePanel.value.offsetHeight : 384 // max-h-96 ≈ 384px
  
  // Constrain to viewport bounds
  panelPosition.value.x = Math.max(0, Math.min(newX, viewportWidth - panelWidth))
  panelPosition.value.y = Math.max(0, Math.min(newY, viewportHeight - panelHeight))
}

const stopDragPanel = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDragPanel)
  document.removeEventListener('mouseup', stopDragPanel)
}

// Clean up event listeners when component is unmounted
onUnmounted(() => {
  document.removeEventListener('mousemove', onDragPanel)
  document.removeEventListener('mouseup', stopDragPanel)
})


  </script>

  <style scoped>
  /* Custom color palette */
  .text-custom-green {
    color: #10b981;
  }
  .bg-custom-green {
    background-color: #10b981;
  }
  .text-custom-orange {
    color: #f97316;
  }
  .bg-custom-orange {
    background-color: #f97316;
  }
  .text-custom-blue {
    color: #3b82f6;
  }
  .bg-custom-blue {
    background-color: #3b82f6;
  }
  .text-custom-yellow {
    color: #f59e0b;
  }
  .bg-custom-yellow {
    background-color: #f59e0b;
  }
  </style>