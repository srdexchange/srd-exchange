export default function FeatureBento() {
  return (
    <section className="bg-black text-white py-20 px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why Choose<br />
            SRD Exchange?
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed text-justify">
            <span className="text-white font-semibold">srd.exchange</span> a secure, no-KYC P2P trading platform 
            built on the BSC chain. It guarantees the best rates by 
            eliminating the middleman and offers fast, secure 
            payments via UPI and cash deposits with a no-bank-
            freeze guarantee. The platform protects against scams 
            and even covers gas fees, making for a safe and 
            seamless trading experience.
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Row 1: Left wide, Right narrow */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Direct & Decentralized - Wide column (3/5) */}
            <div className="lg:col-span-3 rounded-xl p-6 border border-gray-500 text-center">
              <div className="mb-3">
                <div className="w-full h-40 flex items-center justify-center mb-3">
                  <img src="/direct-decentralised.svg" alt="People group" className="w-full h-full object-contain" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Direct & Decentralized:</h3>
              <p className="text-gray-400">
                Trade USDT directly with other users. Our platform acts 
                as a secure, decentralized marketplace, not a 
                middleman.
              </p>
            </div>

            {/* Best rates guarantee - Narrow column (2/5) with blue border */}
            <div className="lg:col-span-2 rounded-xl p-6 border border-gray-500 text-center">
              <div className="mb-3">
                <div className="w-full h-40 flex items-center justify-center mb-3">
                  <img src="/best-rates.svg" alt="ATM Machine" className="w-full h-full object-contain" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Best rates guarantee</h3>
              <p className="text-gray-400 text-sm">
                By cutting out the middleman, we 
                guarantee better trading rates.
              </p>
            </div>
          </div>

          {/* Row 2: Left narrow, Right wide */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Gas Fees Covered - Narrow column (2/5) */}
            <div className="lg:col-span-2 rounded-xl p-6 border border-gray-500 text-center">
              <div className="mb-3">
                <div className="w-full h-32 flex items-center justify-center mb-3">
                  <img src="/gas-fee.svg" alt="Gas pump" className="w-full h-full object-contain" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Gas Fees Covered</h3>
              <p className="text-gray-400">
                We cover $0.02-$0.10 gas fees, keeping 
                every trade smooth and fee-free.
              </p>
            </div>

            {/* No bank freeze - Wide column (3/5) */}
            <div className="lg:col-span-3 rounded-xl p-6 border border-gray-500 text-center">
              <div className="mb-3">
                <div className="w-full h-32 flex items-center justify-center mb-3">
                  <img src="/bank-freeze.svg" alt="Bank safe" className="w-full h-full object-contain" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">No bank freeze</h3>
              <p className="text-gray-400">
                Our CMD option ensures a 100% no-freeze 
                guarantee, with support ready to assist if issues 
                arise.
              </p>
            </div>
          </div>

          {/* Row 3: Left wide, Right narrow */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Say bye to USDT scams - Wide column (3/5) */}
            <div className="lg:col-span-3 rounded-xl p-6 border border-gray-500 text-center">
              <div className="mb-3">
                <div className="w-full h-32 flex items-center justify-center mb-3">
                  <img src="/no-usdt-scams.svg" alt="Security shield" className="w-full h-full object-contain" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Say bye to USDT scams</h3>
              <p className="text-gray-400">
                Our platform safeguards against scams like 'Loan 
                USDT' and 'Flash USDT', ensuring confident trading.
              </p>
            </div>

            {/* Fast & Flexible Payments - Narrow column (2/5) */}
            <div className="lg:col-span-2 rounded-xl p-6 border border-gray-500 text-center">
              <div className="mb-3">
                <div className="w-full h-32 flex items-center justify-center mb-3">
                  <img src="/fast-pay.svg" alt="Payment methods" className="w-full h-full object-contain" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Fast & Flexible Payments</h3>
              <p className="text-gray-400 text-sm">
                Receive your payment in minutes for a 
                smooth, stress-free trading experience.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}