import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'
import { useUserStore } from './userStore';

export const useOrganizationStore = defineStore('organization', () => {
  // --- STATE --- (Semua state Anda dipertahankan)
  const organization = ref(null)
  const businessProfile = ref(null)
  const activeFeatures = ref([])
  const role = ref(null)
  const outlets = ref([])
  const activeOutletId = ref(null)
  
  // --- GETTERS --- (Semua getter Anda dipertahankan)
  const organizationId = computed(() => organization.value?.id || null)
  const userRole = computed(() => role.value || null)
  const isOwner = computed(() => role.value === 'owner')
  const isOnboardingCompleted = computed(() => organization.value?.status === 'active' && !!businessProfile.value)

  // --- ACTIONS ---

  // FUNGSI UTAMA: Menerima data dari userStore, bukan mengambil sendiri
  function setContext(contextData) {
    organization.value = contextData.organization
    businessProfile.value = contextData.business_profile
    activeFeatures.value = contextData.active_features || []
    role.value = contextData.role
    outlets.value = contextData.outlets || []
    if (outlets.value.length > 0 && !activeOutletId.value) {
      activeOutletId.value = outlets.value[0].id
    }
  }

  function clearContext() {
    organization.value = null
    businessProfile.value = null
    activeFeatures.value = []
    role.value = null
    outlets.value = []
    activeOutletId.value = null
  }
  
  function setActiveOutlet(outletId) {
    activeOutletId.value = outletId
  }

  // --- FUNGSI-FUNGSI DARI FILE LAMA ANDA, SEKARANG DI-UPGRADE MENGGUNAKAN apiService ---

  async function getPackages() {
    // Memanggil API melalui service, bukan langsung
    const response = await apiService.get('/packages')
    return response.data || response
  }

  async function registerTenant(registrationData) {
    // Memanggil API, bukan supabase.from
    const response = await apiService.register(registrationData)
    return response
  }

 async function completeOnboarding(onboardingData) {
  const userStore = useUserStore();
  if (!organizationId.value || !userStore.userId) {
    throw new Error('Organization atau User ID tidak ditemukan');
  }

  try {
    // Panggil API untuk menyimpan data onboarding
    const response = await apiService.completeOnboarding(
      userStore.userId,
      organizationId.value,
      onboardingData
    );

    // PENTING: Setelah berhasil, panggil loadUserContext untuk
    // me-refresh SEMUA state (termasuk businessProfile yang baru dibuat).
    await userStore.loadUserContext(true); // 'true' untuk memaksa refresh

    userStore.showNotification('Setup bisnis berhasil!', 'success');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Onboarding error in store:', error);
    throw error; // Lemparkan error agar komponen bisa menanganinya
  }
}
  
  async function updateOrganization(organizationData) {
    if (!organizationId.value) throw new Error("Organization not found to update")
    const response = await apiService.updateOrganization(organizationId.value, organizationData)
    organization.value = { ...organization.value, ...response.data }
    return response
  }

  async function updateBusinessProfile(profileData) {
    if (!organizationId.value) throw new Error("Organization not found")
    const response = await apiService.updateBusinessProfile(organizationId.value, profileData)
    businessProfile.value = response.data
    return response
  }

  // --- UTILITIES ---
  function hasRole(requiredRole) {
    if (!role.value) return false
    const roleHierarchy = { 'owner': 2, 'staff': 1, 'pegawai': 1 }
    return (roleHierarchy[role.value] || 0) >= (roleHierarchy[requiredRole] || 0)
  }

  function hasFeature(featureId) {
    return activeFeatures.value.includes(featureId)
  }

  // --- EXPORT SEMUA FUNGSI PENTING ---
  return {
    // State
    organization, businessProfile, activeFeatures, role, outlets, activeOutletId,
    // Getters
    organizationId, userRole, isOwner, isOnboardingCompleted,
    // Actions
    setContext, clearContext, setActiveOutlet, getPackages, registerTenant,
    completeOnboarding, updateOrganization, updateBusinessProfile,
    // Utilities
    hasRole, hasFeature
  }
})