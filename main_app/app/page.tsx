'use client'
import { useState } from 'react'
import Navbar from '@/components/navbar'
import LandingPage from '@/components/landingPage'
import FeatureBento from '@/components/feature-bento'
import FAQ from '@/components/faq'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <LandingPage />
      <FeatureBento/>
      <FAQ/>
      <Footer />
    </div>
  )
}
