-- =====================================================
-- FINAKO POS: Organization Plan Integration Script
-- =====================================================
-- This script adds plan columns to organizations table and 
-- creates helper functions for feature checking
-- =====================================================

-- Add plan information to organizations table (if not exists)
DO $$
BEGIN
    -- Add plan_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN plan_type VARCHAR(20) DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'enterprise'));
    END IF;

    -- Add plan_expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'plan_expires_at'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN plan_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add plan_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'plan_status'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN plan_status VARCHAR(20) DEFAULT 'active' CHECK (plan_status IN ('active', 'suspended', 'expired', 'trial'));
    END IF;

    RAISE NOTICE '✅ Organization plan columns added successfully!';
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan_type, plan_status);

-- =====================================================
-- HELPER FUNCTIONS FOR FEATURE CHECKING
-- =====================================================

-- Function to check if organization has specific feature
CREATE OR REPLACE FUNCTION organization_has_feature(
    org_plan_type VARCHAR(20),
    feature_id VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    has_feature BOOLEAN := FALSE;
BEGIN
    -- Check if feature exists in the plan
    SELECT 
        CASE 
            WHEN org_plan_type = 'basic' THEN pf.basic_plan
            WHEN org_plan_type = 'pro' THEN pf.pro_plan
            WHEN org_plan_type = 'enterprise' THEN pf.enterprise_plan
            ELSE FALSE
        END
    INTO has_feature
    FROM package_features pf
    WHERE pf.feature_id = organization_has_feature.feature_id;
    
    RETURN COALESCE(has_feature, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get all features for organization plan
CREATE OR REPLACE FUNCTION get_organization_features(org_plan_type VARCHAR(20))
RETURNS TABLE(
    feature_id VARCHAR(50),
    feature_name VARCHAR(100),
    feature_description TEXT,
    feature_category VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.feature_id,
        pf.feature_name,
        pf.feature_description,
        pf.feature_category
    FROM package_features pf
    WHERE 
        CASE 
            WHEN org_plan_type = 'basic' THEN pf.basic_plan
            WHEN org_plan_type = 'pro' THEN pf.pro_plan
            WHEN org_plan_type = 'enterprise' THEN pf.enterprise_plan
            ELSE FALSE
        END = TRUE
    ORDER BY pf.feature_category, pf.feature_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATE EXISTING ORGANIZATIONS WITH DEFAULT PLAN
-- =====================================================

-- Set default plan for existing organizations
UPDATE organizations 
SET 
    plan_type = 'basic',
    plan_status = 'active',
    plan_expires_at = NOW() + INTERVAL '30 days'  -- 30 days trial
WHERE plan_type IS NULL;

-- =====================================================
-- SAMPLE USAGE QUERIES
-- =====================================================

-- Check if organization has specific feature
/*
SELECT organization_has_feature('pro', 'supplier_management') as has_supplier_feature;
SELECT organization_has_feature('basic', 'supplier_management') as has_supplier_feature;
SELECT organization_has_feature('enterprise', 'multi_outlet') as has_multi_outlet;

-- Get all features for organization plan
SELECT * FROM get_organization_features('basic');
SELECT * FROM get_organization_features('pro');
SELECT * FROM get_organization_features('enterprise');

-- Get organization with their available features count
SELECT 
    o.id,
    o.name,
    o.plan_type,
    o.plan_status,
    COUNT(pf.feature_id) as available_features
FROM organizations o
LEFT JOIN package_features pf ON (
    (o.plan_type = 'basic' AND pf.basic_plan = true) OR
    (o.plan_type = 'pro' AND pf.pro_plan = true) OR
    (o.plan_type = 'enterprise' AND pf.enterprise_plan = true)
)
GROUP BY o.id, o.name, o.plan_type, o.plan_status
ORDER BY o.name;
*/

-- =====================================================
-- CREATE VIEW FOR EASY FEATURE ACCESS
-- =====================================================

-- Create view for organization features
CREATE OR REPLACE VIEW organization_features_view AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.plan_type,
    o.plan_status,
    o.plan_expires_at,
    pf.feature_id,
    pf.feature_name,
    pf.feature_description,
    pf.feature_category
FROM organizations o
JOIN package_features pf ON (
    (o.plan_type = 'basic' AND pf.basic_plan = true) OR
    (o.plan_type = 'pro' AND pf.pro_plan = true) OR
    (o.plan_type = 'enterprise' AND pf.enterprise_plan = true)
)
WHERE o.plan_status = 'active';

-- Create RLS policy for the view
ALTER VIEW organization_features_view OWNER TO postgres;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test the helper functions
SELECT 
    'basic' as plan,
    organization_has_feature('basic', 'pos') as has_pos,
    organization_has_feature('basic', 'supplier_management') as has_supplier,
    organization_has_feature('basic', 'multi_outlet') as has_multi_outlet

UNION ALL

SELECT 
    'pro' as plan,
    organization_has_feature('pro', 'pos') as has_pos,
    organization_has_feature('pro', 'supplier_management') as has_supplier,
    organization_has_feature('pro', 'multi_outlet') as has_multi_outlet

UNION ALL

SELECT 
    'enterprise' as plan,
    organization_has_feature('enterprise', 'pos') as has_pos,
    organization_has_feature('enterprise', 'supplier_management') as has_supplier,
    organization_has_feature('enterprise', 'multi_outlet') as has_multi_outlet;

-- Show organizations with their plan info
SELECT 
    id,
    name,
    plan_type,
    plan_status,
    plan_expires_at,
    CASE 
        WHEN plan_expires_at > NOW() THEN 'Valid'
        WHEN plan_expires_at <= NOW() THEN 'Expired'
        ELSE 'No Expiry Set'
    END as plan_validity
FROM organizations
ORDER BY name;

DO $$
BEGIN
    RAISE NOTICE '✅ Organization-Package Features integration completed!';
    RAISE NOTICE '🔧 Helper functions created:';
    RAISE NOTICE '   • organization_has_feature(plan, feature_id)';
    RAISE NOTICE '   • get_organization_features(plan)';
    RAISE NOTICE '📊 View created: organization_features_view';
    RAISE NOTICE '🚀 Ready for backend integration!';
END $$;
