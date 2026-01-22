'use client';

import { motion } from 'framer-motion';
import { LayoutGrid, BarChart3, ArrowLeftRight, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import Image from 'next/image';

const BottomNavbar = () => {
    const pathname = usePathname();
    const { openSidebar } = useSidebar();

    const navItems = [
        {
            label: 'Swap',
            icon: <Image src="/Vector.svg" alt="Swap" width={20} height={20} className="w-5 h-5" />,
            href: '/swap',
        },
        {
            label: 'Trade',
            icon: <Image src="/trade.svg" alt="Trade" width={20} height={20} className="w-5 h-5" />,
            href: '/trade',
        },
        {
            label: 'Flat',
            icon: <Image src="/fiat.svg" alt="Flat" width={20} height={20} className="w-5 h-5" />,
            href: '/fiat',
        },
        {
            label: 'Wallet',
            icon: <Image src="/ww.svg" alt="Wallet" width={20} height={20} className="w-5 h-5" />,
            href: '#',
            isAction: true
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[103] flex justify-center">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="bg-black/90 backdrop-blur-2xl border-t border-white/10 w-full flex items-center justify-between py-2 px-4 md:px-12 lg:px-20 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]"
            >
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    const content = (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={item.isAction ? openSidebar : undefined}
                            className={`relative flex flex-col items-center gap-1 px-2 py-1.5 md:px-4 md:py-2 rounded-xl transition-all duration-300 cursor-pointer ${isActive
                                ? 'text-[#6320EE]'
                                : 'text-gray-500 hover:text-gray-300'
                                } ${item.label === 'Wallet' ? 'sm:hidden' : ''}`}
                        >
                            <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                                {item.icon}
                            </div>
                            <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-[#6320EE]' : ''}`}>
                                {item.label}
                            </span>

                        </motion.div>
                    );

                    if (item.isAction) {
                        return (
                            <div key={item.label} className={item.label === 'Wallet' ? 'sm:hidden' : ''}>
                                {content}
                            </div>
                        );
                    }

                    return (
                        <Link key={item.href} href={item.href} className={item.label === 'Wallet' ? 'sm:hidden' : ''}>
                            {content}
                        </Link>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default BottomNavbar;
