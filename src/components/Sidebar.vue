<template>
  <aside 
    class="bg-base-100 text-base-content flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out shadow-lg"
    :class="userStore.isSidebarCollapsed ? 'w-20' : 'w-64'"
  >
    <!-- Header -->
    <div class="h-16 flex items-center justify-center p-4 border-b border-base-300">
      <RouterLink to="/" class="min-w-max">
        <h2 v-if="!userStore.isSidebarCollapsed" class="text-2xl font-bold text-primary">Finako</h2>
        <h2 v-else class="text-3xl font-bold text-primary">F</h2>
      </RouterLink>
    </div>

    <!-- Organization Info -->
    <div v-if="!userStore.isSidebarCollapsed" class="p-4 border-b border-base-300">
      <div class="text-sm">
        <p class="font-medium truncate">{{ organizationStore.organization?.name || 'Organization' }}</p>
        <p class="text-base-content/60 text-xs">{{ organizationStore.userRole || 'User' }}</p>
      </div>
    </div>

    <!-- Navigation Menu -->
    <div class="flex-grow overflow-y-auto">
      <ul class="menu p-2 space-y-1">
        <!-- Dashboard -->
        <li v-if="organizationStore.userRole === 'owner'">
          <RouterLink to="/" class="flex items-center gap-3">
            <HomeIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Dashboard</span>
          </RouterLink>
        </li>

        <!-- Divider -->
        <div v-if="!userStore.isSidebarCollapsed" class="divider my-2"></div>
        
        <!-- POS -->
        <li v-if="organizationStore.hasFeature('pos')">
          <RouterLink to="/transaksi" class="flex items-center gap-3">
            <ShoppingCartIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Kasir (POS)</span>
          </RouterLink>
        </li>

        <!-- Products -->
        <li>
          <RouterLink to="/produk" class="flex items-center gap-3">
            <ArchiveBoxIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Produk</span>
          </RouterLink>
        </li>

        <!-- Stock -->
        <li v-if="organizationStore.hasFeature('stock_management')">
          <RouterLink to="/stok" class="flex items-center gap-3">
            <CubeIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Stok</span>
          </RouterLink>
        </li>

        <!-- Customers -->
        <li v-if="organizationStore.hasFeature('customer_data')">
          <RouterLink to="/pelanggan" class="flex items-center gap-3">
            <UserGroupIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Pelanggan</span>
          </RouterLink>
        </li>

        <!-- Expenses -->
        <li v-if="organizationStore.hasFeature('expenses')">
          <RouterLink to="/biaya" class="flex items-center gap-3">
            <BuildingStorefrontIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Biaya</span>
          </RouterLink>
        </li>

        <!-- Reports (Owner only) -->
        <li v-if="organizationStore.hasFeature('reports') && organizationStore.userRole === 'owner'">
          <RouterLink to="/laporan" class="flex items-center gap-3">
            <ChartPieIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Laporan</span>
          </RouterLink>
        </li>

        <!-- Employees (Owner only) -->
        <li v-if="organizationStore.hasFeature('employee_management') && organizationStore.userRole === 'owner'">
          <RouterLink to="/pegawai" class="flex items-center gap-3">
            <UsersIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Pegawai</span>
          </RouterLink>
        </li>

        <!-- Attendance -->
        <li v-if="organizationStore.hasFeature('employee_attendance')">
          <RouterLink to="/absensi" class="flex items-center gap-3">
            <ClockIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Absensi</span>
          </RouterLink>
        </li>
      </ul>
    </div>
    
    <!-- Bottom Actions -->
    <div class="sticky bottom-0 bg-base-100 border-t border-base-300 p-2">
      <ul class="menu">
        <!-- Settings (Owner only) -->
        <li v-if="organizationStore.userRole === 'owner'">
          <RouterLink to="/pengaturan" class="flex items-center gap-3">
            <Cog6ToothIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Pengaturan</span>
          </RouterLink>
        </li>
        
        <!-- Logout -->
        <li>
          <button @click="handleLogout" class="flex items-center gap-3 w-full text-left">
            <ArrowLeftOnRectangleIcon class="h-5 w-5 shrink-0" />
            <span v-if="!userStore.isSidebarCollapsed">Logout</span>
          </button>
        </li>
        
        <!-- Collapse Toggle -->
        <li>
          <button @click="userStore.toggleSidebar" class="flex items-center gap-3 w-full text-left">
            <ChevronDoubleLeftIcon 
              class="h-5 w-5 shrink-0 transition-transform duration-300"
              :class="{ 'rotate-180': userStore.isSidebarCollapsed }"
            />
            <span v-if="!userStore.isSidebarCollapsed">Kecilkan</span>
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useOrganizationStore } from '@/stores/organizationStore'
import { supabase } from '@/supabase'

// Import icons
import {
  HomeIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  CubeIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ChartPieIcon,
  UsersIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDoubleLeftIcon
} from '@heroicons/vue/24/outline'

// Initialize
const router = useRouter()
const userStore = useUserStore()
const organizationStore = useOrganizationStore()

// Logout handler
async function handleLogout() {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    try {
      await supabase.auth.signOut()
      userStore.clearUserProfile()
      router.push("/login")
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if Supabase fails
      userStore.clearUserProfile()
      router.push("/login")
    }
  }
}
</script>

<style scoped>
/* Active menu item styling */
.menu li > a.router-link-active, 
.menu li > a.router-link-exact-active {
  background-color: hsl(var(--p));
  color: hsl(var(--pc));
  font-weight: 600;
}

/* Smooth transitions */
.menu li > a, .menu li > button {
  transition: all 0.2s ease;
}

.menu li > a:hover, .menu li > button:hover {
  transform: translateX(2px);
}
</style>