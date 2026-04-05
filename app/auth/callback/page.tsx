"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { handleGoogleCallback } from "@/lib/api/client"
import { setToken } from "@/lib/auth"
import { setEncryptedUser } from "@/lib/encryption"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string>("")
  
  // Prevent duplicate API calls (React StrictMode runs useEffect twice)
  const isProcessingRef = useRef(false)
  const processedCodeRef = useRef<string | null>(null)

  useEffect(() => {
    const processCallback = async () => {
      // Get authorization code from URL params
      const code = searchParams.get("code")
      const errorParam = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")

      // Check for OAuth errors
      if (errorParam) {
        console.error("OAuth error:", errorParam, errorDescription)
        setError(errorDescription || errorParam || "Authentication failed")
        setStatus("error")
        return
      }

      if (!code) {
        setError("No authorization code received")
        setStatus("error")
        return
      }

      // Prevent duplicate processing of the same code
      if (isProcessingRef.current || processedCodeRef.current === code) {
        console.log("Already processing or processed this code, skipping...")
        return
      }

      // Mark as processing
      isProcessingRef.current = true
      processedCodeRef.current = code

      console.log("Processing Google OAuth callback with code:", code.substring(0, 10) + "...")

      try {
        // Get the redirect URI that was used (should match what was sent to Google)
        const redirectUri = typeof window !== "undefined" 
          ? `${window.location.origin}/auth/callback` 
          : undefined

        // Exchange code for tokens via backend
        const response = await handleGoogleCallback(code, redirectUri)

        if (response.success && response.response) {
          const userData = response.response

          // Store tokens
          if (userData.id_token) {
            setToken(userData.id_token)
          }
          if (userData.access_token) {
            localStorage.setItem("meritcap_access_token", userData.access_token)
          }
          if (userData.refresh_token) {
            localStorage.setItem("meritcap_refresh_token", userData.refresh_token)
          }

          // Store user data using encryption
          if (userData.user) {
            const rememberMe = localStorage.getItem("meritcap_remember_me") === "true"
            setEncryptedUser(userData.user, !rememberMe)
          }

          setStatus("success")

          // Check if there's a pending search to resume
          const pendingSearch = localStorage.getItem("meritcap_pending_search")
          if (pendingSearch) {
            localStorage.removeItem("meritcap_pending_search")
            // Redirect to search results with preserved params
            setTimeout(() => {
              router.push(`/search-results?${pendingSearch}`)
            }, 1000)
          } else {
            // Redirect to home or dashboard
            setTimeout(() => {
              router.push("/")
            }, 1000)
          }
        } else {
          setError(response.message || "Failed to complete authentication")
          setStatus("error")
          // Reset processing flag on error to allow retry
          isProcessingRef.current = false
        }
      } catch (err: any) {
        console.error("Google OAuth callback error:", err)
        setError(err?.message || "An unexpected error occurred")
        setStatus("error")
        // Reset processing flag on error to allow retry
        isProcessingRef.current = false
      }
    }

    processCallback()
  }, [searchParams, router])

  const handleRetry = () => {
    // Reset refs to allow new OAuth attempt
    isProcessingRef.current = false
    processedCodeRef.current = null
    router.push("/login")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Completing Sign In
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your Google account...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to MeritCap!
            </h1>
            <p className="text-gray-600">
              You have been signed in successfully. Redirecting...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sign In Failed
            </h1>
            <p className="text-red-600 mb-6">
              {error}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleGoHome}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
