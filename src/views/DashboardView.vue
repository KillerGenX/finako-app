<template>
  <div class="p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-base-content">Dashboard</h1>
      <p class="text-base-content/60">
        {{ greeting }}, {{ userStore.profile?.full_name || 'User' }}!
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Welcome Card -->
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title">Selamat Datang di Finako!</h2>
          <p>
            Anda masuk sebagai <strong>{{ organizationStore.userRole || 'pengguna' }}</strong> 
            di <strong>{{ organizationStore.organization?.name || 'organisasi' }}</strong>
          </p>
          
          <!-- Quick Info -->
          <div class="stats stats-vertical lg:stats-horizontal mt-4">
            <div class="stat">
              <div class="stat-title">Status</div>
              <div class="stat-value text-sm">{{ organizationStore.organization?.status || 'Aktif' }}</div>
            </div>
            
            <div class="stat">
              <div class="stat-title">Paket</div>
              <div class="stat-value text-sm">{{ organizationStore.organization?.package_id || 'Basic' }}</div>
            </div>
            
            <div class="stat">
              <div class="stat-title">Role</div>
              <div class="stat-value text-sm">{{ organizationStore.userRole || 'User' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card bg-primary text-primary-content">
          <div class="card-body">
            <h3 class="card-title text-lg">Penjualan</h3>
            <p>Kelola transaksi harian</p>
            <div class="card-actions justify-end">
              <button class="btn btn-sm">Lihat</button>
            </div>
          </div>
        </div>

        <div class="card bg-secondary text-secondary-content">
          <div class="card-body">
            <h3 class="card-title text-lg">Produk</h3>
            <p>Kelola inventori</p>
            <div class="card-actions justify-end">
              <button class="btn btn-sm">Lihat</button>
            </div>
          </div>
        </div>

        <div class="card bg-accent text-accent-content">
          <div class="card-body">
            <h3 class="card-title text-lg">Laporan</h3>
            <p>Analisis bisnis</p>
            <div class="card-actions justify-end">
              <button class="btn btn-sm">Lihat</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Simple Stats -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Informasi Sistem</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <tbody>
                <tr>
                  <td>User ID</td>
                  <td>{{ userStore.userId || 'Tidak tersedia' }}</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>{{ userStore.profile?.email || 'Tidak tersedia' }}</td>
                </tr>
                <tr>
                  <td>Organization ID</td>
                  <td>{{ organizationStore.organizationId || 'Tidak tersedia' }}</td>
                </tr>
                <tr>
                  <td>Login Status</td>
                  <td>
                    <div class="badge badge-success">{{ userStore.isLoggedIn ? 'Aktif' : 'Tidak Aktif' }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useOrganizationStore } from '@/stores/organizationStore'

// Initialize stores
const userStore = useUserStore()
const organizationStore = useOrganizationStore()

// Basic state
const loading = ref(true)
const greeting = ref('')

// Set greeting based on time
function setGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) greeting.value = 'Selamat Pagi'
  else if (hour < 17) greeting.value = 'Selamat Siang'
  else greeting.value = 'Selamat Malam'
}

onMounted(() => {
  setGreeting()
  // Simulate loading for smooth UX
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>