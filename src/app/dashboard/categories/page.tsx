import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { CategoriesTable } from './CategoriesTable'; 

export default async function CategoriesPage() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    let categories = [];
    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const { data: categoryData } = await supabase
                .from('product_categories')
                .select(`
                    id,
                    name,
                    description,
                    parent_id,
                    parent:parent_id ( name )
                `)
                .eq('organization_id', member.organization_id)
                .order('name', { ascending: true });
            categories = categoryData || [];
        }
    }

    return (
        <div>
            {/* The header (title and add button) is now handled inside the client component */}
            <CategoriesTable allCategories={categories} />
        </div>
    );
}
