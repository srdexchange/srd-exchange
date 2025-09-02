'use client'

import Image from 'next/image'

export default function SimpleNav() {
  return (
    <nav className="w-full bg-black border-b border-gray-800 text-white px-8 py-2">
      <div className="flex items-center justify-between w-full">
        {/* Logo Section - Left */}
        <div className="flex items-center space-x-2">
          <Image
            src="/srd_final.svg"
            alt="SRD Exchange Logo"
            width={10}
            height={10}
            className="w-16 h-16 object-contain"
          />
          <span className="text-xl font-bold  tracking-tight hidden md:flex md:flex-row">
            SRD Exchange
          </span>
        </div>

        {/* Right Section - Social Icons and Help */}
        <div className="flex items-center space-x-6">
          {/* Social Icons */}
          <div className="flex items-center space-x-3">
            {/* Twitter/X Icon */}
            <a href="https://x.com/SrdExchange" className="w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110">
              <svg
                className="w-5 h-5 fill-current text-white" 
                viewBox="0 0 24 24"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          {/* Help Text */}
          <a href='https://telegram.me/SrdExchangeGlobal' className="text-white font-medium text-base cursor-pointer hover:text-gray-300 transition-colors duration-200">
            Help
          </a>
        </div>
      </div>
    </nav>
  )
}