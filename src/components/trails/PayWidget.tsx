import { TrailsWidget } from "0xtrails/widget"
import { useAccount } from "wagmi"

// API key from environment
const apiKey = import.meta.env.VITE_TRAILS_API_KEY

// Base Chain Configuration
const BASE_CHAIN_ID = 8453

// USDC address on Base
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const

// Hardcoded recipient address for demo (Vitalik's Ethereum address for demo purposes)
const RECIPIENT_ADDRESS = "0x3a04409a063bc1d29Ac228894387C14F22bC074d" as const

// Fixed payment amount
const PAYMENT_AMOUNT = "0.01"

export function PayWidget() {
  const { address } = useAccount()

  if (!address) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center">
        <p className="text-gray-600">Please connect your wallet to continue</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-900 font-medium mb-1">Payment Details</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700">Amount:</span>
          <span className="font-mono font-semibold text-blue-900">{PAYMENT_AMOUNT} USDC</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-blue-700">Network:</span>
          <span className="font-semibold text-blue-900">Base</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-blue-700">To:</span>
          <span className="font-mono text-xs text-blue-900">
            {RECIPIENT_ADDRESS.slice(0, 6)}...{RECIPIENT_ADDRESS.slice(-4)}
          </span>
        </div>
      </div>

      <TrailsWidget
        mode="pay"
        apiKey={apiKey}
        toChainId={BASE_CHAIN_ID}
        toToken={BASE_USDC}
        toAddress={RECIPIENT_ADDRESS}
        toAmount={PAYMENT_AMOUNT}
        theme="light"
        buttonText={`Pay ${PAYMENT_AMOUNT} USDC`}
        customCss={`
          --trails-border-radius-button: 12px;
          --trails-border-radius-card: 16px;
          --trails-primary: #0066FF;
          --trails-primary-hover: #0052CC;
          --trails-text-inverse: #FFFFFF;
          --trails-focus-ring: rgba(0, 102, 255, 0.25);
          --trails-background: #FFFFFF;
          --trails-border-color: #E5E7EB;
          --trails-text-primary: #111827;
          --trails-text-secondary: #6B7280;
        `}
      />
    </div>
  )
}
