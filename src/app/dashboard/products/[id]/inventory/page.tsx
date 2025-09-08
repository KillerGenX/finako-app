import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { InventoryClient } from './InventoryClient'; // The client component

export default async function InventoryPage({ params }: { params: { id: string } }) {
    const { id: product_variant_id } = await params; // FIX: Awaited and destructured params
    
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
    if (!user) return notFound();

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) return notFound();
    
    const organization_id = member.organization_id;

    // 1. Fetch product variant details
    const { data: productVariant, error: productError } = await supabase
        .from('product_variants')
        .select('id, name, sku')
        .eq('id', product_variant_id)
        .eq('organization_id', organization_id)
        .single();

    if (productError || !productVariant) {
        return notFound();
    }

    // 2. Fetch all outlets
    const { data: outletsData } = await supabase
        .from('outlets')
        .select('id, name')
        .eq('organization_id', organization_id)
        .order('name');
    
    // 3. Fetch current stock levels for this variant
    const { data: stockLevelsData } = await supabase
        .from('inventory_stock_levels')
        .select(`
            quantity_on_hand,
            outlet:outlets (id, name)
        `)
        .eq('product_variant_id', product_variant_id);

    // 4. Fetch stock movement history for this variant
    const { data: stockMovementsData } = await supabase
        .from('inventory_stock_movements')
        .select(`
            created_at,
            quantity_change,
            movement_type,
            outlet:outlets (name)
        `)
        .eq('product_variant_id', product_variant_id)
        .order('created_at', { ascending: false });

    return (
        <InventoryClient
            productVariant={productVariant}
            outlets={outletsData || []}
            initialStockLevels={stockLevelsData || []}
            stockMovements={stockMovementsData || []}
        />
    );
}
