import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a phone number is a placeholder (generated for users who signed up without phone)
 * @param phone The phone number to check
 * @returns true if the phone is a placeholder, false otherwise
 */
export function isPlaceholderPhone(phone: string | null | undefined): boolean {
  if (!phone) return false
  return phone.startsWith("+1000000000")
}
