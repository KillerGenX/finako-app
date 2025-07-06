// File: src/main.js (Versi dengan urutan yang benar)

import { createApp } from "vue";
import { createPinia } from "pinia"; // 1. Impor Pinia

import App from "./App.vue";
import router from "./router"; // 2. Impor Router
import "./style.css";

const app = createApp(App);

// --- BAGIAN PALING PENTING ADA DI SINI ---
// Kita harus mendaftarkan Pinia terlebih dahulu,
// agar "Pusat Informasi" kita sudah siap sebelum ada halaman (dari router) yang mencoba mengaksesnya.

app.use(createPinia()); // 3. GUNAKAN PINIA
app.use(router); // 4. BARU GUNAKAN ROUTER

// Initialize auth after stores are ready
import { useUserStore } from '@/stores/userStore'
const userStore = useUserStore()
userStore.setupAuthListener()
userStore.initializeAuth()

app.mount("#app");
