import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from './ProductDetailClient';

export default async function ProductDetailPage({ params }: { params: { templateId: string } }) {
    const { templateId } = params;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name:string) { return cookieStore.get(name)?.value },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user!.id).single();
    if (!member) notFound();
    const orgId = member.organization_id;

    // Fetch the main product template
    const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', templateId)
        .eq('organization_id', orgId)
        .single();
    
    if (productError || !product) {
        notFound();
    }

    // Fetch all associated variants
    const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', templateId)
        .order('created_at', { ascending: true });

    if (variantsError) {
        // Handle error, maybe show a message
        console.error("Error fetching variants:", variantsError);
    }
    
    return <ProductDetailClient product={product} initialVariants={variants || []} />;
}
