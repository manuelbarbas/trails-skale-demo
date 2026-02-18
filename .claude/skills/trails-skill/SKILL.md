---
name: trails
description: Trails is an **intent-powered orchestration protocol** that enables **1-click transactions** from any wallet, with any token, across any EVM chain. It aggregates all user balances across every chain and token in a user's wallet as options for any transaction. Built by [Sequence](https://sequence.xyz), Trails acts as a multichain transaction orchestration layer powered by intents that unifies all chains and automates token routing — all with a single end-user confirmation.
---

# Trails

## What is Trails?

Trails is an **intent-powered orchestration protocol** that enables **1-click transactions** from any wallet, with any token, across any EVM chain. It aggregates all user balances across every chain and token in a user's wallet as options for any transaction. Built by [Sequence](https://sequence.xyz), Trails acts as a multichain transaction orchestration layer powered by intents that unifies all chains and automates token routing — all with a single end-user confirmation.

Trails is **free to integrate** and works with virtually all wallets through wagmi connectors (MetaMask, Coinbase Wallet, Privy, Sequence, etc.). EIP-7702 is **not required**.

---

## Key Features

### 1-Click Transactions
Transactions occur in a single confirmation with any wallet (EOA, smart wallet, or EIP-7702). Developers specify a payment intent (e.g., "purchase NFT #123 with 30 USDC") and users select any token across their wallet balance to pay.

### Universal User Liquidity
Built-in multichain, real-time indexing automatically returns user wallet balances, prices, and asset metadata. Leverages existing liquidity infrastructure (DEXs, bridges, aggregators) for a vast array of tokens and chains.

### Alt Fee Tokens (Gas in Any Token)
Users can pay gas fees in any permit-compatible (EIP-2612) token like USDC or USDT, removing the need for native tokens on each chain.

### Aggregated Liquidity
Trails integrates with multiple liquidity sources (Circle CCTP, Relay, LiFi) and selects optimal routes based on speed, cost, and reliability. New providers can be added without code changes.

### Cross-Chain Execution
Trails can execute arbitrary smart contract functions on the destination chain (NFT mints, DeFi deposits, staking, etc.) as part of the same 1-click transaction flow using `toCalldata`.

### Automatic Refunds
If a transaction fails on the source chain, the user gets a full refund (minus gas). If it fails on the destination chain, assets are refunded to the sender address on the destination chain.

---

## How Trails Works

1. **App Defines Intent**: Create a payment transaction (mint, deposit, swap, etc.) for any chain in any token.
2. **Trails Inspects**: Can this succeed with assets on the current chain? Yes = Direct Call. No = Continue Orchestration.
3. **User Selects Route**: Trails presents an aggregated balance of the user's assets across all chains.
4. **Intent Address Generation**: A unique intent contract address is computed based on the full transaction orchestration. The user's wallet is the only party with control over this address.
5. **Origin Transfer**: User sends a single transaction to deposit tokens into the intent address — **the only transaction the user signs**.
6. **Relayer Execution**: Trails relayers execute the encoded transactions on origin and destination chains using merkle proofs. Relayers cannot alter transaction contents — they can only submit pre-committed, verifiable calls.
7. **Final Settlement**: Funds arrive on the destination chain and the final action (send, mint, deposit, etc.) is executed.

Under the hood, Trails intents are counterfactual instantiations of Sequence v3 account abstraction contracts using merkle tree-based execution models.

---

## Widget Modes

| Mode | Description |
|------|-------------|
| **Pay** | Cross-chain, 1-click payments with any token. Ideal for ecommerce, NFT marketplaces, stablecoin transactions. |
| **Swap** | Cross-chain token swaps with low latency and high liquidity. |
| **Fund** | Maximize TVL and transaction velocity via fiat or crypto deposits (perpetual exchanges, prediction markets, chain onboarding). |
| **Earn** | Streamline DeFi yield deposits into vaults, lending pools, and yield strategies from any token on any chain. |
| **Withdraw** | Withdraw assets with a guided, fee-aware flow. |

---

## Quickstart

### Install

```bash
npm install 0xtrails
# or: pnpm add 0xtrails / yarn add 0xtrails / bun add 0xtrails
```

### Basic Widget (Pay Mode)

```tsx
import { TrailsWidget } from '0xtrails/widget'

export function Checkout() {
  return (
    <TrailsWidget
      apiKey="YOUR_API_KEY"
      mode="pay"
      toAddress="0xYourMerchantAddress"
      toAmount="10"
      toChainId={8453}
      toToken="USDC"
      onCheckoutComplete={({ sessionId }) => {
        console.log('Payment completed:', sessionId)
      }}
    />
  )
}
```

User pays with any token from any chain → You receive exactly 10 USDC on Base.

### Swap Mode

```tsx
<TrailsWidget
  apiKey="YOUR_API_KEY"
  mode="swap"
  onCheckoutComplete={({ sessionId }) => {
    console.log('Swap completed:', sessionId)
  }}
>
  <button>Swap Tokens</button>
</TrailsWidget>
```

### Fund Mode

```tsx
<TrailsWidget
  apiKey="YOUR_API_KEY"
  mode="fund"
  toAddress="0xRecipient"
  toChainId={8453}
  toToken="USDC"
>
  <button>Add Funds</button>
</TrailsWidget>
```

### Earn Mode (DeFi Deposits)

```tsx
<TrailsWidget
  apiKey="YOUR_API_KEY"
  mode="earn"
  renderInline={true}
  theme="auto"
/>
```

---

## Core Configuration Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your Trails API key |
| `mode` | `"pay" \| "fund" \| "earn" \| "swap" \| "withdraw"` | Yes | Widget operation mode |
| `toAddress` | `string` | No | Destination address |
| `toAmount` | `string` | No | Exact amount for payments |
| `toChainId` | `number \| string` | No | Destination chain ID |
| `toToken` | `string` | No | Destination token symbol or address |
| `toCalldata` | `string` | No | Custom calldata for contract interactions |
| `fromChainId` | `number \| string` | No | Default origin chain ID |
| `fromToken` | `string` | No | Default origin token |
| `theme` | `"light" \| "dark" \| "auto"` | No | Color theme |
| `customCss` | `string \| Record<string, string>` | No | Custom CSS variables |
| `renderInline` | `boolean` | No | Render inline instead of modal |
| `slippageTolerance` | `number \| string` | No | Slippage tolerance (e.g., 0.005 for 0.5%) |
| `swapProvider` | `RouteProvider` | No | `"AUTO"`, `"LIFI"`, `"RELAY"`, `"SUSHI"`, `"ZEROX"`, `"CCTP"` |
| `bridgeProvider` | `RouteProvider` | No | `"AUTO"`, `"LIFI"`, `"RELAY"`, `"CCTP"` |

---

## Cross-Chain Execution with Custom Calldata

Execute arbitrary smart contract functions on the destination chain:

```tsx
import { TrailsWidget } from '0xtrails/widget'
import { encodeFunctionData } from 'viem'

const mintCalldata = encodeFunctionData({
  abi: [{
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: [],
  }],
  functionName: 'mint',
  args: ['0xUserAddress'],
})

<TrailsWidget
  apiKey="YOUR_API_KEY"
  mode="pay"
  toAddress="0xNFTContract"
  toAmount="0.01"
  toChainId={8453} // Base
  toToken="ETH"
  toCalldata={mintCalldata}
>
  <button>Mint NFT</button>
</TrailsWidget>
```

For dynamic amounts at execution time, use `TRAILS_ROUTER_PLACEHOLDER_AMOUNT`:

```tsx
import { TRAILS_ROUTER_PLACEHOLDER_AMOUNT } from '0xtrails'

const supplyCalldata = encodeFunctionData({
  abi: aaveABI,
  functionName: 'supply',
  args: ['0xUSDCAddress', TRAILS_ROUTER_PLACEHOLDER_AMOUNT, '0xUserAddress', 0],
})
```

---

## Adding a Custom Chain

Trails supports any EVM-compatible chain. To add a custom chain to your widget integration, configure it in your wagmi setup:

```tsx
import { createConfig, http, WagmiProvider } from 'wagmi'
import { mainnet, base, arbitrum } from 'wagmi/chains'

const config = createConfig({
  chains: [mainnet, base, arbitrum], // Add your desired chains here
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
})

export function App() {
  return (
    <WagmiProvider config={config}>
      <TrailsWidget
        apiKey="YOUR_API_KEY"
        mode="pay"
        toAddress="0x..."
        toAmount="1000"
        toChainId={42161} // Target chain
        toToken="USDC"
      />
    </WagmiProvider>
  )
}
```

Trails' relayer and indexing infrastructure is lightweight and easily deployable to new chains. The protocol's pluggable architecture means new bridges, DEXs, and solvers can be integrated without code changes. To request support for a new chain or integrate your bridge/DEX, contact the team via the [Trails Telegram group](https://t.me/build_with_trails).

---

## Route Providers

| Provider | Type | Best For |
|----------|------|----------|
| **AUTO** (default) | Automatic | Let Trails optimize the route |
| **LIFI** | Aggregator | Multi-bridge aggregation, wide token support |
| **RELAY** | Bridge/Solver | Fast cross-chain transfers |
| **CCTP** | Bridge | Native USDC 1:1 transfers (no slippage) |
| **SUSHI** | DEX | On-chain swaps via SushiSwap |
| **ZEROX** | DEX Aggregator | Aggregated DEX liquidity |

---

## Event Handling

```tsx
<TrailsWidget
  apiKey="YOUR_API_KEY"
  mode="pay"
  toAddress="0x..."
  toAmount="1"
  toChainId={8453}
  toToken="USDC"
  onOriginConfirmation={({ txHash, chainId, sessionId }) => {
    console.log('Origin tx confirmed:', txHash)
  }}
  onDestinationConfirmation={({ txHash, chainId, sessionId }) => {
    console.log('Destination tx confirmed:', txHash)
  }}
  onCheckoutComplete={({ sessionId }) => {
    console.log('Transaction completed:', sessionId)
  }}
  onCheckoutError={({ sessionId, error }) => {
    console.error('Transaction failed:', error)
  }}
/>
```

---

## Headless Usage (useQuote Hook)

For custom UIs, use the `useQuote` hook with `TrailsProvider`:

```tsx
import { useQuote, TradeType } from '0xtrails'

const { quote, swap, isLoadingQuote } = useQuote({
  walletClient,
  fromTokenAddress: '0x...',
  fromChainId: 1,
  toTokenAddress: '0x...',
  toChainId: 8453,
  swapAmount: '1000000',
  tradeType: TradeType.EXACT_INPUT,
  toRecipient: address,
  slippageTolerance: '0.005',
})
```

---

## Smart Contracts

- **TrailsRouter** — Main routing contract for intent execution
- **TrailsIntentEntrypoint** — Entry point for intent deposits with permit support
- **TrailsRouterShim** — Execution wrapper with sentinel tracking

All contracts are deployed via ERC-2470 Singleton Factory for deterministic addresses. Source code: [github.com/0xsequence/trails-contracts](https://github.com/0xsequence/trails-contracts)

---

## Key Resources

- **API Key**: Join the [Trails Telegram](https://t.me/build_with_trails) to request access
- **Live Demo**: [demo.trails.build/widget](https://demo.trails.build/widget)
- **React Starter**: [github.com/0xsequence-demos/trails-starter](https://github.com/0xsequence-demos/trails-starter)
- **Next.js Starter**: [github.com/0xsequence-demos/trails-nextjs-starter](https://github.com/0xsequence-demos/trails-nextjs-starter)
- **LLM Integration**: Trails provides an `llms.txt` at [docs.trails.build/llms.txt](https://docs.trails.build/llms.txt) and an MCP server at `https://docs.trails.build/mcp`
- **Docs**: [docs.trails.build](https://docs.trails.build)

---
