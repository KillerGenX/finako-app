-- =====================================================
-- TEST PACKAGES DATA
-- =====================================================
-- This script tests if packages data is properly inserted

-- Check if packages table exists and has data
SELECT 
    'packages' as table_name,
    COUNT(*) as total_records
FROM packages;

-- Show all packages data
SELECT 
    id,
    name,
    price,
    user_limit,
    features
FROM packages
ORDER BY price;

-- Check if features are properly formatted
SELECT 
    id,
    name,
    features::text as features_raw,
    jsonb_typeof(features) as features_type,
    features->'description' as description,
    features->'feature_count' as feature_count,
    features->'max_outlets' as max_outlets,
    features->'max_users' as max_users
FROM packages
ORDER BY price;

-- Test JSON parsing
SELECT 
    id,
    name,
    CASE 
        WHEN features IS NULL THEN 'NULL'
        WHEN jsonb_typeof(features) = 'object' THEN 'Valid JSON Object'
        ELSE 'Invalid or Non-JSON'
    END as features_status
FROM packages;
