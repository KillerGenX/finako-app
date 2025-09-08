import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { ProductsTable } from './ProductsTable'; // Import the client component

export default async function ProductsPage() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    let products = [];
    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const { data: productData } = await supabase
                .from('product_variants')
                .select(`
                    id,
                    name,
                    sku,
                    selling_price,
                    track_stock,
                    created_at
                `)
                .eq('organization_id', member.organization_id)
                .order('created_at', { ascending: false });
            products = productData || [];
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Produk & Inventaris
                    </h1>
                    <p className="mt-1 text-md text-gray-600 dark:text-gray-400">
                        Kelola semua produk, varian, dan stok di semua outlet Anda.
                    </p>
                </div>
                <Link href="/dashboard/products/new">
                    <button className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Tambah Produk Baru
                    </button>
                </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-800">
                 <ProductsTable products={products} />
            </div>
        </div>
    );
}
