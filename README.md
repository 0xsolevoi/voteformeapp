# VOTE FOR ME OR NOT

Secret voting app using Zama FHEVM. Your votes are encrypted and stay private until results are revealed.

## What is this?

Create polls, vote encrypted, see results. Simple as that.

Your vote gets encrypted before hitting the blockchain. Nobody can see what you voted for. When the poll ends, results get revealed and everyone can see the final counts.

## How to use

1. Get some Sepolia testnet ETH from a faucet
2. Connect your MetaMask wallet
3. Create a poll or vote in existing ones
4. That's it

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Setup

Create `.env.local`:

```
NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS=0x7C3D30D0050EC379833322e22893A92b97C1B447
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Contract

- Address: `0x7C3D30D0050EC379833322e22893A92b97C1B447`
- Network: Sepolia Testnet
- [View on Etherscan](https://sepolia.etherscan.io/address/0x7C3D30D0050EC379833322e22893A92b97C1B447)

## Tech

- Next.js
- TypeScript
- Tailwind CSS
- Wagmi & RainbowKit
- Hardhat
- Zama FHEVM

## Deploy contract

```bash
npm run deploy:voting
```

## Notes

- This is on Sepolia testnet - test ETH only
- Votes cost gas
- Needs Zama relayer for encryption
- Demo project - don't use for real voting

## Live

Deployed on Vercel: https://secret-voting-dapp.vercel.app

---

Made with Zama FHEVM
