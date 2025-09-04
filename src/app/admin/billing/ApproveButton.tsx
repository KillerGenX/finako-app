"use client";

import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";
import { confirmManualPayment } from "@/app/dashboard/billing/payment/[invoice_id]/actions";

export default function ApproveButton({ invoiceId }: { invoiceId: string }) {
    const { pending } = useFormStatus();

    return (
        <button 
            type="submit"
            disabled={pending}
            className="p-2 rounded-md bg-green-600/20 text-green-300 hover:bg-green-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Approve Payment"
        >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
    );
}

// Kita bisa juga membuat RejectButton di sini jika diperlukan
// export function RejectButton({ invoiceId }: { invoiceId: string }) { ... }
