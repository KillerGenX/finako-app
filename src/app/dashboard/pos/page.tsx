import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { POSClient } from './POSClient';
import { redirect } from 'next/navigation';

export default async function POSPage() {
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
    if (!user) {
        redirect('/login');
    }

    // Ambil data member dan profil dalam satu query untuk efisiensi
    const memberPromise = supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    const profilePromise = supabase.from('profiles').select('full_name').eq('id', user.id).single();

    const [memberResult, profileResult] = await Promise.all([memberPromise, profilePromise]);

    const { data: member, error: memberError } = memberResult;
    if (memberError || !member) {
        return <p className="p-4">Anda tidak terdaftar di organisasi manapun atau profil Anda tidak ditemukan.</p>;
    }
    
    const { data: profile } = profileResult;
    
    // Tentukan nama kasir: gunakan nama lengkap jika ada, jika tidak, gunakan email.
    const cashierName = profile?.full_name || user.email || 'Kasir';

    const orgId = member.organization_id;

    // Fetch initial data needed for filters: outlets and categories
    const outletsPromise = supabase.from('outlets').select('id, name').eq('organization_id', orgId).order('name');
    const categoriesPromise = supabase.from('product_categories').select('id, name').eq('organization_id', orgId).order('name');

    const [outletsResult, categoriesResult] = await Promise.all([outletsPromise, categoriesPromise]);

    if (outletsResult.error) {
        console.error('Error fetching outlets:', outletsResult.error);
    }
     if (categoriesResult.error) {
        console.error('Error fetching categories:', categoriesResult.error);
    }
    
    const outlets = outletsResult.data || [];
    const categories = categoriesResult.data || [];

    return (
        <POSClient 
            outlets={outlets} 
            categories={categories}
            userName={cashierName} // Kirim nama yang benar ke client component
        />
    );
}
