import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import GameNavigation from '@/components/GameNavigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VOTE FOR ME OR NOT | Secret Voting with Zama FHEVM',
  description: 'Create polls and vote with complete privacy using Fully Homomorphic Encryption. Your votes are encrypted and anonymous until results are revealed.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof global === 'undefined') {
                window.global = globalThis;
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          <GameNavigation />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
