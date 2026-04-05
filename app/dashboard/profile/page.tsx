"use client"
import React, { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Phone,
  GraduationCap,
  Edit3,
  ArrowLeft,
  Award,
  Camera,
  MapPin,
  Calendar,
  Loader2,
  ChevronDown,
  Building2,
  TrendingUp,
  Upload,
  Check,
  Image as ImageIcon,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Target,
} from "lucide-react"
import { getStudentEducation, uploadProfileImage, getStudentProfile } from "@/lib/api/client"
import type { StudentEducation } from "@/lib/api/types"
import { isPlaceholderPhone } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getEncryptedUser, setEncryptedUser } from "@/lib/encryption"

interface EducationDisplay {
  id: string
  degree: string
  field: string
  institution: string
  institutionAddress: string
  startYear: string
  graduationYear: string
  cgpa: string
  percentage: string
  level: "Undergraduate" | "Postgraduate" | "High School" | "Doctorate"
}

export default function ViewProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [educationHistory, setEducationHistory] = useState<EducationDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // User state
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    role: "",
    dateOfBirth: "",
    gender: "",
    graduationLevel: "",
    nationality: "",
    address: "",
    profileImage: "",
    joinedDate: new Date().toISOString(),
    preferences: {
      studyDestination: "",
      interestedFields: "",
      budgetRange: "",
      intakePreference: "",
    },
    stats: {
      applicationsSubmitted: 0,
      universitiesShortlisted: 0,
      documentsCompleted: 0,
      profileStrength: 0,
    },
  })

  // Image upload states
  const [profileImage, setProfileImage] = useState(
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80"
  )
  const [isHoveringImage, setIsHoveringImage] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile completion state
  const [showCompletionDetails, setShowCompletionDetails] = useState(false)

  // Calculate profile completion details
  const getProfileCompletionDetails = () => {
    // Only consider the 6 visible fields in Personal Information + Education History
    const fields = [
      { name: "Full Name", value: user.name, category: "Personal Info" },
      { name: "Username", value: user.username, category: "Personal Info" },
      { name: "Phone Number", value: user.phone, category: "Personal Info" },
      { name: "Gender", value: user.gender, category: "Personal Info" },
      { name: "Date of Birth", value: user.dateOfBirth, category: "Personal Info" },
      { name: "Graduation Level", value: user.graduationLevel, category: "Personal Info" },
      { name: "Education History", value: educationHistory.length > 0, category: "Education" },
    ]

    const completed = fields.filter(f => f.value && f.value !== "N/A" && f.value !== "")
    const missing = fields.filter(f => !f.value || f.value === "N/A" || f.value === "")

    return { fields, completed, missing, total: fields.length }
  }

  // Get color based on completion percentage
  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return { bg: "bg-green-500", text: "text-green-600", ring: "ring-green-500", from: "from-green-500", to: "to-emerald-500" }
    if (percentage >= 60) return { bg: "bg-blue-500", text: "text-blue-600", ring: "ring-blue-500", from: "from-blue-500", to: "to-cyan-500" }
    if (percentage >= 40) return { bg: "bg-yellow-500", text: "text-yellow-600", ring: "ring-yellow-500", from: "from-yellow-500", to: "to-orange-500" }
    return { bg: "bg-red-500", text: "text-red-600", ring: "ring-red-500", from: "from-red-500", to: "to-pink-500" }
  }

  // Load user data from encrypted storage on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof window !== "undefined") {
        try {
          // Try encrypted storage first
          let userData: any = getEncryptedUser()

          // Fallback to unencrypted
          if (!userData) {
            const userString =
              localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
            if (userString) {
              userData = JSON.parse(userString)
            }
          }

          if (userData) {
            // Fetch additional profile data from API
            try {
              const profileResponse = await getStudentProfile()
              if (profileResponse.success && profileResponse.response) {
                const profile = profileResponse.response

                // Map the user data from encrypted storage + API response
                setUser({
                  name:
                    userData.name ||
                    `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
                    "",
                  email: userData.email || "",
                  phone: userData.phone_number || userData.phone || "",
                  username: userData.username || "",
                  role: userData.role || "student",
                  dateOfBirth: profile.date_of_birth || userData.dateOfBirth || userData.date_of_birth || "",
                  gender: profile.gender || "",
                  graduationLevel: profile.graduation_level || "",
                  nationality: userData.nationality || "",
                  address: userData.currentLocation || userData.address || "",
                  profileImage: userData.profile_picture || "",
                  joinedDate: userData.signupTime || userData.loginTime || new Date().toISOString(),
                  preferences: {
                    studyDestination: userData.preferences?.studyDestination || "",
                    interestedFields: userData.preferences?.interestedFields || "",
                    budgetRange: userData.preferences?.budgetRange || "",
                    intakePreference: userData.preferences?.intakePreference || "",
                  },
                  stats: {
                    applicationsSubmitted: userData.stats?.applicationsSubmitted || 0,
                    universitiesShortlisted: userData.stats?.universitiesShortlisted || 0,
                    documentsCompleted: userData.stats?.documentsCompleted || 0,
                    profileStrength: 0, // Will be calculated by real-time calculation
                  },
                })
              } else {
                // Fallback to local data only if API fails
                setUser({
                  name:
                    userData.name ||
                    `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
                    "",
                  email: userData.email || "",
                  phone: userData.phone_number || userData.phone || "",
                  username: userData.username || "",
                  role: userData.role || "student",
                  dateOfBirth: userData.dateOfBirth || userData.date_of_birth || "",
                  gender: "",
                  graduationLevel: "",
                  nationality: userData.nationality || "",
                  address: userData.currentLocation || userData.address || "",
                  profileImage: userData.profile_picture || "",
                  joinedDate: userData.signupTime || userData.loginTime || new Date().toISOString(),
                  preferences: {
                    studyDestination: userData.preferences?.studyDestination || "",
                    interestedFields: userData.preferences?.interestedFields || "",
                    budgetRange: userData.preferences?.budgetRange || "",
                    intakePreference: userData.preferences?.intakePreference || "",
                  },
                  stats: {
                    applicationsSubmitted: userData.stats?.applicationsSubmitted || 0,
                    universitiesShortlisted: userData.stats?.universitiesShortlisted || 0,
                    documentsCompleted: userData.stats?.documentsCompleted || 0,
                    profileStrength: 0, // Will be calculated by real-time calculation
                  },
                })
              }
            } catch (apiError) {
              console.error("Error fetching profile from API:", apiError)
              // Fallback to local data
              setUser({
                name:
                  userData.name ||
                  `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
                  "",
                email: userData.email || "",
                phone: userData.phone_number || userData.phone || "",
                username: userData.username || "",
                role: userData.role || "student",
                dateOfBirth: userData.dateOfBirth || userData.date_of_birth || "",
                gender: "",
                graduationLevel: "",
                nationality: userData.nationality || "",
                address: userData.currentLocation || userData.address || "",
                profileImage: userData.profile_picture || "",
                joinedDate: userData.signupTime || userData.loginTime || new Date().toISOString(),
                preferences: {
                  studyDestination: userData.preferences?.studyDestination || "",
                  interestedFields: userData.preferences?.interestedFields || "",
                  budgetRange: userData.preferences?.budgetRange || "",
                  intakePreference: userData.preferences?.intakePreference || "",
                },
                stats: {
                  applicationsSubmitted: userData.stats?.applicationsSubmitted || 0,
                  universitiesShortlisted: userData.stats?.universitiesShortlisted || 0,
                  documentsCompleted: userData.stats?.documentsCompleted || 0,
                  profileStrength: 0, // Will be calculated by real-time calculation
                },
              })
            }

            // Set profile image if available
            if (userData.profile_picture) {
              setProfileImage(userData.profile_picture)
            }
          }
        } catch (e) {
          console.error("Error loading user data:", e)
        }
      }
    }

    fetchUserData()
  }, [])

  // Close completion details when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showCompletionDetails && !target.closest('.profile-completion-container')) {
        setShowCompletionDetails(false)
      }
    }

    if (showCompletionDetails) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCompletionDetails])

  // Fetch education data on component mount
  useEffect(() => {
    const fetchEducationData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch education data from API (userId retrieved from localStorage meritcap_user)
        const response = await getStudentEducation()

        if (response.success && Array.isArray(response.response)) {
          // Map API response to display format
          const mappedEducation: EducationDisplay[] = response.response.map(
            (edu: StudentEducation) => {
              // Map education level to display format
              let level: EducationDisplay["level"] = "Undergraduate"
              if (edu.educationLevel === "POSTGRADUATE") level = "Postgraduate"
              else if (edu.educationLevel === "HIGH_SCHOOL") level = "High School"
              else if (edu.educationLevel === "DOCTORATE") level = "Doctorate"
              else if (edu.educationLevel === "UNDERGRADUATE") level = "Undergraduate"

              // Extract year from date string (format: "01/08/2018")
              const extractYear = (dateString: string) => {
                if (!dateString) return ""
                const parts = dateString.split("/")
                return parts.length === 3 ? parts[2] : dateString
              }

              // If end year is empty or not available, mark as "Present" (ongoing)
              const endYear = extractYear((edu as any).endYear || "")
              const graduationYear = endYear || "Present"

              return {
                id: (edu.educationId || edu.id || "").toString(),
                degree: edu.degree || "N/A",
                field: edu.fieldOfStudy || "N/A",
                institution: edu.institutionName || "N/A",
                institutionAddress: edu.institutionAddress || "N/A",
                startYear: extractYear((edu as any).startYear || ""),
                graduationYear: graduationYear,
                cgpa: edu.cgpa ? edu.cgpa.toString() : "N/A",
                percentage: edu.percentage ? edu.percentage.toString() : "N/A",
                level: level,
              }
            }
          )

          // Sort by graduation year (end date) in descending order (most recent first)
          // "Present" (ongoing) should appear at the top
          const sortedEducation = mappedEducation.sort((a, b) => {
            // If either is "Present", it should come first
            if (a.graduationYear === "Present") return -1
            if (b.graduationYear === "Present") return 1

            const yearA = parseInt(a.graduationYear) || 0
            const yearB = parseInt(b.graduationYear) || 0
            return yearB - yearA // Descending order
          })

          setEducationHistory(sortedEducation)
        } else {
          throw new Error(response.message || "Failed to fetch education data")
        }
      } catch (err: any) {
        console.error("Error fetching education:", err)
        setError(err.message || "Failed to load education data")
        // Set empty array so the UI doesn't break
        setEducationHistory([])
      } finally {
        setLoading(false)
      }
    }

    fetchEducationData()
  }, [])

  // Calculate real-time profile completion percentage using useMemo
  const profileCompletionPercentage = useMemo(() => {
    // Don't calculate if data hasn't loaded yet (name and email are always set after login)
    if (!user.email || user.email === "") {
      console.log("Skipping calculation - user data not loaded yet")
      return 0
    }

    // Calculate inline to ensure we have current values
    const fields = [
      { name: "Full Name", value: user.name },
      { name: "Username", value: user.username },
      { name: "Phone Number", value: user.phone },
      { name: "Gender", value: user.gender },
      { name: "Date of Birth", value: user.dateOfBirth },
      { name: "Graduation Level", value: user.graduationLevel },
      { name: "Education History", value: educationHistory.length > 0 },
    ]

    const completed = fields.filter(f => f.value && f.value !== "N/A" && f.value !== "").length
    const total = fields.length
    const percentage = Math.round((completed / total) * 100)

    console.log("Profile Completion Calculation:", {
      completed,
      total,
      percentage,
      fields: fields.map(f => ({ name: f.name, hasValue: !!f.value, value: f.value }))
    })

    return percentage
  }, [user.name, user.username, user.email, user.phone, user.dateOfBirth, user.gender, user.graduationLevel, educationHistory.length])

  // Update user state when profile completion changes
  useEffect(() => {
    setUser(prevUser => ({
      ...prevUser,
      stats: {
        ...prevUser.stats,
        profileStrength: profileCompletionPercentage
      }
    }))
  }, [profileCompletionPercentage])

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    // Check if file is an allowed image type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description:
          "Please select a valid image file. Only JPG, JPEG, PNG, and WebP formats are allowed.",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size must be less than 5MB",
      })
      return
    }

    setIsUploading(true)

    try {
      // Call the API to upload the profile image
      const response = await uploadProfileImage(file)

      if (response.success && response.response?.fileUrl) {
        // Update the profile image state with the new URL
        setProfileImage(response.response.fileUrl)

        // Update localStorage with the new profile picture URL
        if (typeof window !== "undefined") {
          try {
            const rememberMe = localStorage.getItem("meritcap_remember_me") === "true"

            // Try to get encrypted user data first
            let userData: any = getEncryptedUser()

            // Fallback to unencrypted
            if (!userData) {
              const userString =
                localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
              if (userString) {
                userData = JSON.parse(userString)
              }
            }

            if (userData) {
              userData.profile_picture = response.response.fileUrl

              // Save encrypted version ONLY
              setEncryptedUser(userData, !rememberMe)

              // Dispatch event to update header
              window.dispatchEvent(new Event("authStateChanged"))
            }
          } catch (e) {
            console.error("Error updating localStorage:", e)
          }
        }

        setIsUploading(false)
        setUploadSuccess(true)

        // Show success toast
        toast({
          title: "Success!",
          description: response.message || "Profile image uploaded successfully",
        })

        // Hide success indicator after 2 seconds
        setTimeout(() => {
          setUploadSuccess(false)
        }, 2000)
      } else {
        throw new Error(response.message || "Failed to upload profile image")
      }
    } catch (err: any) {
      console.error("Error uploading profile image:", err)
      setIsUploading(false)

      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message || "Failed to upload profile image. Please try again.",
      })
    }
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  // Show skeleton loader while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Back button skeleton */}
            <div className="h-10 w-32 bg-gray-200 rounded-md mb-6" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                {/* Profile image skeleton */}
                <div className="w-32 h-32 rounded-full bg-gray-200" />

                <div>
                  {/* Name skeleton */}
                  <div className="h-10 w-64 bg-gray-200 rounded-md mb-3" />
                  {/* Role skeleton */}
                  <div className="h-5 w-48 bg-gray-200 rounded-md mb-2" />
                  {/* Member info skeleton */}
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-40 bg-gray-200 rounded-md" />
                    <div className="h-4 w-32 bg-gray-200 rounded-md" />
                  </div>
                </div>
              </div>

              {/* Edit button skeleton */}
              <div className="h-10 w-32 bg-gray-200 rounded-md" />
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto p-6">
          <div className="space-y-6">
            {/* Personal Information skeleton */}
            <div className="bg-white rounded-xl p-8 shadow-md border-l-4 border-l-gray-200">
              <div className="h-6 w-48 bg-gray-200 rounded-md mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i}>
                    <div className="h-3 w-24 bg-gray-200 rounded-md mb-2" />
                    <div className="h-5 w-full bg-gray-200 rounded-md" />
                  </div>
                ))}
              </div>
            </div>

            {/* Education History skeleton */}
            <div className="bg-white rounded-xl p-8 shadow-md border-l-4 border-l-gray-200">
              <div className="flex items-center justify-between mb-8">
                <div className="h-6 w-48 bg-gray-200 rounded-md" />
                <div className="h-8 w-32 bg-gray-200 rounded-full" />
              </div>

              {/* Education cards skeleton */}
              <div className="relative ml-20">
                <div className="absolute w-1 bg-gray-200 rounded-full left-[-50px] top-2 bottom-2" />
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="flex-1">
                          <div className="h-5 w-48 bg-gray-200 rounded-md mb-2" />
                          <div className="h-4 w-64 bg-gray-200 rounded-md mb-1" />
                          <div className="h-3 w-40 bg-gray-200 rounded-md" />
                        </div>
                        <div className="h-8 w-20 bg-gray-200 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              {/* Interactive Profile Image Uploader */}
              <div
                className="relative group"
                onMouseEnter={() => setIsHoveringImage(true)}
                onMouseLeave={() => setIsHoveringImage(false)}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {/* Profile Image Container */}
                <div className="relative">
                  <div
                    className={`w-28 h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 transition-all duration-300 ${isDragging
                      ? "border-blue-500 shadow-2xl scale-105 ring-4 ring-blue-200"
                      : uploadSuccess
                        ? "border-green-500 shadow-2xl ring-4 ring-green-200"
                        : "border-white shadow-xl group-hover:shadow-2xl group-hover:scale-105"
                      }`}
                  >
                    <img
                      src={profileImage}
                      alt="Profile"
                      className={`w-full h-full object-cover transition-all duration-300 ${isHoveringImage && !isUploading ? "brightness-75 scale-110" : ""
                        } ${isUploading ? "blur-sm brightness-50" : ""}`}
                    />
                  </div>

                  {/* Upload Overlay */}
                  <div
                    className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-300 ${isHoveringImage || isDragging ? "opacity-100" : "opacity-0"
                      } ${isDragging ? "bg-blue-600/80" : "bg-gradient-to-br from-blue-600/80 to-purple-600/80"}`}
                  >
                    {!isUploading && !uploadSuccess && (
                      <div className="text-center">
                        <Upload
                          className={`w-8 h-8 text-white mx-auto mb-1 transition-transform duration-300 ${isDragging ? "scale-125 animate-bounce" : "group-hover:scale-110"
                            }`}
                        />
                        <p className="text-white text-xs font-semibold">{isDragging ? "Drop here!" : "Upload"}</p>
                      </div>
                    )}
                  </div>

                  {/* Loading Spinner */}
                  {isUploading && (
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-blue-600/80">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-1" />
                        <p className="text-white text-xs font-semibold">Uploading...</p>
                      </div>
                    </div>
                  )}

                  {/* Success Indicator */}
                  {uploadSuccess && (
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-green-600/90 animate-in fade-in zoom-in duration-300">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1">
                          <Check className="w-8 h-8 text-white animate-in zoom-in duration-300" strokeWidth={3} />
                        </div>
                        <p className="text-white text-xs font-semibold">Success!</p>
                      </div>
                    </div>
                  )}

                  {/* Camera Button - Bottom Right */}
                  <button
                    onClick={openFilePicker}
                    disabled={isUploading}
                    className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg ${isUploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : uploadSuccess
                        ? "bg-green-600 hover:bg-green-700 scale-110"
                        : "bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-110 hover:shadow-xl"
                      } ${isHoveringImage && !isUploading ? "scale-110 ring-4 ring-blue-200" : ""}`}
                  >
                    {uploadSuccess ? <Check className="w-5 h-5 text-white" strokeWidth={3} /> : <Camera className="w-5 h-5 text-white" />}
                  </button>

                  {/* Drag & Drop Hint */}
                  {isDragging && <div className="absolute -inset-4 rounded-full border-4 border-dashed border-blue-400 animate-pulse" />}
                </div>

                {/* Upload Instructions Tooltip */}
                {isHoveringImage && !isUploading && !isDragging && (
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-48 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    <p className="font-semibold mb-1 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      Change Profile Photo
                    </p>
                    <p className="text-gray-300 text-[10px]">Click or drag & drop to upload</p>
                    <p className="text-gray-400 text-[10px] mt-1">Max 5MB • JPG, JPEG, PNG, WebP</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{user.name || "User Profile"}</h1>

                  {/* Enhanced Profile Completion Badge */}
                  <div className="relative profile-completion-container">
                    <button
                      onClick={() => setShowCompletionDetails(!showCompletionDetails)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                    >
                      <div className="w-10 h-10 relative">
                        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="3"
                            fill="none"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            stroke="rgb(255 255 255)"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${(user.stats.profileStrength / 100) * 100.53} 100.53`}
                            strokeLinecap={user.stats.profileStrength === 100 ? "butt" : "round"}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{user.stats.profileStrength}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-white">Profile Strength</span>
                        <span className="text-xs text-white/90">
                          {user.stats.profileStrength >= 80 ? "Excellent!" : user.stats.profileStrength >= 60 ? "Good" : user.stats.profileStrength >= 40 ? "Fair" : "Needs Work"}
                        </span>
                      </div>
                      <Sparkles className={`w-4 h-4 text-white transition-transform duration-300 ${showCompletionDetails ? "rotate-180" : ""}`} />
                    </button>

                    {/* Profile Completion Dropdown */}
                    {showCompletionDetails && (
                      <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Target className="w-5 h-5" />
                              Profile Completion
                            </h3>
                            <span className="text-2xl font-bold text-white">{user.stats.profileStrength}%</span>
                          </div>
                          <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${user.stats.profileStrength}%` }}
                            />
                          </div>
                          <p className="text-white/90 text-sm mt-2">
                            {getProfileCompletionDetails().completed.length} of {getProfileCompletionDetails().total} fields completed
                          </p>
                        </div>

                        <div className="p-4 max-h-96 overflow-y-auto">
                          {/* Completed Fields */}
                          {getProfileCompletionDetails().completed.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-bold text-green-600 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Completed ({getProfileCompletionDetails().completed.length})
                              </h4>
                              <div className="space-y-1">
                                {getProfileCompletionDetails().completed.map((field, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 rounded-lg px-3 py-2">
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <span className="font-medium">{field.name}</span>
                                    <span className="text-xs text-gray-500 ml-auto">{field.category}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing Fields */}
                          {getProfileCompletionDetails().missing.length > 0 && (
                            <div>
                              <h4 className="text-sm font-bold text-orange-600 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Incomplete ({getProfileCompletionDetails().missing.length})
                              </h4>
                              <div className="space-y-1">
                                {getProfileCompletionDetails().missing.map((field, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-orange-50 rounded-lg px-3 py-2">
                                    <XCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                    <span className="font-medium">{field.name}</span>
                                    <span className="text-xs text-gray-500 ml-auto">{field.category}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Complete Profile CTA */}
                          {getProfileCompletionDetails().missing.length > 0 && (
                            <button
                              onClick={() => {
                                setShowCompletionDetails(false)
                                router.push("/dashboard/profile/edit")
                              }}
                              className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              Complete Your Profile
                            </button>
                          )}

                          {/* Perfect Profile Message */}
                          {getProfileCompletionDetails().missing.length === 0 && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                              <div className="flex items-center gap-2 text-green-700 mb-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-bold">Perfect Profile!</span>
                              </div>
                              <p className="text-sm text-green-600">
                                Your profile is 100% complete. Great job! 🎉
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-lg text-gray-600 mb-2 capitalize">
                  {user.role || "Student"} • {educationHistory.length > 0 ? `${educationHistory[0].field} Graduate` : ""}
                </p>
                <div className="flex items-center gap-4 text-gray-500 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Member since{" "}
                      {new Date(user.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                  {user.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{user.address.split(",")[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button onClick={() => router.push("/dashboard/profile/edit")} className="bg-blue-500 hover:bg-blue-600 text-white">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border-0 border-l-4 border-l-blue-500">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Full Name</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{user.name || "N/A"}</p>
              </div>
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Username</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{user.username || "N/A"}</p>
              </div>
              {/* <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Email Address</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors break-all">{user.email || "N/A"}</p>
              </div> */}
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Phone Number</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {user.phone && !isPlaceholderPhone(user.phone) ? user.phone : (
                    <span className="text-gray-400 italic">Add phone number</span>
                  )}
                </p>
              </div>
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Gender</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors capitalize">
                  {user.gender ? user.gender.toLowerCase() : "N/A"}
                </p>
              </div>
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Date of Birth</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                </p>
              </div>
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Graduation Level</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors capitalize">
                  {user.graduationLevel ? user.graduationLevel.replace(/_/g, " ").toLowerCase() : "N/A"}
                </p>
              </div>
              {/* <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Nationality</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{user.nationality || "N/A"}</p>
              </div>
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Address</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{user.address || "N/A"}</p>
              </div> */}
            </div>
          </div>

          {/* Education Background */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border-0 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                </div>
                Education History
              </h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
                <span className="text-sm font-semibold text-purple-700">
                  {educationHistory.length} {educationHistory.length === 1 ? "Qualification" : "Qualifications"}
                </span>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="ml-3 text-gray-600">Loading education data...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">{error}</div>
                <Button onClick={() => window.location.reload()} variant="outline" className="border-purple-300 text-purple-700">
                  Retry
                </Button>
              </div>
            )}

            {/* Education List */}
            {!loading && !error && educationHistory.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No education records found</p>
                <Button onClick={() => router.push("/dashboard/profile/edit")} className="bg-purple-600 hover:bg-purple-700">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Add Education
                </Button>
              </div>
            )}

            {/* Timeline Container with proper spacing */}
            <div className="relative ml-20">
              {/* Continuous Vertical Timeline Line - Fixed positioning */}
              {educationHistory.length > 0 && (
                <div
                  className="absolute w-1 bg-gradient-to-b from-purple-400 via-blue-400 to-green-400 rounded-full"
                  style={{
                    left: "-50px",
                    top: "8px",
                    bottom: "8px",
                  }}
                />
              )}

              <div className="space-y-4">
                {!loading &&
                  !error &&
                  educationHistory.map((education, index) => {
                    // Get CGPA and Percentage values
                    const cgpaValue = Number.parseFloat(education.cgpa) || 0
                    const percentageValue = Number.parseFloat(education.percentage) || 0
                    const isExpanded = expandedId === education.id
                    const isFirst = index === 0
                    const isLast = index === educationHistory.length - 1

                    // Define gradient colors for each level
                    const levelColors = {
                      Postgraduate: {
                        from: "from-purple-500",
                        to: "to-indigo-500",
                        bg: "bg-purple-50",
                        text: "text-purple-700",
                        border: "border-purple-200",
                        badge: "bg-purple-100",
                        hover: "hover:bg-purple-50",
                        ring: "ring-purple-300",
                        yearBg: "bg-purple-600",
                      },
                      Undergraduate: {
                        from: "from-blue-500",
                        to: "to-cyan-500",
                        bg: "bg-blue-50",
                        text: "text-blue-700",
                        border: "border-blue-200",
                        badge: "bg-blue-100",
                        hover: "hover:bg-blue-50",
                        ring: "ring-blue-300",
                        yearBg: "bg-blue-600",
                      },
                      "High School": {
                        from: "from-green-500",
                        to: "to-emerald-500",
                        bg: "bg-green-50",
                        text: "text-green-700",
                        border: "border-green-200",
                        badge: "bg-green-100",
                        hover: "hover:bg-green-50",
                        ring: "ring-green-300",
                        yearBg: "bg-green-600",
                      },
                      Doctorate: {
                        from: "from-indigo-500",
                        to: "to-purple-500",
                        bg: "bg-indigo-50",
                        text: "text-indigo-700",
                        border: "border-indigo-200",
                        badge: "bg-indigo-100",
                        hover: "hover:bg-indigo-50",
                        ring: "ring-indigo-300",
                        yearBg: "bg-indigo-600",
                      },
                    }
                    const colors = (levelColors as any)[education.level] || levelColors.Undergraduate

                    // Check if education is ongoing (Present)
                    const isOngoing = education.graduationYear === "Present"

                    return (
                      <div
                        key={education.id}
                        className={`relative bg-white rounded-xl border-2 ${colors.border} transition-all duration-300 ${isExpanded ? "shadow-lg ring-2 " + colors.ring : "shadow-sm hover:shadow-md"
                          }`}
                      >
                        {/* Timeline Year Badge - Centered on line */}
                        <div className="absolute -left-[62px] top-6 flex items-center justify-center">
                          {/* Year Badge - Centered */}
                          <div
                            className={`${isOngoing ? "bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse" : colors.yearBg
                              } text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-md whitespace-nowrap z-20 ${isOngoing ? "ring-2 ring-green-300" : ""
                              }`}
                          >
                            {isOngoing ? "Ongoing" : education.graduationYear}
                          </div>
                        </div>

                        {/* Clickable Header */}
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : education.id)}
                          className={`p-4 cursor-pointer ${colors.hover} rounded-t-lg transition-colors`}
                        >
                          <div className="flex items-center justify-between">
                            {/* Left Side - Education Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Icon Circle */}
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                <GraduationCap className="w-5 h-5 text-white" />
                              </div>

                              {/* Education Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h4 className="text-base font-bold text-gray-900 truncate">{education.degree}</h4>
                                  <span className={`text-xs font-bold ${colors.text} px-2 py-0.5 ${colors.badge} rounded-full whitespace-nowrap`}>
                                    {education.level}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{education.field}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {education.institution}
                                  </span>
                                  {education.startYear && education.startYear !== "N/A" ? (
                                    <span className={`text-xs flex items-center gap-1 ${isOngoing ? "text-green-600 font-semibold" : "text-gray-500"}`}>
                                      <Calendar className="w-3 h-3" />
                                      {education.startYear} - {isOngoing ? "Present" : education.graduationYear}
                                    </span>
                                  ) : (
                                    <span className={`text-xs flex items-center gap-1 ${isOngoing ? "text-green-600 font-semibold" : "text-gray-500"}`}>
                                      <Calendar className="w-3 h-3" />
                                      {isOngoing ? "Present" : education.graduationYear}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Side - Score & Expand Icon */}
                            <div className="flex items-center gap-3 ml-3">
                              {/* Score Display */}
                              <div className="flex flex-col items-end gap-1">
                                {cgpaValue > 0 && (
                                  <div className={`flex items-center gap-1 px-2.5 py-1 ${colors.bg} rounded-md`}>
                                    <TrendingUp className={`w-3 h-3 ${colors.text}`} />
                                    <span className={`text-sm font-bold ${colors.text}`}>{cgpaValue}</span>
                                    <span className="text-xs text-gray-500">/10</span>
                                  </div>
                                )}
                                {percentageValue > 0 && (
                                  <div className={`flex items-center gap-1 px-2.5 py-1 ${colors.bg} rounded-md`}>
                                    <span className={`text-sm font-bold ${colors.text}`}>{percentageValue}%</span>
                                  </div>
                                )}
                              </div>

                              {/* Expand/Collapse Icon */}
                              <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                                <ChevronDown className={`w-4 h-4 ${colors.text}`} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Content */}
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                          <div className={`p-4 pt-0 border-t ${colors.border} bg-gradient-to-br from-gray-50 to-white`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              {/* Institution Details */}
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Institution</h5>
                                <div className="flex items-start gap-2">
                                  <MapPin className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{education.institution}</p>
                                    {education.institutionAddress !== "N/A" && <p className="text-xs text-gray-500 mt-0.5">{education.institutionAddress}</p>}
                                  </div>
                                </div>
                              </div>

                              {/* Academic Performance */}
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Academic Performance</h5>
                                <div className="space-y-2">
                                  {cgpaValue > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">CGPA</span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className={`h-2 bg-gradient-to-r ${colors.from} ${colors.to} rounded-full transition-all duration-700`}
                                            style={{ width: `${(cgpaValue / 10) * 100}%` }}
                                          />
                                        </div>
                                        <span className={`text-sm font-bold ${colors.text} min-w-[50px] text-right`}>{cgpaValue}/10</span>
                                      </div>
                                    </div>
                                  )}
                                  {percentageValue > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">Percentage</span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className={`h-2 bg-gradient-to-r ${colors.from} ${colors.to} rounded-full transition-all duration-700`}
                                            style={{ width: `${percentageValue}%` }}
                                          />
                                        </div>
                                        <span className={`text-sm font-bold ${colors.text} min-w-[50px] text-right`}>{percentageValue}%</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Timeline */}
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Timeline</h5>
                                <div className="flex items-center gap-3">
                                  <Calendar className={`w-4 h-4 ${isOngoing ? "text-green-600" : colors.text}`} />
                                  <div className="text-sm">
                                    {education.startYear && education.startYear !== "N/A" ? (
                                      <div>
                                        <span className="text-gray-600">Started:</span>{" "}
                                        <span className="font-semibold text-gray-900">{education.startYear}</span>
                                        <span className="text-gray-400 mx-2">→</span>
                                        <span className={isOngoing ? "text-green-600" : "text-gray-600"}>{isOngoing ? "Ongoing" : "Ended"}:</span>{" "}
                                        <span className={`font-semibold ${isOngoing ? "text-green-600" : "text-gray-900"}`}>{isOngoing ? "Present" : education.graduationYear}</span>
                                        {isOngoing && <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">Currently Studying</span>}
                                      </div>
                                    ) : (
                                      <div>
                                        <span className={isOngoing ? "text-green-600" : "text-gray-600"}>{isOngoing ? "Status:" : "Graduated:"}</span>{" "}
                                        <span className={`font-semibold ${isOngoing ? "text-green-600" : "text-gray-900"}`}>{isOngoing ? "Currently Studying" : education.graduationYear}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Field of Study */}
                              <div className="space-y-2">
                                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Specialization</h5>
                                <div className="flex items-center gap-2">
                                  <Award className={`w-4 h-4 ${colors.text}`} />
                                  <span className="text-sm font-semibold text-gray-900">{education.field}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Add Education Button */}
            <button
              onClick={() => router.push("/dashboard/profile/edit")}
              className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-2 border-dashed border-purple-300 rounded-xl text-purple-700 font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-md group"
            >
              <div className="p-1 bg-purple-200 rounded-full group-hover:bg-purple-300 transition-colors">
                <GraduationCap className="w-4 h-4" />
              </div>
              Add More Education
            </button>
          </div>

          {/* Study Preferences - Commented Out */}
          {/* <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border-0 border-l-4 border-l-green-500">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              Study Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Preferred Destinations</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{user.preferences.studyDestination}</p>
              </div>
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Interested Fields</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{user.preferences.interestedFields}</p>
              </div>
              <div className="group">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Budget Range</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{user.preferences.budgetRange}</p>
              </div>
              <div className="group md:col-span-2 lg:col-span-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Intake Preference</label>
                <p className="text-base font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{user.preferences.intakePreference}</p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}
