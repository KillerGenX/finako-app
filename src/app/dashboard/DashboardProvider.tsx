"use client";

import { useState, createContext, useContext, ReactNode, Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Package, Users, LineChart, Settings, ChevronLeft, CreditCard, Folder, Store, History } from 'lucide-react'; // Impor ikon History
import Header from './Header'; 

const SidebarContext = createContext({
    isCollapsed: false,
    toggleSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

const Sidebar = () => {
    const { isCollapsed, toggleSidebar } = useContext(SidebarContext);
    const pathname = usePathname();
    
    const navLinkGroups = [
        [
            { href: "/dashboard", icon: Home, label: "Dashboard" }
        ],
        [
           
            { href: "/dashboard/pos", icon: ShoppingCart, label: "Transaksi" },
            { href: "/dashboard/history", icon: History, label: "Riwayat" }, // Tambahkan menu Riwayat di sini
            { href: "/dashboard/products", icon: Package, label: "Produk" },
            { href: "/dashboard/categories", icon: Folder, label: "Kategori" },
            { href: "/dashboard/customers", icon: Users, label: "Pelanggan" },
            { href: "/dashboard/outlets", icon: Store, label: "Outlet" },
        ],
        [
            { href: "/dashboard/reports", icon: LineChart, label: "Laporan" },
            { href: "/dashboard/billing", icon: CreditCard, label: "Langganan" },
            { href: "/dashboard/settings", icon: Settings, label: "Pengaturan" },
        ]
    ];

    return (
        <aside className={`transition-all duration-300 ease-in-out border-r bg-gray-100/40 dark:bg-gray-800/40 hidden md:flex flex-col ${isCollapsed ? 'w-20' : 'w-48'}`}>
            <div className="flex h-14 items-center justify-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/dashboard" className="flex items-center justify-center font-semibold">
                    <img src="/finako.svg" alt="Finako Logo" className={`transition-all duration-300 ${isCollapsed ? 'h-8 w-8' : 'h-9 w-9'}`} />
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4">
                    {navLinkGroups.map((group, groupIndex) => (
                        <Fragment key={groupIndex}>
                            {group.map(({ href, icon: Icon, label }) => (
                                <Link key={href} href={href} title={label} className={`flex items-center gap-4 rounded-lg px-3 py-3 my-1 transition-all hover:text-teal-600 dark:hover:text-teal-400 ${pathname.startsWith(href) && href !== "/dashboard" || pathname === href ? 'bg-gray-200 dark:bg-gray-700 text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    <span className={`overflow-hidden transition-opacity whitespace-nowrap ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{label}</span>
                                </Link>
                            ))}
                            {groupIndex < navLinkGroups.length - 1 && (
                                <hr className={`my-3 border-gray-200 dark:border-gray-700 ${isCollapsed ? 'mx-auto w-8' : ''}`} />
                            )}
                        </Fragment>
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

export default function DashboardProvider({ children, userInitials, notificationCount }: { 
    children: ReactNode; 
    userInitials: string;
    notificationCount: number;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => setIsCollapsed(prev => !prev);

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
            <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
                <Sidebar />
                <div className="flex flex-col">
                    <Header userInitials={userInitials} toggleSidebar={toggleSidebar} notificationCount={notificationCount} />
                    {children}
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
