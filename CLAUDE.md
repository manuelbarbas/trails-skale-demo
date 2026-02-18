# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **React + Vite** demo application showcasing the **Sequence Trails SDK** for cross-chain token bridging. The app demonstrates bridging USDC from various chains to the SKALE network via the IMA (Interchain Messaging Agent) bridge.

## Development Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production (TypeScript check + Vite build)
npm run preview      # Preview production build
npm run start        # Start production preview server
npm run lint         # Run ESLint
```

## Environment Variables

Required in `.env`:
- `VITE_TRAILS_API_KEY` - Sequence Trails API key (required)
- `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID (optional)

## Architecture

### Provider Stack (`src/components/Providers.tsx`)

The app uses a nested provider architecture that must be maintained in this order:

1. **WagmiProvider** - Ethereum wallet connections (configured for Base, Ethereum, Polygon, Optimism, Arbitrum)
2. **QueryClientProvider** - React Query with aggressive caching (24h GC, 1h stale time)
3. **TrailsProvider** - Sequence Trails SDK wrapper
4. **RainbowKitProvider** - Wallet connection UI

### Trail Widget Integration Pattern

The core pattern for integrating Trails widgets is in `src/components/trails/BridgeWidget.tsx`:

1. **Encode calldata** using `encodeFunctionData` from `viem` with `TRAILS_ROUTER_PLACEHOLDER_AMOUNT` from `0xtrails` for amount fields
2. **Mount TrailsWidget** with mode="fund" or mode="pay"
3. **Handle lifecycle events**: `onCheckoutQuote`, `onCheckoutComplete`, `onCheckoutError`

Key technical detail: The widget must stay mounted once rendered to avoid auto-closing. Conditional rendering should only determine whether to mount it initially, not unmount it.

### SKALE Bridging Flow

The bridge widget implements this specific flow:
- Source: User's wallet on any configured chain
- Intermediate: Base chain USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- Destination: SKALE chain via IMA DepositBoxERC20 (`0x7f54e52D08C9Ch11eAbB4fDF00Ad36ccf07F867F61` on Base)
- Calldata: Encoded `depositERC20Direct(schainName, erc20OnMainnet, amount, receiver)`

The target SKALE chain is configured via `SKALE_CHAIN_NAME` constant (default: "winged-bubbly-grumium").


## Key Technologies

- **React 19** - UI framework
- **Vite** - Build tool with `@` path alias pointing to `./src`
- **TypeScript 5.8** - Type safety
- **Wagmi 2.x** + **Viem 2.x** - Ethereum interaction
- **RainbowKit 2.x** - Wallet connection UI
- **0xtrails 0.9.6** - Sequence Trails SDK
- **Tailwind CSS 4.x** - Styling

## File Structure Notes

- `src/main.tsx` - Application entry point, wraps App in Providers
- `src/App.tsx` - Main layout with header/content/footer
- `src/components/DemoTabs.tsx` - Tab navigation (Bridge/Pay modes)
- `src/components/trails/` - Trail widget implementations
