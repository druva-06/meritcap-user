"use client"

import { AlertCircle, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface ProfileIncompleteBannerProps {
  onDismiss?: () => void
}

export function ProfileIncompleteBanner({ onDismiss }: ProfileIncompleteBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  const handleDismiss = () => {
    setIsDismissed(true)
    if (onDismiss) onDismiss()
  }

  if (isDismissed) return null

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 relative">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            Complete Your Profile
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            Complete your profile to unlock personalized recommendations and better search results.
          </p>
          <div className="mt-3">
            <Link
              href="/profile"
              className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Complete Profile Now
            </Link>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 flex-shrink-0 text-amber-500 hover:text-amber-700 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
