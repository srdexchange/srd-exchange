import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const Providers = dynamic(() => import("@/components/providers"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Srd Exchange - Decentralized P2P Platform on Bsc Chain",
  description: "Secure peer-to-peer USDT trading platform on Binance Smart Chain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-montserrat bg-black antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
