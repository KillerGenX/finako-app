import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditProductForm } from './EditProductForm'; // Import the new client component

export default async function EditProductPage({ params }: { params: { id: string } }) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: product, error } = await supabase
        .from('product_variants')
        .select(`
            id,
            name,
            sku,
            selling_price,
            track_stock,
            product:products ( description )
        `)
        .eq('id', params.id)
        .single();

    if (error || !product) {
        notFound();
    }
    
    // Flatten the data structure for easier use in the form
    const productData = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        selling_price: product.selling_price,
        track_stock: product.track_stock,
        description: product.product.description || ''
    };

    return (
        <div>
            <div className="mb-6">
                <Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Daftar Produk
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-2">
                    Edit Produk
                </h1>
                <p className="mt-1 text-md text-gray-600 dark:text-gray-400">
                    Perbarui detail untuk produk <span className="font-semibold">{product.name}</span>.
                </p>
            </div>
            
            <EditProductForm product={productData} />
        </div>
    );
}
