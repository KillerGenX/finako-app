import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { InventoryLedgerClient } from './InventoryLedgerClient'; // Komponen baru
import { getInventoryLedgerDetails } from './actions';

export default async function InventoryLedgerPage({ params }: { params: { variantId: string } }) {
    const { variantId } = params;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) notFound();
    
    // Ambil data utama dari RPC baru
    const ledgerDetails = await getInventoryLedgerDetails(variantId);
    if (!ledgerDetails) notFound();

    // Ambil data pendukung
    const variantPromise = supabase
        .from('product_variants')
        .select('id, name, sku, products!inner(name)')
        .eq('id', variantId)
        .eq('organization_id', member.organization_id)
        .single();
        
    const outletsPromise = supabase
        .from('outlets')
        .select('id, name')
        .eq('organization_id', member.organization_id)
        .order('name');
    
    const [variantResult, outletsResult] = await Promise.all([variantPromise, outletsPromise]);
    if (variantResult.error || !variantResult.data) notFound();

    const productVariant = {
        ...variantResult.data,
        name: `${variantResult.data.products.name} - ${variantResult.data.name}`
    };

    // Cek apakah produk sudah punya stok awal
    const hasInitialStock = ledgerDetails.summary.total_stock > 0 || ledgerDetails.ledger.length > 0;

    return (
        <InventoryLedgerClient
            productVariant={productVariant}
            outlets={outletsResult.data || []}
            initialDetails={ledgerDetails}
            hasInitialStock={hasInitialStock}
        />
    );
}
