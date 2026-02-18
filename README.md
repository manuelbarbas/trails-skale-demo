# Trails SKALE Demo

A React + Vite demo showcasing the **Sequence Trails SDK** for cross-chain token bridging. This project demonstrates bridging USDC from multiple chains to the SKALE network via the IMA bridge.

## Features Tested

- **TrailsWidget (Bridge)** - Cross-chain bridging using `mode="fund"` with custom calldata encoding
- **TrailsWidget (Pay)** - Simple fixed-amount payments using `mode="pay"`

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment variables (required)
cp .env.example .env
# Add your VITE_TRAILS_API_KEY

# Start development server
npm run dev

# Build for production
npm run build
```

## Claude Skills

This project includes pre-configured Claude Code skills for Trails API and Trails SDK, enabling AI-assisted development with context-aware knowledge of the Sequence Trails ecosystem.
