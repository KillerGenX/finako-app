"use client";

import { useState, createContext, useContext, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShieldCheck, ChevronLeft, CreditCard, History } from 'lucide-react';
import AdminHeader from './AdminHeader'; // ▼▼▼ GANTI IMPORT KE HEADER BARU ▼▼▼

const AdminSidebarContext = createContext({
    isCollapsed: false,
    toggleSidebar: () => {},
});

const AdminSidebar = () => {
    const { isCollapsed, toggleSidebar } = useContext(AdminSidebarContext);
    const pathname = usePathname();
    
    const navLinks = [
        { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
        { href: "/admin/billing", icon: CreditCard, label: "Verifikasi Pembayaran" },
        { href: "/admin/history", icon: History, label: "Histori Pembayaran" },
    ];

    return (
        <aside className={`transition-all duration-300 ease-in-out border-r bg-gray-100/40 dark:bg-gray-800/40 hidden md:flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}>
             <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/admin/dashboard" className={`flex items-center gap-3 font-semibold transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                    <ShieldCheck className={`transition-all duration-300 text-teal-600 dark:text-teal-400 ${isCollapsed ? 'h-8 w-8' : 'h-9 w-9'}`} />
                    <span className={`font-bold text-xl text-gray-900 dark:text-gray-100 transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>Admin</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4">
                    {navLinks.map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} title={label} className={`flex items-center gap-4 rounded-lg px-3 py-3 my-1 transition-all hover:text-teal-600 dark:hover:text-teal-400 ${pathname.startsWith(href) ? 'bg-gray-200 dark:bg-gray-700 text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span className={`overflow-hidden transition-opacity whitespace-nowrap ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t flex-shrink-0">
                <button 
                    onClick={toggleSidebar} 
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex items-center justify-center w-full gap-4 rounded-lg px-3 py-3 text-gray-500 dark:text-gray-400 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-50"
                >
                    <ChevronLeft className={`h-6 w-6 transition-transform duration-300 flex-shrink-0 ${isCollapsed ? 'rotate-180' : ''}`} />
                    <span className={`overflow-hidden transition-opacity whitespace-nowrap ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{isCollapsed ? '' : 'Collapse'}</span>
                </button>
            </div>
        </aside>
    );
};

export default function AdminProvider({ children, userInitials, notificationCount }: { 
    children: ReactNode; 
    userInitials: string;
    notificationCount: number;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => setIsCollapsed(prev => !prev);

    return (
        <AdminSidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
            <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
                <AdminSidebar />
                <div className="flex flex-col">
                    {/* ▼▼▼ GUNAKAN ADMIN HEADER DI SINI ▼▼▼ */}
                    <AdminHeader userInitials={userInitials} toggleSidebar={toggleSidebar} notificationCount={notificationCount} />
                    {children}
                </div>
            </div>
        </AdminSidebarContext.Provider>
    );
}
