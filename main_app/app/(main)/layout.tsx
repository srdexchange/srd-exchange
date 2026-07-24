'use client';

import BottomNavbar from '@/components/bottom-navbar';
import RightSidebar from '@/components/RightSidebar';
import { useSidebar } from '@/context/SidebarContext';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSidebarOpen } = useSidebar();

    return (
        <div className="min-h-screen bg-black">
            <div className="flex">
                <main className={`flex-1 min-w-0 pb-28 ${isSidebarOpen ? 'hidden lg:block' : ''}`}>
                    {children}
                </main>
                <aside className={`
                    ${isSidebarOpen
                        ? 'block fixed inset-0 z-50 lg:sticky lg:top-0 lg:w-[500px] lg:shrink-0 lg:h-[100dvh] lg:z-auto'
                        : 'hidden'
                    }
                    bg-black/90 backdrop-blur-xl overflow-hidden lg:pt-[72px] border-l border-white/10
                `}>
                    <RightSidebar />
                </aside>
            </div>
            <BottomNavbar />
        </div>
    );
}
