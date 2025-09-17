// src/app/dashboard/inventory/purchase-orders/new/page.tsx
import { getFormData } from './actions';
import { NewPOClient } from './NewPOClient';

export default async function NewPOPage() {
    const { suppliers, outlets } = await getFormData();
    
    return <NewPOClient suppliers={suppliers} outlets={outlets} />;
}
