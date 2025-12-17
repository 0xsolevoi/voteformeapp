'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function GameNavigation() {
  const pathname = usePathname()

  return (
    <header className="w-full border-b border-white/10 bg-black/40 backdrop-blur-2xl sticky top-0 z-50">
      <div className="container mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-2xl font-black group-hover:scale-110 group-hover:rotate-12 transition-all glow">
            🗳️
          </div>
          <span className="text-2xl font-black gradient-text">Vote For Me Or Not</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link
            href="/"
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              pathname === '/'
                ? 'gradient-bg text-white glow'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Home
          </Link>
          <Link
            href="/voting"
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              pathname === '/voting'
                ? 'gradient-bg text-white glow'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Voting
          </Link>
          <Link
            href="/about"
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              pathname === '/about'
                ? 'gradient-bg text-white glow'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            About
          </Link>
        </nav>

        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
