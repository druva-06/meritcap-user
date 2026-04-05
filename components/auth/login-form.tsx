"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { login as loginApi } from "@/lib/api/client"
import { saveToken, saveRefreshToken } from "@/lib/auth"
import type { LoginRequest } from "@/lib/api/types"
import type { UnifiedUserProfile } from "@/types/user"
import { setEncryptedUser } from "@/lib/encryption"
import { setRememberMePreference } from "@/lib/auth-session"

interface LoginFormProps {
    onSuccess?: (user: UnifiedUserProfile) => void
    onCancel?: () => void
}

export default function LoginForm({ onSuccess, onCancel }: LoginFormProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

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

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!email || !password) return toast({ title: "Validation", description: "Please fill email and password", variant: "destructive" })
        setLoading(true)
        try {
            const payload: LoginRequest = { email, password }
            const res = await loginApi(payload)

            if (res?.success && res?.response?.access_token) {
                setRememberMePreference(rememberMe)
                // save tokens
                try {
                    saveToken(res.response.access_token, rememberMe)
                    if (res.response.refresh_token) saveRefreshToken(res.response.refresh_token, rememberMe)
                } catch (e) {
                    // ignore - auth helpers handle fallback
                }

                const user = res.response.user
                const canonicalUser = toCanonicalUser(user)
                const mapped: UnifiedUserProfile = {
                    name: `${user.first_name || user.firstName || ""} ${user.last_name || user.lastName || ""}`.trim(),
                    email: user.email,
                    phone: user.phone_number || "",
                    dateOfBirth: "",
                    nationality: "",
                    currentLocation: "",
                    lastEducation: "",
                    lastEducationPercentage: "",
                    lastEducationYear: "",
                    lastEducationInstitution: "",
                    hasTestScores: false,
                    testScores: [],
                    profileCompleted: !!user.profile_completed,
                    profileCompletion: user.profile_completion || 0,
                    profileStage: user.profile_stage || "basic",
                    studentId: user.user_id ? `WC${user.user_id}` : `WC${Date.now()}`,
                    loginTime: new Date().toISOString(),
                    signupTime: new Date().toISOString(),
                    profile_picture: user.profile_picture || "",
                }

                try {
                    setEncryptedUser(canonicalUser, !rememberMe)
                } catch (e) {
                    if (rememberMe) {
                        localStorage.setItem("meritcap_user", JSON.stringify(canonicalUser))
                    } else {
                        sessionStorage.setItem("meritcap_user", JSON.stringify(canonicalUser))
                    }
                }

                try { window.dispatchEvent(new Event("authStateChanged")) } catch (e) { }

                toast({ title: "Login Successful", description: res.message })
                onSuccess?.(mapped)
            } else {
                toast({ title: "Login Failed", description: res?.message || "Invalid credentials", variant: "destructive" })
            }
        } catch (err: any) {
            toast({ title: "Error", description: err?.response?.data?.message || err.message || "Failed to login", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                    <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
                </div>
            </div>

            <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                    <Input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-600">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="mr-2" /> Remember me
                </label>
                <a className="text-sm text-blue-600 hover:underline" href="/forgot-password">Forgot password?</a>
            </div>

            <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 font-semibold shadow-lg" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign in'}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
                )}
            </div>
        </form>
    )
}
