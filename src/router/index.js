import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useOrganizationStore } from '@/stores/organizationStore'


// Impor semua view Anda
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import OnboardingView from '@/views/OnboardingView.vue'
import PaymentInfoView from '@/views/PaymentInfoView.vue'
import RegisterView from '@/views/RegisterView.vue'
import RegisterSuccessView from '@/views/RegisterSuccessView.vue' 
// ...impor view lainnya

const routes = [
  // ... (Daftar routes Anda TIDAK BERUBAH)
  { path: '/login', name: 'Login', component: LoginView, meta: { requiresAuth: false } },
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
  { path: '/onboarding', name: 'Onboarding', component: OnboardingView, meta: { requiresAuth: true } },
  { path: '/', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
   {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { 
      requiresAuth: false, // Tidak perlu login untuk bisa mendaftar
      title: 'Daftar Akun Baru - Finako'
    }
  },
    {
    path: '/register/success',
    name: 'RegisterSuccess', // Nama ini harus cocok persis
    component: RegisterSuccessView,
    meta: {
      requiresAuth: false, // Halaman ini tidak butuh login
      title: 'Registrasi Berhasil - Finako'
    }
  },

  // ...
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // Jika store belum siap (misal saat refresh), tunggu prosesnya selesai
  if (!userStore.isReady) {
    await userStore.loadUserContext()
  }

  const isAuthenticated = userStore.isLoggedIn
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !isAuthenticated) {
    // Jika butuh login, tapi belum login -> lempar ke Login
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (isAuthenticated && !requiresAuth) {
    // Jika sudah login, tapi mau akses halaman Login/Register -> lempar ke Dashboard
    return next({ name: 'Dashboard' })
  }
  
  if (isAuthenticated && requiresAuth) {
    const organizationStore = useOrganizationStore()
    const orgStatus = organizationStore.organization?.status
    const onboardingCompleted = organizationStore.isOnboardingCompleted

    // Logika Alur SaaS
    if (orgStatus === 'pending' && to.name !== 'PaymentInfo') {
      return next({ name: 'PaymentInfo' })
    }
    
    if (orgStatus === 'active' && !onboardingCompleted && to.name !== 'Onboarding') {
      return next({ name: 'Onboarding' })
    }

    if ((to.name === 'Onboarding' || to.name === 'PaymentInfo') && onboardingCompleted) {
       return next({ name: 'Dashboard' });
    }
  }

  next() // Jika semua aman, lanjutkan navigasi
})

export default router