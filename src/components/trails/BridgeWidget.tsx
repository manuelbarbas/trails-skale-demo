import { useState, useMemo } from "react"
import { TrailsWidget } from "0xtrails/widget"
import { TRAILS_ROUTER_PLACEHOLDER_AMOUNT } from "0xtrails"
import { useAccount } from "wagmi"
import { encodeFunctionData } from "viem"

// API key from environment
const apiKey = import.meta.env.VITE_TRAILS_API_KEY

// Base Mainnet USDC
const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const

// SKALE IMA Bridge DepositBoxERC20 on Base
const DEPOSIT_BOX_ERC20_ADDRESS = "0x7f54e52D08C911eAbB4fDF00Ad36ccf07F867F61" as const

// SKALE Chain name - update this to your target SKALE chain
const SKALE_CHAIN_NAME = "winged-bubbly-grumium"

// DepositBoxERC20 ABI - depositERC20Direct function
const depositBoxErc20Abi = [
  {
    type: "function",
    name: "depositERC20Direct",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schainName", type: "string" },
      { name: "erc20OnMainnet", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [],
  },
] as const

export function BridgeWidget() {
  const { address, isConnected } = useAccount()
  const [recipient, setRecipient] = useState("")
  const [bridgeComplete, setBridgeComplete] = useState(false)
  const [bridgeSessionId, setBridgeSessionId] = useState<string | null>(null)
  const [bridgedAmount, setBridgedAmount] = useState<string | null>(null)

  // Use connected address as recipient if not specified
  const actualRecipient = (recipient || address || "") as `0x${string}`

  // Encode the depositERC20Direct calldata with placeholder amount
  // The placeholder gets replaced at runtime with user's selected amount
  const bridgeCalldata = useMemo(() => {
    if (!actualRecipient) return undefined

    return encodeFunctionData({
      abi: depositBoxErc20Abi,
      functionName: "depositERC20Direct",
      args: [
        SKALE_CHAIN_NAME,
        USDC_BASE_ADDRESS,
        TRAILS_ROUTER_PLACEHOLDER_AMOUNT, // Auto-filled at runtime
        actualRecipient,
      ],
    })
  }, [actualRecipient])

  function handleCheckoutQuote({ quote }: { sessionId: string; quote: { destinationTokenAmount?: string } }) {
    // Capture amount for display on success
    if (quote?.destinationTokenAmount) {
      const amountInUsdc = Number(quote.destinationTokenAmount) / 1e6
      setBridgedAmount(amountInUsdc.toFixed(2))
    }
  }

  function handleBridgeComplete({ sessionId }: { sessionId: string }) {
    console.log("Bridge complete! Session:", sessionId)
    setBridgeComplete(true)
    setBridgeSessionId(sessionId)
  }

  function handleReset() {
    setBridgeComplete(false)
    setBridgeSessionId(null)
    setBridgedAmount(null)
  }

  const isValidRecipient = actualRecipient && actualRecipient.startsWith("0x")

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="space-y-4">
        {/* Recipient Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">SKALE Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={address || "0x..."}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            disabled={bridgeComplete}
          />
          <p className="text-xs text-gray-500">
            Leave empty to use connected wallet address
          </p>
        </div>

        {/* Success State - show after completion */}
        {bridgeComplete && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              🎉 Bridge initiated successfully!
            </p>
            {bridgedAmount && (
              <p className="text-xs text-green-600 mt-2">
                <strong>Amount:</strong> {bridgedAmount} USDC
              </p>
            )}
            <p className="text-xs text-green-600">
              <strong>Recipient:</strong> {actualRecipient.slice(0, 6)}...{actualRecipient.slice(-4)}
            </p>
            <p className="text-xs text-green-600">
              <strong>SKALE Chain:</strong> {SKALE_CHAIN_NAME}
            </p>
            {bridgeSessionId && (
              <p className="text-xs text-green-600 mt-1">
                <strong>Session:</strong> {bridgeSessionId.slice(0, 16)}...
              </p>
            )}
            <p className="text-xs text-green-600 mt-2">
              The IMA bridge typically takes 5-15 minutes to deliver tokens to SKALE.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 mt-6">
        {/* Connect Wallet Message */}
        {!isConnected && (
          <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-sm text-yellow-700">
              Please connect your wallet to continue
            </p>
          </div>
        )}

        {/* Trails Widget - always mounted to prevent auto-close */}
        {isConnected && address && isValidRecipient && bridgeCalldata && (
          <TrailsWidget
            apiKey={apiKey}
            mode="fund"
            toChainId={8453} // Base
            toToken={USDC_BASE_ADDRESS}
            toAddress={DEPOSIT_BOX_ERC20_ADDRESS}
            toCalldata={bridgeCalldata}
            buttonText="Bridge to SKALE"
            onCheckoutQuote={handleCheckoutQuote}
            onCheckoutComplete={handleBridgeComplete}
            onCheckoutError={({ sessionId, error }) => {
              console.error("Bridge error:", { sessionId, error })
            }}
            customCss={`
              --trails-border-radius-button: 9999px;
              --trails-primary: #8B5CF6;
              --trails-primary-hover: #7C3AED;
              --trails-text-inverse: #ffffff;
              --trails-focus-ring: rgba(139,92,246,.4);
            `}
          />
        )}

        {/* Validation Message */}
        {isConnected && !isValidRecipient && !bridgeComplete && (
          <div className="w-full p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              Enter a valid recipient address to continue
            </p>
          </div>
        )}

        {/* Bridge More Button - show after completion */}
        {bridgeComplete && (
          <button
            onClick={handleReset}
            className="w-full h-12 px-7 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium"
          >
            Bridge More
          </button>
        )}
      </div>
    </div>
  )
}
