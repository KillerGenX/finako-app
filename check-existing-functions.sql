-- =====================================================
-- CHECK EXISTING FUNCTIONS BEFORE RUNNING MAIN SCRIPT
-- =====================================================

-- Check if helper functions already exist
SELECT 
    schemaname,
    functionname,
    definition
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN pg_catalog.pg_description d ON d.objoid = p.oid
WHERE 
    n.nspname = 'public' 
    AND p.proname IN (
        'organization_has_feature',
        'get_organization_features', 
        'get_package_info'
    );

-- Alternative check using information_schema
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE 
    routine_schema = 'public'
    AND routine_name IN (
        'organization_has_feature',
        'get_organization_features',
        'get_package_info'
    );

-- Check function signatures
SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    pg_catalog.pg_get_function_result(p.oid) as return_type,
    p.prosrc as source_code
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE 
    n.nspname = 'public'
    AND p.proname IN (
        'organization_has_feature',
        'get_organization_features',
        'get_package_info'
    );

-- Show result
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN (
        'organization_has_feature',
        'get_organization_features',
        'get_package_info'
    );
    
    IF func_count > 0 THEN
        RAISE NOTICE '⚠️  Found % existing helper functions', func_count;
        RAISE NOTICE '✅ CREATE OR REPLACE will safely update them';
    ELSE
        RAISE NOTICE '✅ No existing helper functions found';
        RAISE NOTICE '✅ Safe to create new functions';
    END IF;
END $$;
