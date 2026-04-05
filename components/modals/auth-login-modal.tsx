"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import LoginForm from "@/components/auth/login-form"
import { User, Phone, Mail, Sparkles, MessageCircle } from "lucide-react"
import { setEncryptedUser } from "@/lib/encryption"
import { getRememberMePreference } from "@/lib/auth-session"

interface AuthLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginComplete: (userData: any) => void
}

export function AuthLoginModal({ isOpen, onClose, onLoginComplete }: AuthLoginModalProps) {
  const [step, setStep] = useState<"method" | "phone" | "otp">("method")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const handlePhoneLogin = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter your phone number")
      return
    }

    setLoading(true)
    // Simulate OTP sending
    setTimeout(() => {
      setOtpSent(true)
      setStep("otp")
      setLoading(false)
      alert("OTP sent to your phone number!")
    }, 1500)
  }

  const handleOtpVerify = async () => {
    if (!otp.trim() || otp.length !== 6) {
      alert("Please enter valid 6-digit OTP")
      return
    }

    if (!name.trim()) {
      alert("Please enter your name")
      return
    }

    setLoading(true)
    // Simulate OTP verification
    setTimeout(() => {
      const userData = {
        name: name.trim(),
        phone: phoneNumber,
        email: email.trim() || `${phoneNumber}@temp.com`,
        loginMethod: "phone",
        loginTime: new Date().toISOString(),
        isNewUser: true,
      }

      const rememberMe = getRememberMePreference()
      setEncryptedUser(userData, !rememberMe)
      onLoginComplete(userData)
      setLoading(false)
    }, 1500)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    // Simulate Google login
    setTimeout(() => {
      const userData = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        phone: "",
        loginMethod: "google",
        loginTime: new Date().toISOString(),
        isNewUser: true,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      }

      const rememberMe = getRememberMePreference()
      setEncryptedUser(userData, !rememberMe)
      onLoginComplete(userData)
      setLoading(false)
    }, 2000)
  }

  const resetModal = () => {
    setStep("method")
    setPhoneNumber("")
    setOtp("")
    setName("")
    setEmail("")
    setOtpSent(false)
    setLoading(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-2xl">
        <DialogHeader>
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {step === "method" ? "Login to Continue" : step === "phone" ? "Enter Phone Number" : "Verify OTP"}
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              {step === "method"
                ? "Choose your preferred login method"
                : step === "phone"
                  ? "We'll send you a verification code"
                  : "Enter the 6-digit code sent to your phone"}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === "method" && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <LoginForm
                  onSuccess={(user) => {
                    onLoginComplete(user)
                    handleClose()
                  }}
                  onCancel={() => setStep("method")}
                />
              </CardContent>
            </Card>
          )}

          {step === "phone" && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-blue-600" />
                    Phone Number *
                  </Label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("method")}
                    className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePhoneLogin}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send OTP
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "otp" && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Enter 6-digit OTP *</Label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">OTP sent to {phoneNumber}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Full Name *
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    Email (Optional)
                  </Label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("phone")}
                    className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleOtpVerify}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Verify & Continue
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={handlePhoneLogin}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Resend OTP
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-center text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
