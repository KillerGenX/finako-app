<script setup>
import { useUserStore } from '@/stores/userStore'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const userStore = useUserStore()
const route = useRoute()

const shouldUseAuthLayout = computed(() => {
  // Tampilkan layout utama jika rute butuh auth DAN BUKAN halaman flow saas
  const saasFlowRoutes = ['PaymentInfo', 'Onboarding']
  return route.meta.requiresAuth && !saasFlowRoutes.includes(route.name)
})
</script>

<template>
  <div v-if="!userStore.isReady" class="flex h-screen items-center justify-center bg-base-300">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
  
  <div v-else>
    <LayoutAuthenticated v-if="shouldUseAuthLayout">
      <router-view />
    </LayoutAuthenticated>
    
    <router-view v-else />
  </div>
</template>