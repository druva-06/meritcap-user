import axios from "./axios"
import type { LoginRequest, LoginApiResponse } from "./types"
import { getToken } from "@/lib/auth"
import { getEncryptedUser } from "@/lib/encryption"

export async function login(data: LoginRequest): Promise<LoginApiResponse> {
  try {
    const res = await axios.post<LoginApiResponse>("/api/auth/login", data)
    return res.data
  } catch (err: any) {
    // If backend responded with a structured error payload, return it so callers
    // can show the message instead of relying only on thrown errors.
    if (err?.response?.data) {
      return err.response.data as LoginApiResponse
    }
    throw err
  }
}

export async function signup(data: Record<string, any>): Promise<any> {
  try {
    const res = await axios.post("/api/auth/signup", data)
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function confirmVerificationCode(email: string, verificationCode: string): Promise<any> {
  try {
    const res = await axios.get("/api/auth/confirmVerificationCode", {
      params: { email, verificationCode },
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function resendVerificationCode(email: string): Promise<any> {
  try {
    const res = await axios.get(`/api/auth/resendVerificationCode/${encodeURIComponent(email)}`)
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function sendForgotPasswordOtp(email: string): Promise<any> {
  try {
  // Call the backend forgotPassword endpoint which sends OTP to the given email
  const res = await axios.get(`/api/auth/forgotPassword/${encodeURIComponent(email)}`)
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function confirmForgotPassword(email: string, confirmationCode: string, newPassword: string): Promise<any> {
  try {
    const res = await axios.get(`/api/auth/confirmForgotPassword`, {
      params: { email, confirmationCode, newPassword },
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function searchCollegeCourses(payload: any): Promise<any> {
  try {
    const res = await axios.post(`/api/college-course/collegeCourses`, payload)
    // Normalize intakeMonths in the response to always be an array of upper-case 3-letter month codes
    try {
      const data = res?.data
      const normalizeIntake = (item: any) => {
        if (!item) return item
        const im = item.intakeMonths ?? item.intake_months ?? item.intakeMonthsRaw ?? null
        if (Array.isArray(im)) {
          item.intakeMonths = im.map((m: any) => (m || "").toString().trim().toUpperCase())
        } else if (typeof im === 'string' && im.trim() !== '') {
          // split comma or pipe separated values
          item.intakeMonths = im
            .split(/[ ,|]+/) // split on comma, space or pipe
            .map((m) => (m || "").toString().trim().toUpperCase())
            .filter(Boolean)
        } else {
          item.intakeMonths = Array.isArray(item.intakeMonths) ? item.intakeMonths : []
        }
        return item
      }

      if (data && data.response && Array.isArray(data.response.data)) {
        data.response.data = data.response.data.map(normalizeIntake)
      } else if (data && Array.isArray(data.data)) {
        data.data = data.data.map(normalizeIntake)
      } else if (data && Array.isArray(data)) {
        // axios sometimes returns array directly
        // nothing to normalize at top-level
      }
    } catch (e) {
      // don't block normal flow if normalization fails
      // console.warn('Failed to normalize intakeMonths', e)
    }

    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function getCollegeCourseDetail(id: string | number): Promise<any> {
  try {
    const res = await axios.get(`/api/college-course/collegeCourseDetail/${id}`)
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

// Wishlist APIs
export async function addWishlistItem(studentId: number | string, collegeCourseId: number | string): Promise<any> {
  try {
    const sid = typeof studentId === "string" ? studentId.trim() : studentId
    const cid = typeof collegeCourseId === "string" ? Number.parseInt(collegeCourseId, 10) : collegeCourseId
    const url = `/api/students/${encodeURIComponent(String(sid))}/wishlist/items`
    const res = await axios.post(url, { collegeCourseId: cid })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function getWishlistItems(studentId: number | string): Promise<any> {
  try {
    const sid = typeof studentId === "string" ? studentId.trim() : studentId
    const url = `/api/students/${encodeURIComponent(String(sid))}/wishlist/items`
    const res = await axios.get(url)
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function removeWishlistItem(
  studentId: number | string,
  wishlistItemId: number | string
): Promise<any> {
  try {
    const sid = typeof studentId === "string" ? studentId.trim() : studentId
    const wid = typeof wishlistItemId === "string" ? wishlistItemId.trim() : wishlistItemId
    const url = `/api/students/${encodeURIComponent(String(sid))}/wishlist/items/${encodeURIComponent(String(wid))}`
    const res = await axios.delete(url)
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

// Change Password API
export async function changePassword(oldPassword: string, newPassword: string): Promise<any> {
  try {
    const payload = { old_password: oldPassword, new_password: newPassword }
    const res = await axios.post(`/api/auth/changePassword`, payload)
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

// Document Upload API
export async function uploadDocument(
  file: File,
  metadata: {
    referenceType: string
    referenceId: number
    documentType: string
    category: string
    remarks?: string
  }
): Promise<any> {
  try {
    // Get the token to ensure authorization
    const token = typeof window !== "undefined" ? getToken() : null
    if (!token) {
      throw new Error("No authentication token found")
    }

    const formData = new FormData()
    formData.append("file", file)
    
    // Create a blob for metadata (similar to how Postman sends it as a file)
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" })
    formData.append("metadata", metadataBlob, "metadata.json")

    const res = await axios.post("/api/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${token}`,
      },
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

// Document List API
export async function getDocumentsList(referenceType: string, referenceId: number): Promise<any> {
  try {
    const res = await axios.get("/api/documents/list", {
      params: {
        referenceType,
        referenceId,
      },
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

// Document Delete API
export async function deleteDocument(documentId: number): Promise<any> {
  try {
    // Get the token to ensure authorization
    const token = typeof window !== "undefined" ? getToken() : null
    if (!token) {
      throw new Error("No authentication token found")
    }

    const res = await axios.delete(`/api/documents/delete/${documentId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

// Student College Course Registration API
export async function startCourseRegistration(data: {
  student_id: number
  college_course_id: number
  intake_session: string
  remarks?: string
}): Promise<any> {
  try {
    const res = await axios.post("/api/student-college-course-registration/start", data)
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function getStudentRegistrations(studentId: number): Promise<any> {
  try {
    const res = await axios.get(`/api/student-college-course-registration/student/${studentId}`)
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

// Student Education APIs
export async function getStudentEducation(userId?: number): Promise<any> {
  try {
    let id = userId

    // If userId not provided, try to get from localStorage
    if (!id && typeof window !== "undefined") {
      try {
        // Try encrypted storage first
        let userData = getEncryptedUser()
        
        // Fallback to unencrypted if needed
        if (!userData) {
          const userString = localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
          if (userString) {
            userData = JSON.parse(userString)
          }
        }
        
        if (userData) {
          // Try to get student ID from different possible fields
          // First check for numeric IDs
          id = userData?.user_id || userData?.id || userData?.userId || userData?.student_id
          
          // If not found or still no ID, try to extract from studentId field (e.g., "WC15" → 15)
          if (!id && userData?.studentId) {
            const studentIdStr = String(userData.studentId)
            // Extract numeric part from studentId (e.g., "WC15" → "15")
            const numericMatch = studentIdStr.match(/\d+/)
            if (numericMatch) {
              id = parseInt(numericMatch[0], 10)
              console.log("Extracted user ID from studentId:", userData.studentId, "→", id)
            }
          }
        }
      } catch (e) {
        console.warn("Could not get user ID from storage:", e)
      }
    }

    if (!id) {
      throw new Error("User ID not found. Please login again.")
    }

    console.log("Fetching education for userId:", id)

    const res = await axios.get(`/api/student-education/get`, {
      params: { userId: id }
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function createStudentEducation(educationData: any): Promise<any> {
  try {
    let userId = educationData.userId

    // If userId not provided, try to get from localStorage
    if (!userId && typeof window !== "undefined") {
      try {
        // Try encrypted storage first
        let userData = getEncryptedUser()
        
        // Fallback to unencrypted if needed
        if (!userData) {
          const userString = localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
          if (userString) {
            userData = JSON.parse(userString)
          }
        }
        
        if (userData) {
          userId = userData?.user_id || userData?.id || userData?.userId || userData?.student_id
          
          if (!userId && userData?.studentId) {
            const studentIdStr = String(userData.studentId)
            const numericMatch = studentIdStr.match(/\d+/)
            if (numericMatch) {
              userId = parseInt(numericMatch[0], 10)
            }
          }
        }
      } catch (e) {
        console.warn("Could not get user ID from storage:", e)
      }
    }

    if (!userId) {
      throw new Error("User ID not found. Please login again.")
    }

    // Don't include userId in payload, send it as query parameter
    console.log("Creating education for userId:", userId, "Payload:", educationData)

    const res = await axios.post(`/api/student-education/add`, educationData, {
      params: { userId }
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function updateStudentEducation(educationId: number, educationData: any): Promise<any> {
  try {
    console.log("Updating education:", educationId, educationData)

    const res = await axios.put(`/api/student-education/update`, educationData, {
      params: { educationId }
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function deleteStudentEducation(educationId: number): Promise<any> {
  try {
    console.log("Deleting education:", educationId)

    const res = await axios.delete(`/api/student-education/delete`, {
      params: { educationId }
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

// Profile Image Upload API
export async function uploadProfileImage(file: File): Promise<any> {
  try {
    // Get the token to ensure authorization
    const token = typeof window !== "undefined" ? getToken() : null
    if (!token) {
      throw new Error("No authentication token found")
    }

    const formData = new FormData()
    formData.append("file", file)

    const res = await axios.post("/api/profile/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${token}`,
      },
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

// Student Profile API
export async function getStudentProfile(userId?: number): Promise<any> {
  try {
    let id = userId

    // If userId not provided, try to get from localStorage
    if (!id && typeof window !== "undefined") {
      try {
        // Try encrypted storage first
        let userData = getEncryptedUser()
        
        // Fallback to unencrypted if needed
        if (!userData) {
          const userString = localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
          if (userString) {
            userData = JSON.parse(userString)
          }
        }
        
        if (userData) {
          // Try to get user ID from different possible fields
          id = userData?.user_id || userData?.id || userData?.userId
          
          // If not found, try to extract from studentId field (e.g., "WC15" → 15)
          if (!id && userData?.studentId) {
            const studentIdStr = String(userData.studentId)
            const numericMatch = studentIdStr.match(/\d+/)
            if (numericMatch) {
              id = parseInt(numericMatch[0], 10)
            }
          }
        }
      } catch (e) {
        console.warn("Could not get user ID from storage:", e)
      }
    }

    if (!id) {
      throw new Error("User ID not found. Please login again.")
    }

    console.log("Fetching profile for userId:", id)

    const res = await axios.get(`/api/student/profile`, {
      params: { userId: id }
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

// Update Student Profile API
export async function updateStudentProfile(data: {
  date_of_birth: string
  gender: string
  graduation_level: string
}, userId?: number): Promise<any> {
  try {
    let id = userId

    // If userId not provided, try to get from localStorage
    if (!id && typeof window !== "undefined") {
      try {
        // Try encrypted storage first
        let userData = getEncryptedUser()
        
        // Fallback to unencrypted if needed
        if (!userData) {
          const userString = localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
          if (userString) {
            userData = JSON.parse(userString)
          }
        }
        
        if (userData) {
          // Try to get user ID from different possible fields
          id = userData?.user_id || userData?.id || userData?.userId
          
          // If not found, try to extract from studentId field (e.g., "WC15" → 15)
          if (!id && userData?.studentId) {
            const studentIdStr = String(userData.studentId)
            const numericMatch = studentIdStr.match(/\d+/)
            if (numericMatch) {
              id = parseInt(numericMatch[0], 10)
            }
          }
        }
      } catch (e) {
        console.warn("Could not get user ID from storage:", e)
      }
    }

    if (!id) {
      throw new Error("User ID not found. Please login again.")
    }

    console.log("Updating profile for userId:", id, "with data:", data)

    const res = await axios.put(`/api/student/profile`, data, {
      params: { userId: id }
    })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function sendEmailOTP(email: string): Promise<any> {
  try {
    const res = await axios.post("/api/auth/email-otp/send", { email })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data
    throw err
  }
}

export async function verifyEmailOTP(email: string, otp: string): Promise<LoginApiResponse> {
  try {
    const res = await axios.post<LoginApiResponse>("/api/auth/email-otp/verify", { email, otp })
    return res.data
  } catch (err: any) {
    if (err?.response?.data) return err.response.data as LoginApiResponse
    throw err
  }
}
