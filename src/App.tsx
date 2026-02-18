import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Providers } from "@/components/Providers"
import { DemoTabs } from "@/components/DemoTabs"

export default function App() {
  return (
    <Providers>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Trails SDK Demo</h1>
              <p className="text-sm text-gray-500">Bridge & Pay with USDC</p>
            </div>
            <ConnectButton />
          </div>
        </header>

        {/* Main Content */}
        <main>
          <DemoTabs />
        </main>

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-gray-500">
          <p>Powered by Trails SDK • Built with Vite + React + TypeScript</p>
        </footer>
      </div>
    </Providers>
  )
}
