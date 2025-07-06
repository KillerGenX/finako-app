import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import apiService from '@/services/api'
import { useOrganizationStore } from './organizationStore'

export const useUserStore = defineStore('user', () => {
  // --- STATE ---
  const session = ref(null)
  const profile = ref(null)
  const isReady = ref(false)
  const isSidebarCollapsed = ref(true)
  const notification = ref({ message: '', type: 'info', key: 0 })
  const isInitializing = ref(false) // Flag untuk mencegah duplicate initialization
  let authChangeTimeout = null // Debounce timeout untuk auth state changes

  // --- GETTERS ---
  const isLoggedIn = computed(() => !!session.value)
  const userId = computed(() => session.value?.user?.id || null)

  // --- INITIALIZE API SERVICE ---
  // Set user store reference to API service to avoid circular imports
  apiService.setUserStore({
    session,
    showNotification,
    clearUserProfile
  })

  // --- AUTH STATE LISTENER ---
  // Handle session persistence and restoration
  async function initializeAuth() {
    if (isInitializing.value) {
      console.log('Auth already initializing, skipping...')
      return
    }
    
    console.log('Initializing auth...')
    isInitializing.value = true
    
    try {
      // Get initial session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession) {
        console.log('Session found on init, restoring...')
        session.value = currentSession
        await fetchUserProfile()
      } else {
        console.log('No session found on init')
        isReady.value = true
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      isReady.value = true
    } finally {
      isInitializing.value = false
    }
  }

  // Set up auth state change listener
  function setupAuthListener() {
    console.log('Setting up auth listener...')
    supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event, newSession?.user?.id)
      
      // Skip if we're currently initializing to avoid conflicts
      if (isInitializing.value) {
        console.log('Skipping auth state change during initialization')
        return
      }

      // Clear any existing timeout to debounce rapid auth changes
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout)
      }

      // Debounce auth state changes to prevent rapid fire calls
      authChangeTimeout = setTimeout(async () => {
        try {
          if (event === 'SIGNED_IN' && newSession) {
            console.log('User signed in, setting session...')
            session.value = newSession
            console.log('Session set, fetching profile...')
            await fetchUserProfile()
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out, clearing profile...')
            clearUserProfile()
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
        }
      }, 150) // 150ms debounce to handle rapid auth changes
    })
  }

  // --- ACTIONS ---
  async function fetchUserProfile() {
    // Prevent duplicate calls if already loading
    if (!isReady.value && profile.value) {
      console.log('Profile fetch already in progress, skipping...')
      return
    }

    isReady.value = false
    const organizationStore = useOrganizationStore()
    
    try {
      // Get current Supabase session (auth still via Supabase)
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) {
        clearUserProfile()
        isReady.value = true
        return
      }
      session.value = currentSession

      // Get user profile from Supabase
      try {
        const { data: userProfileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.value.user.id)
          .single()
          
        if (profileError && profileError.code !== 'PGRST116') throw profileError
        if (userProfileData) profile.value = userProfileData
      } catch (error) {
        console.error('Error fetching user profile:', error)
        // Continue even if profile fetch fails
      }

      // Fetch organization data using organizationStore
      try {
        await organizationStore.fetchOrganizationData(session.value.user.id)
      } catch (error) {
        console.error('Error fetching organization data:', error)
        // Continue even if organization fetch fails
      }

    } catch (e) {
      console.error("Error in fetchUserProfile:", e.message)
      clearUserProfile()
    } finally {
      isReady.value = true
    }
  }

  function clearUserProfile() {
    const organizationStore = useOrganizationStore()
    
    session.value = null
    profile.value = null
    notification.value = { message: '', type: 'info', key: 0 }
    
    // Clear organization data via organizationStore
    organizationStore.clearOrganizationData()
  }

  // Refresh user data
  async function refreshUserData() {
    if (!session.value) return
    await fetchUserProfile()
  }

  // Update user profile
  async function updateProfile(profileData) {
    try {
      if (!session.value?.user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', session.value.user.id)
        .select()
        .single()

      if (error) throw error

      profile.value = data
      showNotification('Profil berhasil diperbarui', 'success')
      return { success: true, data }
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification(error.message, 'error')
      throw error
    }
  }

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  function showNotification(message, type = 'success', duration = 3000) {
    notification.value = { message, type, key: Date.now() };
    setTimeout(() => {
      if (notification.value.key === notification.value.key) {
        notification.value = { message: '', type: 'info', key: 0 };
      }
    }, duration);
  }

  // --- SaaS FLOW ACTIONS (Delegated to OrganizationStore) ---
  async function checkSessionAndRedirect() {
    const organizationStore = useOrganizationStore()
    
    if (!session.value?.user?.id) {
      return { next_step: 'login' }
    }

    try {
      const result = await organizationStore.checkSessionAndRedirect(session.value.user.id)
      return result
    } catch (error) {
      console.error('Session check failed:', error)
      return { next_step: 'login' }
    }
  }

  async function registerTenant(registrationData) {
    const organizationStore = useOrganizationStore()
    
    try {
      const result = await organizationStore.registerTenant(registrationData)
      showNotification('Registrasi berhasil!', 'success')
      return result
    } catch (error) {
      console.error('Registration error:', error)
      showNotification(error.message, 'error')
      return { success: false, error: error.message }
    }
  }

  async function completeOnboarding(onboardingData) {
    const organizationStore = useOrganizationStore()
    
    try {
      if (!session.value?.user?.id) {
        throw new Error('User session not found')
      }

      const result = await organizationStore.completeOnboarding(
        session.value.user.id,
        onboardingData
      )
      
      showNotification('Setup bisnis berhasil!', 'success')
      return result
    } catch (error) {
      console.error('Onboarding error:', error)
      showNotification(error.message, 'error')
      return { success: false, error: error.message }
    }
  }

  // --- ENHANCED LOGIN/LOGOUT ---
  async function loginWithEmailPassword(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Fetch user profile after successful login
      await fetchUserProfile()
      
      showNotification('Login berhasil!', 'success')
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      showNotification(error.message, 'error')
      return { success: false, error: error.message }
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut()
      clearUserProfile()
      showNotification('Logout berhasil', 'info')
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      clearUserProfile() // Force clear even if logout fails
      return { success: false, error: error.message }
    }
  }

  // --- UTILITY METHODS ---
  function validateAuthentication() {
    if (!isLoggedIn.value) {
      throw new Error('User tidak terautentikasi')
    }
    return true
  }

  async function getPackages() {
    try {
      console.log('UserStore: Calling API getPackages...')
      const data = await apiService.getPackages()
      console.log('UserStore: API response:', data)
      return data
    } catch (error) {
      console.error('Failed to fetch packages:', error)
      return []
    }
  }

  return { 
    // State
    session, 
    profile, 
    isReady,
    isSidebarCollapsed, 
    notification,
    
    // Getters
    isLoggedIn, 
    userId,
    
    // Actions
    fetchUserProfile, 
    clearUserProfile, 
    refreshUserData,
    updateProfile,
    toggleSidebar, 
    showNotification,
    
    // Authentication
    loginWithEmailPassword,
    logout,
    validateAuthentication,

    // SaaS Actions (Delegated)
    checkSessionAndRedirect, 
    registerTenant, 
    completeOnboarding, 
    getPackages,
    
    // Auth Initialization
    initializeAuth,
    setupAuthListener
  }
})