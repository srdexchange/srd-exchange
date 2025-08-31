import { http, createConfig } from 'wagmi'
import { bsc, bscTestnet } from 'wagmi/chains'
import { 
  walletConnect, 
  injected, 
  metaMask, 
  coinbaseWallet,
} from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SRD Exchange'
const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'P2P USDT Trading Platform'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const appIcon = process.env.NEXT_PUBLIC_APP_ICON || 'https://your-domain.com/logo.png'

if (!projectId) {
  throw new Error(`
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set.
    
    Get your Project ID from:
    👉 https://cloud.walletconnect.com
    
    Then add it to your .env.local file:
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
  `)
}

export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ 
      projectId,
      metadata: {
        name: appName,
        description: appDescription,
        url: appUrl,
        icons: [appIcon]
      }
    }),
    coinbaseWallet({
      appName,
      appLogoUrl: appIcon,
    }),
  ],
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: true,
})

export { projectId }
