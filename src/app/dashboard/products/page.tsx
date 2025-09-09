import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { ProductsTable } from './ProductsTable';

export default async function ProductsPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    let productsWithStock = [];
    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            // Call the RPC function to get products with their total stock
            const { data, error } = await supabase
                .rpc('get_products_with_stock', {
                    p_organization_id: member.organization_id
                });
            
            if (error) {
                console.error('Error fetching products with stock:', error);
            } else {
                productsWithStock = data || [];
            }
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
                <Link href="/dashboard/products/templates/new">
                    <button className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Buat Produk Baru
                    </button>
                </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-800">
                 <ProductsTable products={productsWithStock} />
            </div>
        </div>
    );
}
