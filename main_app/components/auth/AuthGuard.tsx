'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from '@particle-network/connectkit'
import { motion } from 'framer-motion'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  redirectTo = '/'
}: AuthGuardProps) {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const verifyUser = async () => {
      console.log("AuthGuard: Starting verification", { requireAuth, isConnected, address });
      
      if (!requireAuth) {
        setIsAuthorized(true)
        setIsVerifying(false)
        return
      }

      if (!isConnected || !address) {
        console.log("AuthGuard: Not connected, redirecting to:", redirectTo);
        setIsAuthorized(false)
        setIsVerifying(false)
        router.push(redirectTo)
        return
      }

      try {
        console.log("AuthGuard: Verifying user with address:", address);
        
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress: address }),
        })

        const data = await response.json()
        
        console.log("AuthGuard: Verification response:", data);

        if (data.isValid && data.user) {
          // Profile completion check: user must have profileCompleted = true
          if (!data.user.profileCompleted) {
            console.log("AuthGuard: Profile not completed, redirecting to complete-profile");
            router.push('/complete-profile')
            setIsAuthorized(false)
          } else {
            console.log("AuthGuard: Profile completed, allowing access");
            setIsAuthorized(true)
          }
        } else {
          console.log("AuthGuard: User not found in DB, redirecting to /complete-profile");
          setIsAuthorized(false)
          router.push('/complete-profile')
        }
      } catch (error) {
        console.error('AuthGuard: Verification failed:', error)
        setIsAuthorized(false)
        router.push(redirectTo)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyUser()
  }, [isConnected, address, requireAuth, router, redirectTo])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 border-4 border-[#622DBF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2 font-montserrat">
            Verifying Access...
          </h2>
          <p className="text-gray-400 font-montserrat">Please wait...</p>
        </motion.div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}