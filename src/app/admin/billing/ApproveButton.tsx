"use client";

import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";

export default function ApproveButton({ invoiceId }: { invoiceId: string }) {
    const { pending } = useFormStatus();

    return (
        <button 
            type="submit"
            disabled={pending}
            // ▼▼▼ WARNA DIPERBARUI AGAR LEBIH MENYALA ▼▼▼
            className="p-2 rounded-md bg-teal-600/30 text-teal-300 hover:bg-teal-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Approve Payment"
        >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
    );
}
