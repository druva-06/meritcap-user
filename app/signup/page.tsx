"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, User, CheckCircle, Upload, FileText, Clock, Shield, Zap, Loader2, Mail, Phone, Lock, UserPlus, Sparkles, ArrowRight, Globe } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getGoogleAuthUrl } from "@/lib/api/client"
import { savePendingSignup, setRememberMePreference } from "@/lib/auth-session"

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    countryCode: "+91",
    password: "",
    confirmPassword: "",
  })

  // Password strength calculator
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) strength += 25
    return strength
  }

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password))
  }, [formData.password])

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "bg-red-500"
    if (passwordStrength < 50) return "bg-orange-500"
    if (passwordStrength < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return "Weak"
    if (passwordStrength < 50) return "Fair"
    if (passwordStrength < 75) return "Good"
    return "Strong"
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    try {
      setRememberMePreference(false)

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
          title: "Google Sign-up Failed",
          description: response.message || "Failed to initiate Google sign-up",
          variant: "destructive",
        })
        setGoogleLoading(false)
      }
    } catch (error: any) {
      toast({
        title: "Google Sign-up Failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      })
      setGoogleLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    // Phone is now optional - only validate format if provided
    if (formData.phone.trim() && !/^[0-9]{10,15}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone number must be 10-15 digits"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      setRememberMePreference(false)

      // Build request body as required by backend
      // Ensure phone number includes country code
      const normalizedPhone = formData.phone.startsWith("+")
        ? formData.phone
        : `${formData.countryCode}${formData.phone}`

      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone_number: normalizedPhone,
        role: "STUDENT",
      }

      const { signup } = await import("@/lib/api/client")
      const res = await signup(payload)

      // Backend expected to return success message or created user
      if (res && (res.success || res.id || res.user)) {
        savePendingSignup({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          phoneNumber: normalizedPhone,
        })
        // Redirect user to email confirmation page (backend sends OTP automatically)
        toast({ title: "Account Created", description: res?.message || "Please check your email for the verification code." })
        setIsLoading(false)
        router.push(`/signup/confirm?email=${encodeURIComponent(formData.email)}`)
      } else {
        const msg = res?.message || "Failed to create account"
        toast({ title: "Signup Failed", description: msg, variant: "destructive" })
        setIsLoading(false)
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Signup failed"
      toast({ title: "Signup Error", description: message, variant: "destructive" })
      setIsLoading(false)
    }
  }

  const handleSkipDocuments = () => {
    router.push("/dashboard")
  }

  const handleSetupDocumentVault = () => {
    router.push("/dashboard?tab=documents&setup=true")
  }

  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <Card className="w-full max-w-2xl border-0 shadow-2xl backdrop-blur-sm bg-white/95 relative z-10">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-600 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-24 h-24 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3 flex items-center justify-center gap-2">
                Account Created Successfully!
                <Sparkles className="w-8 h-8 text-green-500 animate-bounce" />
              </h1>
              <p className="text-gray-700 text-lg font-medium">
                Welcome to MeritCap, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">{`${formData.firstName} ${formData.lastName}`}</span>!
              </p>
              <p className="text-gray-600 mt-2">Your educational journey starts here 🚀</p>
            </div>

            {/* Enhanced Document Vault Section */}
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-blue-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-xl"></div>
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      Set Up Your Document Vault
                      <Zap className="w-6 h-6 text-yellow-500" />
                    </h3>
                    <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                      Upload your documents once and use them for all university applications. 
                      <span className="font-semibold text-blue-600"> Save time and apply faster!</span>
                    </p>

                    {/* Enhanced Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border shadow-sm">
                        <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">Save 80% time on applications</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border shadow-sm">
                        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">Secure document storage</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border shadow-sm">
                        <Zap className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">One-click document sharing</span>
                      </div>
                    </div>

                    {/* Enhanced Document Types */}
                    <div className="bg-white/80 rounded-xl p-5 border border-gray-200/50 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-4 text-lg">Documents you can upload:</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                        {[
                          'Academic Transcripts',
                          'Degree Certificates', 
                          'Test Scores (IELTS, TOEFL)',
                          'Passport Copy',
                          'Work Experience Letters',
                          'Financial Documents'
                        ].map((doc, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative group flex-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition duration-300 animate-pulse"></div>
                <Button
                  onClick={handleSetupDocumentVault}
                  className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 font-bold shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl text-base"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Set Up Document Vault
                  <span className="ml-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                    Recommended
                  </span>
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={handleSkipDocuments}
                className="flex-1 py-4 font-semibold bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 text-base"
              >
                Skip for Now
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border">
                💡 <strong>Pro Tip:</strong> You can always set up your document vault later from your dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl backdrop-blur-sm bg-white/95 relative z-10">
        <CardContent className="p-8">
          {/* Header with animated icon */}
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
              <div className="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              Join MeritCap
              <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
            </h1>
            <p className="text-gray-600 mt-2 font-medium">Create your free account and unlock your potential</p>
          </div>

          {/* Enhanced Google Sign-up Button */}
          <div className="relative group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <Button
              type="button"
              onClick={handleGoogleSignup}
              disabled={googleLoading || isLoading}
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
                    Quick signup with Google
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
                Or create account manually
              </span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Enhanced Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md opacity-0 group-hover:opacity-20 transition-all duration-300 ${focusedField === 'firstName' ? 'opacity-30' : ''}`}></div>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                    className={`relative transition-all duration-300 ${errors.firstName ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"} ${focusedField === 'firstName' ? 'shadow-lg scale-[1.02]' : ''}`}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md opacity-0 group-hover:opacity-20 transition-all duration-300 ${focusedField === 'lastName' ? 'opacity-30' : ''}`}></div>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                    className={`relative transition-all duration-300 ${errors.lastName ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"} ${focusedField === 'lastName' ? 'shadow-lg scale-[1.02]' : ''}`}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Enhanced Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Username <span className="text-red-500">*</span>
                <User className="w-4 h-4 text-gray-400" />
              </Label>
              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md opacity-0 group-hover:opacity-20 transition-all duration-300 ${focusedField === 'username' ? 'opacity-30' : ''}`}></div>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className={`relative transition-all duration-300 ${errors.username ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"} ${focusedField === 'username' ? 'shadow-lg scale-[1.02]' : ''}`}
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Enhanced Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Email Address <span className="text-red-500">*</span>
                <Mail className="w-4 h-4 text-gray-400" />
              </Label>
              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md opacity-0 group-hover:opacity-20 transition-all duration-300 ${focusedField === 'email' ? 'opacity-30' : ''}`}></div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`relative transition-all duration-300 ${errors.email ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"} ${focusedField === 'email' ? 'shadow-lg scale-[1.02]' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Enhanced Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Phone Number
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 text-xs font-normal bg-gray-100 px-2 py-1 rounded-full">Optional</span>
              </Label>
              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md opacity-0 group-hover:opacity-20 transition-all duration-300 ${focusedField === 'phone' ? 'opacity-30' : ''}`}></div>
                <div className="flex relative">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, countryCode: e.target.value }))}
                    className="px-3 py-2.5 rounded-l-md border border-r-0 border-gray-300 bg-white text-sm font-medium focus:outline-none focus:border-blue-500 transition-all duration-300"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+81">🇯🇵 +81</option>
                  </select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone (optional)"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    className={`rounded-l-none border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 flex-1 transition-all duration-300 ${errors.phone ? "border-red-400 bg-red-50" : ""} ${focusedField === 'phone' ? 'shadow-lg' : ''}`}
                  />
                </div>
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Enhanced Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Password <span className="text-red-500">*</span>
                <Lock className="w-4 h-4 text-gray-400" />
              </Label>
              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md opacity-0 group-hover:opacity-20 transition-all duration-300 ${focusedField === 'password' ? 'opacity-30' : ''}`}></div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`relative transition-all duration-300 pr-10 ${errors.password ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"} ${focusedField === 'password' ? 'shadow-lg scale-[1.02]' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength >= 75 ? 'text-green-600' : passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Enhanced Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Confirm Password <span className="text-red-500">*</span>
                <Lock className="w-4 h-4 text-gray-400" />
              </Label>
              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-md opacity-0 group-hover:opacity-20 transition-all duration-300 ${focusedField === 'confirmPassword' ? 'opacity-30' : ''}`}></div>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    className={`relative transition-all duration-300 pr-10 ${errors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"} ${focusedField === 'confirmPassword' ? 'shadow-lg scale-[1.02]' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="animate-in fade-in duration-200">
                  {formData.password === formData.confirmPassword ? (
                    <p className="text-green-600 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Passwords match
                    </p>
                  ) : (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      Passwords don't match
                    </p>
                  )}
                </div>
              )}
              
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Enhanced Terms Checkbox */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 transition-all duration-200 transform hover:scale-105"
                required
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-200">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-200">
                  Privacy Policy
                </Link>
              </span>
            </div>

            {/* Enhanced Submit Button */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition duration-300 animate-pulse"></div>
              <Button
                type="submit"
                disabled={isLoading || googleLoading}
                className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 font-semibold shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Enhanced Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-200">
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Free forever</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-600">
                <Globe className="w-4 h-4" />
                <span className="font-medium">Global Access</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
