-- =====================================================
-- TEST REGISTRATION FLOW AND DEBUG
-- =====================================================

-- 1. Check if organization was created correctly
SELECT 
    id,
    name,
    status,
    package_id,
    owner_id,
    created_at
FROM organizations 
WHERE name = 'finako'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check organization membership
SELECT 
    om.organization_id,
    om.user_id,
    om.role,
    o.name as org_name,
    o.status as org_status,
    o.package_id
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
WHERE o.name = 'finako'
ORDER BY om.created_at DESC;

-- 3. Check organization features (should be 43 for enterprise)
SELECT 
    COUNT(*) as total_features,
    array_agg(of.feature_id) as feature_list
FROM organization_features of
JOIN organizations o ON of.organization_id = o.id
WHERE o.name = 'finako' AND of.is_enabled = true;

-- 4. Check package_features mapping (should show enterprise features)
SELECT 
    COUNT(*) as total_package_features
FROM package_features 
WHERE package_id = 'enterprise' AND is_enabled = true;

-- 5. Check business profile (should be NULL for new registration)
SELECT 
    bp.*
FROM business_profiles bp
JOIN organizations o ON bp.organization_id = o.id
WHERE o.name = 'finako';

-- 6. Simulate next_step logic (what backend is doing)
WITH org_data AS (
    SELECT 
        o.id as org_id,
        o.name,
        o.status,
        o.package_id,
        bp.id as business_profile_id
    FROM organizations o
    LEFT JOIN business_profiles bp ON bp.organization_id = o.id
    WHERE o.name = 'finako'
    ORDER BY o.created_at DESC
    LIMIT 1
)
SELECT 
    org_id,
    name,
    status,
    package_id,
    business_profile_id,
    CASE 
        WHEN status = 'pending' THEN 'payment_info'
        WHEN status = 'active' AND business_profile_id IS NULL THEN 'onboarding'
        WHEN status = 'active' AND business_profile_id IS NOT NULL THEN 'dashboard'
        ELSE 'unknown'
    END as expected_next_step
FROM org_data;

-- 7. Show what should happen next for development
DO $$
DECLARE
    org_status TEXT;
    has_business_profile BOOLEAN;
    next_step TEXT;
BEGIN
    -- Get organization status
    SELECT status INTO org_status
    FROM organizations 
    WHERE name = 'finako'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if business profile exists
    SELECT EXISTS(
        SELECT 1 
        FROM business_profiles bp
        JOIN organizations o ON bp.organization_id = o.id
        WHERE o.name = 'finako'
    ) INTO has_business_profile;
    
    -- Determine next step
    IF org_status = 'pending' THEN
        next_step = 'payment_info';
    ELSIF org_status = 'active' AND NOT has_business_profile THEN
        next_step = 'onboarding';
    ELSIF org_status = 'active' AND has_business_profile THEN
        next_step = 'dashboard';
    ELSE
        next_step = 'unknown';
    END IF;
    
    RAISE NOTICE '🔍 REGISTRATION FLOW DEBUG:';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Current Status:';
    RAISE NOTICE '   • Organization Status: %', COALESCE(org_status, 'NOT FOUND');
    RAISE NOTICE '   • Has Business Profile: %', has_business_profile;
    RAISE NOTICE '   • Expected Next Step: %', next_step;
    RAISE NOTICE '';
    
    IF next_step = 'payment_info' THEN
        RAISE NOTICE '✅ FLOW IS CORRECT:';
        RAISE NOTICE '   • Organization created with status "pending"';
        RAISE NOTICE '   • User should see PaymentInfo page';
        RAISE NOTICE '   • Admin needs to approve (change status to "active")';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 TO SIMULATE APPROVAL (for testing):';
        RAISE NOTICE '   UPDATE organizations SET status = ''active'' WHERE name = ''finako'';';
        
    ELSIF next_step = 'onboarding' THEN
        RAISE NOTICE '✅ READY FOR ONBOARDING:';
        RAISE NOTICE '   • Organization approved (status = "active")';
        RAISE NOTICE '   • User should see Onboarding page';
        RAISE NOTICE '   • Need to create business profile';
        
    ELSIF next_step = 'dashboard' THEN
        RAISE NOTICE '✅ SETUP COMPLETE:';
        RAISE NOTICE '   • Organization approved';
        RAISE NOTICE '   • Business profile created';
        RAISE NOTICE '   • User should see Dashboard';
        
    ELSE
        RAISE NOTICE '❌ UNEXPECTED STATE:';
        RAISE NOTICE '   • Check organization and business_profile data';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '💡 Next Actions:';
    RAISE NOTICE '   1. If testing: run approval simulation above';
    RAISE NOTICE '   2. If production: wait for admin approval';
    RAISE NOTICE '   3. Check PaymentInfo page auto-refresh working';
    
END $$;
