import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NewProductForm } from './NewProductForm';

export default async function NewProductPage() {
    const cookieStore = await cookies(); // FIX: Added await
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
    
    let categories = [];
    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const { data: categoryData } = await supabase
                .from('product_categories')
                .select('id, name')
                .eq('organization_id', member.organization_id)
                .order('name', { ascending: true });
            categories = categoryData || [];
        }
    }

    return <NewProductForm categories={categories} />;
}
