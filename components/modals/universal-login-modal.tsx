"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { User, Lock, Mail, Phone, Eye, EyeOff, Sparkles } from "lucide-react"
import { setEncryptedUser } from "@/lib/encryption"
import { getRememberMePreference } from "@/lib/auth-session"

interface UniversalLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (userData: any) => void
}

export function UniversalLoginModal({ isOpen, onClose, onComplete }: UniversalLoginModalProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup")
  const [showPassword, setShowPassword] = useState(false)

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  })

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const handleSignupInputChange = (field: string, value: string) => {
    setSignupData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignup = () => {
    if (!signupData.fullName || !signupData.email || !signupData.phone || !signupData.password) {
      alert("Please fill in all required fields")
      return
    }

    // Create user account
    const userData = {
      email: signupData.email,
      name: signupData.fullName,
      phone: signupData.phone,
      signupTime: new Date().toISOString(),
    }

    const rememberMe = getRememberMePreference()
    setEncryptedUser(userData, !rememberMe)
    onComplete(userData)
    onClose()
  }

  const handleLogin = () => {
    if (!loginData.email || !loginData.password) {
      alert("Please fill in all required fields")
      return
    }

    // Simulate login
    const userData = {
      email: loginData.email,
      name: loginData.email
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      loginTime: new Date().toISOString(),
    }

    const rememberMe = getRememberMePreference()
    setEncryptedUser(userData, !rememberMe)
    onComplete(userData)
    onClose()
  }

  const handleContinueBrowsing = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-2xl">
        <DialogHeader>
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {mode === "signup" ? <User className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {mode === "signup" ? "Create Your Free Account" : "Welcome Back"}
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              {mode === "signup"
                ? "Join thousands of students and get personalized recommendations"
                : "Login to access your personalized dashboard"}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {mode === "signup" ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                      <User className="w-4 h-4 mr-2 text-blue-600" />
                      Full Name *
                    </Label>
                    <Input
                      placeholder="Enter your full name"
                      value={signupData.fullName}
                      onChange={(e) => handleSignupInputChange("fullName", e.target.value)}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-blue-600" />
                      Email Address *
                    </Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={signupData.email}
                      onChange={(e) => handleSignupInputChange("email", e.target.value)}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-blue-600" />
                      Phone Number *
                    </Label>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={signupData.phone}
                      onChange={(e) => handleSignupInputChange("phone", e.target.value)}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-blue-600" />
                      Password *
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signupData.password}
                        onChange={(e) => handleSignupInputChange("password", e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-blue-600" />
                      Email Address *
                    </Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => handleLoginInputChange("email", e.target.value)}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-blue-600" />
                      Password *
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => handleLoginInputChange("password", e.target.value)}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button
              onClick={mode === "signup" ? handleSignup : handleLogin}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{mode === "signup" ? "Create Free Account" : "Login to Dashboard"}</span>
            </Button>

            <Button
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 py-3 font-semibold bg-white/80 backdrop-blur-sm"
            >
              {mode === "signup" ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </Button>

            <Button
              onClick={handleContinueBrowsing}
              variant="ghost"
              className="text-gray-600 hover:text-gray-800 py-3 font-medium"
            >
              Continue Browsing
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            By {mode === "signup" ? "registering" : "logging in"}, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
