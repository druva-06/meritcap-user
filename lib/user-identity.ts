import { getEncryptedUser } from "@/lib/encryption"

function toNumericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return null

    if (/^\d+$/.test(trimmed)) {
      const parsed = Number.parseInt(trimmed, 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }

    const numericMatch = trimmed.match(/\d+/)
    if (numericMatch) {
      const parsed = Number.parseInt(numericMatch[0], 10)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }
  }

  return null
}

export function parseUserIdFromObject(userLike: any): number | null {
  if (!userLike || typeof userLike !== "object") {
    return null
  }

  const candidates = [
    userLike.user_id,
    userLike.userId,
    userLike.id,
    userLike.student_id,
    userLike.studentId,
  ]

  for (const candidate of candidates) {
    const parsed = toNumericId(candidate)
    if (parsed) {
      return parsed
    }
  }

  return null
}

function parseStoredUser(raw: string | null): any | null {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function resolveCurrentUserId(userLike?: any): number | null {
  const fromProvidedUser = parseUserIdFromObject(userLike)
  if (fromProvidedUser) {
    return fromProvidedUser
  }

  if (typeof window === "undefined") {
    return null
  }

  const fromEncrypted = parseUserIdFromObject(getEncryptedUser())
  if (fromEncrypted) {
    return fromEncrypted
  }

  const fromLocal = parseUserIdFromObject(parseStoredUser(localStorage.getItem("meritcap_user")))
  if (fromLocal) {
    return fromLocal
  }

  const fromSession = parseUserIdFromObject(parseStoredUser(sessionStorage.getItem("meritcap_user")))
  if (fromSession) {
    return fromSession
  }

  return null
}
