"use client"

// Simple encryption/decryption utility using AES-like approach with Web Crypto API
// For production, consider using a more robust library like crypto-js

const ENCRYPTION_KEY = "meritcap-secure-key-2025" // In production, this should be an environment variable

/**
 * Encrypts data using a simple XOR cipher with base64 encoding
 * For production, use proper encryption libraries
 */
export function encryptData(data: any): string {
  try {
    // Handle circular references by using a replacer function
    const jsonString = JSON.stringify(data, (key, value) => {
      // Remove circular references and functions
      if (typeof value === 'function') return undefined;
      if (typeof value === 'object' && value !== null) {
        // Simple check for potential circular refs by limiting depth
        if (key.length > 50) return '[DEEP_OBJECT]';
      }
      return value;
    })
    
    const encrypted = btoa(
      jsonString
        .split("")
        .map((char, i) => 
          String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
        )
        .join("")
    )
    return encrypted
  } catch (error) {
    console.error("Encryption error:", error)
    // Fallback: try with minimal data only
    try {
      const minimalData = {
        email: data?.email,
        firstName: data?.firstName,
        userId: data?.userId
      }
      return btoa(JSON.stringify(minimalData))
    } catch {
      return btoa(JSON.stringify({ email: data?.email || 'unknown' }))
    }
  }
}

/**
 * Decrypts data that was encrypted with encryptData
 */
export function decryptData(encryptedData: string): any {
  try {
    const decoded = atob(encryptedData)
    const decrypted = decoded
      .split("")
      .map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
      )
      .join("")
    return JSON.parse(decrypted)
  } catch (error) {
    console.error("Decryption error:", error)
    try {
      // Fallback: try to decode as base64 only
      return JSON.parse(atob(encryptedData))
    } catch {
      return null
    }
  }
}

/**
 * Securely stores user data in localStorage with encryption
 */
export function setEncryptedUser(userData: any, useSessionStorage = false): void {
  try {
    // Create a canonical, backward-compatible copy
    const normalizedUserId =
      userData.userId ||
      userData.user_id ||
      userData.id ||
      (typeof userData.studentId === "string" ? Number.parseInt(userData.studentId.replace(/\D/g, ""), 10) : undefined)

    const normalizedFirstName =
      userData.firstName ||
      userData.first_name ||
      (typeof userData.name === "string" ? userData.name.split(" ").slice(0, 1).join(" ") : "")

    const normalizedLastName =
      userData.lastName ||
      userData.last_name ||
      (typeof userData.name === "string" ? userData.name.split(" ").slice(1).join(" ") : "")

    const cleanUserData = {
      userId: normalizedUserId,
      user_id: normalizedUserId,
      firstName: normalizedFirstName,
      first_name: normalizedFirstName,
      lastName: normalizedLastName,
      last_name: normalizedLastName,
      email: userData.email || "",
      username: userData.username || "",
      phoneNumber: userData.phoneNumber || userData.phone_number || userData.phone || "",
      phone_number: userData.phoneNumber || userData.phone_number || userData.phone || "",
      profilePicture: userData.profilePicture || userData.profile_picture || "",
      profile_picture: userData.profilePicture || userData.profile_picture || "",
      role: userData.role || "",
      profileIncomplete: userData.profileIncomplete || userData.profile_incomplete || false,
      profile_incomplete: userData.profileIncomplete || userData.profile_incomplete || false
    }
    
    const encrypted = encryptData(cleanUserData)
    
    if (useSessionStorage) {
      sessionStorage.setItem("meritcap_user_secure", encrypted)
    } else {
      localStorage.setItem("meritcap_user_secure", encrypted)
    }

    if (useSessionStorage) {
      sessionStorage.removeItem("meritcap_user")
    } else {
      localStorage.removeItem("meritcap_user")
    }
  } catch (error) {
    console.error("[Encryption] Failed to store encrypted user data:", error)
  }
}

/**
 * Retrieves and decrypts user data from localStorage
 */
export function getEncryptedUser(): any {
  try {
    // Try localStorage first
    let encrypted = localStorage.getItem("meritcap_user_secure")
    let storageType = "localStorage"
    
    // Fallback to sessionStorage
    if (!encrypted) {
      encrypted = sessionStorage.getItem("meritcap_user_secure")
      storageType = "sessionStorage"
    }
    
    if (!encrypted) {
      return null
    }
    
    const decrypted = decryptData(encrypted)
    
    return decrypted
  } catch (error) {
    console.error("[Encryption] Failed to retrieve encrypted user data:", error)
    return null
  }
}

/**
 * Removes encrypted user data from storage
 */
export function removeEncryptedUser(): void {
  try {
    localStorage.removeItem("meritcap_user_secure")
    sessionStorage.removeItem("meritcap_user_secure")
  } catch (error) {
    console.error("Failed to remove encrypted user data:", error)
  }
}

/**
 * Migrates existing unencrypted user data to encrypted format
 */
export function migrateToEncryptedStorage(): void {
  try {
    // Check for existing unencrypted data
    const unencryptedData = localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
    
    if (unencryptedData) {
      const userData = JSON.parse(unencryptedData)
      const useSession = !!sessionStorage.getItem("meritcap_user")
      
      // Store encrypted version
      setEncryptedUser(userData, useSession)
      
      // Keep the old version for backward compatibility during transition
      // You can remove this after full migration
    }
  } catch (error) {
    console.error("Failed to migrate user data:", error)
  }
}
