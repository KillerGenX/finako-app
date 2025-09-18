// src/app/dashboard/inventory/other-receivings/new/page.tsx
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NewReceivingClient } from './NewReceivingClient';

async function getOutlets() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) return [];
    const { data: outlets } = await supabase.from('outlets').select('id, name').eq('organization_id', member.organization_id).order('name');
    return outlets || [];
}

export default async function NewReceivingPage() {
    const outlets = await getOutlets();
    return <NewReceivingClient outlets={outlets} />;
}
