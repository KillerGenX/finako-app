import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from './ProductDetailClient';
import type { Variant } from './ProductDetailClient'; 

export type CompositeComponent = {
    id: string; 
    quantity: number;
    component_details: {
        id: string; 
        name: string; 
        sku: string | null;
        product_name: string; 
        image_url: string | null;
    }
};

// Menambahkan composite_hpp ke tipe data
type ProductDetailsData = {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    category_id: string | null;
    brand_id: string | null;
    product_type: 'SINGLE' | 'VARIANT' | 'COMPOSITE' | 'SERVICE';
    product_tax_rates: { tax_rate_id: string }[];
    variants?: Variant[];
    components?: CompositeComponent[];
    composite_hpp?: number; // << BARU: Field untuk HPP
};


export default async function ProductDetailPage({ params }: { params: { templateId: string } }) {
    const { templateId } = await params;
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value, ...options }) } catch (error) {}
                },
                remove(name: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value: '', ...options }) } catch (error) {}
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user!.id).single();
    if (!member) notFound();
    const orgId = member.organization_id;

    // Panggilan RPC ini sekarang akan mengembalikan 'composite_hpp' jika tipenya COMPOSITE
    const { data: productDetails, error } = await supabase
        .rpc('get_product_details', { 
            p_product_id: templateId, 
            p_organization_id: orgId 
        })
        .single<ProductDetailsData>();
    
    if (error || !productDetails) {
        console.error('Error fetching product details:', error);
        notFound();
    }

    const categoriesPromise = supabase.from('product_categories').select('id, name').eq('organization_id', orgId).order('name');
    const brandsPromise = supabase.from('brands').select('id, name').eq('organization_id', orgId).order('name');
    const taxesPromise = supabase.from('tax_rates').select('id, name, rate').eq('organization_id', orgId).eq('is_active', true).order('name');

    const [categoriesResult, brandsResult, taxesResult] = await Promise.all([
        categoriesPromise,
        brandsPromise,
        taxesPromise
    ]);

    // Sekarang kita passing composite_hpp ke ProductDetailClient
    return (
        <ProductDetailClient 
            product={productDetails}
            initialVariants={productDetails.variants || []}
            initialComponents={productDetails.components || []}
            compositeHpp={productDetails.composite_hpp || null} // << BARU: Passing HPP
            categories={categoriesResult.data || []}
            brands={brandsResult.data || []}
            taxes={taxesResult.data || []}
        />
    );
}
