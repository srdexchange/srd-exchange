'use client'
import { useState } from 'react'
import Navbar from '@/components/navbar'
import LandingPage from '@/components/landingPage'
import FeatureBento from '@/components/feature-bento'

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <LandingPage />
      <FeatureBento/>
    </div>
  )
}
