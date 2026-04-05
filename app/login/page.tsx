"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, LogIn, Sparkles, Shield, Zap, Globe, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ProfileCompletionModal } from "@/components/modals/profile-completion-modal"
import type { UnifiedUserProfile } from "@/types/user"
import { login as loginApi, getGoogleAuthUrl } from "@/lib/api/client"
import { setToken, setRefreshToken } from "@/lib/auth"
import type { LoginRequest } from "@/lib/api/types"
import { setEncryptedUser } from "@/lib/encryption"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userData, setUserData] = useState<UnifiedUserProfile | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const toCanonicalUser = (apiUser: any) => ({
    user_id: apiUser.user_id,
    first_name: apiUser.first_name || "",
    last_name: apiUser.last_name || "",
    email: apiUser.email || "",
    username: apiUser.username || "",
    phone_number: apiUser.phone_number || "",
    role: apiUser.role || "",
    profile_picture: apiUser.profile_picture || "",
    profile_incomplete: apiUser.profile_incomplete || false,
    login_time: new Date().toISOString(),
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      // Store remember me preference for use after callback
      localStorage.setItem("meritcap_remember_me", formData.rememberMe.toString())

      // Get redirect URI for the callback
      const redirectUri = typeof window !== "undefined" 
        ? `${window.location.origin}/auth/callback` 
        : undefined

      // Get Google OAuth URL from backend
      const response = await getGoogleAuthUrl(redirectUri)
      
      if (response.success && response.response?.auth_url) {
        // Redirect to Google OAuth
        window.location.href = response.response.auth_url
      } else {
        toast({
          title: "Google Login Failed",
          description: response.message || "Failed to initiate Google sign-in",
          variant: "destructive",
        })
        setGoogleLoading(false)
      }
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Email/password login via API
    setLoading(true)
    try {
      if (!formData.email || !formData.password) {
        toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" })
        setLoading(false)
        return
      }

      const payload: LoginRequest = { email: formData.email, password: formData.password }
      const res = await loginApi(payload)

      if (res?.success && res?.response?.access_token) {
        // Enforce role-based access: this is the Student portal, only allow users with role 'student'
        const backendRole = res.response.user?.role || ""
        if (backendRole && backendRole.toLowerCase() !== "student") {
          toast({ title: "Unauthorized", description: "Your account is not allowed to login to the Student portal.", variant: "destructive" })
          setLoading(false)
          return
        }
        // store tokens according to rememberMe
        const remember = formData.rememberMe
        // use helper that writes to localStorage or sessionStorage
        try {
          // save tokens to chosen storage
          const { saveToken, saveRefreshToken } = await import("@/lib/auth")
          saveToken(res.response.access_token, remember)
          if (res.response.refresh_token) saveRefreshToken(res.response.refresh_token, remember)
        } catch (e) {
          // fallback to localStorage
          setToken(res.response.access_token)
          if (res.response.refresh_token) setRefreshToken(res.response.refresh_token)
        }

        // save minimal user info for UI + canonical user for persisted session
        const user = res.response.user
        const canonicalUser = toCanonicalUser(user)
        const mapped: UnifiedUserProfile = {
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone_number || "",
          username: user.username || "",
          dateOfBirth: "",
          nationality: "",
          currentLocation: "",
          lastEducation: "",
          lastEducationPercentage: "",
          lastEducationYear: "",
          lastEducationInstitution: "",
          hasTestScores: false,
          testScores: [],
          profileCompleted: false,
          profileCompletion: 25,
          profileStage: "basic",
          studentId: `WC${user.user_id}`,
          loginTime: new Date().toISOString(),
          signupTime: new Date().toISOString(),
          profile_picture: user.profile_picture || "",
        }

        setUserData(mapped)
        try {
          setEncryptedUser(canonicalUser, !formData.rememberMe)
        } catch (e) {
          // Fallback to unencrypted storage
          if (formData.rememberMe) {
            localStorage.setItem("meritcap_user", JSON.stringify(canonicalUser))
          } else {
            sessionStorage.setItem("meritcap_user", JSON.stringify(canonicalUser))
          }
        }
        // Notify other components in the same window to refresh auth state
        try {
          window.dispatchEvent(new Event("authStateChanged"))
        } catch (e) {
          // ignore during SSR or if window is not available
        }

        toast({ title: "Login Successful", description: res.message })
        router.push("/")
      } else {
        const msg = res?.message || res?.response?.message || "Invalid credentials"
        toast({ title: "Login Failed", description: msg, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Login Error", description: err?.response?.data?.message || err.message || "Failed to login", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileComplete = (completeProfileData: UnifiedUserProfile) => {
    setShowProfileModal(false)
    // Redirect to home after profile completion
    router.push("/")
  }

  const handleProfileSkip = () => {
    setShowProfileModal(false)
    // Redirect to home even if profile is skipped
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md mx-auto p-8 relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">WOW MAMA</span>
          </Link>
        </div>

        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            Welcome Back!
            <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
          </h1>
          <p className="text-gray-600 font-medium">Sign in to continue your educational journey</p>
        </div>

        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Student Portal Login
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Enhanced Google Sign-in Button */}
            <div className="relative group mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                variant="outline"
                className="relative w-full h-12 text-base font-medium border-2 hover:bg-gray-50 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin text-blue-500" />
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-semibold text-gray-700 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      Quick login with Google
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                  </>
                )}
              </Button>
            </div>

            {/* Enhanced Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 py-1 text-muted-foreground font-medium rounded-full border shadow-sm">
                  Or sign in with email
                </span>
              </div>
            </div>

            {/* Enhanced Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Enhanced Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  Email Address
                  <Mail className="w-4 h-4 text-gray-400" />
                </Label>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md opacity-0 group-hover:opacity-20 transition-all duration-300 ${focusedField === 'email' ? 'opacity-30' : ''}`}></div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors duration-200" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={`relative pl-10 transition-all duration-300 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${focusedField === 'email' ? 'shadow-lg scale-[1.02]' : ''}`}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  Password
                  <Lock className="w-4 h-4 text-gray-400" />
                </Label>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md opacity-0 group-hover:opacity-20 transition-all duration-300 ${focusedField === 'password' ? 'opacity-30' : ''}`}></div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors duration-200" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className={`relative pl-10 pr-10 transition-all duration-300 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${focusedField === 'password' ? 'shadow-lg scale-[1.02]' : ''}`}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:scale-110"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Options Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, rememberMe: checked as boolean }))
                    }
                    className="transition-all duration-200 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-medium text-gray-700">
                    Remember me
                  </Label>
                </div>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-200"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Enhanced Submit Button */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition duration-300 animate-pulse"></div>
                <Button
                  type="submit"
                  className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 font-semibold shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl"
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Enhanced Footer */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-200">
                  Sign up here
                </Link>
              </p>
              
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 text-green-600">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Secure Login</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-600">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">Fast Access</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-600">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">24/7 Available</span>
                </div>
              </div>
            </div>

            <div className="lg:hidden mt-6 text-center">
              <Link href="/portals" className="text-gray-600 hover:text-gray-700 font-medium hover:underline transition-all duration-200">
                Other Portals
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
        onSkip={handleProfileSkip}
        userData={userData}
      />
    </div>
  )
}
