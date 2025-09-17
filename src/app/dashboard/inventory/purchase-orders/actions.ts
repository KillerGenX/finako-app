"use server";

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export type PurchaseOrderListItem = {
    id: string;
    po_number: string;
    supplier_name: string;
    outlet_name: string;
    status: string;
    order_date: string;
    total_cost: number;
};

export async function getPurchaseOrders(): Promise<PurchaseOrderListItem[]> {
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

    // Menggunakan query yang lebih eksplisit dengan foreign table name
    const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
            id,
            po_number,
            suppliers ( name ),
            outlets ( name ),
            status,
            order_date,
            purchase_order_items(quantity, unit_cost)
        `)
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching purchase orders:", error);
        return [];
    }
    
    // PERBAIKAN: Menangani kasus di mana relasi mengembalikan array
    return data.map(po => {
        // Supabase bisa mengembalikan relasi sebagai objek atau array. Kita tangani keduanya.
        const supplier = Array.isArray(po.suppliers) ? po.suppliers[0] : po.suppliers;
        const outlet = Array.isArray(po.outlets) ? po.outlets[0] : po.outlets;

        return {
            id: po.id,
            po_number: po.po_number,
            supplier_name: supplier?.name || 'N/A',
            outlet_name: outlet?.name || 'N/A',
            status: po.status,
            order_date: po.order_date,
            total_cost: po.purchase_order_items.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0),
        }
    });
}
