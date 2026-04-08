"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface ChaosToggle {
  id: number
  bugId: string
  isActive: boolean
  activatedAt: string | null
  activatedBy: string | null
}

const BUG_META: Record<
  string,
  {
    name: string
    category: "security" | "runtime" | "logic"
    severity: "critical" | "high" | "medium"
    description: string
    triggerUrl: string
    triggerHint: string
    expectedFix: string
  }
> = {
  "sql-injection": {
    name: "SQL Injection in Search",
    category: "security",
    severity: "critical",
    description:
      "String concatenation in SQL query allows injection attacks",
    triggerUrl: "/search?q=%27%3B+DROP+TABLE+products--",
    triggerHint: "Search for: '; DROP TABLE products--",
    expectedFix:
      "Replace string concatenation with Drizzle ORM parameterized query",
  },
  "xss-reviews": {
    name: "XSS in Reviews",
    category: "security",
    severity: "critical",
    description:
      "Review comments rendered with dangerouslySetInnerHTML",
    triggerUrl: "/",
    triggerHint: "Post a review with: <img src=x onerror=alert(1)>",
    expectedFix: "Replace dangerouslySetInnerHTML with text rendering",
  },
  "hardcoded-secret": {
    name: "Hardcoded API Secret",
    category: "security",
    severity: "critical",
    description:
      "Stripe API key hardcoded in source and exposed in response headers",
    triggerUrl: "/checkout",
    triggerHint: "Complete a checkout — check response headers",
    expectedFix: "Remove hardcoded key, use env var, remove header",
  },
  "open-redirect": {
    name: "Open Redirect",
    category: "security",
    severity: "high",
    description: "Redirect endpoint accepts any URL without validation",
    triggerUrl: "/api/redirect?url=https://evil.com",
    triggerHint: "Visit /api/redirect?url=https://evil.com",
    expectedFix:
      "Add URL validation, restrict to relative paths only",
  },
  "prototype-pollution": {
    name: "Prototype Pollution",
    category: "security",
    severity: "high",
    description:
      "Deep merge without sanitization allows __proto__ injection",
    triggerUrl: "/cart",
    triggerHint: 'POST to /api/cart with {"__proto__": {"isAdmin": true}}',
    expectedFix: "Replace deepMerge with explicit field destructuring",
  },
  "missing-auth": {
    name: "Missing Auth Check",
    category: "security",
    severity: "critical",
    description: "Orders API returns all orders without authentication",
    triggerUrl: "/api/orders",
    triggerHint: "Hit /api/orders while logged out",
    expectedFix:
      "Add session check, filter by user ID, return 401 if unauthorized",
  },
  "weak-crypto": {
    name: "Weak Crypto (MD5)",
    category: "security",
    severity: "medium",
    description: "MD5 hash used for coupon validation",
    triggerUrl: "/checkout",
    triggerHint: "Apply a coupon code at checkout",
    expectedFix:
      "Remove unnecessary hashing, use direct string comparison",
  },
  "cors-wildcard": {
    name: "CORS Wildcard",
    category: "security",
    severity: "medium",
    description:
      "Access-Control-Allow-Origin set to * with credentials",
    triggerUrl: "/api/products",
    triggerHint: "Any cross-origin API request",
    expectedFix: "Replace wildcard with specific origin from env var",
  },
  "null-checkout": {
    name: "Null Reference in Checkout",
    category: "runtime",
    severity: "critical",
    description:
      "No null check on shippingAddress before accessing properties",
    triggerUrl: "/checkout",
    triggerHint: "Click 'Place Order' without shipping address",
    expectedFix: "Add null check with early return and 400 status",
  },
  "unhandled-promise": {
    name: "Unhandled Promise Rejection",
    category: "runtime",
    severity: "critical",
    description:
      "External API call with no error handling crashes the page",
    triggerUrl: "/products/any-id",
    triggerHint: "Visit any product page when external API is down",
    expectedFix:
      "Wrap in try-catch, add fallback for non-critical fetch",
  },
  "race-stock": {
    name: "Race Condition in Stock",
    category: "logic",
    severity: "high",
    description:
      "Check-then-act without transaction allows overselling",
    triggerUrl: "/checkout",
    triggerHint: "Two users buy the last item simultaneously",
    expectedFix:
      "Wrap in transaction with SELECT FOR UPDATE lock",
  },
  "off-by-one": {
    name: "Off-by-One Pagination",
    category: "logic",
    severity: "medium",
    description:
      "Page 1 starts at offset 12 instead of 0, skipping first products",
    triggerUrl: "/?page=1",
    triggerHint: "Browse to page 2 — last product of page 1 is missing",
    expectedFix:
      "Change page * limit to (page - 1) * limit",
  },
}

const severityColors = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
}

const categoryLabels = {
  security: "Security Bugs",
  runtime: "Runtime Errors",
  logic: "Logic Bugs",
}

export default function ChaosPanel() {
  const { data: session, status } = useSession()
  const [toggles, setToggles] = useState<ChaosToggle[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated" || (session && session.user.role !== "admin")) {
      router.push("/")
      return
    }
    if (status === "authenticated") {
      fetch("/api/admin/chaos")
        .then((r) => r.json())
        .then(setToggles)
        .finally(() => setLoading(false))
    }
  }, [status, session, router])

  const toggle = async (bugId: string, current: boolean) => {
    setToggling(bugId)
    await fetch("/api/admin/chaos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bugId, isActive: !current }),
    })
    setToggles((prev) =>
      prev.map((t) =>
        t.bugId === bugId
          ? { ...t, isActive: !current, activatedAt: !current ? new Date().toISOString() : null }
          : t
      )
    )
    setToggling(null)
  }

  const resetAll = async () => {
    await fetch("/api/admin/reset", { method: "POST" })
    setToggles((prev) => prev.map((t) => ({ ...t, isActive: false, activatedAt: null })))
  }

  const activateAll = async () => {
    for (const t of toggles) {
      if (!t.isActive) {
        await fetch("/api/admin/chaos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bugId: t.bugId, isActive: true }),
        })
      }
    }
    setToggles((prev) =>
      prev.map((t) => ({ ...t, isActive: true, activatedAt: new Date().toISOString() }))
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading chaos panel...</p>
      </div>
    )
  }

  const activeCount = toggles.filter((t) => t.isActive).length

  const grouped = {
    security: toggles.filter((t) => BUG_META[t.bugId]?.category === "security"),
    runtime: toggles.filter((t) => BUG_META[t.bugId]?.category === "runtime"),
    logic: toggles.filter((t) => BUG_META[t.bugId]?.category === "logic"),
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl p-6 mb-8">
        <h1 className="text-2xl font-bold">Chaos Panel</h1>
        <p className="text-red-100 mt-1">
          Activate bugs to test InariWatch detection and auto-remediation
        </p>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
            {activeCount} / {toggles.length} active
          </span>
          <button
            onClick={activateAll}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
          >
            Activate All
          </button>
          <button
            onClick={resetAll}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      {(["security", "runtime", "logic"] as const).map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-bold mb-3 capitalize">
            {categoryLabels[category]}
          </h2>
          <div className="space-y-3">
            {grouped[category].map((t) => {
              const meta = BUG_META[t.bugId]
              if (!meta) return null
              return (
                <div
                  key={t.bugId}
                  className={`bg-white border rounded-lg p-4 transition-all ${
                    t.isActive
                      ? "border-red-300 shadow-sm shadow-red-100"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{meta.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${severityColors[meta.severity]}`}
                        >
                          {meta.severity}
                        </span>
                        {t.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-medium animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {meta.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <a
                          href={meta.triggerUrl}
                          className="text-xs text-orange-600 hover:underline"
                        >
                          Trigger &rarr;
                        </a>
                        <span className="text-xs text-gray-400">
                          {meta.triggerHint}
                        </span>
                      </div>
                      {t.isActive && t.activatedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Activated{" "}
                          {new Date(t.activatedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggle(t.bugId, t.isActive)}
                      disabled={toggling === t.bugId}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                        t.isActive ? "bg-red-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          t.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  {t.isActive && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <span className="font-medium">Expected fix:</span>{" "}
                      {meta.expectedFix}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
