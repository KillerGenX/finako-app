-- =====================================================
-- FINAKO POS: Package Features Setup (Minimal Version)
-- =====================================================
-- This version only creates packages and package_features data
-- WITHOUT helper functions to avoid any conflicts
-- =====================================================

-- =====================================================
-- INSERT PACKAGES DATA
-- =====================================================

-- Insert the 3 main packages
INSERT INTO packages (id, name, price, user_limit, features) VALUES
('basic', 'Basic Plan', 49000, 2, '{"description": "Essential POS untuk UMKM pemula", "monthly_price": 49000, "feature_count": 14, "max_outlets": 1, "max_users": 2}'),
('pro', 'Pro Plan', 99000, 10, '{"description": "Complete POS untuk bisnis yang berkembang", "monthly_price": 99000, "feature_count": 26, "max_outlets": 5, "max_users": 10}'),
('enterprise', 'Enterprise Plan', 249000, 999, '{"description": "Advanced business intelligence untuk enterprise", "monthly_price": 249000, "feature_count": 41, "max_outlets": 10, "max_users": "unlimited"}')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    user_limit = EXCLUDED.user_limit,
    features = EXCLUDED.features;

-- =====================================================
-- INSERT FEATURES DATA (if not exists)
-- =====================================================

-- Core Business Features
INSERT INTO features (id, name, description, category) VALUES
-- Basic Plan Features (14 features - includes multi_outlet & multi_user for limits)
('pos', 'Kasir (Point of Sale)', 'Sistem kasir utama untuk transaksi penjualan', 'pos'),
('customer_data', 'Data Pelanggan', 'Manajemen data pelanggan basic', 'customer'),
('expenses', 'Biaya Operasional', 'Pencatatan pengeluaran bisnis', 'finance'),
('kategori-biaya', 'Kategori Biaya', 'Kategorisasi pengeluaran bisnis', 'finance'),
('stock_management', 'Manajemen Stok', 'Pengelolaan inventory basic', 'inventory'),
('product_category', 'Product Category', 'Kategorisasi produk', 'inventory'),
('employee_attendance', 'Absensi Pegawai', 'Pencatatan kehadiran karyawan basic', 'hr'),
('multi_payment', 'Multi-Metode Bayar', 'Pembayaran dengan berbagai metode', 'pos'),
('service_charge', 'Biaya Layanan', 'Penambahan biaya layanan', 'pos'),
('tax_ppn', 'Pajak PPN', 'Perhitungan pajak otomatis', 'finance'),
('custom_receipt', 'Custom Receipt', 'Kustomisasi struk pembayaran', 'pos'),
('sales_history', 'Riwayat Penjualan', 'Histori transaksi penjualan', 'reports'),
('multi_outlet', 'Multi Outlet', 'Manajemen multi cabang (dengan limit per paket)', 'operations'),
('multi_user', 'Multi User', 'Manajemen user (dengan limit per paket)', 'hr'),

-- Pro Plan Additional Features (12 additional features)
('discount_per_item', 'Diskon per Item', 'Pemberian diskon per produk', 'marketing'),
('discount_per_trx', 'Diskon per Transaksi', 'Diskon untuk keseluruhan transaksi', 'marketing'),
('promo_management', 'Promo Management', 'Manajemen kampanye promosi', 'marketing'),
('customer_loyalty', 'Customer Loyalty', 'Program loyalitas pelanggan basic', 'customer'),
('stock_adjustment', 'Penyesuaian Stok', 'Adjustment inventory manual', 'inventory'),
('stock_alert', 'Stock Alert', 'Notifikasi stock menipis', 'inventory'),
('inventory_audit', 'Inventory Audit', 'Audit trail pergerakan stok', 'inventory'),
('product_variant', 'Product Variant', 'Variasi produk (ukuran, warna, dll)', 'inventory'),
('return_refund', 'Return & Refund', 'Pengembalian barang dan refund', 'pos'),
('employee_management', 'Kelola Pegawai', 'Manajemen karyawan lengkap', 'hr'),
('shift_management', 'Manajemen Shift', 'Penjadwalan shift kerja', 'hr'),
('cash_drawer', 'Cash Drawer Management', 'Pengelolaan kas harian', 'finance'),
('supplier_management', 'Manajemen Supplier', 'Data supplier dan vendor', 'procurement'),
('purchase_orders', 'Purchase Orders', 'Workflow pembelian barang', 'procurement'),

-- Enterprise Plan Additional Features (13 additional features)
('advanced_dashboard', 'Advanced Dashboard', 'Dashboard dengan metrik advanced', 'analytics'),
('reports', 'Laporan Lanjutan', 'Reporting komprehensif', 'reports'),
('bep', 'Analisis BEP', 'Break-even point analysis', 'analytics'),
('sales_target', 'Sales Target', 'Tracking target dan KPI', 'analytics'),
('export_data', 'Export Data', 'Export data ke Excel/CSV', 'reports'),
('outlet_report', 'Outlet Report', 'Laporan per cabang', 'reports'),
('outlet_switching', 'Outlet Switching', 'Switching antar cabang', 'operations'),
('role_management', 'Role Management', 'Permission granular', 'hr'),
('loyalty_points', 'Program Poin Loyalitas', 'Sistem poin loyalty advanced', 'customer'),
('customer_segment', 'Segmentasi Pelanggan', 'Analisis segmen customer', 'customer'),
('recurring_expenses', 'Biaya Berulang', 'Manajemen biaya recurring', 'finance'),
('api_access', 'API Access', 'Akses API untuk integrasi', 'integration'),
('cloud_backup', 'Cloud Backup', 'Backup otomatis ke cloud', 'system')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- =====================================================
-- INSERT PACKAGE_FEATURES MAPPING
-- =====================================================

-- BASIC PLAN FEATURES (14 features - includes multi_outlet & multi_user)
INSERT INTO package_features (package_id, feature_id, is_enabled, max_value) VALUES
('basic', 'pos', true, NULL),
('basic', 'customer_data', true, 1000),
('basic', 'expenses', true, NULL),
('basic', 'kategori-biaya', true, 10),
('basic', 'stock_management', true, 500),
('basic', 'product_category', true, 10),
('basic', 'employee_attendance', true, 2),
('basic', 'multi_payment', true, NULL),
('basic', 'service_charge', true, NULL),
('basic', 'tax_ppn', true, NULL),
('basic', 'custom_receipt', true, NULL),
('basic', 'sales_history', true, 365),
('basic', 'multi_outlet', true, 1),
('basic', 'multi_user', true, 2),

-- PRO PLAN FEATURES (All Basic + 12 additional = 26 total)
('pro', 'pos', true, NULL),
('pro', 'customer_data', true, 5000),
('pro', 'expenses', true, NULL),
('pro', 'kategori-biaya', true, 25),
('pro', 'stock_management', true, 2000),
('pro', 'product_category', true, 25),
('pro', 'employee_attendance', true, 10),
('pro', 'multi_payment', true, NULL),
('pro', 'service_charge', true, NULL),
('pro', 'tax_ppn', true, NULL),
('pro', 'custom_receipt', true, NULL),
('pro', 'sales_history', true, 730),
('pro', 'multi_outlet', true, 5),
('pro', 'multi_user', true, 10),
('pro', 'discount_per_item', true, NULL),
('pro', 'discount_per_trx', true, NULL),
('pro', 'promo_management', true, 50),
('pro', 'customer_loyalty', true, NULL),
('pro', 'stock_adjustment', true, NULL),
('pro', 'stock_alert', true, NULL),
('pro', 'inventory_audit', true, NULL),
('pro', 'product_variant', true, 10),
('pro', 'return_refund', true, NULL),
('pro', 'employee_management', true, 10),
('pro', 'shift_management', true, NULL),
('pro', 'cash_drawer', true, NULL),
('pro', 'supplier_management', true, 100),
('pro', 'purchase_orders', true, NULL),

-- ENTERPRISE PLAN FEATURES (All Pro + 13 additional = 39 total)
('enterprise', 'pos', true, NULL),
('enterprise', 'customer_data', true, NULL),
('enterprise', 'expenses', true, NULL),
('enterprise', 'kategori-biaya', true, NULL),
('enterprise', 'stock_management', true, NULL),
('enterprise', 'product_category', true, NULL),
('enterprise', 'employee_attendance', true, NULL),
('enterprise', 'multi_payment', true, NULL),
('enterprise', 'service_charge', true, NULL),
('enterprise', 'tax_ppn', true, NULL),
('enterprise', 'custom_receipt', true, NULL),
('enterprise', 'sales_history', true, NULL),
('enterprise', 'multi_outlet', true, 10),
('enterprise', 'multi_user', true, NULL),
('enterprise', 'discount_per_item', true, NULL),
('enterprise', 'discount_per_trx', true, NULL),
('enterprise', 'promo_management', true, NULL),
('enterprise', 'customer_loyalty', true, NULL),
('enterprise', 'stock_adjustment', true, NULL),
('enterprise', 'stock_alert', true, NULL),
('enterprise', 'inventory_audit', true, NULL),
('enterprise', 'product_variant', true, NULL),
('enterprise', 'return_refund', true, NULL),
('enterprise', 'employee_management', true, NULL),
('enterprise', 'shift_management', true, NULL),
('enterprise', 'cash_drawer', true, NULL),
('enterprise', 'supplier_management', true, NULL),
('enterprise', 'purchase_orders', true, NULL),
('enterprise', 'advanced_dashboard', true, NULL),
('enterprise', 'reports', true, NULL),
('enterprise', 'bep', true, NULL),
('enterprise', 'sales_target', true, NULL),
('enterprise', 'export_data', true, NULL),
('enterprise', 'outlet_report', true, NULL),
('enterprise', 'outlet_switching', true, NULL),
('enterprise', 'role_management', true, NULL),
('enterprise', 'loyalty_points', true, NULL),
('enterprise', 'customer_segment', true, NULL),
('enterprise', 'recurring_expenses', true, NULL),
('enterprise', 'api_access', true, NULL),
('enterprise', 'cloud_backup', true, NULL)
ON CONFLICT (package_id, feature_id) DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    max_value = EXCLUDED.max_value;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show all packages with their feature count
SELECT 
    p.id,
    p.name,
    p.price,
    p.user_limit,
    p.features,
    COUNT(pf.feature_id) as actual_feature_count
FROM packages p
LEFT JOIN package_features pf ON p.id = pf.package_id AND pf.is_enabled = true
GROUP BY p.id, p.name, p.price, p.user_limit, p.features
ORDER BY p.price;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Package Features setup completed successfully! (Minimal Version)';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Packages created:';
    RAISE NOTICE '   • basic (14 features) - Rp 49,000/month - Max 1 outlet, 2 users';
    RAISE NOTICE '   • pro (26 features) - Rp 99,000/month - Max 5 outlets, 10 users';
    RAISE NOTICE '   • enterprise (39 features) - Rp 249,000/month - Max 10 outlets, unlimited users';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Helper functions NOT created to avoid conflicts';
    RAISE NOTICE '💡 You can create them later if needed';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for frontend testing!';
END $$;
