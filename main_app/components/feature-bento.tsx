"use client"

import { motion } from "framer-motion"

export default function FeatureBento() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        duration: 0.6
      }
    }
  }

  return (
    <motion.section 
      className="bg-black text-white py-8 px-4 sm:py-6 sm:px-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8 sm:mb-16"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Why Choose<br />
            SRD Exchange?
          </motion.h2>
          <motion.p 
            className="text-gray-400 max-w-3xl mx-auto leading-relaxed text-justify text-sm sm:text-base"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <span className="text-white font-semibold">srd.exchange</span> a secure, no-KYC P2P trading platform 
            built on the BSC chain. It guarantees the best rates by 
            eliminating the middleman and offers fast, secure 
            payments via UPI and cash deposits with a no-bank-
            freeze guarantee. The platform protects against scams 
            and even covers gas fees, making for a safe and 
            seamless trading experience.
          </motion.p>
        </motion.div>

        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          
          {/* Row 1: Left wide, Right narrow */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            variants={itemVariants}
          >
            {/* Direct & Decentralized - Wide column (3/5) */}
            <motion.div 
              className="lg:col-span-3 rounded-xl p-6 border border-gray-500 text-center"
              whileHover={{ scale: 1.02, borderColor: "#8b5cf6" }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-3">
                <motion.div 
                  className="w-full h-40 flex items-center justify-center mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.img 
                    src="/direct-decentralised.svg" 
                    alt="People group" 
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                  />
                </motion.div>
              </div>
              <motion.h3 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Direct & Decentralized:
              </motion.h3>
              <motion.p 
                className="text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                Trade USDT directly with other users. Our platform acts 
                as a secure, decentralized marketplace, not a 
                middleman.
              </motion.p>
            </motion.div>

            {/* Best rates guarantee - Narrow column (2/5) */}
            <motion.div 
              className="lg:col-span-2 rounded-xl p-6 border border-gray-500 text-center"
              whileHover={{ scale: 1.02, borderColor: "#8b5cf6" }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-3">
                <motion.div 
                  className="w-full h-40 flex items-center justify-center mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.img 
                    src="/best-rates.svg" 
                    alt="ATM Machine" 
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                  />
                </motion.div>
              </div>
              <motion.h3 
                className="text-xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Best rates guarantee
              </motion.h3>
              <motion.p 
                className="text-gray-400 text-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                By cutting out the middleman, we 
                guarantee better trading rates.
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Row 2: Left narrow, Right wide */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            variants={itemVariants}
          >
            {/* Gas Fees Covered - Narrow column (2/5) */}
            <motion.div 
              className="lg:col-span-2 rounded-xl p-6 border border-gray-500 text-center"
              whileHover={{ scale: 1.02, borderColor: "#8b5cf6" }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-3">
                <motion.div 
                  className="w-full h-32 flex items-center justify-center mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.img 
                    src="/gas-fee.svg" 
                    alt="Gas pump" 
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                  />
                </motion.div>
              </div>
              <motion.h3 
                className="text-xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Gas Fees Covered
              </motion.h3>
              <motion.p 
                className="text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                We cover $0.02-$0.10 gas fees, keeping 
                every trade smooth and fee-free.
              </motion.p>
            </motion.div>

            {/* No bank freeze - Wide column (3/5) */}
            <motion.div 
              className="lg:col-span-3 rounded-xl p-6 border border-gray-500 text-center"
              whileHover={{ scale: 1.02, borderColor: "#8b5cf6" }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-3">
                <motion.div 
                  className="w-full h-32 flex items-center justify-center mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.img 
                    src="/bank-freeze.svg" 
                    alt="Bank safe" 
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                  />
                </motion.div>
              </div>
              <motion.h3 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                No bank freeze
              </motion.h3>
              <motion.p 
                className="text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                Our CDM option ensures a 100% no-freeze 
                guarantee, with support ready to assist if issues 
                arise.
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Row 3: Left wide, Right narrow */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
            variants={itemVariants}
          >
            {/* Say bye to USDT scams - Wide column (3/5) */}
            <motion.div 
              className="lg:col-span-3 rounded-xl p-6 border border-gray-500 text-center"
              whileHover={{ scale: 1.02, borderColor: "#8b5cf6" }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-3">
                <motion.div 
                  className="w-full h-32 flex items-center justify-center mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.img 
                    src="/no-usdt-scams.svg" 
                    alt="Security shield" 
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                  />
                </motion.div>
              </div>
              <motion.h3 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Say bye to USDT scams
              </motion.h3>
              <motion.p 
                className="text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                Our platform safeguards against scams like 'Loan 
                USDT' and 'Flash USDT', ensuring confident trading.
              </motion.p>
            </motion.div>

            {/* Fast & Flexible Payments - Narrow column (2/5) */}
            <motion.div 
              className="lg:col-span-2 rounded-xl p-6 border border-gray-500 text-center"
              whileHover={{ scale: 1.02, borderColor: "#8b5cf6" }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-3">
                <motion.div 
                  className="w-full h-32 flex items-center justify-center mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.img 
                    src="/fast-pay.svg" 
                    alt="Payment methods" 
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                  />
                </motion.div>
              </div>
              <motion.h3 
                className="text-xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Fast & Flexible Payments
              </motion.h3>
              <motion.p 
                className="text-gray-400 text-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                Receive your payment in minutes for a 
                smooth, stress-free trading experience.
              </motion.p>
            </motion.div>
          </motion.div>

        </motion.div>

        {/* Supported Blockchains Section */}
        <motion.div 
          className="text-center mt-12 sm:mt-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            More Chains Coming in Soon...
          </motion.h2>
          
          <motion.div 
            className="mb-4 sm:mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.img 
              src="/other-chains.svg" 
              alt="Supported blockchain networks" 
              className="mx-auto max-w-full h-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
          
          <motion.p 
            className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
          >
            Expanding to more networks for faster, cheaper,<br />
            and wider reach — so you can transact and build on your favorite <br /> blockchain.
          </motion.p>

          <motion.button 
            className="border border-[#622DBF] py-2 px-8 sm:px-12 mt-6 sm:mt-10 rounded-md -rotate-4 text-sm sm:text-base"
            initial={{ opacity: 0, rotate: -4, scale: 0.8 }}
            whileInView={{ opacity: 1, rotate: -4, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, rotate: 0 }}
            whileTap={{ scale: 0.95 }}
          >
            Coming Soon !!
          </motion.button>
        </motion.div>

      </div>
    </motion.section>
  )
}