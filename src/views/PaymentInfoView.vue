<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
          <svg class="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Menunggu Persetujuan
        </h1>
        <p class="text-gray-600">
          Registrasi Anda sedang diproses oleh tim admin
        </p>
      </div>

      <!-- Status Card -->
      <div class="bg-white rounded-lg shadow-xl p-8">
        <!-- Organization Info -->
        <div v-if="organizationInfo" class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Informasi Organisasi</h2>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Nama Bisnis:</span>
              <span class="text-sm font-medium text-gray-900">{{ organizationInfo.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Email:</span>
              <span class="text-sm font-medium text-gray-900">{{ userProfile?.email }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Paket:</span>
              <span class="text-sm font-medium text-gray-900">{{ organizationInfo.package_id || 'Starter' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Status:</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusClass(organizationInfo.status)">
                {{ getStatusText(organizationInfo.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Status Message -->
        <div class="text-center mb-6">
          <div v-if="organizationInfo?.status === 'pending'" class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">
                  Registrasi Sedang Diproses
                </h3>
                <div class="mt-2 text-sm text-yellow-700">
                  <p>Tim admin kami akan memverifikasi data Anda dalam 1-2 hari kerja. Anda akan menerima email konfirmasi setelah akun disetujui.</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="organizationInfo?.status === 'rejected'" class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Registrasi Ditolak
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>Mohon maaf, registrasi Anda tidak dapat diproses. Silakan hubungi support untuk informasi lebih lanjut.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <!-- Refresh Button -->
          <button
            @click="checkStatus"
            :disabled="isChecking"
            class="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="isChecking" class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ isChecking ? 'Memeriksa...' : 'Periksa Status' }}
          </button>

          <!-- Logout Button -->
          <button
            @click="handleLogout"
            :disabled="isLoggingOut"
            class="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="isLoggingOut" class="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {{ isLoggingOut ? 'Keluar...' : 'Keluar' }}
          </button>
        </div>

        <!-- Auto Refresh Info -->
        <div class="mt-6 text-center">
          <p class="text-xs text-gray-500">
            Status akan dicek otomatis setiap {{ autoRefreshInterval / 1000 }} detik
          </p>
          <p class="text-xs text-gray-400 mt-1">
            Refresh berikutnya dalam {{ nextRefreshCountdown }} detik
          </p>
        </div>
      </div>

      <!-- Support Info -->
      <div class="text-center text-sm text-gray-500">
        <p>
          Butuh bantuan? Hubungi support di 
          <a href="mailto:support@finako.id" class="text-blue-600 hover:text-blue-500">
            support@finako.id
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useOrganizationStore } from '@/stores/organizationStore'

const router = useRouter()
const userStore = useUserStore()
const organizationStore = useOrganizationStore()

// State lokal (tidak ada perubahan)
const isChecking = ref(false)
const isLoggingOut = ref(false)
const autoRefreshInterval = ref(30000)
const nextRefreshCountdown = ref(autoRefreshInterval.value / 1000)
let autoRefreshTimer = null
let countdownTimer = null

// Computed properties (tidak ada perubahan)
const organizationInfo = computed(() => organizationStore.organization)
const userProfile = computed(() => userStore.profile)

// Helper functions (tidak ada perubahan)
function getStatusClass(status) { /* ... */ }
function getStatusText(status) { /* ... */ }

// --- FUNGSI CHECKSTATUS YANG SUDAH DIPERBAIKI ---
async function checkStatus() {
  if (isChecking.value) return;
  
  isChecking.value = true;
  
  try {
    // Panggil loadUserContext dengan parameter 'true' untuk memaksa refresh
    await userStore.loadUserContext(true);
    
    // Logika setelahnya tetap sama
    const organizationStore = useOrganizationStore(); // Panggil store di sini
    const newStatus = organizationStore.organization?.status;

    if (newStatus === 'active') {
      userStore.showNotification('Akun Anda telah diaktifkan!', 'success');
      router.push({ name: 'Dashboard' }); 
    } else {
      userStore.showNotification('Status Anda masih menunggu persetujuan.', 'info');
    }

  } catch (error) {
    console.error('Status check failed:', error);
    userStore.showNotification('Gagal memeriksa status. Silakan coba lagi.', 'error');
  } finally {
    isChecking.value = false;
    nextRefreshCountdown.value = autoRefreshInterval.value / 1000;
  }
}
// --- AKHIR FUNGSI CHECKSTATUS ---


// Fungsi Logout sudah benar
async function handleLogout() {
  if (isLoggingOut.value) return;
  
  isLoggingOut.value = true;
  
  try {
    const success = await userStore.logout();
    
    // HANYA jika logout berhasil, lakukan redirect
    if (success) {
      router.push('/login');
    } else {
      userStore.showNotification('Logout gagal, silakan coba lagi.', 'error');
    }
  } catch (error) {
    console.error('Logout failed on view:', error);
  } finally {
    // Pastikan loading state selalu mati
    isLoggingOut.value = false;
  }
}

// Logika auto-refresh sudah bagus, tidak perlu diubah
function setupAutoRefresh() { /* ... */ }
function cleanup() { /* ... */ }

onMounted(() => {
  // Pengecekan awal tidak lagi diperlukan di sini
  // karena router guard sudah menanganinya sebelum halaman ini dimuat.
  setupAutoRefresh()
})

onUnmounted(cleanup)
</script>
