

Let me search for information about the Trails API to create a comprehensive SKILL.md.Here's a comprehensive **SKILL.md** for the Trails API:

---

# SKILL.md — Trails API

## What is the Trails API?

The Trails API is a backend service for cross-chain token swaps, deposits, payments, and smart contract executions using the Trails intent protocol. It enables developers to programmatically orchestrate cross-chain transactions without the widget UI.

**Base URL:** `https://trails-api.sequence.app`

**Authentication:** All requests require an `X-Access-Key` header with your API key.

---

## API SDK

Install the typed TypeScript/JavaScript client:

```bash
pnpm install @0xtrails/api
# or: npm install @0xtrails/api / yarn add @0xtrails/api / bun add @0xtrails/api
```

Initialize:

```typescript
import { TrailsApi } from '@0xtrails/api'

const trailsApi = new TrailsApi('YOUR_API_KEY')
```

---

## Intent Lifecycle

Every Trails transaction follows this lifecycle:

```
QuoteIntent → CommitIntent → ExecuteIntent → WaitIntentReceipt/GetIntentReceipt
```

### Intent Statuses

| Status | Description |
|--------|-------------|
| `QUOTED` | Initial quote generated |
| `COMMITTED` | Intent committed, ready for execution |
| `EXECUTING` | Currently executing cross-chain |
| `FAILED` | Execution failed |
| `SUCCEEDED` | Successfully completed |

---

## Core Endpoints

### 1. QuoteIntent

**`POST /rpc/Trails/QuoteIntent`**

Get a quote for a cross-chain transaction.

```typescript
import { TradeType, RouteProvider } from '@0xtrails/api'

const { intent, gasFeeOptions } = await trailsApi.quoteIntent({
  ownerAddress: '0x0709CF2d5D4f3D38f5948d697fE64d7FB3639Eb1',
  originChainId: 42161,                                          // Arbitrum
  originTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
  originTokenAmount: 100000000n,                                 // 100 USDC
  destinationChainId: 8453,                                      // Base
  destinationTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  destinationToAddress: '0x0709CF2d5D4f3D38f5948d697fE64d7FB3639Eb1',
  tradeType: TradeType.EXACT_INPUT,
  options: {
    slippageTolerance: 0.005,
    bridgeProvider: RouteProvider.RELAY
  }
})
```

**Trade Types:**
- `EXACT_INPUT` — User specifies exact amount to spend; output varies
- `EXACT_OUTPUT` — User specifies exact amount to receive; input varies

**Raw HTTP:**

```typescript
const response = await fetch('https://trails-api.sequence.app/rpc/Trails/QuoteIntent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Access-Key': 'YOUR_ACCESS_KEY'
  },
  body: JSON.stringify(quoteRequest)
})

const { intent, gasFeeOptions } = await response.json()
```

---

### 2. CommitIntent

**`POST /rpc/Trails/CommitIntent`**

Lock in a quote and prepare for execution. The intent object from `QuoteIntent` must not be modified.

```typescript
const { intentId } = await trailsApi.commitIntent({ intent })
```

> **Warning:** Committed intents must be executed within **10 minutes**.

---

### 3. ExecuteIntent

**`POST /rpc/Trails/ExecuteIntent`**

Execute a committed intent. Two execution modes:

#### Mode 1: With Deposit Transaction Hash

User sends tokens to the intent address first, then provides the tx hash:

```typescript
import { encodeFunctionData } from 'viem'

// Step 1: User deposits tokens to intent address
const depositTx = await walletClient.sendTransaction({
  to: intent.depositTransaction.tokenAddress,
  value: 0n,
  data: encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [
      intent.depositTransaction.toAddress,
      BigInt(intent.depositTransaction.amount)
    ]
  })
})

// Step 2: Execute with deposit hash
const { intentStatus } = await trailsApi.executeIntent({
  intentId,
  depositTransactionHash: depositTx
})
```

#### Mode 2: With Deposit Signature (Gasless)

For permit-compatible tokens (USDC, USDT), users sign instead of sending a transaction:

```typescript
const { intentStatus } = await trailsApi.executeIntent({
  intentId,
  depositSignature: {
    intentSignature: signature,
    selectedGasFeeOption: gasFeeOptions.feeOptions[0],
    userNonce: 1,
    deadline: Math.floor(Date.now() / 1000) + 3600
  }
})
```

**DepositSignature Fields:**
- `intentSignature` — EIP-712 signature of the intent
- `permitSignature` — ERC-2612 permit signature (if applicable)
- `permitDeadline` — Permit expiration timestamp
- `permitAmount` — Amount authorized by permit
- `selectedGasFeeOption` — Selected gas fee payment option
- `userNonce` — User's nonce for replay protection
- `deadline` — Signature expiration timestamp

---

### 4. WaitIntentReceipt

**`POST /rpc/Trails/WaitIntentReceipt`**

Stream/wait for intent completion (blocking call):

```typescript
const receipt = await trailsApi.waitIntentReceipt({ intentId })
console.log('Completed:', receipt)
```

---

### 5. GetIntentReceipt

**`POST /rpc/Trails/GetIntentReceipt`**

Poll for intent receipt (non-blocking):

```typescript
const { intentReceipt } = await trailsApi.getIntentReceipt({ intentId })

console.log('Status:', intentReceipt.status)
console.log('Deposit TX:', intentReceipt.depositTransaction.txnHash)
console.log('Origin TX:', intentReceipt.originTransaction.txnHash)
console.log('Destination TX:', intentReceipt.destinationTransaction.txnHash)
```

**IntentReceipt Structure:**
- `intentId` — Unique intent identifier
- `status` — `QUOTED | COMMITTED | EXECUTING | FAILED | SUCCEEDED`
- `ownerAddress` — Wallet that initiated the intent
- `originChainId` / `destinationChainId` — Chain IDs
- `depositTransaction` / `originTransaction` / `destinationTransaction` — Transaction details

**Transaction Status Values:**
`UNKNOWN` → `PENDING` → `RELAYING` → `RELAYED` → `MINING` → `SUCCEEDED` / `FAILED`

**Polling Pattern:**

```typescript
async function pollReceipt(intentId: string, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const { intentReceipt } = await trailsApi.getIntentReceipt({ intentId })
    
    if (intentReceipt.status === 'SUCCEEDED') return intentReceipt
    if (intentReceipt.status === 'FAILED') {
      throw new Error(intentReceipt.originTransaction.statusReason)
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  throw new Error('Timeout')
}
```

---

### 6. GetIntent

**`POST /rpc/Trails/GetIntent`**

Retrieve full intent details by ID:

```typescript
const { intent } = await trailsApi.getIntent({ intentId: 'intent_123abc' })

console.log('Status:', intent.status)
console.log('From Amount:', intent.quote.fromAmount)
console.log('To Amount:', intent.quote.toAmount)
console.log('Total Fee (USD):', intent.fees.totalFeeUsd)
console.log('Expires:', intent.expiresAt)
```

**Intent Object includes:**
- `quoteRequest` — Original quote parameters
- `depositTransaction` — Deposit details (token, amount, address)
- `originCalls` / `destinationCalls` — Transaction calls with calldata
- `quote` — Provider quote (amounts, slippage, price impact)
- `fees` — Fee breakdown (originGas, destinationGas, provider, totalFeeUsd)
- `originIntentAddress` / `destinationIntentAddress` — Intent contract addresses

---

## Discovery & Search Endpoints

### 7. SearchIntents

**`POST /rpc/Trails/SearchIntents`**

Search intents by various criteria:

```typescript
// By owner address
const { intents } = await trailsApi.searchIntents({
  byOwnerAddress: '0x0709CF2d5D4f3D38f5948d697fE64d7FB3639Eb1'
})

// By deposit transaction hash
const { intents } = await trailsApi.searchIntents({
  byDepositTransactionHash: '0x1234...'
})

// By origin intent address
const { intents } = await trailsApi.searchIntents({
  byOriginIntentAddress: '0xabcdef...'
})
```

---

### 8. GetIntentHistory

**`POST /rpc/Trails/GetIntentHistory`**

Paginated transaction history with full receipt data.

---

### 9. GetChains

**`POST /rpc/Trails/GetChains`**

Get list of supported chains.

---

### 10. GetTokenList

**`POST /rpc/Trails/GetTokenList`**

Get available tokens for specified chains.

---

### 11. GetTokenPrices

**`POST /rpc/Trails/GetTokenPrices`**

Get current USD prices for tokens.

---

### 12. GetExactInputRoutes

**`POST /rpc/Trails/GetExactInputRoutes`**

Find destination tokens available from a source token:

```typescript
const response = await fetch('https://trails-api.sequence.app/rpc/Trails/GetExactInputRoutes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Access-Key': 'YOUR_ACCESS_KEY'
  },
  body: JSON.stringify({
    originChainId: 1,
    originTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    destinationChainId: 8453 // Optional: filter by destination chain
  })
})

const { tokens } = await response.json()
```

---

### 13. GetExactOutputRoutes

**`POST /rpc/Trails/GetExactOutputRoutes`**

Find source tokens that can route to a destination token:

```typescript
const response = await fetch('https://trails-api.sequence.app/rpc/Trails/GetExactOutputRoutes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Access-Key': 'YOUR_ACCESS_KEY'
  },
  body: JSON.stringify({
    destinationChainId: 8453,
    destinationTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    originChainId: 1, // Optional: filter by source chain
    ownerAddress: '0x...' // Optional: balance-aware filtering
  })
})

const { tokens } = await response.json()
```

---

## Complete Flow Example

```typescript
import { TradeType, TrailsApi, RouteProvider } from '@0xtrails/api'

const trailsApi = new TrailsApi('YOUR_API_KEY')

// Step 1: Quote
const { intent, gasFeeOptions } = await trailsApi.quoteIntent({
  ownerAddress: '0x0709CF2d5D4f3D38f5948d697fE64d7FB3639Eb1',
  originChainId: 42161,
  originTokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  originTokenAmount: 100000000n,
  destinationChainId: 8453,
  destinationTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  destinationToAddress: '0x0709CF2d5D4f3D38f5948d697fE64d7FB3639Eb1',
  tradeType: TradeType.EXACT_INPUT,
  options: {
    slippageTolerance: 0.005,
    bridgeProvider: RouteProvider.RELAY
  }
})

// Step 2: Commit
const { intentId } = await trailsApi.commitIntent({ intent })

// Step 3: Execute (gasless with signature)
await trailsApi.executeIntent({
  intentId,
  depositSignature: {
    intentSignature: await signIntent(intent),
    selectedGasFeeOption: gasFeeOptions.feeOptions[0],
    userNonce: 1,
    deadline: Math.floor(Date.now() / 1000) + 3600
  }
})

// Step 4: Wait for completion
const receipt = await trailsApi.waitIntentReceipt({ intentId })
console.log('Done:', receipt.intentReceipt.status)
```

---

## Deposit Address Flow (Server-Side)

Create trustless deposit addresses for backend integrations:

```typescript
// 1. Quote
const { intent } = await quoteResponse.json()
const intentAddress = intent.depositTransaction.toAddress

// 2. Commit
const { intentId } = await commitResponse.json()

// 3. User deposits to intentAddress
// 4. Execute with deposit tx hash
await trailsApi.executeIntent({
  intentId,
  depositTransactionHash: userDepositTxHash
})
```

---

## Route Providers

| Provider | Type | Best For |
|----------|------|----------|
| `AUTO` (default) | Automatic | Let Trails optimize |
| `LIFI` | Aggregator | Multi-bridge, wide token support |
| `RELAY` | Bridge/Solver | Fast cross-chain transfers |
| `CCTP` | Bridge | Native USDC 1:1 (no slippage) |
| `SUSHI` | DEX | On-chain swaps |
| `ZEROX` | DEX Aggregator | Aggregated DEX liquidity |

---

## Supported Chains (18 Mainnets)

| Chain | Chain ID | Native Token |
|-------|----------|-------------|
| Ethereum | 1 | ETH |
| Base | 8453 | ETH |
| Arbitrum | 42161 | ETH |
| Optimism | 10 | ETH |
| Polygon | 137 | POL |
| Avalanche | 43114 | AVAX |
| BNB Chain | 56 | BNB |
| Gnosis | 100 | xDAI |
| Blast | 81457 | ETH |
| Arbitrum Nova | 42170 | ETH |
| Ape Chain | 33139 | APE |
| B3 | 8333 | ETH |
| Soneium | 1868 | ETH |
| Xai | 660279 | XAI |
| Katana | 747474 | ETH |
| Etherlink | 42793 | XTZ |
| Somnia | 5031 | SOMI |
| Monad | 143 | MON |

---

## Fee Breakdown Structure

```typescript
intent.fees = {
  originGas: {
    chainId, totalGasLimit, gasPrice,
    nativeTokenSymbol, totalFeeUsd, chainGasUsageStatus
  },
  destinationGas: { /* same structure */ },
  provider: {
    quoteProvider, quoteProviderFeeUsd,
    trailsFeeUsd, totalFeeUsd
  },
  feeTokenAddress,
  feeTokenTotal,
  totalFeeAmount,
  totalFeeUsd
}
```

---

## Error Handling

```typescript
const errorMap = {
  'INSUFFICIENT_BALANCE': 'User does not have enough tokens.',
  'NO_ROUTE_FOUND': 'No route available. Try a different token pair or chain.',
  'AMOUNT_TOO_SMALL': 'Amount below minimum (~$1 equivalent).',
  'QUOTE_EXPIRED': 'Quote expired. Get a new quote.',
  'INTENT_EXPIRED': 'Intent expired before execution. Start over.',
  'DEPOSIT_FAILED': 'Token deposit failed. Check approval.',
  'SLIPPAGE_EXCEEDED': 'Price moved too much. Retry with higher slippage.',
  'INVALID_API_KEY': 'API key invalid.',
  'RATE_LIMITED': 'Too many requests. Wait before retrying.'
}
```

---

## Key Timing Constraints

- **Quotes expire** after ~5 minutes
- **Committed intents** must be executed within **10 minutes**
- The intent object from `QuoteIntent` **must not be modified** before committing

---

## Resources

- **API Key**: Join [Trails Telegram](https://t.me/build_with_trails) to request access
- **SDK Package**: `@0xtrails/api` on npm
- **Docs**: [docs.trails.build](https://docs.trails.build)
- **API Reference**: [docs.trails.build/api-reference](https://docs.trails.build/api-reference)

---

This SKILL.md was assembled from the official Trails documentation pages including `/api-reference/introduction`, `/api-reference/trails-api-sdk`, `/api-reference/endpoints/commit-intent`, `/api-reference/endpoints/execute-intent`, `/api-reference/endpoints/get-intent`, `/api-reference/endpoints/get-intent-receipt`, `/api-reference/endpoints/search-intents`, `/api-reference/endpoints/get-exact-input-routes`, `/api-reference/endpoints/get-exact-output-routes`, `/resources/supported-chains`, `/resources/llm-integration`, and `/use-cases/fund`.