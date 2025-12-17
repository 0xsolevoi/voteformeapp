'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { getProvider, getSigner } from '@/lib/provider'

interface Poll {
  pollId: number
  creator: string
  question: string
  options: string[]
  isActive: boolean
  resultsRevealed: boolean
  createdAt: number
  endTime: number
  voteCount: number
  hasVoted: boolean
  results?: number[]
}

const VOTING_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS || '0x7C3D30D0050EC379833322e22893A92b97C1B447').trim()

const VOTING_ABI = [
  'function createPoll(string memory question, string[] memory options, uint256 duration) external returns (uint256)',
  'function castVote(uint256 pollId, bytes32 encryptedVote, bytes calldata attestation) external',
  'function revealResults(uint256 pollId, uint256[] memory results) external',
  'function endPoll(uint256 pollId) external',
  'function getPoll(uint256 pollId) external view returns (address creator, string memory question, string[] memory options, bool isActive, bool resultsRevealed, uint256 createdAt, uint256 endTime, uint256 voteCount)',
  'function getResults(uint256 pollId) external view returns (uint256[] memory results, bool revealed)',
  'function hasVoted(uint256 pollId, address voter) external view returns (bool)',
  'function getUserPolls(address user) external view returns (uint256[])',
  'function getUserVotes(address user) external view returns (uint256[])',
  'event PollCreated(uint256 indexed pollId, address indexed creator, string question, uint256 endTime)',
  'event VoteCast(uint256 indexed pollId, address indexed voter)',
  'event ResultsRevealed(uint256 indexed pollId, uint256[] results)',
]

export default function VotingPoll({ pollId }: { pollId: number }) {
  const { address, isConnected } = useAccount()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [relayerInstance, setRelayerInstance] = useState<any>(null)

  useEffect(() => {
    loadPoll()
    if (isConnected && address) {
      initRelayer()
    }
  }, [pollId, isConnected, address])

  const initRelayer = async () => {
    if (relayerInstance) return
    
    try {
      if (typeof window === 'undefined') {
        throw new Error('Browser only')
      }

      if (typeof global === 'undefined') {
        (window as any).global = globalThis
      }

      const relayerModule = await import('@zama-fhe/relayer-sdk/web')
      const sdkInitialized = await relayerModule.initSDK()
      if (!sdkInitialized) {
        throw new Error('SDK init failed')
      }
      
      const instance = await relayerModule.createInstance(relayerModule.SepoliaConfig)
      setRelayerInstance(instance)
    } catch (err: any) {
      // relayer init failed, will show error when user tries to vote
    }
  }

  const loadPoll = async () => {
    try {
      const { JsonRpcProvider } = await import('ethers')
      const provider = new JsonRpcProvider('https://sepolia.drpc.org')
      const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider)

      const [creator, question, options, isActive, resultsRevealed, createdAt, endTime, voteCount] = await contract.getPoll(pollId)

      let hasVoted = false
      if (isConnected && address) {
        try {
          hasVoted = await contract.hasVoted(pollId, address)
        } catch {
          // ignore
        }
      }

      let results: number[] | undefined
      if (resultsRevealed) {
        try {
          const [resultsData] = await contract.getResults(pollId)
          results = resultsData.map((r: any) => Number(r))
        } catch {
          // ignore
        }
      }

      setPoll({
        pollId: Number(pollId),
        creator,
        question,
        options,
        isActive,
        resultsRevealed,
        createdAt: Number(createdAt),
        endTime: Number(endTime),
        voteCount: Number(voteCount),
        hasVoted,
        results,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load poll')
    }
  }

  const castVote = async () => {
    if (!address || !isConnected || !poll || selectedOption === null || !relayerInstance) {
      setError('Please select an option and ensure relayer is initialized')
      return
    }

    if (poll.hasVoted) {
      setError('You have already voted')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          if (chainId !== '0xaa36a7') {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }],
              })
              await new Promise(resolve => setTimeout(resolve, 1000))
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }
      }

      const signer = await getSigner()
      const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, signer)

      if (!relayerInstance) {
        throw new Error('FHEVM relayer not initialized. Please wait for initialization or check configuration.')
      }

      // Validate contract address
      if (!ethers.isAddress(VOTING_CONTRACT_ADDRESS)) {
        throw new Error(`Invalid contract address: ${VOTING_CONTRACT_ADDRESS}`)
      }

      if (selectedOption < 0 || selectedOption > 255) {
        throw new Error('Invalid option value')
      }
      
      let encryptedInput
      try {
        const inputBuilder = relayerInstance.createEncryptedInput(VOTING_CONTRACT_ADDRESS, address)
        inputBuilder.add8(selectedOption)
        encryptedInput = await Promise.race([
          inputBuilder.encrypt(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Encryption timeout')), 30000)
          )
        ]) as any
      } catch (encryptError: any) {
        let errorMessage = encryptError?.message || 'Encryption failed'
        if (errorMessage.includes('JSON') || errorMessage.includes('Bad JSON')) {
          errorMessage = 'Relayer connection issue. Please try again.'
        }
        throw new Error(errorMessage)
      }
      
      if (!encryptedInput?.handles || encryptedInput.handles.length === 0) {
        throw new Error('Encryption failed: no handles returned')
      }
      
      if (!encryptedInput.inputProof) {
        throw new Error('Encryption failed: no proof returned')
      }

      const encryptedHandle = encryptedInput.handles[0]
      const attestation = encryptedInput.inputProof

      const tx = await contract.castVote(pollId, encryptedHandle, attestation)
      await tx.wait()
      await loadPoll()
    } catch (err: any) {
      let errorMessage = 'Failed to cast vote'
      
      if (err.message) {
        errorMessage = err.message
      } else if (err.reason) {
        errorMessage = err.reason
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err.toString) {
        errorMessage = err.toString()
      }
      
      // Clean up error messages
      if (errorMessage.includes('JSON') || errorMessage.includes('Bad JSON')) {
        errorMessage = 'Relayer connection error. Please check your internet connection and ensure you are on Sepolia testnet. The relayer service may be temporarily unavailable.'
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and ensure you are on Sepolia testnet.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!poll) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center">
        <div className="animate-spin text-6xl mb-6">⏳</div>
        <p className="text-gray-400 text-xl font-semibold">Loading poll...</p>
      </div>
    )
  }

  const isExpired = Date.now() / 1000 > poll.endTime
  const isCreator = poll.creator.toLowerCase() === address?.toLowerCase()

  return (
    <div className="glass-strong rounded-3xl p-10 animate-slide-in neon-border">
      {error && (
        <div className="mb-8 glass rounded-2xl p-6 border-2 border-red-600/50 bg-red-600/10">
          <p className="text-red-400 font-bold">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-4xl font-black text-white mb-6 gradient-text">{poll.question}</h2>
        <div className="flex items-center gap-6 text-sm">
          <span className="px-4 py-2 glass rounded-xl font-bold">📊 {poll.voteCount} votes</span>
          {isExpired ? (
            <span className="px-4 py-2 bg-red-600/20 text-red-400 rounded-xl font-bold border-2 border-red-600/50">⏰ Ended</span>
          ) : (
            <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl font-bold border-2 border-green-500/50">⏰ Active</span>
          )}
          {poll.resultsRevealed && <span className="px-4 py-2 bg-white/20 text-white rounded-xl font-bold border-2 border-white/50">✅ Results revealed</span>}
        </div>
      </div>

      {!poll.resultsRevealed && !poll.hasVoted && isConnected && !isExpired && (
        <div className="mb-8">
          <p className="text-white font-black text-xl mb-6">Select your vote:</p>
          <div className="space-y-4">
            {poll.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                disabled={loading}
                className={`w-full p-6 rounded-2xl text-left transition-all font-bold text-lg ${
                  selectedOption === index
                    ? 'gradient-bg text-white glow scale-105'
                    : 'glass text-gray-300 hover:bg-white/10 hover:scale-102'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            onClick={castVote}
            disabled={loading || selectedOption === null || !relayerInstance}
            className="mt-6 w-full px-8 py-5 rounded-2xl gradient-bg text-white font-black text-xl hover:opacity-90 transition disabled:opacity-50 glow-hover"
          >
            {loading ? 'Casting vote...' : '🔐 Cast Encrypted Vote'}
          </button>
        </div>
      )}

      {poll.hasVoted && !poll.resultsRevealed && (
        <div className="mb-8 glass rounded-2xl p-10 text-center border-2 border-green-500/50">
          <div className="text-6xl mb-4 animate-float">✅</div>
          <p className="text-white font-black text-2xl mb-2">You have voted!</p>
          <p className="text-gray-400 text-lg">Results will be revealed when poll ends</p>
        </div>
      )}

      {poll.resultsRevealed && poll.results && (
        <div className="mb-8">
          <h3 className="text-3xl font-black text-white mb-6 gradient-text">Results:</h3>
          <div className="space-y-5">
            {poll.options.map((option, index) => {
              const votes = poll.results![index]
              const total = poll.results!.reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? (votes / total) * 100 : 0

              return (
                <div key={index} className="glass rounded-2xl p-6 border-2 border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-black text-xl">{option}</span>
                    <span className="text-gray-400 font-bold">{votes} votes ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-4 overflow-hidden">
                    <div
                      className="gradient-bg h-4 rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isCreator && !poll.resultsRevealed && isExpired && (
        <div className="mt-8 glass rounded-2xl p-8 text-center border-2 border-yellow-500/50">
          <p className="text-gray-300 mb-4 text-lg font-bold">Poll has ended. Reveal results?</p>
          <p className="text-xs text-gray-500">
            Note: You need to calculate results using the relayer first, then call revealResults
          </p>
        </div>
      )}
    </div>
  )
}
