<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
      <!-- Success Icon -->
      <div class="mb-6">
        <div class="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Registrasi Berhasil!</h1>
        <p class="text-gray-600">Selamat datang di Finako</p>
      </div>

      <!-- User Info -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <p class="text-sm text-gray-600 mb-1">Akun berhasil dibuat untuk:</p>
        <p class="font-semibold text-gray-900">{{ registrationData.email }}</p>
        <p class="text-sm text-gray-600 mb-1">Nama Pemilik Bisnis:</p>
        <p class="font-semibold text-gray-900">{{ registrationData.userName }}</p>
        <p class="text-sm text-gray-600 mt-2">Nama Bisnis: {{ registrationData.organizationName }}</p>
        <div class="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Paket {{ registrationData.packageName }}
        </div>
      </div>

      <!-- Next Steps -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Langkah Selanjutnya</h3>
        <div class="space-y-2 text-left">
          <div class="flex items-start">
            <span class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
            <p class="text-sm text-gray-700">Login dengan akun yang baru saja dibuat</p>
          </div>
          <div class="flex items-start">
            <span class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
            <p class="text-sm text-gray-700">Lengkapi informasi pembayaran</p>
          </div>
          <div class="flex items-start">
            <span class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
            <p class="text-sm text-gray-700">Setup bisnis dan mulai menggunakan Finako</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <button 
          @click="goToLogin"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
        >
          Login Sekarang
        </button>
        <button 
          @click="goToHomepage"
          class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition duration-200"
        >
          Kembali ke Homepage
        </button>
      </div>

      <!-- Tips Section -->
      <div class="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <div class="text-left">
            <p class="text-sm font-medium text-amber-800 mb-1">💡 Tips Setup Cepat</p>
            <p class="text-xs text-amber-700">Siapkan informasi bisnis Anda seperti nama toko, alamat, dan produk untuk setup yang lebih efisien nanti.</p>
          </div>
        </div>
      </div>

      <!-- Support Info -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500">
          Butuh bantuan? 
          <a href="mailto:support@finako.com" class="text-blue-600 hover:text-blue-800 font-medium">
            Hubungi Support
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Registration data from query params or store
const registrationData = ref({
  email: '',
  organizationName: '',
  packageName: '',
  userName: ''
})

onMounted(() => {
  // Get registration data from query params (passed from RegisterView)
  registrationData.value = {
    email: route.query.email || 'User',
    organizationName: route.query.organizationName || 'Organisasi Anda',
    packageName: route.query.packageName || 'Basic',
    userName: route.query.userName || 'User'
  }

  // If no registration data, redirect to register
  if (!route.query.email) {
    router.push('/register')
  }
})

const goToLogin = () => {
  // Navigate to login with a hint that user just registered
  router.push({
    path: '/login',
    query: { 
      email: registrationData.value.email,
      newUser: 'true'
    }
  })
}

const goToHomepage = () => {
  router.push('/')
}
</script>

<style scoped>
/* Custom animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.max-w-md {
  animation: fadeInUp 0.6s ease-out;
}

/* Hover effects */
button:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

/* Success icon animation */
@keyframes checkmark {
  0% {
    stroke-dasharray: 0 100;
  }
  100% {
    stroke-dasharray: 100 0;
  }
}

svg path {
  animation: checkmark 0.6s ease-in-out 0.3s both;
}
</style>
