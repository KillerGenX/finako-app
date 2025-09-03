"use client";

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Bell, ChevronDown, Loader2, Menu } from 'lucide-react';
import { logout } from '@/app/auth/actions';

// (Placeholder components remain the same)
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block text-left">{children}</div>;
const DropdownMenuTrigger = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => <button onClick={onClick}>{children}</button>;
const DropdownMenuContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}>{children}</div>;
const DropdownMenuItem = ({ children }: { children: React.ReactNode }) => <div className="px-1 py-1">{children}</div>;

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

// Header now accepts toggleSidebar function
export default function Header({ userInitials, toggleSidebar }: { userInitials: string; toggleSidebar: () => void; }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-white dark:bg-gray-950 px-4 lg:h-[60px] lg:px-6">
            {/* ▼▼▼ TOMBOL MENU BARU ▼▼▼ */}
            <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden" // Hanya terlihat di mobile untuk membuka sidebar
            >
                <Menu className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                <span className="sr-only">Toggle sidebar</span>
            </button>
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
