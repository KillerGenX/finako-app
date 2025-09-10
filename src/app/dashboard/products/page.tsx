import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { ProductsClient } from './ProductsClient'; // Import the new client component

export default async function ProductsPage() {
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
    
    let productsWithStock = [];
    let categories: { id: any; name: any; }[] = [];

    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const orgId = member.organization_id;

            // Fetch products and categories in parallel
            const productsPromise = supabase.rpc('get_products_with_stock', { p_organization_id: orgId });
            const categoriesPromise = supabase.from('product_categories').select('id, name').eq('organization_id', orgId).order('name');

            const [productsResult, categoriesResult] = await Promise.all([productsPromise, categoriesPromise]);
            
            if (productsResult.error) {
                console.error('Error fetching products with stock:', productsResult.error);
            } else {
                productsWithStock = productsResult.data || [];
            }

            if (categoriesResult.error) {
                console.error('Error fetching categories:', categoriesResult.error);
            } else {
                categories = categoriesResult.data || [];
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
                 <ProductsClient allProducts={productsWithStock} categories={categories} />
            </div>
        </div>
    );
}
