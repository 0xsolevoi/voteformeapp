'use client'

import { useAccount } from 'wagmi'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ethers } from 'ethers'
import { getProvider, getSigner } from '@/lib/provider'
import VotingPoll from '@/components/VotingPoll'
import Link from 'next/link'

const VOTING_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS || '0x7C3D30D0050EC379833322e22893A92b97C1B447').trim()

const VOTING_ABI = [
  'function createPoll(string memory question, string[] memory options, uint256 duration) external returns (uint256)',
  'function getUserPolls(address user) external view returns (uint256[])',
  'function getUserVotes(address user) external view returns (uint256[])',
  'function getPoll(uint256 pollId) external view returns (address creator, string memory question, string[] memory options, bool isActive, bool resultsRevealed, uint256 createdAt, uint256 endTime, uint256 voteCount)',
  'function pollCounter() external view returns (uint256)',
  'event PollCreated(uint256 indexed pollId, address indexed creator, string question, uint256 endTime)',
]

function VotingPageContent() {
  const { address, isConnected } = useAccount()
  const searchParams = useSearchParams()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [polls, setPolls] = useState<number[]>([])
  const [selectedPoll, setSelectedPoll] = useState<number | null>(null)
  const [pollIdInput, setPollIdInput] = useState('')

  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [duration, setDuration] = useState(3600)

  useEffect(() => {
    const pollParam = searchParams.get('poll')
    if (pollParam) {
      const pollId = parseInt(pollParam)
      if (!isNaN(pollId) && pollId >= 0) {
        setSelectedPoll(pollId)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (isConnected && address) {
      loadAllPolls()
    } else {
      setPolls([])
    }
  }, [isConnected, address])

  const loadAllPolls = async () => {
    if (!address || !isConnected) return

    try {
      const provider = getProvider()
      const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, provider)
      
      const userPolls = await contract.getUserPolls(address)
      const createdPolls = userPolls.map((id: any) => Number(id))
      
      const userVotes = await contract.getUserVotes(address)
      const votedPolls = userVotes.map((id: any) => Number(id))
      
      const allPolls = [...new Set([...createdPolls, ...votedPolls])]
      
      try {
        const pollCounter = await contract.pollCounter()
        const totalPolls = Number(pollCounter)
        const recentPolls: number[] = []
        
        const startId = Math.max(0, totalPolls - 20)
        for (let i = startId; i < totalPolls; i++) {
          try {
            const poll = await contract.getPoll(i)
            if (poll && poll.creator && poll.creator !== '0x0000000000000000000000000000000000000000') {
              recentPolls.push(i)
            }
          } catch {
            continue
          }
        }
        
        const combinedPolls = [...new Set([...allPolls, ...recentPolls])]
        combinedPolls.sort((a, b) => b - a)
        setPolls(combinedPolls)
      } catch {
        allPolls.sort((a, b) => b - a)
        setPolls(allPolls)
      }
    } catch (err: any) {
      console.error('Error loading polls:', err)
    }
  }

  const createPoll = async () => {
    if (!address || !isConnected) {
      setError('Please connect your wallet')
      return
    }

    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    const validOptions = options.filter(opt => opt.trim())
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const signer = await getSigner()
      const contract = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VOTING_ABI, signer)

      const tx = await contract.createPoll(question, validOptions, duration)
      const receipt = await tx.wait()

      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'PollCreated'
        } catch {
          return false
        }
      })

      if (event) {
        const parsed = contract.interface.parseLog(event)
        const pollId = Number(parsed?.args.pollId)
        await loadAllPolls()
        setSelectedPoll(pollId)
        setShowCreateForm(false)
        setQuestion('')
        setOptions(['', ''])
        console.log('✅ Poll created:', pollId)
      }
    } catch (err: any) {
      console.error('Error creating poll:', err)
      setError(err.message || 'Failed to create poll')
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center glass-strong rounded-3xl p-16 max-w-md w-full">
          <div className="text-8xl mb-8 animate-float">🔐</div>
          <h2 className="text-4xl font-black text-white mb-6">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-10 text-lg">
            Connect your wallet to start creating and voting in secret polls
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-4 rounded-xl gradient-bg text-white font-bold hover:opacity-90 transition glow-hover"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 relative">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 animate-slide-in">
          <h1 className="text-6xl md:text-8xl font-black mb-6 gradient-text">
            VOTING
          </h1>
          <p className="text-xl text-gray-300">
            Create polls. Vote encrypted. Stay anonymous.
          </p>
        </div>

        {error && (
          <div className="mb-8 glass rounded-2xl p-6 border-2 border-red-600/50 bg-red-600/10">
            <p className="text-red-400 font-bold text-lg">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-10 py-4 rounded-2xl gradient-bg text-white font-black text-lg hover:opacity-90 transition glow-hover"
          >
            {showCreateForm ? '✖ Cancel' : '✨ Create New Poll'}
          </button>
          <div className="flex gap-2">
            <input
              type="number"
              value={pollIdInput}
              onChange={(e) => setPollIdInput(e.target.value)}
              placeholder="Enter Poll ID"
              className="px-6 py-4 bg-black/50 text-white rounded-2xl border-2 border-white/10 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 font-semibold"
            />
            <button
              onClick={() => {
                const id = parseInt(pollIdInput)
                if (!isNaN(id) && id >= 0) {
                  setSelectedPoll(id)
                  setPollIdInput('')
                }
              }}
              className="px-8 py-4 rounded-2xl glass text-white font-bold hover:bg-white/10 transition"
            >
              View
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="glass-strong rounded-3xl p-10 mb-10 animate-slide-in neon-border">
            <h2 className="text-3xl font-black text-white mb-8 gradient-text">Create Poll</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3">
                  Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What is your favorite color?"
                  className="w-full px-6 py-4 bg-black/50 text-white rounded-2xl border-2 border-white/10 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 font-semibold text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3">
                  Options
                </label>
                {options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options]
                      newOptions[index] = e.target.value
                      setOptions(newOptions)
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="w-full px-6 py-4 bg-black/50 text-white rounded-2xl border-2 border-white/10 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 mb-3 font-semibold"
                  />
                ))}
                <div className="flex gap-3 mt-3">
                  {options.length < 10 && (
                    <button
                      onClick={() => setOptions([...options, ''])}
                      className="px-6 py-3 glass rounded-xl text-white font-bold hover:bg-white/10 transition"
                    >
                      + Add Option
                    </button>
                  )}
                  {options.length > 2 && (
                    <button
                      onClick={() => setOptions(options.slice(0, -1))}
                      className="px-6 py-3 glass rounded-xl text-white font-bold hover:bg-white/10 transition"
                    >
                      - Remove
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={60}
                  className="w-full px-6 py-4 bg-black/50 text-white rounded-2xl border-2 border-white/10 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/50 font-semibold"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Examples: 3600 (1 hour), 86400 (1 day), 604800 (1 week)
                </p>
              </div>

              <button
                onClick={createPoll}
                disabled={loading}
                className="w-full px-8 py-5 rounded-2xl gradient-bg text-white font-black text-xl hover:opacity-90 transition disabled:opacity-50 glow-hover"
              >
                {loading ? 'Creating...' : '🚀 Create Poll'}
              </button>
            </div>
          </div>
        )}

        {polls.length > 0 && (
          <div className="glass-strong rounded-3xl p-8 mb-10">
            <h3 className="text-2xl font-black text-white mb-6 gradient-text">Available Polls</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {polls.map((pollId) => (
                <button
                  key={pollId}
                  onClick={() => setSelectedPoll(pollId)}
                  className={`p-6 rounded-2xl transition-all font-black text-lg ${
                    selectedPoll === pollId
                      ? 'gradient-bg text-white glow scale-105'
                      : 'glass text-gray-300 hover:bg-white/10 hover:scale-105'
                  }`}
                >
                  <div className="text-3xl mb-2">📊</div>
                  <div>Poll #{pollId}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedPoll !== null ? (
          <VotingPoll pollId={selectedPoll} />
        ) : (
          <div className="glass-strong rounded-3xl p-16 text-center">
            <div className="text-8xl mb-6 animate-float">🗳️</div>
            <p className="text-gray-300 text-2xl mb-4 font-bold">No poll selected</p>
            <p className="text-gray-500 mb-6">
              Create a new poll or enter a poll ID to view it
            </p>
            <div className="text-sm text-gray-600 space-y-2">
              <p>✨ Create polls with encrypted votes</p>
              <p>🔐 Vote anonymously on blockchain</p>
              <p>📊 See results when poll ends</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VotingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-6">⏳</div>
          <p className="text-gray-400 text-xl">Loading...</p>
        </div>
      </div>
    }>
      <VotingPageContent />
    </Suspense>
  )
}
