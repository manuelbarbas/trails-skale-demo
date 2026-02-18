import type { ReactNode } from "react"
import { WagmiProvider, createConfig, http } from "wagmi"
import { base, mainnet, optimism, arbitrum, polygon } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { lightTheme } from "@rainbow-me/rainbowkit"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { TrailsProvider } from "0xtrails"

// Chains configured - includes Base for USDC payments
const chains = [base, mainnet, polygon, optimism, arbitrum] as const

const config = createConfig({
  chains,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
})

// Query client with long cache time
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
    },
  },
})

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TrailsProvider
          config={{
            trailsApiKey: import.meta.env.VITE_TRAILS_API_KEY ?? "",
          }}
        >
          <RainbowKitProvider theme={lightTheme()}>
            {children}
          </RainbowKitProvider>
        </TrailsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
