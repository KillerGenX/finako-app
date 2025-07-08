import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import apiService from '@/services/api'
import { useOrganizationStore } from './organizationStore'

export const useUserStore = defineStore('user', () => {
  const session = ref(null)
  const profile = ref(null)
  const isReady = ref(false)
  const notification = ref({ message: '', type: 'info', key: 0 })

  const isLoggedIn = computed(() => !!session.value)
  const userId = computed(() => session.value?.user?.id || null)

  apiService.setUserStore({ session, showNotification, clearUserProfile })

  function clearUserProfile() {
    const organizationStore = useOrganizationStore()
    session.value = null
    profile.value = null
    organizationStore.clearContext()
    isReady.value = true // Tandai siap bahkan setelah clear
  }

  async function loadUserContext(forceRefresh = false) {
  // Hanya berhenti jika SUDAH SIAP dan TIDAK DIPAKSA untuk refresh
  if (isReady.value && !forceRefresh) {
    return;
  }

  isReady.value = false;
  try {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      clearUserProfile();
      return;
    }
    session.value = currentSession;

    const response = await apiService.getSessionInfo(session.value.user.id);
    const data = response.data;

    profile.value = data.user;
    
    const organizationStore = useOrganizationStore();
    organizationStore.setContext(data);

  } catch (error) {
    console.error("Failed to load user context:", error);
    clearUserProfile();
  } finally {
    isReady.value = true;
  }
}

  async function loginWithEmailPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      showNotification(error.message, 'error')
      throw error
    }
    isReady.value = false // Reset isReady agar loadUserContext bisa berjalan lagi
    await loadUserContext()
    showNotification('Login berhasil!', 'success')
    return { success: true }
  }

 async function logout() {
  try {
    await supabase.auth.signOut();
    // HAPUS hard redirect dari sini
  } catch (error) {
    console.error('Supabase signout error:', error);
    // Jika gagal, kembalikan false
    return false;
  } finally {
    // Selalu bersihkan state
    clearUserProfile();
    showNotification('Anda telah logout.', 'info');
  }
  // Kembalikan true jika semua proses berhasil
  return true;
}
  
  function showNotification(message, type = 'success') {
    notification.value = { message, type, key: Date.now() }
  }

  return { session, profile, isReady, notification, isLoggedIn, userId, loadUserContext, loginWithEmailPassword, logout, showNotification, clearUserProfile }
})