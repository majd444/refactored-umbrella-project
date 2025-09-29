"use client"

import { useEffect, useState } from "react"
import { CreditCard, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
// Removed unused Badge import
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@clerk/nextjs"


export function SettingsContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [timezone, setTimezone] = useState("")
  const [isSavingTimezone, setIsSavingTimezone] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")

  // Load existing settings from Convex
  const mySettings = useQuery(api.userSettings.getMySettings) as
    | { timezone?: string; companyName?: string; companyAddress?: string; language?: string }
    | null
    | undefined
  const upsert = useMutation(api.userSettings.upsertMySettings)

  // Removed detected timezone helper UI

  // Initialize local timezone state from backend when available
  useEffect(() => {
    if (mySettings?.timezone) {
      setTimezone(mySettings.timezone)
    }
    if (mySettings?.companyName !== undefined) {
      setCompanyName(mySettings.companyName || "")
    }
    if (mySettings?.companyAddress !== undefined) {
      setCompanyAddress(mySettings.companyAddress || "")
    }
  }, [mySettings])

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate save operation
    try {
      await upsert({ timezone })
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (e) {
      // Non-blocking: in a real app, show a toast
      console.error("Failed to save settings:", e)
    }
    setIsLoading(false)
  }

  const handleSaveTimezone = async () => {
    if (!timezone && !companyName && !companyAddress) return
    setIsSavingTimezone(true)
    try {
      await upsert({ timezone, companyName, companyAddress })
    } catch (e) {
      console.error("Failed to save timezone:", e)
    } finally {
      setIsSavingTimezone(false)
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl space-y-10">
          <div>
            <h1 className="text-2xl font-bold text-black">Settings</h1>
            <p className="text-sm text-gray-600">Manage your platform configuration</p>
          </div>

          <GeneralSettings
            timezone={timezone}
            setTimezone={setTimezone}
            onSaveTimezone={handleSaveTimezone}
            isSavingTimezone={isSavingTimezone}
            companyName={companyName}
            setCompanyName={setCompanyName}
            companyAddress={companyAddress}
            setCompanyAddress={setCompanyAddress}
          />

          <Separator className="my-4" />

          <BillingSettings />

          <Separator className="my-4" />

          <SecuritySettings />

          {/* Unified Save Area */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset to Defaults
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Danger Zone removed as requested */}
        </div>
      </div>
    </div>
  )
}

function GeneralSettings({
  timezone,
  setTimezone,
  onSaveTimezone,
  isSavingTimezone,
  companyName,
  setCompanyName,
  companyAddress,
  setCompanyAddress,
}: {
  timezone: string
  setTimezone: React.Dispatch<React.SetStateAction<string>>
  onSaveTimezone: () => void | Promise<void>
  isSavingTimezone: boolean
  companyName: string
  setCompanyName: React.Dispatch<React.SetStateAction<string>>
  companyAddress: string
  setCompanyAddress: React.Dispatch<React.SetStateAction<string>>
}) {
  const [localTime, setLocalTime] = useState("")
  const [nowMs, setNowMs] = useState<number>(Date.now())
  const [isTimeFocused, setIsTimeFocused] = useState(false)

  // Ticker for the live clock
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Compute clock text (HH:MM, no seconds) if timezone is an offset like "UTC-04:00"
  const clockText = (() => {
    const m = /^UTC([+-])(\d{2}):(\d{2})$/.exec(timezone || "")
    if (!m) return ""
    const sign = m[1] === "-" ? -1 : 1
    const hours = parseInt(m[2], 10)
    const minutes = parseInt(m[3], 10)
    const offsetMs = sign * ((hours * 60 + minutes) * 60 * 1000)
    const localMs = nowMs + offsetMs
    const d = new Date(localMs)
    const hh = String(d.getUTCHours()).padStart(2, "0")
    const mm = String(d.getUTCMinutes()).padStart(2, "0")
    return `${hh}:${mm}`
  })()

  // Normalize time to HH:mm if user typed H:mm or HH:m
  const normalizedTime = (() => {
    const t = localTime.trim()
    const m = /^(\d{1,2}):(\d{1,2})$/.exec(t)
    if (!m) return ""
    const hh = Math.min(23, Math.max(0, parseInt(m[1], 10)))
    const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)))
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
  })()

  const timeMatches = useQuery(
    api.userSettings.getTimezonesByLocalTime,
    normalizedTime ? { time: normalizedTime } : "skip"
  ) as { timeZone: string; offsetLabel: string }[] | undefined

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Organization Information</CardTitle>
          <CardDescription>Basic information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company-name" className="text-black">
                Company Name
              </Label>
              <Input
                id="company-name"
                placeholder="Your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="local-time" className="text-black">
                Time Zone (HH:mm)
              </Label>
              <Input
                id="local-time"
                placeholder="e.g., 12:30"
                value={isTimeFocused ? localTime : (clockText || localTime)}
                onFocus={() => {
                  setIsTimeFocused(true)
                  if (!localTime && clockText) setLocalTime(clockText)
                }}
                onBlur={() => setIsTimeFocused(false)}
                onChange={(e) => setLocalTime(e.target.value)}
              />
              {normalizedTime && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-gray-600">
                    Showing UTC offsets where current local time is {normalizedTime}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const offsets = Array.from(
                        new Set((timeMatches ?? []).map((m) => m.offsetLabel))
                      ).filter((o) => o.startsWith("UTC-"))
                      if (offsets.length === 0) {
                        return <p className="text-xs text-gray-500">No UTC- offsets found right now.</p>
                      }
                      return offsets.map((offset) => (
                        <Button
                          key={offset}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setTimezone(offset)}
                        >
                          {offset}
                        </Button>
                      ))
                    })()}
                  </div>
                </div>
              )}
              {timezone && (
                <div className="mt-2">
                  <p className="text-xs text-gray-700">
                    Selected timezone: <span className="font-medium">{timezone}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address" className="text-black">
              Company Address
            </Label>
            <Textarea
              id="company-address"
              placeholder="Enter your company address"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <Button
              type="button"
              size="sm"
              onClick={onSaveTimezone}
              disabled={isSavingTimezone}
            >
              {isSavingTimezone ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save timezone
                </>
              )}
            </Button>
          </div>
          
        </CardContent>
      </Card>

      

    </div>
  )
}

function BillingSettings() {
  const { userId } = useAuth()
  const [plan, setPlan] = useState("pro")
  const [isStartingCheckout, setIsStartingCheckout] = useState<string | null>(null)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [invoices, setInvoices] = useState<Array<{
    id: string
    date: string | null
    description: string
    amount: number
    currency: string
    status: string
    hosted_invoice_url: string | null
    invoice_pdf: string | null
  }> | null>(null)
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)

  const PRICE_IDS: Record<string, string | undefined> = {
    starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE,
  }
  const PAYMENT_LINKS: Record<string, string | undefined> = {
    starter: process.env.NEXT_PUBLIC_STRIPE_LINK_BASIC,
    pro: process.env.NEXT_PUBLIC_STRIPE_LINK_pro,
    // enterprise can be added as NEXT_PUBLIC_STRIPE_LINK_ENTERPRISE
    enterprise: process.env.NEXT_PUBLIC_STRIPE_LINK_ENTERPRISE,
  }

  // Map UI tiers to Convex plans used in backend/webhook logic
  const PLAN_BY_TIER: Record<"starter" | "pro" | "enterprise", "basic" | "pro"> = {
    starter: "basic",
    pro: "pro",
    // Treat enterprise as pro for now (adjust if you add more plans later)
    enterprise: "pro",
  }

  const saveStripeCustomerId = useMutation(api.users.setStripeCustomerId)
  const setPlanMutation = useMutation(api.users.setPlan)

  async function openPortal() {
    try {
      setIsOpeningPortal(true)
      const res = await fetch("/api/stripe/create-portal-session", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to create portal session")
      if (data?.customerId) {
        try { await saveStripeCustomerId({ customerId: data.customerId }) } catch {}
      }
      if (data?.url) window.location.href = data.url
    } catch (e) {
      console.error("Failed to open billing portal:", e)
    } finally {
      setIsOpeningPortal(false)
    }
  }

  async function startCheckout(tier: "starter" | "pro" | "enterprise") {
    // Prefer Payment Links if configured
    const link = PAYMENT_LINKS[tier]
    if (link) {
      try {
        const url = new URL(link)
        if (userId) url.searchParams.set("client_reference_id", userId)
        window.location.href = url.toString()
      } catch {
        // Fallback: navigate directly
        window.location.href = link
      }
      return
    }
    const priceId = PRICE_IDS[tier]
    if (!priceId) {
      console.error(`Missing Stripe config for tier: ${tier}. Provide NEXT_PUBLIC_STRIPE_LINK_* or NEXT_PUBLIC_STRIPE_PRICE_*`)
      return
    }
    try {
      setIsStartingCheckout(tier)
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, plan: PLAN_BY_TIER[tier] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to create checkout session")
      if (data?.url) window.location.href = data.url
    } catch (e) {
      console.error("Failed to start checkout:", e)
    } finally {
      setIsStartingCheckout(null)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Billing & Subscription</h2>
        <p className="text-gray-600">Manage your subscription and payment methods</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Current Plan</CardTitle>
          <CardDescription>Choose the plan that works best for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await setPlanMutation({ plan: "free" })
                } catch (e) {
                  console.error("Failed to switch to free:", e)
                }
              }}
            >
              Switch to Free
            </Button>
            <Button variant="outline" size="sm" onClick={openPortal} disabled={isOpeningPortal}>
              {isOpeningPortal ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Opening portal...
                </>
              ) : (
                <>Manage billing</>
              )}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(["starter", "pro", "enterprise"] as Array<"starter" | "pro" | "enterprise">).map((tier) => (
              <div
                key={tier}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  plan === tier ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setPlan(tier)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize">{tier}</h4>
                  {plan === tier && (
                    <div className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                      Current
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  {tier === 'starter' ? (
                    <span className="text-2xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold">
                        ${tier === 'pro' ? '10' : '20'}
                      </span>
                      <span className="text-sm text-gray-500">/month</span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {tier === 'starter' 
                    ? 'For small teams getting started' 
                    : tier === 'pro' 
                      ? 'For growing businesses' 
                      : 'For large organizations'}
                </p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); startCheckout(tier) }}
                    disabled={isStartingCheckout === tier}
                  >
                    {isStartingCheckout === tier ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        {tier === 'starter' ? 'Get started' : `Select ${tier}`}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-12 rounded bg-blue-100 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-gray-500">Expires 12/25</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={openPortal} disabled={isOpeningPortal}>
                {isOpeningPortal ? 'Opening...' : 'Edit in portal'}
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-4" onClick={openPortal} disabled={isOpeningPortal}>
            + Add Payment Method
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Billing History</CardTitle>
          <CardDescription>View and download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoadingInvoices && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Loading invoices…</td>
                  </tr>
                )}
                {!isLoadingInvoices && invoices && invoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No invoices yet.</td>
                  </tr>
                )}
                {!isLoadingInvoices && (invoices ?? []).map((inv) => {
                  const d = inv.date ? new Date(inv.date) : null
                  const dateStr = d ? d.toLocaleDateString() : "—"
                  const amount = (inv.amount / 100).toFixed(2)
                  const paid = inv.status === 'paid'
                  return (
                    <tr key={inv.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{dateStr}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.description}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{inv.currency} ${amount}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {paid ? 'Paid' : inv.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {inv.hosted_invoice_url ? (
                          <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                        ) : inv.invoice_pdf ? (
                          <a href={inv.invoice_pdf} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">PDF</a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [gdprEnabled, setGdprEnabled] = useState(true)
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Security & Privacy</h2>
        <p className="text-gray-600">Manage your account security and privacy settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Security</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <Switch 
              checked={twoFactorEnabled} 
              onCheckedChange={setTwoFactorEnabled} 
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          <Separator />
          
          <div>
            <h3 className="mb-4 font-medium">Password</h3>
            <Button variant="outline">Change Password</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-black">Privacy</CardTitle>
          <CardDescription>Manage your privacy settings and data preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">GDPR Compliance</h3>
              <p className="text-sm text-gray-500">Enable to ensure GDPR compliance for data handling</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Switch 
                checked={gdprEnabled} 
                onCheckedChange={setGdprEnabled} 
                className="data-[state=checked]:bg-blue-600"
              />
              {gdprEnabled && (
                <span className="text-xs text-green-600">GDPR Compliant</span>
              )}
            </div>
          </div>

          <Separator />
          
          <div>
            <h3 className="mb-2 font-medium">Data Export</h3>
            <p className="mb-4 text-sm text-gray-500">Request a copy of all your personal data</p>
            <Button variant="outline">Request Data Export</Button>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Account Deletion</h3>
            <p className="mb-4 text-sm text-gray-500">Permanently delete your account and all associated data</p>
            <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
