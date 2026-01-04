'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ParticleConnectkit } from '@/lib/connectkit'
import FontProvider from './FontProvider'
import { ReactNode } from 'react'

// Note: Particle Network requires environment variables to be set in .env.local:
// NEXT_PUBLIC_PROJECT_ID, NEXT_PUBLIC_CLIENT_KEY, NEXT_PUBLIC_APP_ID
// Get these from: https://dashboard.particle.network

const queryClient = new QueryClient()

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ParticleConnectkit>
      <QueryClientProvider client={queryClient}>
        <FontProvider />
        <div className="font-montserrat">
          {children}
        </div>
      </QueryClientProvider>
    </ParticleConnectkit>
  )
}