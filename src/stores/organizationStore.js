import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import apiService from '@/services/api'

export const useOrganizationStore = defineStore('organization', () => {
  // --- STATE ---
  const organization = ref(null)
  const businessProfile = ref(null)
  const activeFeatures = ref([])
  const role = ref(null)
  const lastFetchTime = ref(null) // Cache timestamp

  // --- GETTERS ---
  const organizationId = computed(() => organization.value?.id || null)
  const hasValidOrganization = computed(() => !!organization.value && !!role.value)
  const userRole = computed(() => role.value || 'public')
  const isOwner = computed(() => role.value === 'owner')
  const isPegawai = computed(() => role.value === 'pegawai')
  const organizationStatus = computed(() => organization.value?.status || 'unknown')
  const isOnboardingCompleted = computed(() => {
    const hasActiveStatus = organization.value?.status === 'active'
    const hasBusinessProfile = !!businessProfile.value
    
    console.log('=== Checking onboarding completion ===')
    console.log('- Organization:', organization.value)
    console.log('- Organization status:', organization.value?.status)
    console.log('- Business profile:', businessProfile.value)
    console.log('- Has business profile:', hasBusinessProfile)
    console.log('- Is completed:', hasActiveStatus && hasBusinessProfile)
    console.log('=======================================')
    
    return hasActiveStatus && hasBusinessProfile
  })

  // --- ACTIONS ---
  async function fetchOrganizationData(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      console.log('Fetching organization data for user:', userId)

      // Get user membership and organization data
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select(`role, organizations ( * )`)
        .eq('user_id', userId)
        .single()

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError
      }

      if (memberData) {
        role.value = memberData.role
        organization.value = memberData.organizations
        console.log('Organization data fetched:', organization.value)

        // Fetch additional organization data if organization exists
        if (organization.value?.id) {
          await Promise.all([
            fetchActiveFeatures(organization.value.id),
            fetchBusinessProfile(organization.value.id)
          ])
        }
        
        // Update cache timestamp
        lastFetchTime.value = Date.now()
      } else {
        // Clear organization data if no membership found
        clearOrganizationData()
      }

      return { success: true }
    } catch (error) {
      console.error('Error fetching organization data:', error)
      clearOrganizationData()
      throw error
    }
  }

  async function fetchActiveFeatures(organizationId) {
    try {
      const { data: featureData, error: featureError } = await supabase
        .from('organization_features')
        .select('feature_id')
        .eq('organization_id', organizationId)
        .eq('is_enabled', true)

      if (featureError) throw featureError

      if (featureData) {
        activeFeatures.value = featureData.map(f => f.feature_id)
        console.log('Active features fetched:', activeFeatures.value)
      }
    } catch (error) {
      console.error('Error fetching features:', error)
      activeFeatures.value = []
    }
  }

  async function fetchBusinessProfile(organizationId) {
    try {
      console.log('Fetching business profile for organization:', organizationId)
      const profileData = await apiService.getBusinessProfile(organizationId)
      businessProfile.value = profileData.data
      console.log('Business profile fetched successfully:', businessProfile.value)
    } catch (error) {
      console.error('Error fetching business profile:', error)
      console.log('Setting businessProfile to null due to error')
      businessProfile.value = null
    }
  }

  async function updateOrganization(organizationData) {
    try {
      if (!organization.value?.id) {
        throw new Error('No organization found to update')
      }

      // Call backend API to update organization
      const response = await apiService.updateOrganization(organization.value.id, organizationData)
      
      // Update local state
      organization.value = { ...organization.value, ...response.data }
      
      console.log('Organization updated:', organization.value)
      return { success: true, data: organization.value }
    } catch (error) {
      console.error('Error updating organization:', error)
      throw error
    }
  }

  async function updateBusinessProfile(profileData) {
    try {
      if (!organization.value?.id) {
        throw new Error('No organization found for business profile update')
      }

      // Call backend API to update business profile
      const response = await apiService.updateBusinessProfile(organization.value.id, profileData)
      
      // Update local state
      businessProfile.value = response.data
      
      console.log('Business profile updated:', businessProfile.value)
      return { success: true, data: businessProfile.value }
    } catch (error) {
      console.error('Error updating business profile:', error)
      throw error
    }
  }

  function clearOrganizationData() {
    organization.value = null
    businessProfile.value = null
    activeFeatures.value = []
    role.value = null
    lastFetchTime.value = null
    console.log('Organization data cleared')
  }

  // --- UTILITY METHODS ---
  function hasFeature(featureId) {
    return activeFeatures.value.includes(featureId)
  }

  function hasRole(requiredRole) {
    if (!role.value) return false
    
    const roleHierarchy = {
      'super_admin': 4,
      'admin': 3,
      'manager': 2,
      'owner': 2, // Same level as manager for organization context
      'pegawai': 1,
      'staff': 1,
      'viewer': 0
    }
    
    return roleHierarchy[role.value] >= roleHierarchy[requiredRole]
  }

  function validateMembership() {
    if (!organization.value) {
      throw new Error('User tidak memiliki organisasi')
    }
    
    if (!role.value) {
      throw new Error('User tidak memiliki role dalam organisasi')
    }
    
    return true
  }

  function getOrganizationStatus() {
    return organization.value?.status || 'unknown'
  }

  // --- SaaS FLOW ACTIONS ---
  async function registerTenant(registrationData) {
    try {
      console.log('Registering tenant with data:', registrationData)
      
      // Use API service method directly
      const data = await apiService.registerTenant(registrationData)
      
      console.log('Registration API response:', data)

      // Update store with new organization data
      if (data.organization) {
        organization.value = data.organization
        role.value = 'owner'
        
        // Fetch additional data after registration
        if (data.organization.id) {
          await fetchActiveFeatures(data.organization.id)
        }
      }

      return { success: true, next_step: data.next_step || 'login', data }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  async function completeOnboarding(userId, onboardingData) {
    try {
      if (!organization.value?.id) {
        throw new Error('Organization not found for onboarding')
      }

      console.log('Completing onboarding with data:', onboardingData)
      
      // Use API service method directly
      const data = await apiService.completeOnboarding(
        userId,
        organization.value.id,
        onboardingData
      )

      console.log('Onboarding API response:', data)

      // Refresh organization data after onboarding
      await fetchOrganizationData(userId)
      
      return { success: true, next_step: data.next_step || 'dashboard', data }
    } catch (error) {
      console.error('Onboarding error:', error)
      throw error
    }
  }

  async function checkSessionAndRedirect(userId) {
    try {
      if (!userId) {
        return { next_step: 'login' }
      }

      console.log('=== Checking session for user ID:', userId, '===')
      
      // Use direct API call to get session info
      const response = await apiService.getSessionInfo(userId)
      
      console.log('Session API response:', response)

      // Extract data from the response structure {success: true, data: {...}}
      const data = response.data || response
      
      console.log('Extracted session data:', data)

      // Update store with fresh data
      if (data.organization) {
        organization.value = data.organization
        role.value = data.role
        console.log('Updated organization from session:', data.organization)
      }
      
      if (data.business_profile) {
        businessProfile.value = data.business_profile
        console.log('Updated business profile from session:', data.business_profile)
      } else {
        businessProfile.value = null
        console.log('No business profile in session data')
      }

      if (data.active_features) {
        activeFeatures.value = data.active_features
        console.log('Updated active features from session:', data.active_features)
      }

      // Use backend-determined next step (this is the source of truth)
      const nextStep = data.next_step || 'dashboard'
      console.log('Backend determined next step:', nextStep)
      
      // Double-check onboarding logic for debugging
      if (organization.value?.status === 'active') {
        const hasBusinessProfile = !!businessProfile.value
        console.log('=== Onboarding Check ===')
        console.log('Organization status: active')
        console.log('Has business profile:', hasBusinessProfile)
        console.log('Should redirect to:', hasBusinessProfile ? 'dashboard' : 'onboarding')
        console.log('Backend says redirect to:', nextStep)
        console.log('========================')
      }
      
      return { next_step: nextStep, data }
    } catch (error) {
      console.error('Session check failed:', error)
      return { next_step: 'login' }
    }
  }

  // --- REFRESH & SYNC ---
  async function refreshOrganizationData(userId) {
    if (!userId) return
    await fetchOrganizationData(userId)
  }

  return {
    // State
    organization,
    businessProfile,
    activeFeatures,
    role,
    lastFetchTime,

    // Getters
    organizationId,
    hasValidOrganization,
    userRole,
    isOwner,
    isPegawai,
    organizationStatus,
    isOnboardingCompleted,

    // Actions
    fetchOrganizationData,
    fetchActiveFeatures,
    fetchBusinessProfile,
    updateOrganization,
    updateBusinessProfile,
    clearOrganizationData,
    refreshOrganizationData,

    // Utilities
    hasFeature,
    hasRole,
    validateMembership,
    getOrganizationStatus,

    // SaaS Actions
    registerTenant,
    completeOnboarding,
    checkSessionAndRedirect
  }
})
