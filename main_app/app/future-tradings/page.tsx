"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Zap, TrendingUp, BarChart3 } from "lucide-react";

export default function FutureTradingPage() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const floatingAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Similar Background Elements as Landing Page */}
      <motion.div 
        className="absolute top-1/2 left-5/12 transform -translate-y-1/2 -translate-x-102 w-148 h-148 bg-purple-600/20 rounded-full blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      <motion.div 
        className="absolute top-1/2 left-5/12 transform -translate-y-1/2 translate-x-0 w-148 h-148 bg-purple-700/30 rounded-full blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
      />

      {/* Additional gradient for more depth */}
      <motion.div 
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 py-4">
        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          className="absolute top-8 left-8 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-montserrat">Back</span>
        </motion.button>

        {/* Floating Icons Around the Content */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Left Icon */}
          <motion.div 
            className="absolute top-1/4 left-20 w-12 h-12 rounded-xl flex items-center justify-center"
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.2 }}
          >
            <motion.div animate={floatingAnimation}>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </motion.div>
          </motion.div>

          {/* Top Right Icon */}
          <motion.div 
            className="absolute top-1/4 right-20 w-12 h-12 rounded-xl flex items-center justify-center"
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.4 }}
          >
            <motion.div 
              animate={{
                ...floatingAnimation,
                transition: { ...floatingAnimation.transition, delay: 0.5 }
              }}
            >
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </motion.div>
          </motion.div>

          {/* Bottom Left Icon */}
          <motion.div 
            className="absolute bottom-1/4 left-20 w-12 h-12 rounded-xl flex items-center justify-center"
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.6 }}
          >
            <motion.div 
              animate={{
                ...floatingAnimation,
                transition: { ...floatingAnimation.transition, delay: 1 }
              }}
            >
              <Zap className="w-8 h-8 text-yellow-400" />
            </motion.div>
          </motion.div>

          {/* Bottom Right Icon */}
          <motion.div 
            className="absolute bottom-1/4 right-20 w-12 h-12 rounded-xl flex items-center justify-center"
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 1.8 }}
          >
            <motion.div 
              animate={{
                ...floatingAnimation,
                transition: { ...floatingAnimation.transition, delay: 1.5 }
              }}
            >
              <Clock className="w-8 h-8 text-green-400" />
            </motion.div>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Coming Soon Text */}
          <motion.h1 
            className="text-6xl md:text-8xl lg:text-9xl font-bold leading-tight mb-8 font-montserrat"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 100 }}
          >
            <motion.span 
              className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              COMING
            </motion.span>
            <br />
            <motion.span 
              className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ["100%", "0%", "100%"],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            >
              SOON
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.h2 
            className="text-2xl md:text-4xl font-semibold text-gray-300 mb-6 font-montserrat"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Future Trading Platform
          </motion.h2>

          {/* Description */}
          <motion.p 
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8 font-montserrat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Advanced cryptocurrency futures trading with leverage, 
            perpetual swaps, and professional trading tools. 
            Get ready for the next level of crypto trading.
          </motion.p>

          {/* Features Preview */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            {[
              { icon: "⚡", text: "Leverage Trading" },
              { icon: "📊", text: "Advanced Charts" },
              { icon: "🔄", text: "Perpetual Swaps" },
              { icon: "🛡️", text: "Risk Management" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.05, borderColor: "#8B5CF6" }}
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <div className="text-sm text-gray-400 font-montserrat">{feature.text}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Animated Loading Indicator */}
          <motion.div 
            className="flex justify-center items-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
          >
            <motion.div 
              className="w-3 h-3 bg-purple-500 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: 0
              }}
            />
            <motion.div 
              className="w-3 h-3 bg-pink-500 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: 0.3
              }}
            />
            <motion.div 
              className="w-3 h-3 bg-blue-500 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: 0.6
              }}
            />
          </motion.div>

        
        </motion.div>
      </div>
    </div>
  );
}