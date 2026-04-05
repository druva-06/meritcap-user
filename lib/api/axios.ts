"use client"

import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { getToken, clearTokens, getRefreshToken, saveToken } from "@/lib/auth"
import { getEncryptedUser } from "@/lib/encryption"

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

const instance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Attach token from storage if present
instance.interceptors.request.use((config) => {
  try {
    const token = typeof window !== "undefined" ? getToken() : null
    if (token && config.headers) config.headers["Authorization"] = `Bearer ${token}`
  } catch (e) {
    // ignore
  }
  return config
})

// State to avoid multiple parallel refresh calls
let isRefreshing = false
let refreshQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

function processRefreshQueue(error: any, token: string | null) {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  refreshQueue = []
}

function handleAuthFailure(message = "Session expired") {
  try {
    clearTokens()
    if (typeof window !== "undefined") {
      // Remove stored user/profile + any meritcap_* keys (localStorage & sessionStorage)
      try {
        const purge = (storage: Storage) => {
          const keys: string[] = []
          for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i)
            if (!key) continue
            if (key.startsWith("meritcap_")) keys.push(key)
            if (key === "meritcap_user") keys.push(key)
          }
          keys.forEach((k) => storage.removeItem(k))
        }
        purge(localStorage)
        purge(sessionStorage)
      } catch {}
      // Broadcast auth change
      window.dispatchEvent(new Event("authStateChanged"))
      // Redirect to login (preserve intended page as redirect param if desired)
      try {
        const current = window.location.pathname + window.location.search
        const loginUrl = `/login?redirect=${encodeURIComponent(current)}`
        if (!window.location.pathname.startsWith("/login")) {
          window.location.replace(loginUrl)
        }
      } catch {}
    }
  } catch {}
  toast({ title: message, description: "Please login again", variant: "destructive" })
}

instance.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const message = error?.response?.data?.message || error.message || "Request failed"

    // Attempt token refresh on 401 for authenticated requests
    if (status === 401) {
      try {
        const originalRequest = error.config
        if (!originalRequest) return Promise.reject(error)

        // If request already flagged to retry, do not loop
        if (originalRequest._retry) {
          handleAuthFailure()
          return Promise.reject(error)
        }

        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          handleAuthFailure()
          return Promise.reject(error)
        }

        // Extract email from stored user profile
        let email: string | null = null
        try {
          if (typeof window !== "undefined") {
            // Try encrypted storage first
            let parsed = getEncryptedUser()
            
            // Fallback to unencrypted
            if (!parsed) {
              const raw = localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
              if (raw) {
                parsed = JSON.parse(raw)
              }
            }
            
            if (parsed) {
              email = parsed?.email || parsed?.username || null
            }
          }
        } catch {}

        if (!email) {
          handleAuthFailure()
          return Promise.reject(error)
        }

        // Queue requests while a refresh is in progress
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject })
          })
            .then((newAccess) => {
              if (newAccess && originalRequest.headers)
                originalRequest.headers["Authorization"] = `Bearer ${newAccess}`
              return instance(originalRequest)
            })
            .catch((err) => Promise.reject(err))
        }

        originalRequest._retry = true
        isRefreshing = true

        return instance
          .post("/api/auth/refresh", { email, refresh_token: refreshToken })
          .then((resp) => {
            const newAccess = resp?.data?.response?.access_token
            if (newAccess) {
              try {
                saveToken(newAccess, !!localStorage.getItem("meritcap_refresh_token"))
              } catch {}
              processRefreshQueue(null, newAccess)
              if (originalRequest.headers) originalRequest.headers["Authorization"] = `Bearer ${newAccess}`
              return instance(originalRequest)
            }
            throw new Error("No access token in refresh response")
          })
          .catch((refreshErr) => {
            processRefreshQueue(refreshErr, null)
            handleAuthFailure()
            return Promise.reject(refreshErr)
          })
          .finally(() => {
            isRefreshing = false
          })
      } catch (e) {
        handleAuthFailure()
        return Promise.reject(error)
      }
    }

    toast({ title: "API Error", description: String(message), variant: "destructive" })

    return Promise.reject(error)
  }
)

export default instance
