<template>
  <aside 
    class="bg-base-100 text-base-content flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out shadow-lg border-r border-base-300 relative"
    :class="userStore.isSidebarCollapsed ? 'w-20' : 'w-72'"
  >
    <!-- Header -->
    <div class="h-16 flex items-center justify-between p-4 border-b border-base-300">
      <RouterLink to="/" class="min-w-max">
        <h2 v-if="!userStore.isSidebarCollapsed" class="text-2xl font-bold text-primary">Finako</h2>
        <h2 v-else class="text-2xl font-bold text-primary">F</h2>
      </RouterLink>
      
      <!-- Collapse Toggle -->
      <button 
        @click="userStore.toggleSidebar" 
        class="btn btn-ghost btn-sm p-1"
        v-if="!userStore.isSidebarCollapsed"
      >
        <ChevronDoubleLeftIcon class="h-4 w-4" />
      </button>
    </div>

    <!-- Organization Info -->
    <div v-if="!userStore.isSidebarCollapsed" class="p-4 border-b border-base-300 bg-base-200/50">
      <div class="text-sm">
        <p class="font-semibold truncate text-base-content">{{ organizationStore.organization?.name || 'Organization' }}</p>
        <p class="text-base-content/60 text-xs capitalize flex items-center gap-1">
          <div class="w-2 h-2 rounded-full bg-success"></div>
          {{ organizationStore.userRole || 'User' }} • {{ organizationStore.organization?.status || 'Active' }}
        </p>
      </div>
    </div>

    <!-- Navigation Menu -->
    <div class="flex-grow overflow-y-auto py-2">
      <nav class="space-y-1">
        
        <!-- 🏠 DASHBOARD -->
        <div v-if="canAccessFeature('advanced_dashboard')" class="px-3">
          <RouterLink to="/" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
            <HomeIcon class="h-5 w-5 shrink-0 text-primary" />
            <span v-if="!userStore.isSidebarCollapsed" class="font-medium">Dashboard</span>
            
            <!-- DaisyUI Tooltip for collapsed mode -->
            <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Dashboard">
            </div>
          </RouterLink>
        </div>

        <!-- 🛒 POINT OF SALE -->
        <div v-if="hasAnyCoreFeature(['pos', 'multi_payment', 'sales_history'])" class="px-2">
          <h3 v-if="!userStore.isSidebarCollapsed" class="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Point of Sale
          </h3>
          
          <!-- Main POS (Kasir) -->
          <div v-if="canAccessFeature('pos')" class="px-1">
            <RouterLink to="/pos" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <ShoppingCartIcon class="h-5 w-5 shrink-0 text-success" />
              <span v-if="!userStore.isSidebarCollapsed">Kasir (POS)</span>
              
              <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Kasir (POS)">
              </div>
            </RouterLink>
          </div>
          
          <!-- Sales & Transactions -->
          <div v-if="!userStore.isSidebarCollapsed && hasAnyCoreFeature(['sales_history', 'return_refund', 'multi_payment'])" class="px-1">
            <div class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <ClipboardDocumentListIcon class="h-5 w-5 shrink-0 text-blue-500" />
                <span>Transaksi & Penjualan</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink v-if="canAccessFeature('sales_history')" to="/sales/history" class="btn btn-ghost btn-sm w-full justify-start normal-case">Riwayat Penjualan</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('return_refund')" to="/sales/returns" class="btn btn-ghost btn-sm w-full justify-start normal-case">Return & Refund</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('multi_payment')" to="/sales/payments" class="btn btn-ghost btn-sm w-full justify-start normal-case">Multi Payment</RouterLink> -->
              </div>
            </div>
          </div>
          
          <!-- Payments & Cash Management -->
          <div v-if="!userStore.isSidebarCollapsed && canAccessFeature('cash_drawer')" class="px-1">
            <div class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <BanknotesIcon class="h-5 w-5 shrink-0 text-green-600" />
                <span>Manajemen Kas</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink to="/cash/drawer" class="btn btn-ghost btn-sm w-full justify-start normal-case">Cash Drawer</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('shift_management')" to="/cash/shifts" class="btn btn-ghost btn-sm w-full justify-start normal-case">Manajemen Shift</RouterLink> -->
              </div>
            </div>
          </div>
        </div>

        <!-- 📦 INVENTORY MANAGEMENT -->
        <div v-if="hasAnyCoreFeature(['stock_management', 'product_category', 'inventory_audit'])" class="px-2">
          <h3 v-if="!userStore.isSidebarCollapsed" class="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Inventory
          </h3>
          
          <!-- Products & Categories -->
          <div class="px-1">
            <div v-if="!userStore.isSidebarCollapsed" class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <ArchiveBoxIcon class="h-5 w-5 shrink-0 text-blue-500" />
                <span>Produk & Kategori</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink to="/products" class="btn btn-ghost btn-sm w-full justify-start normal-case">Daftar Produk</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('product_category')" to="/products/categories" class="btn btn-ghost btn-sm w-full justify-start normal-case">Kategori Produk</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('product_variant')" to="/products/variants" class="btn btn-ghost btn-sm w-full justify-start normal-case">Varian Produk</RouterLink> -->
                <!-- <RouterLink to="/products/barcode" class="btn btn-ghost btn-sm w-full justify-start normal-case">Kelola Barcode</RouterLink> -->
              </div>
            </div>
            
            <!-- Collapsed state -->
            <RouterLink v-else to="/products" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <ArchiveBoxIcon class="h-5 w-5 shrink-0 text-blue-500" />
              <div class="tooltip tooltip-right" data-tip="Produk & Kategori"></div>
            </RouterLink>
          </div>

          <!-- Stock Management -->
          <div v-if="canAccessFeature('stock_management')" class="px-1">
            <div v-if="!userStore.isSidebarCollapsed" class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <CubeIcon class="h-5 w-5 shrink-0 text-orange-500" />
                <span>Manajemen Stok</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink to="/inventory/current" class="btn btn-ghost btn-sm w-full justify-start normal-case">Stok Saat Ini</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('stock_adjustment')" to="/inventory/adjustments" class="btn btn-ghost btn-sm w-full justify-start normal-case">Penyesuaian Stok</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('inventory_audit')" to="/inventory/audit" class="btn btn-ghost btn-sm w-full justify-start normal-case">Audit Inventory</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('stock_alert')" to="/inventory/alerts" class="btn btn-ghost btn-sm w-full justify-start normal-case">Peringatan Stok</RouterLink> -->
              </div>
            </div>
            
            <!-- Collapsed state -->
            <RouterLink v-else to="/inventory" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <CubeIcon class="h-5 w-5 shrink-0 text-orange-500" />
              <div class="tooltip tooltip-right" data-tip="Manajemen Stok"></div>
            </RouterLink>
          </div>
        </div>

        <!-- 🛒 PROCUREMENT -->
        <div v-if="hasAnyCoreFeature(['supplier_management', 'purchase_orders'])" class="px-2">
          <h3 v-if="!userStore.isSidebarCollapsed" class="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Procurement
          </h3>
          
          <!-- Suppliers -->
          <div v-if="canAccessFeature('supplier_management')" class="px-1">
            <RouterLink to="/suppliers" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <TruckIcon class="h-5 w-5 shrink-0 text-purple-500" />
              <span v-if="!userStore.isSidebarCollapsed">Supplier</span>
              <div v-if="!canAccessFeature('supplier_management')" class="badge badge-warning badge-sm ml-auto">Soon</div>
              
              <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Supplier">
              </div>
            </RouterLink>
          </div>

          <!-- Purchase Orders -->
          <div v-if="canAccessFeature('purchase_orders')" class="px-1">
            <RouterLink to="/purchase-orders" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <DocumentTextIcon class="h-5 w-5 shrink-0 text-indigo-500" />
              <span v-if="!userStore.isSidebarCollapsed">Purchase Orders</span>
              <div v-if="!canAccessFeature('purchase_orders')" class="badge badge-warning badge-sm ml-auto">Soon</div>
              
              <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Purchase Orders">
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- 👥 CUSTOMER RELATIONSHIP -->
        <div v-if="hasAnyCoreFeature(['customer_data', 'customer_loyalty', 'loyalty_points'])" class="px-2">
          <h3 v-if="!userStore.isSidebarCollapsed" class="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Customer
          </h3>
          
          <!-- Customer Management -->
          <div v-if="canAccessFeature('customer_data')" class="px-1">
            <div v-if="!userStore.isSidebarCollapsed" class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <UserGroupIcon class="h-5 w-5 shrink-0 text-pink-500" />
                <span>Manajemen Pelanggan</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink to="/customers" class="btn btn-ghost btn-sm w-full justify-start normal-case">Daftar Pelanggan</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('customer_segment')" to="/customers/segments" class="btn btn-ghost btn-sm w-full justify-start normal-case">Segmentasi</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('customer_loyalty')" to="/customers/loyalty" class="btn btn-ghost btn-sm w-full justify-start normal-case">Program Loyalitas</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('loyalty_points')" to="/customers/points" class="btn btn-ghost btn-sm w-full justify-start normal-case">Manajemen Poin</RouterLink> -->
              </div>
            </div>
            
            <!-- Collapsed state -->
            <RouterLink v-else to="/customers" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <UserGroupIcon class="h-5 w-5 shrink-0 text-pink-500" />
              <div class="tooltip tooltip-right" data-tip="Manajemen Pelanggan"></div>
            </RouterLink>
          </div>
        </div>

        <!-- 🎁 MARKETING & PROMOTIONS -->
        <div v-if="hasAnyCoreFeature(['promo_management', 'discount_per_item', 'discount_per_trx'])" class="px-2">
          <h3 v-if="!userStore.isSidebarCollapsed" class="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Marketing
          </h3>
          
          <!-- Promotions & Discounts -->
          <div v-if="canAccessFeature('promo_management')" class="px-1">
            <div v-if="!userStore.isSidebarCollapsed" class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <TagIcon class="h-5 w-5 shrink-0 text-red-500" />
                <span>Promosi & Diskon</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink to="/promotions" class="btn btn-ghost btn-sm w-full justify-start normal-case">Daftar Promosi</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('discount_per_item')" to="/promotions/item-discount" class="btn btn-ghost btn-sm w-full justify-start normal-case">Diskon per Item</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('discount_per_trx')" to="/promotions/transaction-discount" class="btn btn-ghost btn-sm w-full justify-start normal-case">Diskon per Transaksi</RouterLink> -->
              </div>
            </div>
            
            <!-- Collapsed state -->
            <RouterLink v-else to="/promotions" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <TagIcon class="h-5 w-5 shrink-0 text-red-500" />
              <div class="tooltip tooltip-right" data-tip="Promosi & Diskon"></div>
            </RouterLink>
          </div>
        </div>

        <!-- 💰 FINANCE & ACCOUNTING -->
        <div v-if="hasAnyCoreFeature(['expenses', 'kategori-biaya', 'sales_target', 'bep'])" class="px-2">
          <h3 v-if="!userStore.isSidebarCollapsed" class="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Finance
          </h3>
          
          <!-- Expenses -->
          <div v-if="canAccessFeature('expenses')" class="px-1">
            <div v-if="!userStore.isSidebarCollapsed" class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <CurrencyDollarIcon class="h-5 w-5 shrink-0 text-emerald-500" />
                <span>Pengeluaran</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink to="/expenses" class="btn btn-ghost btn-sm w-full justify-start normal-case">Daftar Biaya</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('kategori-biaya')" to="/expense-categories" class="btn btn-ghost btn-sm w-full justify-start normal-case">Kategori Biaya</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('recurring_expenses')" to="/expenses/recurring" class="btn btn-ghost btn-sm w-full justify-start normal-case">Biaya Berulang</RouterLink> -->
              </div>
            </div>
            
            <!-- Collapsed state -->
            <RouterLink v-else to="/expenses" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <CurrencyDollarIcon class="h-5 w-5 shrink-0 text-emerald-500" />
              <div class="tooltip tooltip-right" data-tip="Pengeluaran"></div>
            </RouterLink>
          </div>

          <!-- Business Targets & Analysis -->
          <div v-if="canAccessFeature('sales_target')" class="px-1">
            <RouterLink to="/targets" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <ChartBarIcon class="h-5 w-5 shrink-0 text-yellow-500" />
              <span v-if="!userStore.isSidebarCollapsed">Target Bisnis</span>
              <div v-if="!canAccessFeature('sales_target')" class="badge badge-warning badge-sm ml-auto">Soon</div>
              
              <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Target Bisnis">
              </div>
            </RouterLink>
          </div>

          <!-- BEP Analysis -->
          <div v-if="canAccessFeature('bep')" class="px-1">
            <RouterLink to="/bep-analysis" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <CalculatorIcon class="h-5 w-5 shrink-0 text-purple-600" />
              <span v-if="!userStore.isSidebarCollapsed">Analisis BEP</span>
              <div v-if="!canAccessFeature('bep')" class="badge badge-warning badge-sm ml-auto">Soon</div>
              
              <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Analisis BEP">
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- 📊 ANALYTICS & REPORTS -->
        <div v-if="canAccessFeature('reports') && organizationStore.userRole === 'owner'" class="px-2">
          <h3 v-if="!userStore.isSidebarCollapsed" class="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Analytics
          </h3>
          
          <!-- Reports -->
          <div class="px-1">
            <div v-if="!userStore.isSidebarCollapsed" class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <ChartPieIcon class="h-5 w-5 shrink-0 text-violet-500" />
                <span>Laporan & Analytics</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink to="/reports/sales" class="btn btn-ghost btn-sm w-full justify-start normal-case">Laporan Penjualan</RouterLink> -->
                <!-- <RouterLink to="/reports/inventory" class="btn btn-ghost btn-sm w-full justify-start normal-case">Laporan Inventory</RouterLink> -->
                <!-- <RouterLink to="/reports/financial" class="btn btn-ghost btn-sm w-full justify-start normal-case">Laporan Keuangan</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('outlet_report')" to="/reports/outlets" class="btn btn-ghost btn-sm w-full justify-start normal-case">Laporan per Outlet</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('export_data')" to="/reports/export" class="btn btn-ghost btn-sm w-full justify-start normal-case">Export Data</RouterLink> -->
              </div>
            </div>
            
            <!-- Collapsed state -->
            <RouterLink v-else to="/reports" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <ChartPieIcon class="h-5 w-5 shrink-0 text-violet-500" />
              <div class="tooltip tooltip-right" data-tip="Laporan & Analytics"></div>
            </RouterLink>
          </div>
        </div>

        <!-- ⚙️ SERVICE & TAX CONFIGURATION -->
        <div v-if="organizationStore.userRole === 'owner' && hasAnyCoreFeature(['service_charge', 'tax_ppn', 'custom_receipt'])" class="px-2">
          <h3 v-if="!userStore.isSidebarCollapsed" class="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Configuration
          </h3>
          
          <!-- Service & Tax Settings -->
          <div class="px-1">
            <div v-if="!userStore.isSidebarCollapsed" class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <AdjustmentsHorizontalIcon class="h-5 w-5 shrink-0 text-orange-600" />
                <span>Layanan & Pajak</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink v-if="canAccessFeature('service_charge')" to="/settings/service-charge" class="btn btn-ghost btn-sm w-full justify-start normal-case">Biaya Layanan</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('tax_ppn')" to="/settings/tax" class="btn btn-ghost btn-sm w-full justify-start normal-case">Pengaturan Pajak PPN</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('custom_receipt')" to="/settings/receipt" class="btn btn-ghost btn-sm w-full justify-start normal-case">Custom Receipt</RouterLink> -->
              </div>
            </div>
            
            <!-- Collapsed state -->
            <RouterLink v-else to="/settings/service-tax" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <AdjustmentsHorizontalIcon class="h-5 w-5 shrink-0 text-orange-600" />
              <div class="tooltip tooltip-right" data-tip="Layanan & Pajak"></div>
            </RouterLink>
          </div>
        </div>

        <!-- 🔧 SYSTEM ADMINISTRATION -->
        <div v-if="organizationStore.userRole === 'owner' && hasAnyCoreFeature(['multi_user', 'api_access', 'cloud_backup'])" class="px-2">
          <h3 v-if="!userStore.isSidebarCollapsed" class="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            System
          </h3>
          
          <!-- User Management -->
          <div v-if="canAccessFeature('multi_user')" class="px-1">
            <RouterLink to="/admin/users" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <UserPlusIcon class="h-5 w-5 shrink-0 text-indigo-600" />
              <span v-if="!userStore.isSidebarCollapsed">Manajemen User</span>
              <div v-if="!canAccessFeature('multi_user')" class="badge badge-warning badge-sm ml-auto">Soon</div>
              
              <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Manajemen User">
              </div>
            </RouterLink>
          </div>

          <!-- API Access -->
          <div v-if="canAccessFeature('api_access')" class="px-1">
            <RouterLink to="/admin/api" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <CodeBracketIcon class="h-5 w-5 shrink-0 text-green-600" />
              <span v-if="!userStore.isSidebarCollapsed">API Access</span>
              <div v-if="!canAccessFeature('api_access')" class="badge badge-warning badge-sm ml-auto">Soon</div>
              
              <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="API Access">
              </div>
            </RouterLink>
          </div>

          <!-- Cloud Backup -->
          <div v-if="canAccessFeature('cloud_backup')" class="px-1">
            <RouterLink to="/admin/backup" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <CloudArrowUpIcon class="h-5 w-5 shrink-0 text-sky-600" />
              <span v-if="!userStore.isSidebarCollapsed">Cloud Backup</span>
              <div v-if="!canAccessFeature('cloud_backup')" class="badge badge-warning badge-sm ml-auto">Soon</div>
              
              <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Cloud Backup">
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- 👨‍💼 OPERATIONS & HR -->
        <div v-if="organizationStore.userRole === 'owner' && hasAnyCoreFeature(['employee_management', 'employee_attendance', 'role_management'])" class="px-2">
          <h3 v-if="!userStore.isSidebarCollapsed" class="px-3 py-2 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
            Operations
          </h3>
          
          <!-- Employee Management -->
          <div v-if="canAccessFeature('employee_management')" class="px-1">
            <div v-if="!userStore.isSidebarCollapsed" class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <UsersIcon class="h-5 w-5 shrink-0 text-cyan-500" />
                <span>Manajemen Pegawai</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink to="/employees" class="btn btn-ghost btn-sm w-full justify-start normal-case">Daftar Pegawai</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('role_management')" to="/employees/roles" class="btn btn-ghost btn-sm w-full justify-start normal-case">Role & Permission</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('shift_management')" to="/employees/shifts" class="btn btn-ghost btn-sm w-full justify-start normal-case">Manajemen Shift</RouterLink> -->
              </div>
            </div>
            
            <!-- Collapsed state -->
            <RouterLink v-else to="/employees" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <UsersIcon class="h-5 w-5 shrink-0 text-cyan-500" />
              <div class="tooltip tooltip-right" data-tip="Manajemen Pegawai"></div>
            </RouterLink>
          </div>

          <!-- Attendance -->
          <div v-if="canAccessFeature('employee_attendance')" class="px-1">
            <RouterLink to="/attendance" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <ClockIcon class="h-5 w-5 shrink-0 text-teal-500" />
              <span v-if="!userStore.isSidebarCollapsed">Absensi</span>
              
              <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Absensi">
              </div>
            </RouterLink>
          </div>

          <!-- Multi Outlet Management -->
          <div v-if="canAccessFeature('multi_outlet')" class="px-1">
            <div v-if="!userStore.isSidebarCollapsed" class="collapse collapse-arrow">
              <input type="checkbox" />
              <summary class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case collapse-title">
                <BuildingStorefrontIcon class="h-5 w-5 shrink-0 text-blue-600" />
                <span>Multi Outlet</span>
              </summary>
              <div class="collapse-content ml-8 space-y-1">
                <!-- <RouterLink to="/outlets" class="btn btn-ghost btn-sm w-full justify-start normal-case">Daftar Outlet</RouterLink> -->
                <!-- <RouterLink v-if="canAccessFeature('outlet_switching')" to="/outlets/switch" class="btn btn-ghost btn-sm w-full justify-start normal-case">Switching Outlet</RouterLink> -->
              </div>
            </div>
            
            <!-- Collapsed state -->
            <RouterLink v-else to="/outlets" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group">
              <BuildingStorefrontIcon class="h-5 w-5 shrink-0 text-blue-600" />
              <div class="tooltip tooltip-right" data-tip="Multi Outlet"></div>
            </RouterLink>
          </div>
        </div>

      </nav>
    </div>
    
    <!-- Bottom Actions -->
    <div class="sticky bottom-0 bg-base-100 border-t border-base-300 p-3">
      <div class="space-y-2">
        
        <!-- Settings (Owner only) -->
        <RouterLink 
          v-if="organizationStore.userRole === 'owner'" 
          to="/settings" 
          class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group"
        >
          <Cog6ToothIcon class="h-5 w-5 shrink-0 text-gray-500" />
          <span v-if="!userStore.isSidebarCollapsed">Pengaturan</span>
          
          <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Pengaturan">
          </div>
        </RouterLink>
        
        <!-- Logout -->
        <button @click="handleLogout" class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group text-error hover:bg-error/10">
          <ArrowLeftOnRectangleIcon class="h-5 w-5 shrink-0" />
          <span v-if="!userStore.isSidebarCollapsed">Logout</span>
          
          <div v-if="userStore.isSidebarCollapsed" class="tooltip tooltip-right" data-tip="Logout">
          </div>
        </button>
        
        <!-- Collapse Toggle (Bottom) -->
        <button 
          v-if="userStore.isSidebarCollapsed"
          @click="userStore.toggleSidebar" 
          class="btn btn-ghost w-full justify-start gap-3 h-12 normal-case group"
        >
          <ChevronDoubleRightIcon class="h-5 w-5 shrink-0" />
          
          <div class="tooltip tooltip-right" data-tip="Expand Menu">
          </div>
        </button>
        
      </div>
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
  CurrencyDollarIcon,
  ChartPieIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  TruckIcon,
  DocumentTextIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  CalculatorIcon,
  BuildingStorefrontIcon,
  AdjustmentsHorizontalIcon,
  UserPlusIcon,
  CodeBracketIcon,
  CloudArrowUpIcon
} from '@heroicons/vue/24/outline'

// Initialize
const router = useRouter()
const userStore = useUserStore()
const organizationStore = useOrganizationStore()

// Feature access control functions
const canAccessFeature = (featureId) => {
  // Check if organization has this feature in their package
  if (!organizationStore.hasFeature(featureId)) {
    return false
  }
  
  // Check role-based access
  if (organizationStore.userRole === 'owner') {
    return true
  }
  
  // For staff, check if owner has granted access to this feature
  // TODO: Implement staff permission checking from organizationStore.staffPermissions
  // return organizationStore.staffPermissions?.[featureId] ?? false
  
  // For now, allow basic features for staff
  const staffAllowedFeatures = [
    'pos', 'customer_data', 'expenses', 'employee_attendance', 
    'stock_management', 'sales_history'
  ]
  return staffAllowedFeatures.includes(featureId)
}

const hasAnyCoreFeature = (features) => {
  return features.some(feature => canAccessFeature(feature))
}

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