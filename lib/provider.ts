import { BrowserProvider, JsonRpcProvider } from 'ethers'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
      selectedAddress?: string
    }
  }
}
export async function getBrowserProvider(address?: string): Promise<BrowserProvider> {
  if (!window.ethereum) {
    throw new Error('Please install a wallet extension (MetaMask, etc.)')
  }

  if (!address) {
    console.warn('getBrowserProvider called without address')
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    if (chainId !== '0xaa36a7') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        })
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (switchError: any) {
        if (switchError.code === 4001) {
          // user rejected, continue anyway
        } else if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://sepolia.drpc.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }],
            })
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch {
            // ignore
          }
        }
      }
    }
  } catch {
    // ignore network errors
  }

  return new BrowserProvider(window.ethereum)
}

export function getReadOnlyProvider(): BrowserProvider | JsonRpcProvider {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      return new BrowserProvider(window.ethereum)
    } catch {
      // fallback to public rpc
    }
  }
  return new JsonRpcProvider('https://sepolia.drpc.org')
}

export function getProvider(): BrowserProvider | JsonRpcProvider {
  return getReadOnlyProvider()
}
export async function getSigner(): Promise<any> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Please install a wallet extension (MetaMask, etc.)')
  }

  const provider = await getBrowserProvider()
  const signer = await provider.getSigner()
  return signer
}

