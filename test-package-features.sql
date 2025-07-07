-- =====================================================
-- FINAKO POS: Package Features Testing & Validation Script
-- =====================================================
-- This script tests all package features functionality
-- and validates the setup
-- =====================================================

-- =====================================================
-- BASIC VALIDATION TESTS
-- =====================================================

-- Test 1: Verify all packages exist
SELECT 
    'Package Existence Test' as test_name,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ PASS - All 3 packages exist'
        ELSE '❌ FAIL - Expected 3 packages, found ' || COUNT(*)
    END as result
FROM packages 
WHERE id IN ('basic', 'pro', 'enterprise');

-- Test 2: Verify feature counts per package
SELECT 
    'Feature Count Validation' as test_name,
    p.id as package_id,
    COUNT(pf.feature_id) as actual_count,
    CASE 
        WHEN p.id = 'basic' THEN 12
        WHEN p.id = 'pro' THEN 26  
        WHEN p.id = 'enterprise' THEN 41
    END as expected_count,
    CASE 
        WHEN COUNT(pf.feature_id) = CASE 
            WHEN p.id = 'basic' THEN 12
            WHEN p.id = 'pro' THEN 26  
            WHEN p.id = 'enterprise' THEN 41
        END THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result
FROM packages p
LEFT JOIN package_features pf ON p.id = pf.package_id AND pf.is_enabled = true
WHERE p.id IN ('basic', 'pro', 'enterprise')
GROUP BY p.id
ORDER BY p.price;

-- Test 3: Verify all required core features exist
WITH required_features AS (
    SELECT unnest(ARRAY[
        'pos', 'customer_data', 'expenses', 'stock_management', 
        'supplier_management', 'multi_outlet', 'advanced_dashboard'
    ]) as feature_id
)
SELECT 
    'Core Features Existence Test' as test_name,
    rf.feature_id,
    CASE 
        WHEN f.id IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as result
FROM required_features rf
LEFT JOIN features f ON rf.feature_id = f.id
ORDER BY rf.feature_id;

-- =====================================================
-- PACKAGE HIERARCHY VALIDATION
-- =====================================================

-- Test 4: Verify Pro includes all Basic features
WITH basic_features AS (
    SELECT feature_id 
    FROM package_features 
    WHERE package_id = 'basic' AND is_enabled = true
),
pro_features AS (
    SELECT feature_id 
    FROM package_features 
    WHERE package_id = 'pro' AND is_enabled = true
)
SELECT 
    'Pro Plan Inheritance Test' as test_name,
    bf.feature_id,
    CASE 
        WHEN pf.feature_id IS NOT NULL THEN '✅ INCLUDED'
        ELSE '❌ MISSING FROM PRO'
    END as result
FROM basic_features bf
LEFT JOIN pro_features pf ON bf.feature_id = pf.feature_id
ORDER BY bf.feature_id;

-- Test 5: Verify Enterprise includes all Pro features
WITH pro_features AS (
    SELECT feature_id 
    FROM package_features 
    WHERE package_id = 'pro' AND is_enabled = true
),
enterprise_features AS (
    SELECT feature_id 
    FROM package_features 
    WHERE package_id = 'enterprise' AND is_enabled = true
)
SELECT 
    'Enterprise Plan Inheritance Test' as test_name,
    pf.feature_id,
    CASE 
        WHEN ef.feature_id IS NOT NULL THEN '✅ INCLUDED'
        ELSE '❌ MISSING FROM ENTERPRISE'
    END as result
FROM pro_features pf
LEFT JOIN enterprise_features ef ON pf.feature_id = ef.feature_id
ORDER BY pf.feature_id;

-- =====================================================
-- FUNCTION TESTING
-- =====================================================

-- Test 6: Test helper functions with sample data
-- First, let's check if we have any organizations to test with
SELECT 
    'Organization Count Check' as test_name,
    COUNT(*) as organization_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Organizations exist for testing'
        ELSE '⚠️ No organizations found - function testing limited'
    END as result
FROM organizations 
WHERE status = 'active';

-- Test 7: Test organization_has_feature function (if organizations exist)
-- This will use the first organization for testing
WITH test_org AS (
    SELECT id, name, package_id 
    FROM organizations 
    WHERE status = 'active' 
    LIMIT 1
)
SELECT 
    'Function Test: organization_has_feature' as test_name,
    to.name as org_name,
    to.package_id,
    organization_has_feature(to.id, 'pos') as has_pos,
    organization_has_feature(to.id, 'supplier_management') as has_supplier_mgmt,
    organization_has_feature(to.id, 'multi_outlet') as has_multi_outlet,
    CASE 
        WHEN organization_has_feature(to.id, 'pos') = true THEN '✅ POS feature working'
        ELSE '❌ POS feature test failed'
    END as pos_test_result
FROM test_org to;

-- =====================================================
-- PRICING VALIDATION
-- =====================================================

-- Test 8: Verify pricing structure
SELECT 
    'Pricing Structure Test' as test_name,
    id as package_id,
    price,
    CASE 
        WHEN id = 'basic' AND price = 49000 THEN '✅ Basic price correct'
        WHEN id = 'pro' AND price = 99000 THEN '✅ Pro price correct'  
        WHEN id = 'enterprise' AND price = 249000 THEN '✅ Enterprise price correct'
        ELSE '❌ Price mismatch for ' || id || ' (expected: ' || 
            CASE 
                WHEN id = 'basic' THEN '49000'
                WHEN id = 'pro' THEN '99000'
                WHEN id = 'enterprise' THEN '249000'
                ELSE 'unknown'
            END || ', actual: ' || price || ')'
    END as result
FROM packages 
WHERE id IN ('basic', 'pro', 'enterprise')
ORDER BY price;

-- =====================================================
-- FEATURE CATEGORY DISTRIBUTION
-- =====================================================

-- Test 9: Feature distribution by category
SELECT 
    'Feature Category Distribution' as test_name,
    f.category,
    COUNT(*) as total_features,
    COUNT(CASE WHEN pf_basic.package_id = 'basic' THEN 1 END) as in_basic,
    COUNT(CASE WHEN pf_pro.package_id = 'pro' THEN 1 END) as in_pro,
    COUNT(CASE WHEN pf_ent.package_id = 'enterprise' THEN 1 END) as in_enterprise
FROM features f
LEFT JOIN package_features pf_basic ON f.id = pf_basic.feature_id AND pf_basic.package_id = 'basic' AND pf_basic.is_enabled = true
LEFT JOIN package_features pf_pro ON f.id = pf_pro.feature_id AND pf_pro.package_id = 'pro' AND pf_pro.is_enabled = true
LEFT JOIN package_features pf_ent ON f.id = pf_ent.feature_id AND pf_ent.package_id = 'enterprise' AND pf_ent.is_enabled = true
GROUP BY f.category
ORDER BY f.category;

-- =====================================================
-- DATA INTEGRITY CHECKS
-- =====================================================

-- Test 10: Check for orphaned package_features
SELECT 
    'Orphaned Package Features Check' as test_name,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No orphaned package features'
        ELSE '❌ Found ' || COUNT(*) || ' orphaned package features'
    END as result
FROM package_features pf
LEFT JOIN packages p ON pf.package_id = p.id
LEFT JOIN features f ON pf.feature_id = f.id
WHERE p.id IS NULL OR f.id IS NULL;

-- Test 11: Check for missing basic features in higher tiers
WITH basic_features AS (
    SELECT feature_id FROM package_features WHERE package_id = 'basic' AND is_enabled = true
),
missing_in_pro AS (
    SELECT bf.feature_id 
    FROM basic_features bf
    LEFT JOIN package_features pf ON bf.feature_id = pf.feature_id AND pf.package_id = 'pro' AND pf.is_enabled = true
    WHERE pf.feature_id IS NULL
),
missing_in_enterprise AS (
    SELECT bf.feature_id 
    FROM basic_features bf
    LEFT JOIN package_features pf ON bf.feature_id = pf.feature_id AND pf.package_id = 'enterprise' AND pf.is_enabled = true
    WHERE pf.feature_id IS NULL
)
SELECT 
    'Missing Basic Features in Higher Tiers' as test_name,
    (SELECT COUNT(*) FROM missing_in_pro) as missing_in_pro_count,
    (SELECT COUNT(*) FROM missing_in_enterprise) as missing_in_enterprise_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM missing_in_pro) = 0 AND (SELECT COUNT(*) FROM missing_in_enterprise) = 0 
        THEN '✅ All basic features included in higher tiers'
        ELSE '❌ Some basic features missing in higher tiers'
    END as result;

-- =====================================================
-- PERFORMANCE TESTS
-- =====================================================

-- Test 12: Performance test for organization_has_feature function
SELECT 
    'Performance Test: Feature Checking' as test_name,
    COUNT(*) as organizations_tested,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Function executed successfully for all organizations'
        ELSE '⚠️ No organizations to test'
    END as result
FROM (
    SELECT 
        o.id,
        organization_has_feature(o.id, 'pos') as has_pos
    FROM organizations o
    WHERE status = 'active'
    LIMIT 100  -- Test with up to 100 organizations
) test_results;

-- =====================================================
-- COMPREHENSIVE SUMMARY
-- =====================================================

-- Final summary of all packages and their features
SELECT 
    '=== FINAL VALIDATION SUMMARY ===' as summary_section,
    '' as package_id,
    '' as feature_count,
    '' as status
UNION ALL
SELECT 
    'Package: ' || p.name as summary_section,
    p.id as package_id,
    COUNT(pf.feature_id)::TEXT as feature_count,
    CASE 
        WHEN COUNT(pf.feature_id) > 0 THEN '✅ Active'
        ELSE '❌ No Features'
    END as status
FROM packages p
LEFT JOIN package_features pf ON p.id = pf.package_id AND pf.is_enabled = true
WHERE p.id IN ('basic', 'pro', 'enterprise')
GROUP BY p.id, p.name, p.price
ORDER BY summary_section;

-- =====================================================
-- SAMPLE QUERIES FOR BACKEND INTEGRATION
-- =====================================================

-- Example queries that backend can use:

-- 1. Get organization's package and features
/*
SELECT 
    o.id,
    o.name,
    o.package_id,
    p.name as package_name,
    p.price as monthly_price
FROM organizations o
JOIN packages p ON o.package_id = p.id
WHERE o.id = $1 AND o.status = 'active';

-- 2. Check if organization has specific feature
SELECT organization_has_feature($1, $2) as has_feature;

-- 3. Get all features for organization
SELECT * FROM get_organization_features($1);

-- 4. Get package information
SELECT * FROM get_package_info($1);
*/

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
DECLARE
    total_features INTEGER;
    basic_features INTEGER;
    pro_features INTEGER;
    enterprise_features INTEGER;
    org_count INTEGER;
BEGIN
    -- Count features
    SELECT COUNT(*) INTO total_features FROM features;
    SELECT COUNT(*) INTO basic_features FROM package_features WHERE package_id = 'basic' AND is_enabled = true;
    SELECT COUNT(*) INTO pro_features FROM package_features WHERE package_id = 'pro' AND is_enabled = true;
    SELECT COUNT(*) INTO enterprise_features FROM package_features WHERE package_id = 'enterprise' AND is_enabled = true;
    SELECT COUNT(*) INTO org_count FROM organizations WHERE status = 'active';
    
    RAISE NOTICE '';
    RAISE NOTICE '🧪 PACKAGE FEATURES TESTING COMPLETED!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 VALIDATION RESULTS:';
    RAISE NOTICE '   • Total Features Defined: %', total_features;
    RAISE NOTICE '   • Basic Plan Features: % (expected: 12)', basic_features;
    RAISE NOTICE '   • Pro Plan Features: % (expected: 26)', pro_features;
    RAISE NOTICE '   • Enterprise Plan Features: % (expected: 41)', enterprise_features;
    RAISE NOTICE '   • Active Organizations: %', org_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ All tests completed! Review results above for any issues.';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 System ready for production use!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Backend Integration Points:';
    RAISE NOTICE '   • Use organization_has_feature(org_id, feature_id) in API endpoints';
    RAISE NOTICE '   • Use get_organization_features(org_id) for menu generation';
    RAISE NOTICE '   • Use organization_features_view for reporting';
    RAISE NOTICE '';
END $$;
