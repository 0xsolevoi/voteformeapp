'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12 px-4 relative">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16 animate-slide-in">
          <h1 className="text-6xl md:text-8xl font-black mb-6 gradient-text">
            ABOUT
          </h1>
          <p className="text-xl text-gray-300">
            Learn more about Vote For Me Or Not
          </p>
        </div>

        <div className="space-y-10">
          <div className="glass-strong rounded-3xl p-12 animate-slide-in neon-border">
            <h2 className="text-4xl font-black text-white mb-6 gradient-text">What is this?</h2>
            <p className="text-gray-300 text-xl leading-relaxed">
              Vote For Me Or Not is a decentralized voting platform built on Ethereum using Zama's Fully Homomorphic Encryption (FHE) technology. 
              Unlike traditional voting systems, your votes are encrypted and stored on the blockchain, ensuring complete privacy during the voting process.
            </p>
          </div>

          <div className="glass-strong rounded-3xl p-12 animate-slide-in">
            <h2 className="text-4xl font-black text-white mb-8 gradient-text">How it works?</h2>
            <div className="space-y-6 text-gray-300">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-2xl font-black text-white mb-3">1. Create a Poll</h3>
                <p className="text-lg">Create a poll with a question and multiple options. Set the duration for voting.</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-2xl font-black text-white mb-3">2. Vote Encrypted</h3>
                <p className="text-lg">Voters submit their choices encrypted using Zama's FHE technology. No one can see individual votes.</p>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-2xl font-black text-white mb-3">3. Results Revealed</h3>
                <p className="text-lg">After the poll ends, the creator can reveal results. All votes are counted fairly on encrypted data.</p>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-12 animate-slide-in">
            <h2 className="text-4xl font-black text-white mb-8 gradient-text">Technology</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="text-2xl font-black text-white mb-3">Zama FHEVM</h3>
                <p className="text-gray-300">
                  Fully Homomorphic Encryption allows computations on encrypted data without decrypting it first. 
                  This means your votes stay private even on a public blockchain.
                </p>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-2xl font-black text-white mb-3">Ethereum Sepolia</h3>
                <p className="text-gray-300">
                  All polls are stored as smart contracts on the Sepolia testnet. 
                  This ensures transparency and immutability of voting results.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-12 animate-slide-in">
            <h2 className="text-4xl font-black text-white mb-8 gradient-text">Smart Contract</h2>
            <div className="glass rounded-2xl p-8">
              <h3 className="text-2xl font-black text-white mb-4">SecretVoting</h3>
              <p className="text-gray-300 text-lg mb-4">Smart contract for creating polls and casting encrypted votes.</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Address: <code className="bg-black/50 px-3 py-1 rounded-lg font-mono text-red-400">0x7C3D30D0050EC379833322e22893A92b97C1B447</code>
                </p>
                <p className="text-sm text-gray-400">
                  Network: Sepolia Testnet
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/voting"
              className="inline-block px-12 py-5 rounded-2xl gradient-bg text-white font-black text-xl hover:opacity-90 transition glow-hover"
            >
              Start Voting →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
