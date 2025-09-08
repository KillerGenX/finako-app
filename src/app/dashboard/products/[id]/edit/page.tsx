import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { EditProductForm } from './EditProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
    const { id } = await params;

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
    const orgId = member.organization_id;

    // Fetch product, categories, and brands in parallel
    const productPromise = supabase.from('product_variants').select(`
        id, name, sku, selling_price, cost_price, track_stock,
        product:products ( description, category_id, brand_id, image_url )
    `).eq('id', id).eq('organization_id', orgId).single();
    
    const categoriesPromise = supabase.from('product_categories').select('id, name').eq('organization_id', orgId).order('name');
    const brandsPromise = supabase.from('brands').select('id, name').eq('organization_id', orgId).order('name');

    const [productResult, categoriesResult, brandsResult] = await Promise.all([productPromise, categoriesPromise, brandsPromise]);

    if (productResult.error || !productResult.data) {
        notFound();
    }
    
    const productData = {
        id: productResult.data.id,
        name: productResult.data.name,
        sku: productResult.data.sku,
        selling_price: productResult.data.selling_price,
        cost_price: productResult.data.cost_price,
        track_stock: productResult.data.track_stock,
        description: productResult.data.product?.description || '',
        category_id: productResult.data.product?.category_id || null,
        brand_id: productResult.data.product?.brand_id || null,
        image_url: productResult.data.product?.image_url || null,
    };

    return <EditProductForm product={productData} categories={categoriesResult.data || []} brands={brandsResult.data || []} />;
}
