import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { OutletsClient } from './OutletsClient'; // Client component for table and modal

export default async function OutletsPage() {
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
    
    let outlets: { id: any; name: any; address: any; phone_number: any; location_types: any; }[] = [];
    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const { data: outletData } = await supabase
                .from('outlets')
                .select(`
                    id,
                    name,
                    address,
                    phone_number,
                    location_types
                `)
                .eq('organization_id', member.organization_id)
                .order('name', { ascending: true });
            outlets = outletData || [];
        }
    }

    return <OutletsClient allOutlets={outlets} />;
}
