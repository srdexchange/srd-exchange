import { Headset } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white border-gray-800">
      <div className="max-w-7xl mx-auto px-8 py-8 bg-[#0C0C0C] rounded-xl mb-8">
        <div className="flex items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.svg" 
              alt="SRD Exchange Logo" 
              className="w-12 h-12"
            />
          </div>

          {/* Right side - Support and Telegram */}
          <div className="flex flex-col items-start gap-3">
            <button className="text-white border border-[#622DBF] px-6 py-2 rounded-md transition-colors duration-200 flex items-center gap-2">
              <img src="/telegram.svg" alt="" />
              Telegram community
            </button>

            <div className="flex items-center gap-2">
              <Headset className="w-4 h-4"/>
              <span className="text-gray-400 text-sm">24 x 7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}