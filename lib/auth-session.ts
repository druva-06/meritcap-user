"use client"

export const REMEMBER_ME_KEY = "meritcap_remember_me"
export const PENDING_SIGNUP_KEY = "meritcap_pending_signup"

export interface PendingSignupData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  username?: string
  phoneNumber?: string
  createdAt: string
}

export function getRememberMePreference(defaultValue = false): boolean {
  if (typeof window === "undefined") return defaultValue

  const stored = localStorage.getItem(REMEMBER_ME_KEY)
  if (stored === null) {
    localStorage.setItem(REMEMBER_ME_KEY, String(defaultValue))
    return defaultValue
  }

  return stored === "true"
}

export function setRememberMePreference(value: boolean): void {
  if (typeof window === "undefined") return
  localStorage.setItem(REMEMBER_ME_KEY, String(value))
}

export function dispatchAuthStateChanged(): void {
  if (typeof window === "undefined") return
  try {
    window.dispatchEvent(new Event("authStateChanged"))
  } catch (e) { }
}

export function savePendingSignup(data: Omit<PendingSignupData, "createdAt">): void {
  if (typeof window === "undefined") return
  const payload: PendingSignupData = {
    ...data,
    createdAt: new Date().toISOString(),
  }
  sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(payload))
}

export function getPendingSignup(maxAgeMinutes = 30): PendingSignupData | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PendingSignupData
    const createdAt = new Date(parsed.createdAt).getTime()
    if (!Number.isFinite(createdAt)) {
      sessionStorage.removeItem(PENDING_SIGNUP_KEY)
      return null
    }

    const ageMs = Date.now() - createdAt
    if (ageMs > maxAgeMinutes * 60 * 1000) {
      sessionStorage.removeItem(PENDING_SIGNUP_KEY)
      return null
    }
    return parsed
  } catch {
    sessionStorage.removeItem(PENDING_SIGNUP_KEY)
    return null
  }
}

export function clearPendingSignup(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(PENDING_SIGNUP_KEY)
}
