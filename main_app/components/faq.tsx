"use client"

import { Headset } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is Srd Exchange?",
    answer: "SRD Exchange is a secure, Decentralized P2P trading platform built on the BSC chain. It allows users to trade USDT ↔ INR directly with each other while providing security, better rates, and protection against scams."
  },
  {
    question: "Which Crypto Wallet is compatible with Srd.Exchange?",
    answer: "SRD Exchange is compatible with all major BSC-compatible wallets including MetaMask, Trust Wallet, Binance Chain Wallet, and any wallet that supports BEP-20 tokens. (Soon Login with Mobile number/Gmail)"
  },
  {
    question: "Which UPI/Bank Account should use with Srd.Exchange?",
    answer: "We recommend you to use Digital Banks [ Like Airtel Payments Bank, India Post Payments Bank (IPPB), Jio Payments Bank etc] because if your bank account got frozen by any chance no effect on your primary account."
  },
  {
    question: "What should I Do if my bank account got frozen?",
    answer: "Firstly, use our CDM method for P2P because there is rare chance for your bank freeze; but if you use UPI, please use your digital banks and have only few moneys there for spend or use for instant ATM cash withdrawal.\n\nIf your bank freeze immediately contacts our support team on mail or on telegram support, we will help you for further quire and try to unfreeze your account."
  },
  {
    question: "Are these transactions subject to 30% Tax & 1% TDS?",
    answer: "Yes of course, we are decentralized platform so, we are not report directly to government without any specific demand; It's your responsibility to file your income tax or others tax according to your local law."
  },
  {
    question: "What's the difference between UPI/CDM, buy/Sell?",
    answer: "For Buy/Sell, Upi used for paying or receiving payment directly to or by UPI But CDM is used for Cash Deposit Method directly to your bank (slower but secured from bank freeze)."
  },
  {
    question: "How Fast are Transactions?",
    answer: "For UPI less than 15min and for cdm 1hour30min."
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const handleTelegramClick = () => {
    window.open('https://telegram.me/SrdExchangeGlobal', '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.section 
      className="bg-black text-white py-8 px-4 md:px-8 min-h-screen flex flex-col justify-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-2xl md:text-3xl font-bold mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Have Questions? We Have Answers.
          </motion.h2>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-2 mb-6">
          {faqData.map((faq, index) => (
            <motion.div 
              key={index} 
              className="border-b border-gray-700 overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={!isMobile ? { backgroundColor: "rgba(31, 41, 55, 0.3)" } : {}}
            >
              <motion.button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center py-4 text-left hover:bg-gray-900/50 transition-all duration-300 ease-in-out"
                whileHover={!isMobile ? { x: 5 } : {}}
                transition={{ duration: 0.2 }}
              >
                <span className="text-base md:text-lg font-medium pr-4">
                  {faq.question}
                </span>
                <motion.span 
                  className={`
                    text-xl flex-shrink-0 transition-all duration-500 ease-in-out transform
                    ${openIndex === index ? 'rotate-45 text-gray-300' : 'rotate-0 text-gray-500'}
                  `}
                  animate={{ 
                    rotate: openIndex === index ? 45 : 0,
                    scale: openIndex === index ? 1.1 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  +
                </motion.span>
              </motion.button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="pb-4"
                    >
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-3 transition-opacity duration-300"></div>
                      <p className="text-gray-400 text-sm md:text-base leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div 
          className="flex items-center justify-between pt-1 border-gray-700 gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="flex items-center flex-1"
            whileHover={!isMobile ? { scale: 1.02 } : {}}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 flex-shrink-0"
              whileHover={!isMobile ? { rotate: 360, scale: 1.2 } : {}}
              transition={{ duration: 0.5 }}
            >
             <Headset className="w-full h-full"/>
            </motion.div>
            <div>
              {/* Mobile Text - Shorter */}
              <div className="block md:hidden">
                <p className="text-xs text-gray-400">
                  Questions? Reach out to our
                </p>
                <p className="text-[#622DBF] font-medium text-xs">
                  Telegram community (24x7) <span className="text-gray-400">for help</span>
                </p>
              </div>
              
              {/* Desktop Text - Full */}
              <div className="hidden md:block">
                <p className="text-sm text-gray-400">
                  If your question isn't answered here, reach out to our
                </p>
                <p className="text-[#622DBF] font-medium text-sm">
                  Telegram community (24x7) <span className="text-gray-400">directly and we'll help <br /> you get sorted</span>
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.button 
            onClick={handleTelegramClick}
            className="bg-black hover:border-[#632dbfc6] border border-[#622DBF] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-md transition-colors duration-200 flex items-center text-xs md:text-sm flex-shrink-0"
            whileHover={!isMobile ? { scale: 1.05, borderColor: "#8b5cf6" } : {}}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <motion.img 
              src="/telegram.svg" 
              alt="" 
              className='pr-1.5 md:pr-2 w-4 h-4 md:w-6 md:h-6' 
              whileHover={!isMobile ? { rotate: 360 } : {}}
              transition={{ duration: 0.5 }}
            />
            <span className="text-xs md:text-sm">Telegram community</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  )
}

export function Footer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTelegramClick = () => {
    window.open('https://telegram.me/SrdExchangeGlobal', '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.footer 
      id="contact" // 🔥 ADD: Contact section ID
      className="bg-black text-white border-gray-800"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto px-8 py-12 bg-[#0C0C0C] rounded-xl">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          
          {/* Logo - Large Size */}
          <motion.div 
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <motion.img 
              src="/logo.svg" 
              alt="SRD Exchange Logo" 
              className="w-20 h-20 md:w-24 md:h-24"
              whileHover={!isMobile ? { scale: 1.1, rotate: 5 } : { scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Telegram Button */}
          <motion.button 
            onClick={handleTelegramClick}
            className="text-white border border-[#622DBF] px-6 py-3 md:px-8 md:py-4 rounded-md transition-colors duration-200 flex items-center gap-3 text-sm md:text-base"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={!isMobile ? { scale: 1.05, borderColor: "#8b5cf6" } : {}}
            whileTap={{ scale: 0.95 }}
          >
            <motion.img 
              src="/telegram.svg" 
              alt="" 
              className="w-5 h-5 md:w-6 md:h-6"
              whileHover={!isMobile ? { rotate: 360 } : {}}
              transition={{ duration: 0.5 }}
            />
            <span>Telegram community</span>
          </motion.button>

          {/* 24x7 Support Text */}
          <motion.div 
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={!isMobile ? { scale: 1.2, rotate: 15 } : {}}
              transition={{ duration: 0.2 }}
            >
              <Headset className="w-4 h-4 md:w-5 md:h-5"/>
            </motion.div>
            <span className="text-gray-400 text-sm md:text-base">24 x 7 Support</span>
          </motion.div>

        </div>
      </div>
    </motion.footer>
  )
}