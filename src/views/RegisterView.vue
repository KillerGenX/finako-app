<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
    <div class="max-w-lg w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Daftar Tenant Baru
        </h1>
        <p class="text-gray-600">
          Bergabung dengan ribuan bisnis yang menggunakan Finako
        </p>
      </div>

      <!-- Registration Form -->
      <div class="bg-white rounded-lg shadow-xl p-8">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <!-- Business Name -->
          <div>
            <label for="businessName" class="block text-sm font-medium text-gray-700 mb-2">
              Nama Bisnis *
            </label>
            <input
              id="businessName"
              v-model="form.businessName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="PT. Nama Perusahaan"
              :disabled="isLoading"
            />
          </div>

          <!-- Owner Name -->
          <div>
            <label for="ownerName" class="block text-sm font-medium text-gray-700 mb-2">
              Nama Pemilik *
            </label>
            <input
              id="ownerName"
              v-model="form.ownerName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Nama lengkap pemilik"
              :disabled="isLoading"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="email@perusahaan.com"
              :disabled="isLoading"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Minimal 6 karakter"
                :disabled="isLoading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                :disabled="isLoading"
              >
                <svg v-if="showPassword" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Package Selection -->
          <div>
            <label for="packageId" class="block text-sm font-medium text-gray-700 mb-2">
              Pilih Paket *
            </label>
            <select
              id="packageId"
              v-model="form.packageId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              :disabled="isLoading || packagesLoading"
            >
              <option value="">Pilih paket langganan</option>
              <option
                v-for="pkg in packages"
                :key="pkg.id"
                :value="pkg.id"
              >
                {{ pkg.name }} - Rp {{ formatCurrency(pkg.price) }}/bulan
              </option>
            </select>
            
            <!-- Package Details -->
            <div v-if="selectedPackage" class="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <p class="text-sm font-medium text-green-800">{{ selectedPackage.name }}</p>
              <p class="text-sm text-green-600">Max {{ selectedPackage.user_limit }} pengguna</p>
              <div class="mt-1">
                <span class="text-xs text-green-600">Fitur: </span>
                <span class="text-xs text-green-700">{{ selectedPackage.features?.join(', ') || 'Basic features' }}</span>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            {{ errorMessage }}
          </div>

          <!-- Terms and Conditions -->
          <div class="flex items-start">
            <input
              id="agreeTerms"
              v-model="form.agreeTerms"
              type="checkbox"
              required
              class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              :disabled="isLoading"
            />
            <label for="agreeTerms" class="ml-2 block text-sm text-gray-700">
              Saya setuju dengan 
              <a href="#" class="text-green-600 hover:text-green-500">syarat dan ketentuan</a> 
              serta 
              <a href="#" class="text-green-600 hover:text-green-500">kebijakan privasi</a>
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading || !isFormValid"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'Mendaftarkan...' : 'Daftar Sekarang' }}
          </button>
        </form>

        <!-- Login Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Sudah punya akun?
            <router-link
              to="/login"
              class="font-medium text-green-600 hover:text-green-500 transition-colors"
            >
              Masuk di sini
            </router-link>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center text-sm text-gray-500">
        <p>&copy; 2025 Finako. Platform POS untuk bisnis modern.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useOrganizationStore } from '@/stores/organizationStore'

const router = useRouter()
const userStore = useUserStore()
const organizationStore = useOrganizationStore()

// Form state
const form = ref({
  businessName: '',
  ownerName: '',
  email: '',
  password: '',
  packageId: '',
  agreeTerms: false
})

const isLoading = ref(false)
const packagesLoading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const packages = ref([])

// Computed properties
const selectedPackage = computed(() => {
  return packages.value.find(pkg => pkg.id === form.value.packageId) || null
})

const isFormValid = computed(() => {
  return form.value.businessName &&
         form.value.ownerName &&
         form.value.email &&
         form.value.password &&
         form.value.packageId &&
         form.value.agreeTerms &&
         form.value.password.length >= 6
})

// Load packages
async function loadPackages() {
  packagesLoading.value = true
  try {
    console.log('Loading packages...')
    const packageData = await userStore.getPackages()
    console.log('Package data received:', packageData)
    packages.value = packageData || []
    console.log('Packages array set:', packages.value)
  } catch (error) {
    console.error('Failed to load packages:', error)
    errorMessage.value = 'Gagal memuat paket. Silakan refresh halaman.'
  } finally {
    packagesLoading.value = false
  }
}

// Handle registration
async function handleRegister() {
  if (isLoading.value || !isFormValid.value) return
  
  isLoading.value = true
  errorMessage.value = ''

  try {
    // Validate password
    if (form.value.password.length < 6) {
      throw new Error('Password minimal 6 karakter')
    }

    // Prepare registration data
    const registrationData = {
      email: form.value.email.trim(),
      password: form.value.password,
      businessName: form.value.businessName.trim(),
      ownerName: form.value.ownerName.trim(),
      packageId: form.value.packageId
    }

    // Attempt registration
    const result = await organizationStore.registerTenant(registrationData)

    if (result.success) {
      // Find selected package name
      const selectedPackage = packages.value.find(pkg => pkg.id === form.value.packageId)
      
      // Registration successful, redirect to success page with registration info
      router.push({
        path: '/register/success',
        query: {
          email: form.value.email,
          organizationName: form.value.businessName,
          packageName: selectedPackage?.name || 'Basic',
          userName: form.value.ownerName
        }
      })
    } else {
      errorMessage.value = result.error || 'Registrasi gagal. Silakan coba lagi.'
    }
  } catch (error) {
    console.error('Registration error:', error)
    errorMessage.value = error.message || 'Terjadi kesalahan. Silakan coba lagi.'
  } finally {
    isLoading.value = false
  }
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID').format(amount)
}

// Initialize page
onMounted(async () => {
  await loadPackages()
  
  // Focus on business name field
  const businessNameInput = document.getElementById('businessName')
  if (businessNameInput) {
    businessNameInput.focus()
  }
})
</script>
