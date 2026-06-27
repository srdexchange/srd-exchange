const CHAIN_ALCHEMY_NETWORKS: Record<number, string> = {
  1: 'eth-mainnet',
  56: 'bnb-mainnet',
  8453: 'base-mainnet',
  42161: 'arb-mainnet',
  10: 'opt-mainnet',
  137: 'polygon-mainnet',
  43114: 'avax-mainnet',
}

export function getAlchemyNetwork(chainId: number): string {
  const network = CHAIN_ALCHEMY_NETWORKS[chainId]
  if (!network) throw new Error(`No Alchemy network configured for chain ${chainId}`)
  return network
}

export function getAlchemyRpcUrl(chainId: number): string {
  const network = getAlchemyNetwork(chainId)
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  if (!apiKey) throw new Error('Missing NEXT_PUBLIC_ALCHEMY_API_KEY')
  return `https://${network}.g.alchemy.com/v2/${apiKey}`
}

export function getServerAlchemyRpcUrl(chainId: number): string {
  const network = getAlchemyNetwork(chainId)
  const apiKey = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  if (!apiKey) throw new Error('Missing ALCHEMY_API_KEY')
  return `https://${network}.g.alchemy.com/v2/${apiKey}`
}

export function getAlchemyChainIdHex(chainId: number): string {
  return `0x${chainId.toString(16)}`
}

const SUPPORTED_CHAINS: Record<number, true> = {
  1: true,
  56: true,
  8453: true,
  42161: true,
  10: true,
  137: true,
  43114: true,
}

export function isSupportedEvmChain(chainId: number): boolean {
  return chainId in SUPPORTED_CHAINS
}
