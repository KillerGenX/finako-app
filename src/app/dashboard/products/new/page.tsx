import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NewProductForm } from './NewProductForm';

export default async function NewProductPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    let categories = [];
    let brands = [];
    let taxes = [];
    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const orgId = member.organization_id;
            
            const categoriesPromise = supabase.from('product_categories').select('id, name').eq('organization_id', orgId).order('name');
            const brandsPromise = supabase.from('brands').select('id, name').eq('organization_id', orgId).order('name');
            const taxesPromise = supabase.from('tax_rates').select('id, name, rate').eq('organization_id', orgId).order('name');
            
            const [categoriesResult, brandsResult, taxesResult] = await Promise.all([categoriesPromise, brandsPromise, taxesPromise]);
            
            categories = categoriesResult.data || [];
            brands = brandsResult.data || [];
            taxes = taxesResult.data || [];
        }
    }

    return <NewProductForm categories={categories} brands={brands} taxes={taxes} />;
}
