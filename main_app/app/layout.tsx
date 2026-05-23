import type { Metadata } from "next";
import ClientProviders from "@/components/ClientProviders";
import "./globals.css";

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
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
