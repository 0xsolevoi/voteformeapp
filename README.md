# 🔐 Vote For Me Or Not

**Secret Voting Platform with Fully Homomorphic Encryption**

A decentralized voting application built on Ethereum that ensures complete privacy during the voting process using Zama's Fully Homomorphic Encryption (FHE) technology. Your votes are encrypted before being stored on-chain, and remain private until results are revealed.

---

## 🌐 Live Demo & Contract

<div align="center">

### 🚀 [**Try the Live Demo**](https://secret-voting-dapp.vercel.app)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-00D4AA?style=for-the-badge&logo=vercel)](https://secret-voting-dapp.vercel.app)

### 📄 [**View Smart Contract on Etherscan**](https://sepolia.etherscan.io/address/0x29E6AA7D4e9cef601cFACc46C556Ce0B56f0a71e)

[![Etherscan](https://img.shields.io/badge/Etherscan-View_Contract-627EEA?style=for-the-badge&logo=ethereum)](https://sepolia.etherscan.io/address/0x29E6AA7D4e9cef601cFACc46C556Ce0B56f0a71e)

**Contract Address:** `0x29E6AA7D4e9cef601cFACc46C556Ce0B56f0a71e`  
**Network:** Sepolia Testnet

</div>

---

## 🎯 Key Features

- **🔒 Encrypted Voting**: Votes are encrypted using FHE before being sent to the blockchain
- **👤 Complete Anonymity**: No one can see individual votes during the voting period
- **✅ Transparent Results**: Final results are revealed after the poll ends, ensuring fairness
- **⏰ Time-Limited Polls**: Poll creators set duration, polls automatically end after the deadline
- **📊 Live Poll Dashboard**: View active polls and their current status
- **🌐 Decentralized**: Built on Ethereum Sepolia testnet, fully decentralized
- **🎨 Modern UI**: Beautiful, responsive interface with smooth animations

---

## 🏗️ How It Works

### Architecture Overview

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Encrypt vote using Zama Relayer SDK
       ▼
┌─────────────────────┐
│  Zama FHE Relayer   │
│   (Encryption)      │
└──────┬──────────────┘
       │
       │ 2. Send encrypted handle (bytes32) + attestation
       ▼
┌─────────────────────┐
│  SecretVoting       │
│  Smart Contract     │
│  (Sepolia)          │
└──────┬──────────────┘
       │
       │ 3. Store encrypted votes on-chain
       ▼
┌─────────────────────┐
│  Ethereum Blockchain│
│  (Sepolia Testnet)  │
└─────────────────────┘
```

### Voting Flow

1. **Create Poll**: Poll creator sets up a question with multiple options and a duration
2. **Vote Encryption**: When a user votes, their choice is encrypted client-side using Zama FHE Relayer SDK
3. **On-Chain Storage**: The encrypted vote (as a `bytes32` handle) is stored on the blockchain
4. **Privacy Guaranteed**: During the voting period, no one can see individual votes
5. **Results Revelation**: After the poll ends, the creator reveals the aggregated results
6. **Transparency**: Everyone can see the final vote counts

### FHE Implementation

- Votes are encrypted using **Zama FHEVM Relayer SDK** before submission
- Encrypted handles are stored as `bytes32` on the smart contract
- Attestation proofs validate the encryption integrity
- Results are computed off-chain using the relayer, then posted on-chain
- The contract accepts `bytes32 encryptedVote` and `bytes attestation` parameters

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Ethereum wallet
- Sepolia testnet ETH (get from [faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd wallet-9

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=0x29E6AA7D4e9cef601cFACc46C556Ce0B56f0a71e
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_private_key_for_deployment
```

### Run Locally

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📝 Usage Guide

### Creating a Poll

1. Connect your wallet (MetaMask recommended)
2. Navigate to the "Voting" page
3. Enter your question and add options (2-10 options)
4. Set the poll duration
5. Click "Create Poll" - your poll is now live!

### Voting

1. Browse active polls on the home page or voting page
2. Click on a poll you want to vote in
3. Select your preferred option
4. Click "Cast Encrypted Vote"
5. Confirm the transaction in your wallet
6. Your encrypted vote is now stored on-chain!

### Revealing Results

1. Poll creators can reveal results after the poll ends
2. Results are computed off-chain using the FHE relayer
3. Once revealed, everyone can see the final vote counts

---

## 📄 Smart Contract

### SecretVoting Contract

**Address**: `0x29E6AA7D4e9cef601cFACc46C556Ce0B56f0a71e`  
**Network**: Sepolia Testnet  
**Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x29E6AA7D4e9cef601cFACc46C556Ce0B56f0a71e)

### Key Functions

- `createPoll(question, options[], duration)` - Create a new poll
- `castVote(pollId, encryptedVote, attestation)` - Cast an encrypted vote
- `revealResults(pollId, results[])` - Reveal poll results (creator only)
- `getPoll(pollId)` - Get poll information
- `getResults(pollId)` - Get revealed results

### Contract Details

The contract uses FHE handles (`bytes32`) to store encrypted votes. Each vote is encrypted client-side before submission, ensuring privacy throughout the voting process.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Wagmi** - React Hooks for Ethereum
- **RainbowKit** - Wallet connection UI
- **Zama FHEVM Relayer SDK** - FHE encryption

### Smart Contracts
- **Solidity ^0.8.20** - Smart contract language
- **Hardhat** - Development environment
- **Ethers.js** - Ethereum library

### Infrastructure
- **Vercel** - Hosting and deployment
- **Sepolia Testnet** - Ethereum test network

---

## 🧪 Development

### Compile Contracts

```bash
npm run compile
```

### Deploy Contract

```bash
# Using Hardhat
npm run deploy:voting

# Or using the simple deployment script
PRIVATE_KEY=your_key node scripts/deploy-voting-simple.js
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🌐 Deployment

### Live Application

The application is deployed on Vercel:
- **Production**: [https://secret-voting-dapp.vercel.app](https://secret-voting-dapp.vercel.app)

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## ⚠️ Important Notes

- **Testnet Only**: This is deployed on Sepolia testnet - use test ETH only
- **Gas Costs**: Each vote requires a transaction and costs gas
- **Relayer Required**: FHE encryption requires the Zama relayer to be accessible
- **Demo Project**: This is a demonstration project - do not use for real voting systems
- **Privacy**: Individual votes remain private until results are revealed

---

## 🔐 Security Considerations

- Votes are encrypted using industry-standard FHE technology
- Encrypted handles are stored on-chain, ensuring immutability
- Attestation proofs validate encryption integrity
- Only poll creators can reveal results after polls end
- All transactions are publicly verifiable on the blockchain

---

## 📚 Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [Ethereum Sepolia Testnet](https://sepolia.dev)
- [Solidity Documentation](https://docs.soliditylang.org)

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

Built with [Zama FHEVM](https://www.zama.ai/) - Making privacy-preserving blockchain applications possible.

---

## 📞 Support

For issues, questions, or contributions, please open an issue in the repository.
