"use client";

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Bell, ChevronDown, Loader2 } from 'lucide-react';
import { logout } from '@/app/auth/actions';

// --- Placeholder UI Components for dropdown functionality ---
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block text-left">{children}</div>;
const DropdownMenuTrigger = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => <button onClick={onClick}>{children}</button>;
const DropdownMenuContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}>{children}</div>;
const DropdownMenuItem = ({ children }: { children: React.ReactNode }) => <div className="px-1 py-1">{children}</div>;
// --- End Placeholder UI Components ---

// A new component specifically for the logout button
// This is necessary because useFormStatus() only works on components
// that are direct children of a <form> element.
function LogoutButton() {
    const { pending } = useFormStatus();

    return (
        <button 
            type="submit" 
            disabled={pending}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Logging out...</span>
                </>
            ) : (
                'Logout'
            )}
        </button>
    );
}


export default function Header({ userInitials }: { userInitials: string }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-white dark:bg-gray-950 px-4 lg:h-[60px] lg:px-6">
            <div className="w-full flex-1">
                {/* Search bar can be added here */}
            </div>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="sr-only">Toggle notifications</span>
            </button>
            <DropdownMenu>
                <DropdownMenuTrigger onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <div className="flex items-center gap-2 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                            {userInitials}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </div>
                </DropdownMenuTrigger>
                {isMenuOpen && (
                    <DropdownMenuContent className="py-1">
                        <DropdownMenuItem>
                            <form action={logout}>
                                <LogoutButton />
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                )}
            </DropdownMenu>
        </header>
    );
};
