import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { InventoryClient } from './InventoryClient'; // This will be the client component

export default async function InventoryPage({ params }: { params: { variantId: string } }) {
    const { variantId } = await params; // Await params
    
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
    if (!user) notFound();

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) notFound();
    
    const organization_id = member.organization_id;

    // Fetch all necessary data in parallel
    const variantPromise = supabase
        .from('product_variants')
        .select('id, name, sku, product:products(name)')
        .eq('id', variantId)
        .eq('organization_id', organization_id)
        .single();

    const outletsPromise = supabase
        .from('outlets')
        .select('id, name')
        .eq('organization_id', organization_id)
        .order('name');
    
    const stockLevelsPromise = supabase
        .from('inventory_stock_levels')
        .select('quantity_on_hand, outlet:outlets (id, name)')
        .eq('product_variant_id', variantId);

    const stockMovementsPromise = supabase
        .from('inventory_stock_movements')
        .select('created_at, quantity_change, movement_type, outlet:outlets (name)')
        .eq('product_variant_id', variantId)
        .order('created_at', { ascending: false });

    const [
        variantResult,
        outletsResult,
        stockLevelsResult,
        stockMovementsResult
    ] = await Promise.all([
        variantPromise,
        outletsPromise,
        stockLevelsPromise,
        stockMovementsPromise
    ]);

    if (variantResult.error || !variantResult.data) {
        notFound();
    }
    
    // Combine product name with variant name
    const productVariant = {
        ...variantResult.data,
        name: `${variantResult.data.product?.name} - ${variantResult.data.name}`
    }

    return (
        <InventoryClient
            productVariant={productVariant}
            outlets={outletsResult.data || []}
            initialStockLevels={stockLevelsResult.data || []}
            stockMovements={stockMovementsResult.data || []}
        />
    );
}
