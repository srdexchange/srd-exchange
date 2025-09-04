"use client";

import BuySellSection from '@/components/buysellSection';
import SimpleNav from '@/components/simple-nav';
import Orders from '@/components/orders';
import AuthGuard from '@/components/auth/AuthGuard';
import { useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';
import Footer from '@/components/footer';

export default function Dashboard() {
    const { disconnect } = useDisconnect();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // Disconnect wallet
            disconnect();
            
            // Clear any cached user data
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user-session');
                sessionStorage.clear();
                
                // Clear any other relevant storage keys
                const keysToRemove = Object.keys(localStorage).filter(key => 
                    key.includes('wagmi') || 
                    key.includes('wallet') || 
                    key.includes('user') ||
                    key.includes('auth')
                );
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            
            // Navigate to landing page
            router.push('/');
            
            // Force page refresh to clear all state
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } catch (error) {
            console.error('Logout error:', error);
            // Force navigation even if disconnect fails
            router.push('/');
            window.location.reload();
        }
    };

    return (
        <AuthGuard requireAuth={true}>
            <div className="bg-black">
                <div className="flex justify-between items-center p-4">
                    <SimpleNav />
                    <motion.button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 shadow-lg font-montserrat"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </motion.button>
                </div>
                <BuySellSection />
                <Orders />
           
                <div className='max-w-7xl mx-auto px-8 py-8'>
                    <Footer />
                </div>
            </div>
        </AuthGuard>
    );
}