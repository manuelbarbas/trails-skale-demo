import { useState } from "react"
import { BridgeWidget } from "./trails/BridgeWidget"
import { PayWidget } from "./trails/PayWidget"
//import { BridgeWidgetCustom } from "../trails-api/bridge-widget-custom"

type Mode = "bridge" | "bridge-custom" | "pay"

export function DemoTabs() {
  const [activeMode, setActiveMode] = useState<Mode>("bridge")

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveMode("bridge")}
            className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
              activeMode === "bridge"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Bridge (Widget)
          </button>
        {/*  <button
            onClick={() => setActiveMode("bridge-custom")}
            className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
              activeMode === "bridge-custom"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Bridge (API)
          </button>*/}
          <button
            onClick={() => setActiveMode("pay")}
            className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
              activeMode === "pay"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pay
          </button>
        </div>
      </div>

      {/* Widget Display */}
      <div className="flex justify-center">
        {activeMode === "bridge" && <BridgeWidget />}
        {/*{activeMode === "bridge-custom" && <BridgeWidgetCustom />}*/}
        {activeMode === "pay" && <PayWidget />}
      </div>

      {/* Info Section */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          {activeMode === "bridge"
            ? "Bridge USDC from multiple chains to SKALE network (using TrailsWidget)"
            : activeMode === "bridge-custom"
            ? "Bridge USDC from multiple chains to SKALE network (using Trails API directly)"
            : "Send 0.01 USDC on Base chain to a fixed recipient address"}
        </p>
      </div>
    </div>
  )
}
