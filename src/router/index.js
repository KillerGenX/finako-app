import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useOrganizationStore } from '@/stores/organizationStore'

// Import Views
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import RegisterSuccessView from '@/views/RegisterSuccessView.vue'
import PaymentInfoView from '@/views/PaymentInfoView.vue'
import OnboardingView from '@/views/OnboardingView.vue'
import DashboardView from '@/views/DashboardView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

// Import other existing views
import AbsensiView from '@/views/AbsensiView.vue'
import BiayaView from '@/views/BiayaView.vue'
import KategoriBiayaView from '@/views/KategoriBiayaView.vue'
import LaporanView from '@/views/LaporanView.vue'
import PegawaiView from '@/views/PegawaiView.vue'
import PelangganView from '@/views/PelangganView.vue'
import PengaturanView from '@/views/PengaturanView.vue'
import ProdukView from '@/views/ProdukView.vue'
import StokView from '@/views/StokView.vue'
import TransaksiView from '@/views/TransaksiView.vue'

const routes = [
  // Public Routes (No Authentication Required)
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { 
      requiresAuth: false,
      title: 'Login - Finako'
    }
  },
  {
    path: '/register',
    name: 'Register', 
    component: RegisterView,
    meta: { 
      requiresAuth: false,
      title: 'Daftar - Finako'
    }
  },
  {
    path: '/register/success',
    name: 'RegisterSuccess',
    component: RegisterSuccessView,
    meta: {
      requiresAuth: false,
      title: 'Registrasi Berhasil - Finako'
    }
  },

  // SaaS Flow Routes (Authentication Required)
  {
    path: '/payment-info',
    name: 'PaymentInfo',
    component: PaymentInfoView,
    meta: {
      requiresAuth: true,
      allowedStatus: ['pending'],
      title: 'Informasi Pembayaran - Finako'
    }
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: OnboardingView,
    meta: {
      requiresAuth: true,
      allowedStatus: ['active'],
      requiresOnboarding: false,
      title: 'Setup Bisnis - Finako'
    }
  },

  // Main Application Routes (Full Access Required)
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Dashboard - Finako'
    }
  },
  {
    path: '/dashboard',
    redirect: '/'
  },
  {
    path: '/transaksi',
    name: 'Transaksi',
    component: TransaksiView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Transaksi - Finako'
    }
  },
  {
    path: '/produk',
    name: 'Produk',
    component: ProdukView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Produk - Finako'
    }
  },
  {
    path: '/pelanggan',
    name: 'Pelanggan',
    component: PelangganView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Pelanggan - Finako'
    }
  },
  {
    path: '/stok',
    name: 'Stok',
    component: StokView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Stok - Finako'
    }
  },
  {
    path: '/biaya',
    name: 'Biaya',
    component: BiayaView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Biaya - Finako'
    }
  },
  {
    path: '/kategori-biaya',
    name: 'KategoriBiaya',
    component: KategoriBiayaView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Kategori Biaya - Finako'
    }
  },
  {
    path: '/laporan',
    name: 'Laporan',
    component: LaporanView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Laporan - Finako'
    }
  },
  {
    path: '/pegawai',
    name: 'Pegawai',
    component: PegawaiView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Pegawai - Finako'
    }
  },
  {
    path: '/absensi',
    name: 'Absensi',
    component: AbsensiView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Absensi - Finako'
    }
  },
  {
    path: '/pengaturan',
    name: 'Pengaturan',
    component: PengaturanView,
    meta: {
      requiresAuth: true,
      requiresOnboarding: true,
      allowedStatus: ['active'],
      title: 'Pengaturan - Finako'
    }
  },

  // 404 Route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: {
      title: 'Halaman Tidak Ditemukan - Finako'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guards untuk SaaS Flow Control
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const organizationStore = useOrganizationStore()
  
  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // Wait for auth initialization to complete
    if (!userStore.isReady) {
      console.log('Waiting for auth initialization...')
      // Wait for auth to be ready with timeout
      let retries = 0
      const maxRetries = 50 // 5 seconds max wait
      
      while (!userStore.isReady && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }
      
      if (!userStore.isReady) {
        console.log('Auth initialization timeout, redirecting to login')
        return next({ name: 'Login', query: { redirect: to.fullPath } })
      }
    }
    
    // Check if user is authenticated after initialization is complete
    if (!userStore.isLoggedIn) {
      console.log('User not authenticated after initialization, redirecting to login')
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }

    // If authenticated, check user session and organization status
    try {
      console.log('Checking session for authenticated user...')
      
      // ALWAYS call backend for authoritative session data
      // Backend has the complete logic for determining next_step
      const sessionData = await organizationStore.checkSessionAndRedirect(userStore.userId)
      console.log('Session data received:', sessionData)
      
      const organization = organizationStore.organization
      console.log('Organization data:', organization)
      
      const nextStep = sessionData.next_step
      console.log('Next step from backend:', nextStep)
      
      // If no organization data, something went wrong
      if (!organization) {
        console.log('No organization found, redirecting to login')
        await userStore.logout()
        return next({ name: 'Login' })
      }

      // Check organization status restrictions
      if (to.meta.allowedStatus && !to.meta.allowedStatus.includes(organization.status)) {
        console.log(`Organization status ${organization.status} not allowed for route ${to.name}`)
        return next({ name: getRedirectRoute(nextStep) })
      }

      // TRUST BACKEND DECISION COMPLETELY
      // Backend has the authoritative logic for onboarding completion
      
      // If backend says go to onboarding but user is trying to access protected route
      if (nextStep === 'onboarding' && to.name !== 'Onboarding') {
        console.log('Backend determined onboarding needed, redirecting to onboarding')
        return next({ name: 'Onboarding' })
      }

      // If backend says go to payment-info but user is trying to access other route
      if (nextStep === 'payment_info' && to.name !== 'PaymentInfo') {
        console.log('Backend determined payment info needed, redirecting to payment info')
        return next({ name: 'PaymentInfo' })
      }

      // If backend says dashboard, allow access to protected routes
      if (nextStep === 'dashboard') {
        // If trying to access onboarding/payment when backend says dashboard
        if (to.name === 'Onboarding' || to.name === 'PaymentInfo') {
          console.log('Backend says setup completed, redirecting to dashboard')
          return next({ name: 'Dashboard' })
        }
        // Otherwise allow normal navigation to protected routes
      }

    } catch (error) {
      console.error('Session check failed:', error)
      await userStore.logout()
      return next({ name: 'Login' })
    }
  }

  // If user is authenticated and trying to access login/register, redirect appropriately
  if ((to.name === 'Login' || to.name === 'Register') && userStore.isLoggedIn) {
    try {
      const sessionData = await organizationStore.checkSessionAndRedirect(userStore.userId)
      const nextStep = sessionData.next_step
      console.log('User already authenticated, redirecting to:', nextStep)
      return next({ name: getRedirectRoute(nextStep) })
    } catch (error) {
      console.error('Error checking session:', error)
      // Continue to login/register if there's an error
    }
  }

  next()
})

// Helper function to get redirect route based on next step
function getRedirectRoute(nextStep) {
  switch (nextStep) {
    case 'payment_info':
      return 'PaymentInfo'
    case 'onboarding':
      return 'Onboarding'
    case 'dashboard':
      return 'Dashboard'
    default:
      return 'Dashboard'
  }
}

export default router