-- =====================================================
-- FINAKO POS: Package Features Setup Script
-- =====================================================
-- This script creates packages and package_features data
-- based on the 3-tier SaaS pricing strategy
-- =====================================================

-- First, ensure features table exists and has all required features
-- (This assumes features table structure matches your existing schema)

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
('basic', 'customer_data', true, 1000),  -- Max 1000 customers
('basic', 'expenses', true, NULL),
('basic', 'kategori-biaya', true, 10),   -- Max 10 expense categories
('basic', 'stock_management', true, 500), -- Max 500 products
('basic', 'product_category', true, 10),  -- Max 10 product categories
('basic', 'employee_attendance', true, 2), -- Max 2 employees (owner + 1 staff)
('basic', 'multi_payment', true, NULL),
('basic', 'service_charge', true, NULL),
('basic', 'tax_ppn', true, NULL),
('basic', 'custom_receipt', true, NULL),
('basic', 'sales_history', true, 365),   -- 1 year history
('basic', 'multi_outlet', true, 1),      -- Max 1 outlet
('basic', 'multi_user', true, 2),        -- Max 2 users (owner + 1 staff)

-- PRO PLAN FEATURES (All Basic + 12 additional = 26 total)
('pro', 'pos', true, NULL),
('pro', 'customer_data', true, 5000),    -- Max 5000 customers
('pro', 'expenses', true, NULL),
('pro', 'kategori-biaya', true, 25),     -- Max 25 expense categories
('pro', 'stock_management', true, 2000), -- Max 2000 products
('pro', 'product_category', true, 25),   -- Max 25 product categories
('pro', 'employee_attendance', true, 10), -- Max 10 employees
('pro', 'multi_payment', true, NULL),
('pro', 'service_charge', true, NULL),
('pro', 'tax_ppn', true, NULL),
('pro', 'custom_receipt', true, NULL),
('pro', 'sales_history', true, 730),     -- 2 years history
('pro', 'multi_outlet', true, 5),        -- Max 5 outlets
('pro', 'multi_user', true, 10),         -- Max 10 users
-- Pro additional features (12 new features)
('pro', 'discount_per_item', true, NULL),
('pro', 'discount_per_trx', true, NULL),
('pro', 'promo_management', true, 50),   -- Max 50 active promos
('pro', 'customer_loyalty', true, NULL),
('pro', 'stock_adjustment', true, NULL),
('pro', 'stock_alert', true, NULL),
('pro', 'inventory_audit', true, NULL),
('pro', 'product_variant', true, 10),    -- Max 10 variants per product
('pro', 'return_refund', true, NULL),
('pro', 'employee_management', true, 10), -- Max 10 employees
('pro', 'shift_management', true, NULL),
('pro', 'cash_drawer', true, NULL),
('pro', 'supplier_management', true, 100), -- Max 100 suppliers
('pro', 'purchase_orders', true, NULL),

-- ENTERPRISE PLAN FEATURES (All Pro + 15 additional = 41 total)
('enterprise', 'pos', true, NULL),
('enterprise', 'customer_data', true, NULL),    -- Unlimited customers
('enterprise', 'expenses', true, NULL),
('enterprise', 'kategori-biaya', true, NULL),   -- Unlimited categories
('enterprise', 'stock_management', true, NULL), -- Unlimited products
('enterprise', 'product_category', true, NULL), -- Unlimited categories
('enterprise', 'employee_attendance', true, NULL), -- Unlimited employees
('enterprise', 'multi_payment', true, NULL),
('enterprise', 'service_charge', true, NULL),
('enterprise', 'tax_ppn', true, NULL),
('enterprise', 'custom_receipt', true, NULL),
('enterprise', 'sales_history', true, NULL),    -- Unlimited history
('enterprise', 'multi_outlet', true, 10),       -- Max 10 outlets
('enterprise', 'multi_user', true, NULL),       -- Unlimited users
-- Pro features
('enterprise', 'discount_per_item', true, NULL),
('enterprise', 'discount_per_trx', true, NULL),
('enterprise', 'promo_management', true, NULL), -- Unlimited promos
('enterprise', 'customer_loyalty', true, NULL),
('enterprise', 'stock_adjustment', true, NULL),
('enterprise', 'stock_alert', true, NULL),
('enterprise', 'inventory_audit', true, NULL),
('enterprise', 'product_variant', true, NULL),  -- Unlimited variants
('enterprise', 'return_refund', true, NULL),
('enterprise', 'employee_management', true, NULL), -- Unlimited employees
('enterprise', 'shift_management', true, NULL),
('enterprise', 'cash_drawer', true, NULL),
('enterprise', 'supplier_management', true, NULL), -- Unlimited suppliers
('enterprise', 'purchase_orders', true, NULL),
-- Enterprise additional features (15 new features)
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
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check if organization has specific feature
CREATE OR REPLACE FUNCTION organization_has_feature(
    org_id UUID,
    feature_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    has_feature BOOLEAN := FALSE;
    org_package_id TEXT;
BEGIN
    -- Get organization's package_id
    SELECT package_id INTO org_package_id
    FROM organizations 
    WHERE id = org_id AND status = 'active';
    
    -- If no package assigned, return false
    IF org_package_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if feature exists in organization's package
    SELECT is_enabled INTO has_feature
    FROM package_features pf
    WHERE pf.package_id = org_package_id 
    AND pf.feature_id = organization_has_feature.feature_id;
    
    RETURN COALESCE(has_feature, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get all features for organization
CREATE OR REPLACE FUNCTION get_organization_features(org_id UUID)
RETURNS TABLE(
    feature_id TEXT,
    feature_name TEXT,
    feature_description TEXT,
    feature_category TEXT,
    is_enabled BOOLEAN,
    max_value INTEGER
) AS $$
DECLARE
    org_package_id TEXT;
BEGIN
    -- Get organization's package_id
    SELECT package_id INTO org_package_id
    FROM organizations 
    WHERE id = org_id AND status = 'active';
    
    -- If no package assigned, return empty
    IF org_package_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.description,
        f.category,
        pf.is_enabled,
        pf.max_value
    FROM package_features pf
    JOIN features f ON f.id = pf.feature_id
    WHERE pf.package_id = org_package_id
    AND pf.is_enabled = true
    ORDER BY f.category, f.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get package info with feature count
CREATE OR REPLACE FUNCTION get_package_info(pkg_id TEXT)
RETURNS TABLE(
    package_id TEXT,
    package_name TEXT,
    package_price NUMERIC,
    user_limit INTEGER,
    feature_count BIGINT,
    features_list TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.price,
        p.user_limit,
        COUNT(pf.feature_id) as feature_count,
        ARRAY_AGG(f.name ORDER BY f.category, f.name) as features_list
    FROM packages p
    LEFT JOIN package_features pf ON p.id = pf.package_id AND pf.is_enabled = true
    LEFT JOIN features f ON pf.feature_id = f.id
    WHERE p.id = pkg_id
    GROUP BY p.id, p.name, p.price, p.user_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE VIEWS FOR EASY ACCESS
-- =====================================================

-- View for organization features
CREATE OR REPLACE VIEW organization_features_view AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.package_id,
    p.name as package_name,
    p.price as package_price,
    f.id as feature_id,
    f.name as feature_name,
    f.description as feature_description,
    f.category as feature_category,
    pf.is_enabled,
    pf.max_value
FROM organizations o
JOIN packages p ON o.package_id = p.id
JOIN package_features pf ON p.id = pf.package_id
JOIN features f ON pf.feature_id = f.id
WHERE o.status = 'active' AND pf.is_enabled = true;

-- Create RLS policies (adjust according to your RLS setup)
-- This is a template - adjust according to your existing RLS policies
/*
ALTER TABLE package_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for package_features (adjust as needed)
CREATE POLICY "Users can view package features" ON package_features
    FOR SELECT USING (true);  -- Adjust this policy according to your needs
*/

-- =====================================================
-- SAMPLE USAGE AND VERIFICATION
-- =====================================================

-- Show all packages with their feature count
SELECT 
    p.id,
    p.name,
    p.price,
    p.user_limit,
    COUNT(pf.feature_id) as feature_count
FROM packages p
LEFT JOIN package_features pf ON p.id = pf.package_id AND pf.is_enabled = true
GROUP BY p.id, p.name, p.price, p.user_limit
ORDER BY p.price;

-- Show features by category for each package
SELECT 
    p.name as package_name,
    f.category,
    COUNT(*) as features_in_category
FROM packages p
JOIN package_features pf ON p.id = pf.package_id AND pf.is_enabled = true
JOIN features f ON pf.feature_id = f.id
GROUP BY p.name, f.category
ORDER BY p.name, f.category;

-- Test helper functions (uncomment to test with actual organization IDs)
/*
-- Test organization_has_feature function
SELECT organization_has_feature('[org-uuid-here]', 'pos') as has_pos;
SELECT organization_has_feature('[org-uuid-here]', 'multi_outlet') as has_multi_outlet;

-- Test get_organization_features function
SELECT * FROM get_organization_features('[org-uuid-here]');

-- Test get_package_info function
SELECT * FROM get_package_info('basic');
SELECT * FROM get_package_info('pro');
SELECT * FROM get_package_info('enterprise');
*/

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Package Features setup completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Packages created:';
    RAISE NOTICE '   • basic (14 features) - Rp 49,000/month - Max 1 outlet, 2 users';
    RAISE NOTICE '   • pro (26 features) - Rp 99,000/month - Max 5 outlets, 10 users';
    RAISE NOTICE '   • enterprise (41 features) - Rp 249,000/month - Max 10 outlets, unlimited users';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Helper functions created:';
    RAISE NOTICE '   • organization_has_feature(org_id, feature_id)';
    RAISE NOTICE '   • get_organization_features(org_id)';
    RAISE NOTICE '   • get_package_info(package_id)';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Views created:';
    RAISE NOTICE '   • organization_features_view';
    RAISE NOTICE '';
    RAISE NOTICE '� Key Features with Limits:';
    RAISE NOTICE '   • multi_outlet: Basic(1), Pro(5), Enterprise(10)';
    RAISE NOTICE '   • multi_user: Basic(2), Pro(10), Enterprise(unlimited)';
    RAISE NOTICE '   • customer_data: Basic(1000), Pro(5000), Enterprise(unlimited)';
    RAISE NOTICE '   • stock_management: Basic(500), Pro(2000), Enterprise(unlimited)';
    RAISE NOTICE '';
    RAISE NOTICE '�🚀 Ready for backend integration!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Next steps:';
    RAISE NOTICE '   1. Update existing organizations with package_id';
    RAISE NOTICE '   2. Implement feature checking in backend APIs';
    RAISE NOTICE '   3. Update frontend to use organization_has_feature()';
    RAISE NOTICE '   4. Enforce max_value limits in business logic';
END $$;
