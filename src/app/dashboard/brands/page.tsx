import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { BrandsClient } from './BrandsClient';

export default async function BrandsPage() {
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
    
    let brands = [];
    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const { data: brandData } = await supabase
                .from('brands')
                .select('id, name')
                .eq('organization_id', member.organization_id)
                .order('name', { ascending: true });
            brands = brandData || [];
        }
    }

    return <BrandsClient allBrands={brands} />;
}
