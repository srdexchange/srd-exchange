"use client"

import { Headset } from 'lucide-react'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is a srd Exchange?",
    answer: "SRD Exchange is a secure, no-KYC P2P trading platform built on the BSC chain. It allows users to trade USDT directly with each other while providing security, better rates, and protection against scams."
  },
  {
    question: "Which crypto wallets are compatible with srd Exchange ?",
    answer: "SRD Exchange is compatible with all major BSC-compatible wallets including MetaMask, Trust Wallet, Binance Chain Wallet, and any wallet that supports BEP-20 tokens."
  },
  {
    question: "What should I do if my bank account gets frozen?",
    answer: "With our CMD option, we provide a 100% no-freeze guarantee. If any issues arise, our support team is ready to assist you immediately. We have protocols in place to handle and resolve such situations quickly."
  },
  {
    question: "How do I pay or receive funds?",
    answer: "You can pay or receive funds through multiple methods including UPI, bank transfers, and cash deposits. Our platform supports fast and flexible payment options to ensure smooth transactions."
  },
  {
    question: "How fast are transactions?",
    answer: "Transactions are typically completed within minutes. The blockchain confirmation takes a few minutes, and payment processing is also very fast, ensuring you receive your funds quickly."
  },
  {
    question: "Are these transactions subject to a 30% tax rate?",
    answer: "Tax implications depend on your local jurisdiction and tax laws. We recommend consulting with a tax professional regarding your specific situation and local cryptocurrency taxation policies."
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="bg-black text-white py-8 px-8 min-h-screen flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Have Questions? We Have Answers.
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="space-y-2 mb-6">
          {faqData.map((faq, index) => (
            <div key={index} className="border-b border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center py-4 text-left hover:bg-gray-900/50 transition-all duration-300 ease-in-out"
              >
                <span className="text-base md:text-lg font-medium pr-4">
                  {faq.question}
                </span>
                <span className={`
                  text-xl flex-shrink-0 transition-all duration-500 ease-in-out transform
                  ${openIndex === index ? 'rotate-45 text-gray-300' : 'rotate-0 text-gray-500'}
                `}>
                  +
                </span>
              </button>
              
              <div className={`
                overflow-hidden transition-all duration-500 ease-in-out
                ${openIndex === index 
                  ? 'max-h-96 opacity-100 pb-4' 
                  : 'max-h-0 opacity-0 pb-0'
                }
              `}>
                <div className={`
                  transform transition-all duration-500 ease-in-out
                  ${openIndex === index 
                    ? 'translate-y-0 opacity-100' 
                    : '-translate-y-2 opacity-0'
                  }
                `}>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mb-3 transition-opacity duration-300"></div>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-1 border-gray-700 gap-4">
          <div className="flex items-center">
            <div className="w-6 h-6 mr-3">
             <Headset/>
            </div>
            <div>
              <p className="text-sm text-gray-400">
                If your question isn't answered here, reach out to our
              </p>
              <p className="text-[#622DBF] font-medium text-sm">
                Telegram community (24x7) <span className="text-gray-400">directly and we'll help <br /> you get sorted</span>
              </p>
            </div>
          </div>
          
          <button className="bg-black hover:border-[#632dbfc6] border border-[#622DBF] text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center text-sm">
          <img src="/telegram.svg" alt="" className='pr-2 w-6 h-6' />
            Telegram community
          </button>
        </div>
      </div>
    </section>
  )
}