import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { TaxesClient } from './TaxesClient';

export default async function TaxesPage() {
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
    
    let taxRates = [];
    if (user) {
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (member) {
            const { data: taxData } = await supabase
                .from('tax_rates')
                .select('id, name, rate, is_inclusive')
                .eq('organization_id', member.organization_id)
                .order('name', { ascending: true });
            taxRates = taxData || [];
        }
    }

    return <TaxesClient allTaxRates={taxRates} />;
}
