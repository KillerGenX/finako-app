import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { EditProductForm } from './EditProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
    const { id } = await params; // FIX: Awaited and destructured params

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
    if (!user) return notFound();

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) return notFound();

    // Fetch the product data to edit
    const { data: product, error } = await supabase
        .from('product_variants')
        .select(`
            id,
            name,
            sku,
            selling_price,
            track_stock,
            product:products ( description, category_id )
        `)
        .eq('id', id) // Use the destructured id
        .eq('organization_id', member.organization_id)
        .single();

    if (error || !product) {
        notFound();
    }
    
    // Fetch all categories for the dropdown
    const { data: categoriesData } = await supabase
        .from('product_categories')
        .select('id, name')
        .eq('organization_id', member.organization_id)
        .order('name', { ascending: true });
    
    // Flatten the product data structure
    const productData = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        selling_price: product.selling_price,
        track_stock: product.track_stock,
        description: product.product?.description || '',
        category_id: product.product?.category_id || null,
    };

    return <EditProductForm product={productData} categories={categoriesData || []} />;
}
