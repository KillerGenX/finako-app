<script setup>
// --- Impor dari Library & Komponen ---
import { ref, onMounted, computed, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import QrcodeVue from 'qrcode.vue';
import ReceiptTemplate from '@/components/ReceiptTemplate.vue';

// --- Impor Ikon ---
import { 
  PlusIcon, MinusIcon, TrashIcon, QrCodeIcon, DocumentCheckIcon, 
  PrinterIcon, PaperAirplaneIcon, TagIcon, PencilIcon 
} from '@heroicons/vue/24/solid';

const userStore = useUserStore();

// --- State Halaman ---
const produkList = ref([]);
const keranjang = ref([]);
const searchTerm = ref('');
const loading = ref(true);
const isProcessing = ref(false);
const customerName = ref('');
const customerPhone = ref('');

// --- State Fitur Lanjutan ---
const globalDiscount = ref({ type: 'percentage', value: 0 });
const taxPercent = ref(11);
const serviceChargePercent = ref(5);

// --- State Modal & Pembayaran ---
const paymentModal = ref(null);
const payments = ref([]);
const amountPaid = ref(0); // Menyimpan nilai angka MURNI untuk kalkulasi
const formattedAmountPaid = ref(''); // Menyimpan nilai yang TAMPIL di input
const quickCashOptions = [10000, 20000, 50000, 100000, 200000];

// --- State Struk ---
const generatedReceiptUrl = ref('');
const lastSaleId = ref(null);
const receiptTemplateRef = ref(null);

// --- Fungsi Pengambilan Data ---
// Ganti fungsi fetchProduk lama Anda dengan versi baru ini
async function fetchProduk() {
  loading.value = true;
  try {
    // Mengambil data dari API backend lokal kita, bukan lagi Supabase
    // Pastikan server backend Anda berjalan di port 3000
   const backendUrl = 'https://shiny-spoon-q79765g6jw6ghxpjg-3000.app.github.dev';
   const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products`);
    
    if (!response.ok) {
      throw new Error('Gagal terhubung ke server backend Finako.');
    }

    const data = await response.json();
    produkList.value = data;

  } catch (error) {
    userStore.showNotification(`Error: ${error.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

// --- Computed Properties ---
const filteredProdukList = computed(() => {
  if (!searchTerm.value) return produkList.value;
  return produkList.value.filter(p => p.name.toLowerCase().includes(searchTerm.value.toLowerCase()));
});

// Kalkulasi Harga Bertingkat
const subtotal = computed(() => keranjang.value.reduce((sum, item) => sum + (item.price * item.quantity), 0));
const totalDiscount = computed(() => (globalDiscount.value.type === 'percentage') ? (subtotal.value * globalDiscount.value.value) / 100 : globalDiscount.value.value);
const subtotalAfterDiscount = computed(() => subtotal.value - totalDiscount.value);
const serviceChargeAmount = computed(() => userStore.activeFeatures.includes('service_charge') ? (subtotalAfterDiscount.value * serviceChargePercent.value) / 100 : 0);
const taxAmount = computed(() => userStore.activeFeatures.includes('tax_ppn') ? ((subtotalAfterDiscount.value + serviceChargeAmount.value) * taxPercent.value) / 100 : 0);
const grandTotal = computed(() => subtotalAfterDiscount.value + serviceChargeAmount.value + taxAmount.value);

const totalPaid = computed(() => {
    if (userStore.activeFeatures.includes('multi_payment')) {
        return payments.value.reduce((sum, p) => sum + p.amount, 0);
    }
    return amountPaid.value;
});
const changeAmount = computed(() => totalPaid.value - grandTotal.value);


// --- Logika Keranjang Belanja ---
function tambahKeKeranjang(produk) {
  const itemDiKeranjang = keranjang.value.find(item => item.id === produk.id);
  if (itemDiKeranjang) {
    itemDiKeranjang.quantity++;
  } else {
    keranjang.value.push({ ...produk, quantity: 1, discount: 0, note: '' });
  }
}
function incrementQuantity(item) { item.quantity++; }
function decrementQuantity(item) {
  item.quantity--;
  if (item.quantity === 0) hapusDariKeranjang(item.id);
}
function hapusDariKeranjang(produkId) {
  keranjang.value = keranjang.value.filter(item => item.id !== produkId);
}

// --- Fungsi Aksi, Modal & Transaksi ---
function fiturBelumTersedia(fitur = 'ini') {
  userStore.showNotification(`Fitur '${fitur}' akan segera tersedia.`, 'info');
}

function openPaymentModal() {
  if (keranjang.value.length === 0) return userStore.showNotification('Keranjang masih kosong!', 'warning');
  payments.value = [];
  amountPaid.value = 0;
  formattedAmountPaid.value = '';
  paymentModal.value.showModal();
}

function addPayment() {
  if (amountPaid.value > 0) {
    payments.value.push({ method: 'Tunai', amount: amountPaid.value });
    amountPaid.value = 0;
    formattedAmountPaid.value = '';
  }
}

async function processTransaction() {
  if (totalPaid.value < grandTotal.value) return userStore.showNotification('Jumlah pembayaran kurang!', 'error');
  
  isProcessing.value = true;
  try {
    let customerId = null; // Mulai dengan null, artinya pelanggan tidak terdaftar

    // --- LOGIKA BARU: HANYA PROSES PELANGGAN JIKA NOMOR HP DIISI ---
    if (customerPhone.value) {
      // Membersihkan nomor HP dari karakter selain angka
      const cleanedPhone = customerPhone.value.replace(/\D/g, '');

      // Kirim data pelanggan ke backend API
      const customerResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: userStore.organization.id,
          phone_number: cleanedPhone,
          name: customerName.value || cleanedPhone
        })
      });

      if (!customerResponse.ok) {
        throw new Error('Gagal menyimpan data pelanggan');
      }

      const customerData = await customerResponse.json();
      customerId = customerData.id;
    }
    // --- AKHIR LOGIKA BARU ---

    // Proses penyimpanan ke 'sales' menggunakan backend API
    const itemsToSave = keranjang.value.map(item => ({ 
      product_id: item.id, 
      name: item.name, 
      price: item.price, 
      quantity: item.quantity, 
      cost_price: item.cost_price 
    }));
    
    const salesResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: customerId,
        customer_phone: customerPhone.value,
        customer_name: customerName.value,
        total: grandTotal.value,
        items: itemsToSave,
        organization_id: userStore.organization.id,
        user_id: userStore.session.user.id,
        discount_value: totalDiscount.value,
        tax_amount: taxAmount.value,
        service_charge_amount: serviceChargeAmount.value,
        status: 'completed'
      })
    });

    if (!salesResponse.ok) {
      throw new Error('Gagal menyimpan data penjualan');
    }

    const saleData = await salesResponse.json();

    // Simpan ke transactions menggunakan backend API
    const transactionResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: `Penjualan #${saleData.id}`,
        amount: grandTotal.value,
        type: 'income',
        category: 'Penjualan',
        organization_id: userStore.organization.id,
        user_id: userStore.session.user.id,
        sale_id: saleData.id
      })
    });

    if (!transactionResponse.ok) {
      throw new Error('Gagal menyimpan riwayat transaksi');
    }
    
    userStore.showNotification('Transaksi berhasil disimpan!', 'success');
    paymentModal.value.close();
    resetForm();

  } catch(error) {
    userStore.showNotification(`Gagal: ${error.message}`, 'error');
  } finally {
    isProcessing.value = false;
  }
}

function resetForm() {
  keranjang.value = [];
  customerName.value = '';
  customerPhone.value = '';
  searchTerm.value = '';
  globalDiscount.value = { type: 'percentage', value: 0 };
  payments.value = [];
  amountPaid.value = 0;
  formattedAmountPaid.value = '';
}

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(angka || 0);
}

function handleManualInput(event) {
  const rawValue = event.target.value.replace(/\D/g, '');
  const numberValue = Number(rawValue);
  amountPaid.value = numberValue;
  if (rawValue) {
    const formatted = new Intl.NumberFormat('id-ID').format(numberValue);
    if (event.target.value !== formatted) {
      event.target.value = formatted;
    }
    formattedAmountPaid.value = formatted;
  } else {
    formattedAmountPaid.value = '';
  }
}

function setAmount(amount) {
  amountPaid.value = amount;
  formattedAmountPaid.value = new Intl.NumberFormat('id-ID').format(amount);
}

// --- Lifecycle Hooks ---
onMounted(() => { if (userStore.isReady) fetchProduk(); });
watch(() => userStore.isReady, (ready) => { if (ready && produkList.value.length === 0) fetchProduk(); });
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-[calc(100vh-120px)]">

    <div class="lg:col-span-2 flex flex-col h-full bg-base-100 p-4 rounded-xl shadow">
      <div class="mb-4">
        <h1 class="text-2xl font-bold">Kasir Penjualan</h1>
        <p class="text-base-content/70 text-sm">Pilih produk untuk ditambahkan ke keranjang.</p>
      </div>
      <div class="form-control mb-4">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Cari nama produk..." 
          class="input input-bordered w-full" 
        />
      </div>
      <div class="flex-grow overflow-y-auto pr-2 -mr-2">
        <div v-if="loading" class="flex justify-center items-center h-full pt-16">
            <span class="loading loading-spinner loading-lg"></span>
        </div>
        <div v-else>
            <div v-if="filteredProdukList.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div
                    v-for="produk in filteredProdukList"
                    :key="produk.id"
                    class="card card-compact bg-base-200 shadow-md cursor-pointer hover:ring-2 hover:ring-primary transition-all duration-200"
                    @click="tambahKeKeranjang(produk)"
                >
                    <figure><img :src="produk.foto_url || 'https://placehold.co/300x200?text=Finako'" alt="Produk" class="w-full h-24 object-cover" /></figure>
                    <div class="card-body p-3 text-center">
                        <h3 class="text-sm font-semibold truncate" :title="produk.name">{{ produk.name }}</h3>
                        <p class="text-primary font-bold text-sm">{{ formatRupiah(produk.price) }}</p>
                    </div>
                </div>
            </div>
            <div v-else class="text-center pt-16 text-base-content/60">
                <p>Produk tidak ditemukan.</p>
            </div>
        </div>
      </div>
    </div>

    <div class="lg:col-span-1">
      <div class="card bg-base-100 shadow-xl h-full">
        <div class="card-body flex flex-col p-4">
          <div class="flex justify-between items-center">
             <h2 class="card-title">Keranjang</h2>
             <button v-if="keranjang.length > 0" @click="resetForm" class="btn btn-xs btn-ghost text-error">Reset</button>
          </div>
          
          <div class="flex-grow overflow-y-auto my-4 -mr-4 pr-4">
            <div v-if="keranjang.length === 0" class="flex items-center justify-center h-full text-center">
                <p class="text-base-content/60 italic">Klik produk untuk memulai</p>
            </div>
            <div v-else class="space-y-3">
              <div v-for="item in keranjang" :key="item.id" class="flex items-start gap-3">
                <img :src="item.foto_url || 'https://placehold.co/100x100?text=F'" class="w-12 h-12 rounded-lg object-cover" />
                <div class="flex-grow">
                  <p class="font-semibold text-sm">{{ item.name }}</p>
                  <a @click="fiturBelumTersedia('Catatan per Item')" v-if="userStore.activeFeatures.includes('order_notes')" class="text-xs link link-hover link-info">Tambah Catatan</a>
                </div>
                <div class="flex flex-col items-end">
                    <p class="font-medium text-sm">{{ formatRupiah(item.price * item.quantity) }}</p>
                    <div class="flex items-center gap-1 mt-1">
                      <button @click="fiturBelumTersedia('Diskon per Item')" v-if="userStore.activeFeatures.includes('discount_per_item')" class="btn btn-xs btn-circle btn-ghost"><TagIcon class="h-4 w-4"/></button>
                      <button @click="decrementQuantity(item)" class="btn btn-xs btn-square btn-ghost">-</button>
                      <span class="font-bold w-5 text-center">{{ item.quantity }}</span>
                      <button @click="incrementQuantity(item)" class="btn btn-xs btn-square btn-ghost">+</button>
                    </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="keranjang.length > 0" class="mt-auto pt-4 border-t">
            <div class="form-control">
              <label class="label pb-1"><span class="label-text text-xs">Nama Pelanggan (Opsional)</span></label>
              <input v-model="customerName" type="text" class="input input-sm input-bordered" placeholder="Nama..." />
            </div>
            <div class="form-control mt-2">
              <label class="label pb-1"><span class="label-text text-xs">Nomor HP Pelanggan</span></label>
              <input v-model="customerPhone" type="tel" class="input input-sm input-bordered" placeholder="62812..." />
            </div>
            
            <div class="space-y-1 text-sm mt-4">
              <div class="flex justify-between"><span>Subtotal</span><span>{{ formatRupiah(subtotal) }}</span></div>
              <div v-if="userStore.activeFeatures.includes('discount_per_trx')" class="flex justify-between items-center">
                <a @click="fiturBelumTersedia('Diskon per Transaksi')" class="link link-hover text-info">Diskon</a>
                <span class="text-success">- {{ formatRupiah(totalDiscount) }}</span>
              </div>
              <div v-if="userStore.activeFeatures.includes('service_charge') && userStore.businessProfile?.service_charge_enabled" class="flex justify-between">
                <span>Biaya Layanan</span><span class="text-error">+ {{ formatRupiah(serviceChargeAmount) }}</span>
              </div>
              <div v-if="userStore.activeFeatures.includes('tax_ppn') && userStore.businessProfile?.tax_enabled" class="flex justify-between">
                <span>PPN (11%)</span><span class="text-error">+ {{ formatRupiah(taxAmount) }}</span>
              </div>
            </div>
            <div class="divider my-2"></div>
            <div class="flex justify-between items-center text-xl font-bold">
              <span>Total Bayar:</span>
              <span class="text-primary">{{ formatRupiah(grandTotal) }}</span>
            </div>
            <div class="card-actions mt-4">
              <button class="btn btn-primary w-full text-lg" @click="openPaymentModal">
                Bayar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <dialog ref="paymentModal" class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="resetForm">✕</button>
      </form>
      <h3 class="font-bold text-lg">Proses Pembayaran</h3>
      <div class="py-4 space-y-4">
        
        <div class="text-center">
          <p class="text-sm opacity-70">Total Tagihan</p>
          <p class="text-4xl font-bold text-primary">{{ formatRupiah(grandTotal) }}</p>
        </div>
        
        <div v-if="userStore.activeFeatures.includes('multi_payment')">
          <label class="label"><span class="label-text">Tambah Metode Pembayaran</span></label>
          <div class="form-control">
            <div class="join">
              <input v-model.number="amountPaid" type="number" placeholder="Jumlah dibayar" class="input input-bordered join-item w-full" @keyup.enter="addPayment"/>
              <button @click="addPayment" class="btn btn-primary join-item">Tambah</button>
            </div>
          </div>
          <div class="mt-2 space-y-1 max-h-24 overflow-y-auto">
            <p v-if="payments.length > 0" class="text-xs font-bold">Pembayaran Diterima:</p>
            <div v-for="(p, index) in payments" :key="index" class="flex justify-between items-center bg-base-200 p-2 rounded-lg">
              <span class="text-sm">{{ p.method }}: {{ formatRupiah(p.amount) }}</span>
              <button class="btn btn-xs btn-circle" @click="payments.splice(index, 1)">✕</button>
            </div>
          </div>
        </div>

        <div v-else>
           <div class="form-control">
            <label class="label"><span class="label-text">Jumlah Uang Diterima</span></label>
            <input 
              :value="formattedAmountPaid"
              @input="handleManualInput"
              type="text" 
              inputmode="numeric"
              placeholder="Ketik jumlah atau pilih di bawah" 
              class="input input-bordered w-full text-lg text-right" 
            />
           </div>
           <div class="grid grid-cols-5 gap-2 mt-2">
             <button 
                 v-for="cash in quickCashOptions" 
                 :key="cash" 
                 @click="setAmount(cash)" 
                 class="btn btn-outline btn-sm"
             >
                 {{ new Intl.NumberFormat('id-ID').format(cash).replace(/\D/g,'').slice(0,-3) ? new Intl.NumberFormat('id-ID').format(cash).replace(/\D/g,'').slice(0,-3) + 'rb' : new Intl.NumberFormat('id-ID').format(cash) }}
             </button>
           </div>
        </div>

        <div class="divider my-2"></div>

        <div class="text-center text-lg">
            <p v-if="changeAmount < 0" class="font-semibold">Kurang Bayar: <span class="text-error">{{ formatRupiah(Math.abs(changeAmount)) }}</span></p>
            <p v-else class="font-semibold">Kembalian: <span class="text-success">{{ formatRupiah(changeAmount) }}</span></p>
        </div>

      </div>
      <div class="modal-action">
        <button type="button" class="btn btn-ghost" @click="resetForm">Batal</button>
        <button @click="processTransaction" class="btn btn-success" :disabled="isProcessing || totalPaid < grandTotal">
          <span v-if="isProcessing" class="loading loading-spinner"></span>
          Selesaikan & Simpan
        </button>
      </div>
    </div>
  </dialog>
</template>