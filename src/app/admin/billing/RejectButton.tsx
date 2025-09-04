"use client";

import { useFormStatus } from "react-dom";
import { X, Loader2 } from "lucide-react";

export default function RejectButton() {
    const { pending } = useFormStatus();

    return (
        <button 
            type="submit"
            disabled={pending}
            className="p-2 rounded-md bg-red-600/20 text-red-300 hover:bg-red-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reject Payment"
        >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </button>
    );
}
