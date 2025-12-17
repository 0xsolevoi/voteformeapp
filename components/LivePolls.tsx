'use client'

import { useState, useEffect } from 'react'
import { ethers, JsonRpcProvider } from 'ethers'
import Link from 'next/link'

interface PollInfo {
  pollId: number
  question: string
  options: string[]
  endTime: number
  voteCount: number
  isActive: boolean
}

const VOTING_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS || '0x7C3D30D0050EC379833322e22893A92b97C1B447').trim()

const VOTING_ABI = [
  'function getPoll(uint256 pollId) external view returns (address creator, string memory question, string[] memory options, bool isActive, bool resultsRevealed, uint256 createdAt, uint256 endTime, uint256 voteCount)',
  'function pollCounter() external view returns (uint256)',
]

export default function LivePolls() {
  const [polls, setPolls] = useState<PollInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait a bit for the page to fully load before trying to fetch polls
    const initialTimeout = setTimeout(() => {
      loadLivePolls()
    }, 1000)
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadLivePolls()
    }, 30000)
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const loadLivePolls = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!ethers.isAddress(VOTING_CONTRACT_ADDRESS)) {
        throw new Error('Invalid contract address')
      }
      
      const provider = new JsonRpcProvider('https://sepolia.drpc.org')
      const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider)

      let totalPolls = 0
      try {
        const pollCounter = await contract.pollCounter()
        totalPolls = Number(pollCounter)
      } catch {
        totalPolls = 100
      }

      if (totalPolls === 0) {
        setPolls([])
        setLoading(false)
        return
      }

      const livePolls: PollInfo[] = []
      const currentTime = Math.floor(Date.now() / 1000)
      const startCheck = Math.max(0, totalPolls - 100)
      let foundPolls = 0
      let consecutiveErrors = 0
      
      for (let i = totalPolls - 1; i >= startCheck && consecutiveErrors < 10; i--) {
        try {
          const [creator, question, options, isActive, resultsRevealed, createdAt, endTime, voteCount] = await contract.getPoll(i)
          consecutiveErrors = 0
          
          const endTimeNum = Number(endTime)
          const isNotEnded = endTimeNum > currentTime
          const hasValidCreator = creator && creator !== '0x0000000000000000000000000000000000000000'
          
          if (isActive && !resultsRevealed && isNotEnded && hasValidCreator) {
            livePolls.push({
              pollId: i,
              question,
              options,
              endTime: endTimeNum,
              voteCount: Number(voteCount),
              isActive: true,
            })
            foundPolls++
            if (foundPolls >= 20) break
          }
        } catch {
          consecutiveErrors++
          if (consecutiveErrors >= 10) break
        }
      }

      livePolls.sort((a, b) => b.pollId - a.pollId)
      setPolls(livePolls)
    } catch (err: any) {
      console.error('❌ Error loading live polls:', err)
      setError(err.message || 'Failed to load polls')
      setPolls([])
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000)
    const remaining = endTime - now

    if (remaining <= 0) return 'Ended'

    const days = Math.floor(remaining / 86400)
    const hours = Math.floor((remaining % 86400) / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading && polls.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center">
        <div className="animate-spin text-6xl mb-6">⏳</div>
        <p className="text-gray-400 text-xl font-semibold">Loading polls...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <p className="text-red-400 text-xl mb-4 font-bold">Error loading polls</p>
        <p className="text-gray-500 mb-6 text-sm">{error}</p>
        <button
          onClick={loadLivePolls}
          className="inline-block px-8 py-4 rounded-xl gradient-bg text-white font-bold hover:opacity-90 transition glow-hover"
        >
          Retry
        </button>
      </div>
    )
  }

  if (polls.length === 0) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center">
        <div className="text-6xl mb-6">📊</div>
        <p className="text-gray-300 text-2xl mb-4 font-bold">No active polls</p>
        <p className="text-gray-500 mb-6">
          Be the first to create a poll!
        </p>
        <Link
          href="/voting"
          className="inline-block px-8 py-4 rounded-xl gradient-bg text-white font-bold hover:opacity-90 transition glow-hover"
        >
          Create Poll →
        </Link>
      </div>
    )
  }

  return (
    <div className="glass-strong rounded-3xl p-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-black text-white gradient-text">
          🔴 Live Polls
        </h2>
        <button
          onClick={loadLivePolls}
          disabled={loading}
          className="px-4 py-2 glass rounded-xl text-white font-bold hover:bg-white/10 transition disabled:opacity-50 text-sm"
          title="Refresh polls"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>
      <div className="space-y-4">
        {polls.map((poll) => (
          <Link
            key={poll.pollId}
            href={`/voting?poll=${poll.pollId}`}
            className="block glass rounded-2xl p-6 hover:bg-white/5 transition-all border-2 border-white/10 hover:border-red-600/50"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-black text-white flex-1 pr-4">
                {poll.question}
              </h3>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg font-bold text-sm border-2 border-green-500/50">
                  🔴 Live
                </span>
                <span className="px-3 py-1 glass rounded-lg font-bold text-sm text-gray-300">
                  ⏰ {formatTimeRemaining(poll.endTime)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>📊 {poll.voteCount} votes</span>
                <span>📝 {poll.options.length} options</span>
              </div>
              <span className="text-red-400 font-bold text-sm hover:text-red-300 transition">
                Vote Now →
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/voting"
          className="inline-block px-8 py-4 rounded-xl gradient-bg text-white font-bold hover:opacity-90 transition glow-hover"
        >
          View All Polls →
        </Link>
      </div>
    </div>
  )
}

