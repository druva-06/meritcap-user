"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle, Loader2, Phone, User, Mail } from "lucide-react"

interface CampaignInfo {
  id: number
  name: string
  source: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

async function fetchCampaign(campaignId: string): Promise<CampaignInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/campaigns/${campaignId}`)
    if (!res.ok) return null
    const json = await res.json()
    return json.response ?? null
  } catch {
    return null
  }
}

async function submitLead(data: {
  name: string
  phone: string
  email: string
  campaignId: number
}): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/public/leads/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    return { ok: res.ok, message: json.message || (res.ok ? "Success" : "Failed") }
  } catch {
    return { ok: false, message: "Network error. Please try again." }
  }
}

function LeadForm() {
  const searchParams = useSearchParams()
  const campaignIdParam = searchParams.get("campaign")

  const [campaign, setCampaign] = useState<CampaignInfo | null>(null)
  const [loadingCampaign, setLoadingCampaign] = useState(true)
  const [invalidLink, setInvalidLink] = useState(false)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!campaignIdParam) {
      setInvalidLink(true)
      setLoadingCampaign(false)
      return
    }
    fetchCampaign(campaignIdParam).then((c) => {
      if (!c) setInvalidLink(true)
      else setCampaign(c)
      setLoadingCampaign(false)
    })
  }, [campaignIdParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaign) return
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone number are required.")
      return
    }
    setError("")
    setSubmitting(true)
    const result = await submitLead({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      campaignId: campaign.id,
    })
    setSubmitting(false)
    if (result.ok) {
      setSubmitted(true)
    } else {
      setError(result.message)
    }
  }

  if (loadingCampaign) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (invalidLink) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid or expired link</h2>
            <p className="text-sm text-gray-500">
              This QR code link is no longer valid. Please contact the event organiser.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h2>
            <p className="text-sm text-gray-600">
              We have received your details and will be in touch with you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <img src="/logo.png" alt="MeritCap" className="h-10 mx-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Register Your Interest</CardTitle>
          {campaign && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              {campaign.name}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Fill in your details and our counsellors will reach out to you.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LeadCapturePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <LeadForm />
    </Suspense>
  )
}
