-- =====================================================
-- FINAKO POS: Update Existing Organizations Script
-- =====================================================
-- This script assigns default packages to existing organizations
-- and provides migration utilities
-- =====================================================

-- =====================================================
-- UPDATE EXISTING ORGANIZATIONS WITH DEFAULT PACKAGES
-- =====================================================

-- Set default package for existing organizations (Basic plan for trial)
UPDATE organizations 
SET package_id = 'basic'
WHERE package_id IS NULL OR package_id = '';

-- =====================================================
-- MIGRATION UTILITIES
-- =====================================================

-- Function to migrate organization to specific package
CREATE OR REPLACE FUNCTION migrate_organization_package(
    org_id UUID,
    new_package_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    package_exists BOOLEAN := FALSE;
BEGIN
    -- Check if package exists
    SELECT EXISTS(SELECT 1 FROM packages WHERE id = new_package_id) INTO package_exists;
    
    IF NOT package_exists THEN
        RAISE EXCEPTION 'Package % does not exist', new_package_id;
        RETURN FALSE;
    END IF;
    
    -- Update organization package
    UPDATE organizations 
    SET package_id = new_package_id
    WHERE id = org_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk migrate organizations
CREATE OR REPLACE FUNCTION bulk_migrate_organizations(
    target_package_id TEXT,
    organization_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    package_exists BOOLEAN := FALSE;
BEGIN
    -- Check if package exists
    SELECT EXISTS(SELECT 1 FROM packages WHERE id = target_package_id) INTO package_exists;
    
    IF NOT package_exists THEN
        RAISE EXCEPTION 'Package % does not exist', target_package_id;
        RETURN 0;
    END IF;
    
    -- Update all organizations if no specific IDs provided
    IF organization_ids IS NULL THEN
        UPDATE organizations 
        SET package_id = target_package_id
        WHERE status = 'active';
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    ELSE
        -- Update specific organizations
        UPDATE organizations 
        SET package_id = target_package_id
        WHERE id = ANY(organization_ids) AND status = 'active';
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    END IF;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show organizations with their package assignment
SELECT 
    o.id,
    o.name,
    o.package_id,
    p.name as package_name,
    p.price as monthly_price,
    o.status,
    COUNT(pf.feature_id) as available_features
FROM organizations o
LEFT JOIN packages p ON o.package_id = p.id
LEFT JOIN package_features pf ON p.id = pf.package_id AND pf.is_enabled = true
GROUP BY o.id, o.name, o.package_id, p.name, p.price, o.status
ORDER BY o.name;

-- Show organizations without package assignment (should be empty after migration)
SELECT id, name, package_id, status
FROM organizations 
WHERE package_id IS NULL OR package_id = ''
ORDER BY name;

-- Show feature distribution across organizations
SELECT 
    p.name as package_name,
    COUNT(o.id) as organization_count,
    COUNT(pf.feature_id) as features_per_package
FROM packages p
LEFT JOIN organizations o ON p.id = o.package_id AND o.status = 'active'
LEFT JOIN package_features pf ON p.id = pf.package_id AND pf.is_enabled = true
GROUP BY p.id, p.name, p.price
ORDER BY p.price;

-- =====================================================
-- SAMPLE MIGRATION COMMANDS
-- =====================================================

-- Examples of how to use migration functions:

-- Migrate single organization to Pro plan
-- SELECT migrate_organization_package('[org-uuid-here]', 'pro');

-- Migrate specific organizations to Enterprise plan
-- SELECT bulk_migrate_organizations('enterprise', ARRAY['[org-uuid-1]', '[org-uuid-2]']);

-- Migrate ALL active organizations to Basic plan (use with caution!)
-- SELECT bulk_migrate_organizations('basic');

-- =====================================================
-- TESTING AND VALIDATION
-- =====================================================

-- Test feature checking for organizations
SELECT 
    o.name as organization_name,
    o.package_id,
    organization_has_feature(o.id, 'pos') as has_pos,
    organization_has_feature(o.id, 'supplier_management') as has_supplier_mgmt,
    organization_has_feature(o.id, 'multi_outlet') as has_multi_outlet,
    organization_has_feature(o.id, 'advanced_dashboard') as has_advanced_dashboard
FROM organizations o
WHERE o.status = 'active'
ORDER BY o.name;

-- Show detailed features for each organization
WITH org_features AS (
    SELECT 
        o.id,
        o.name,
        o.package_id,
        (SELECT get_organization_features(o.id)) as features
    FROM organizations o
    WHERE o.status = 'active'
)
SELECT 
    name as organization_name,
    package_id,
    (features).feature_category as category,
    COUNT(*) as feature_count
FROM org_features
GROUP BY name, package_id, (features).feature_category
ORDER BY name, package_id, category;

-- Validate package feature counts
SELECT 
    'Package Validation' as check_type,
    p.id as package_id,
    p.name as package_name,
    COUNT(pf.feature_id) as actual_feature_count,
    CASE 
        WHEN p.id = 'basic' THEN 12
        WHEN p.id = 'pro' THEN 26  
        WHEN p.id = 'enterprise' THEN 41
        ELSE 0
    END as expected_feature_count,
    CASE 
        WHEN COUNT(pf.feature_id) = CASE 
            WHEN p.id = 'basic' THEN 12
            WHEN p.id = 'pro' THEN 26  
            WHEN p.id = 'enterprise' THEN 41
            ELSE 0
        END THEN '✅ Correct'
        ELSE '❌ Mismatch'
    END as validation_status
FROM packages p
LEFT JOIN package_features pf ON p.id = pf.package_id AND pf.is_enabled = true
GROUP BY p.id, p.name
ORDER BY p.price;

-- =====================================================
-- CLEANUP FUNCTIONS (Use with caution!)
-- =====================================================

-- Function to reset all organizations to basic plan
CREATE OR REPLACE FUNCTION reset_all_organizations_to_basic()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE organizations 
    SET package_id = 'basic'
    WHERE status = 'active';
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Reset % organizations to basic plan', updated_count;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to remove package assignment (use for testing only)
CREATE OR REPLACE FUNCTION clear_organization_packages()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE organizations 
    SET package_id = NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleared package assignment for % organizations', updated_count;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
DECLARE
    org_count INTEGER;
    basic_count INTEGER;
    pro_count INTEGER;
    enterprise_count INTEGER;
BEGIN
    -- Count organizations by package
    SELECT COUNT(*) INTO org_count FROM organizations WHERE status = 'active';
    SELECT COUNT(*) INTO basic_count FROM organizations WHERE package_id = 'basic' AND status = 'active';
    SELECT COUNT(*) INTO pro_count FROM organizations WHERE package_id = 'pro' AND status = 'active';
    SELECT COUNT(*) INTO enterprise_count FROM organizations WHERE package_id = 'enterprise' AND status = 'active';
    
    RAISE NOTICE '✅ Organization package migration completed!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Organization Distribution:';
    RAISE NOTICE '   • Total Active Organizations: %', org_count;
    RAISE NOTICE '   • Basic Plan: %', basic_count;
    RAISE NOTICE '   • Pro Plan: %', pro_count;
    RAISE NOTICE '   • Enterprise Plan: %', enterprise_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Migration functions available:';
    RAISE NOTICE '   • migrate_organization_package(org_id, package_id)';
    RAISE NOTICE '   • bulk_migrate_organizations(package_id, org_ids[])';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Testing functions available:';
    RAISE NOTICE '   • reset_all_organizations_to_basic()';
    RAISE NOTICE '   • clear_organization_packages()';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for backend integration!';
END $$;
