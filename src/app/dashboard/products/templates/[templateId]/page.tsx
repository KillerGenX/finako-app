import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from './ProductDetailClient';

export default async function ProductDetailPage({ params }: { params: { templateId: string } }) {
    const { templateId } = await params; // Await params

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name:string) { return cookieStore.get(name)?.value },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user!.id).single();
    if (!member) notFound();
    const orgId = member.organization_id;

    // Fetch all data in parallel
    const productPromise = supabase
        .from('products')
        .select('*, product_tax_rates(tax_rate_id)')
        .eq('id', templateId)
        .eq('organization_id', orgId)
        .single();
    
    // Updated query to fetch variants WITH their stock levels
    const variantsPromise = supabase
        .from('product_variants')
        .select(`
            *,
            inventory_stock_levels(quantity_on_hand)
        `)
        .eq('product_id', templateId)
        .order('created_at', { ascending: true });

    const categoriesPromise = supabase.from('product_categories').select('id, name').eq('organization_id', orgId).order('name');
    const brandsPromise = supabase.from('brands').select('id, name').eq('organization_id', orgId).order('name');
    const taxesPromise = supabase.from('tax_rates').select('id, name, rate').eq('organization_id', orgId).eq('is_active', true).order('name');

    const [productResult, variantsResult, categoriesResult, brandsResult, taxesResult] = await Promise.all([
        productPromise,
        variantsPromise,
        categoriesPromise,
        brandsPromise,
        taxesPromise
    ]);

    if (productResult.error || !productResult.data) {
        notFound();
    }
    
    // Process variants to calculate total_stock
    const variantsWithStock = (variantsResult.data || []).map(variant => {
        const total_stock = variant.inventory_stock_levels.reduce((sum, level) => sum + level.quantity_on_hand, 0);
        // Remove the detailed stock levels array to keep the client component clean
        const { inventory_stock_levels, ...rest } = variant;
        return { ...rest, total_stock };
    });

    return (
        <ProductDetailClient 
            product={productResult.data} 
            initialVariants={variantsWithStock} // Pass the processed data
            categories={categoriesResult.data || []}
            brands={brandsResult.data || []}
            taxes={taxesResult.data || []}
        />
    );
}
