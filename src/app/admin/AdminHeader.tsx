"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Bell, ChevronDown, Loader2, Menu } from 'lucide-react';
import { logout } from '@/app/auth/actions';
import Link from 'next/link';

// Dropdown components
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block text-left">{children}</div>;
const DropdownMenuTrigger = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => <button type="button" onClick={onClick}>{children}</button>;
const DropdownMenuContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={`origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}>{children}</div>;
const DropdownMenuItem = ({ children }: { children: React.ReactNode }) => <div className="px-1 py-1">{children}</div>;

function LogoutButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Logging out...</span></> : 'Logout'}
        </button>
    );
}

// Ini adalah Header KHUSUS untuk Admin
export default function AdminHeader({ userInitials, toggleSidebar, notificationCount = 0 }: { 
    userInitials: string; 
    toggleSidebar: () => void;
    notificationCount?: number;
}) {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
    
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationMenuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
            if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) setIsNotificationMenuOpen(false);
        };
        if (isUserMenuOpen || isNotificationMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isUserMenuOpen, isNotificationMenuOpen]);

    useEffect(() => {
        setIsUserMenuOpen(false);
        setIsNotificationMenuOpen(false);
    }, [pathname]);

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-white dark:bg-gray-900 px-4 lg:h-[60px] lg:px-6">
            <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden">
                <Menu className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="w-full flex-1"></div>

            <div ref={notificationMenuRef}>
                <DropdownMenu>
                    <DropdownMenuTrigger onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}>
                        <div className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            {notificationCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                            )}
                        </div>
                    </DropdownMenuTrigger>
                    {isNotificationMenuOpen && (
                        <DropdownMenuContent>
                            {notificationCount > 0 ? (
                                <DropdownMenuItem><Link href="/admin/billing" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Ada <strong>{notificationCount}</strong> pembayaran menunggu verifikasi.</Link></DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem><div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Tidak ada notifikasi baru.</div></DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    )}
                </DropdownMenu>
            </div>

            <div ref={userMenuRef}>
                <DropdownMenu>
                    <DropdownMenuTrigger onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                        <div className="flex items-center gap-2 cursor-pointer"><div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">{userInitials}</div><ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} /></div>
                    </DropdownMenuTrigger>
                    {isUserMenuOpen && (
                        <DropdownMenuContent>
                            <DropdownMenuItem><form action={logout}><LogoutButton /></form></DropdownMenuItem>
                        </DropdownMenuContent>
                    )}
                </DropdownMenu>
            </div>
        </header>
    );
};
