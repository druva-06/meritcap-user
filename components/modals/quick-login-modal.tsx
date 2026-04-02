"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { sendEmailOTP, verifyEmailOTP } from "@/lib/api/client"
import { setToken } from "@/lib/auth"
import { setEncryptedUser } from "@/lib/encryption"

interface QuickLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginComplete: (userData: any) => void
}

export function QuickLoginModal({ isOpen, onClose, onLoginComplete }: QuickLoginModalProps) {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(true)

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await sendEmailOTP(email.toLowerCase().trim())
      
      if (response.success && response.response?.success) {
        setSuccess("OTP sent successfully! Check your email.")
        setStep("otp")
        setCountdown(60) // 60 second cooldown
        setCanResend(false)
      } else {
        setError(response.message || "Failed to send OTP. Please try again.")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!canResend) return
    await handleSendOTP()
  }

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await verifyEmailOTP(email.toLowerCase().trim(), otp)
      
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

        setSuccess("Login successful!")
        
        // Call completion callback
        onLoginComplete(userData.user || { email })
        
        // Close modal after short delay
        setTimeout(() => {
          onClose()
        }, 500)
      } else {
        setError(response.message || "Invalid OTP. Please try again.")
      }
    } catch (err: any) {
      setError(err?.message || "Failed to verify OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep("email")
    setOtp("")
    setError("")
    setSuccess("")
  }

  const handleModalClose = () => {
    setStep("email")
    setEmail("")
    setOtp("")
    setError("")
    setSuccess("")
    setCountdown(0)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Quick Login
          </DialogTitle>
          <DialogDescription>
            {step === "email" 
              ? "Enter your email to receive a login code" 
              : "Enter the 6-digit code sent to your email"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          {step === "email" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendOTP()}
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={loading || !email.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Login Code"
                )}
              </Button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">6-Digit Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyPress={(e) => e.key === "Enter" && handleVerifyOTP()}
                  disabled={loading}
                  className="w-full text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Code sent to {email}
                </p>
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Login"
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={loading}
                >
                  ← Back
                </Button>

                <Button
                  variant="link"
                  size="sm"
                  onClick={handleResendOTP}
                  disabled={loading || !canResend}
                  className="text-xs"
                >
                  {!canResend ? `Resend in ${countdown}s` : "Resend Code"}
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-center text-muted-foreground pt-2 border-t">
            <p>By continuing, you agree to our Terms of Service</p>
            <p className="mt-2">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline font-medium">
                Login here
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
