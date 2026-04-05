"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, GraduationCap, Save, ArrowLeft, Award, Plus, Trash2, X, Loader2, Check, Edit, CheckCircle2 } from "lucide-react"
import { getStudentEducation, createStudentEducation, updateStudentEducation, deleteStudentEducation, getStudentProfile, updateStudentProfile, updateUsername as updateUsernameApi, updatePhoneNumber as updatePhoneApi } from "@/lib/api/client"
import type { StudentEducation } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"
import { getEncryptedUser, setEncryptedUser } from "@/lib/encryption"
import { isPlaceholderPhone } from "@/lib/utils"

interface Education {
    id: string
    educationId?: number // Backend ID for existing education
    degree: string
    field: string
    institution: string
    institutionAddress: string
    startYear: string
    graduationYear: string
    cgpa: string
    percentage: string
    level: "High School" | "Undergraduate" | "Postgraduate" | "Doctorate"
    isNew?: boolean // Track if this is a new education entry
}

export default function EditProfilePage() {
    const router = useRouter()
    const { toast } = useToast()

    // Form state - populated from user context/API
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        username: "",
        nationality: "",
        address: "",
        preferences: {
            studyDestination: "",
            interestedFields: "",
            budgetRange: "",
            intakePreference: "",
        },
    })

    const [educationHistory, setEducationHistory] = useState<Education[]>([])

    const [isLoading, setIsLoading] = useState(false)
    const [isFetchingEducation, setIsFetchingEducation] = useState(true)
    const [isFetchingProfile, setIsFetchingProfile] = useState(true)
    const [educationError, setEducationError] = useState<string | null>(null)
    const [expandedEducation, setExpandedEducation] = useState<string | null>(null)
    const [savingEducationIds, setSavingEducationIds] = useState<Set<string>>(new Set())
    const [savedEducationIds, setSavedEducationIds] = useState<Set<string>>(new Set())
    const [deletingEducationIds, setDeletingEducationIds] = useState<Set<string>>(new Set())

    // Personal Info editable fields state
    const [editablePersonalInfo, setEditablePersonalInfo] = useState({
        dateOfBirth: "",
        gender: "",
        graduationLevel: "",
    })
    const [isUpdatingPersonalInfo, setIsUpdatingPersonalInfo] = useState(false)
    const [personalInfoSaved, setPersonalInfoSaved] = useState(false)

    // Username editing state for OAuth users
    const [isProfileIncomplete, setIsProfileIncomplete] = useState(false)
    const [userId, setUserId] = useState<number | null>(null)
    const [editableUsername, setEditableUsername] = useState("")
    const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
    const [usernameSaved, setUsernameSaved] = useState(false)
    const [usernameError, setUsernameError] = useState<string | null>(null)

    // Phone editing state for users with placeholder phones
    const [hasPlaceholderPhone, setHasPlaceholderPhone] = useState(false)
    const [editablePhone, setEditablePhone] = useState("")
    const [isUpdatingPhone, setIsUpdatingPhone] = useState(false)
    const [phoneSaved, setPhoneSaved] = useState(false)
    const [phoneError, setPhoneError] = useState<string | null>(null)

    // Fetch user data from encrypted storage and API on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            if (typeof window !== "undefined") {
                try {
                    setIsFetchingProfile(true)
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

                                // Set form data
                                setFormData({
                                    name:
                                        userData.name ||
                                        `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
                                        "",
                                    email: userData.email || "",
                                    phone: userData.phone_number || userData.phone || "",
                                    username: userData.username || "",
                                    nationality: userData.nationality || "",
                                    address: userData.currentLocation || userData.address || "",
                                    preferences: {
                                        studyDestination: userData.preferences?.studyDestination || "",
                                        interestedFields: userData.preferences?.interestedFields || "",
                                        budgetRange: userData.preferences?.budgetRange || "",
                                        intakePreference: userData.preferences?.intakePreference || "",
                                    },
                                })

                                // Check if this is an OAuth user with incomplete profile
                                const profileIncomplete = userData.profileIncomplete || userData.profile_incomplete || false
                                setIsProfileIncomplete(profileIncomplete)
                                setEditableUsername(userData.username || "")
                                
                                // Check if user has placeholder phone
                                const userPhone = userData.phone_number || userData.phone || ""
                                const isPlaceholder = isPlaceholderPhone(userPhone)
                                setHasPlaceholderPhone(isPlaceholder)
                                setEditablePhone(isPlaceholder ? "" : userPhone)
                                
                                // Get user ID for API calls
                                const userIdValue = userData.user_id || userData.id || userData.userId
                                if (userIdValue) {
                                    setUserId(Number(userIdValue))
                                } else if (userData.studentId) {
                                    // Extract numeric ID from studentId (e.g., "WC15" → 15)
                                    const numericMatch = String(userData.studentId).match(/\d+/)
                                    if (numericMatch) {
                                        setUserId(parseInt(numericMatch[0], 10))
                                    }
                                }

                                // Format date from YYYY-MM-DD to DD/MM/YYYY for display, then back for input
                                const formatDateForInput = (dateStr: string) => {
                                    if (!dateStr) return ""
                                    // If already in YYYY-MM-DD format, return as is
                                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr
                                    // If in DD/MM/YYYY format, convert to YYYY-MM-DD
                                    const parts = dateStr.split(/[-/]/)
                                    if (parts.length === 3) {
                                        // Check if it's DD/MM/YYYY or YYYY-MM-DD
                                        if (parts[0].length === 4) {
                                            return dateStr // Already in YYYY-MM-DD
                                        }
                                        // Convert DD/MM/YYYY to YYYY-MM-DD
                                        return `${parts[2]}-${parts[1]}-${parts[0]}`
                                    }
                                    return dateStr
                                }

                                setEditablePersonalInfo({
                                    dateOfBirth: formatDateForInput(profile.date_of_birth) || "",
                                    gender: profile.gender || "",
                                    graduationLevel: profile.graduation_level || "",
                                })
                            } else {
                                // Fallback to local data only if API fails
                                setFormData({
                                    name:
                                        userData.name ||
                                        `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
                                        "",
                                    email: userData.email || "",
                                    phone: userData.phone_number || userData.phone || "",
                                    username: userData.username || "",
                                    nationality: userData.nationality || "",
                                    address: userData.currentLocation || userData.address || "",
                                    preferences: {
                                        studyDestination: userData.preferences?.studyDestination || "",
                                        interestedFields: userData.preferences?.interestedFields || "",
                                        budgetRange: userData.preferences?.budgetRange || "",
                                        intakePreference: userData.preferences?.intakePreference || "",
                                    },
                                })
                            }
                        } catch (err) {
                            console.error("Error fetching profile from API:", err)
                            // Use local data as fallback
                            setFormData({
                                name:
                                    userData.name ||
                                    `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
                                    "",
                                email: userData.email || "",
                                phone: userData.phone_number || userData.phone || "",
                                username: userData.username || "",
                                nationality: userData.nationality || "",
                                address: userData.currentLocation || userData.address || "",
                                preferences: {
                                    studyDestination: userData.preferences?.studyDestination || "",
                                    interestedFields: userData.preferences?.interestedFields || "",
                                    budgetRange: userData.preferences?.budgetRange || "",
                                    intakePreference: userData.preferences?.intakePreference || "",
                                },
                            })
                        }
                    }
                } catch (error) {
                    console.error("Error loading user data:", error)
                } finally {
                    setIsFetchingProfile(false)
                }
            }
        }

        fetchUserData()
    }, [])

    // Fetch education data on component mount
    useEffect(() => {
        const fetchEducationData = async () => {
            try {
                setIsFetchingEducation(true)
                setEducationError(null)

                // Fetch education data from API
                const response = await getStudentEducation()

                if (response.success && Array.isArray(response.response)) {
                    // Map API response to form format
                    const mappedEducation: Education[] = response.response.map((edu: StudentEducation) => {
                        // Map education level to form format
                        let level: Education["level"] = "Undergraduate"
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

                        return {
                            id: edu.educationId.toString(),
                            educationId: edu.educationId,
                            degree: edu.degree || "",
                            field: edu.fieldOfStudy || "",
                            institution: edu.institutionName || "",
                            institutionAddress: edu.institutionAddress || "",
                            startYear: extractYear(edu.startYear),
                            graduationYear: extractYear(edu.endYear),
                            cgpa: edu.cgpa ? edu.cgpa.toString() : "",
                            percentage: edu.percentage ? edu.percentage.toString() : "",
                            level: level,
                            isNew: false,
                        }
                    })

                    setEducationHistory(mappedEducation)
                } else {
                    throw new Error(response.message || "Failed to fetch education data")
                }
            } catch (err: any) {
                console.error("Error fetching education:", err)
                setEducationError(err.message || "Failed to load education data")
            } finally {
                setIsFetchingEducation(false)
            }
        }

        fetchEducationData()
    }, [])

    const handleInputChange = (field: string, value: string) => {
        if (field.includes(".")) {
            const [parent, child] = field.split(".")
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof typeof prev] as any),
                    [child]: value,
                },
            }))
        } else {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }))
        }
    }

    const handleEducationChange = (id: string, field: keyof Education, value: string) => {
        setEducationHistory((prev) =>
            prev.map((edu) => {
                if (edu.id === id) {
                    // Remove from saved state when user edits
                    setSavedEducationIds(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(id)
                        return newSet
                    })
                    return { ...edu, [field]: value }
                }
                return edu
            })
        )
    }

    const addEducation = () => {
        const newEducation: Education = {
            id: Date.now().toString(),
            degree: "",
            field: "",
            institution: "",
            institutionAddress: "",
            startYear: "",
            graduationYear: "",
            cgpa: "",
            percentage: "",
            level: "Undergraduate",
            isNew: true,
        }
        setEducationHistory((prev) => [...prev, newEducation])
        setExpandedEducation(newEducation.id)
    }

    const saveEducation = async (education: Education) => {
        // Validate required fields - all fields are mandatory except end year
        if (!education.degree ||
            !education.field ||
            !education.institution ||
            !education.institutionAddress ||
            !education.startYear ||
            !education.cgpa ||
            !education.percentage) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields. Only End Year is optional.",
                variant: "destructive",
            })
            return
        }

        setSavingEducationIds(prev => new Set(prev).add(education.id))

        try {
            // Map form level to API format
            let educationLevel = "UNDERGRADUATE"
            if (education.level === "Postgraduate") educationLevel = "POSTGRADUATE"
            else if (education.level === "High School") educationLevel = "HIGH_SCHOOL"
            else if (education.level === "Doctorate") educationLevel = "DOCTORATE"

            // Parse CGPA and Percentage values
            const cgpaValue = parseFloat(education.cgpa) || 0
            const percentageValue = parseFloat(education.percentage) || 0

            // Validate year format - must be a 4-digit number
            const isValidYear = (year: string) => {
                if (!year) return false
                const yearRegex = /^\d{4}$/
                if (!yearRegex.test(year)) return false
                const yearNum = parseInt(year, 10)
                return yearNum >= 1900 && yearNum <= 2100
            }

            // Format dates - API expects DD/MM/YYYY format
            const formatYear = (year: string) => {
                if (!year) return ""
                // Validate year format
                if (!isValidYear(year)) return ""
                // If valid year (e.g., "2022"), convert to "01/01/2022"
                return `01/01/${year}`
            }

            // Create payload with snake_case fields as per API spec
            const payload = {
                education_level: educationLevel,
                degree: education.degree,
                field_of_study: education.field,
                institution_name: education.institution,
                institution_address: education.institutionAddress,
                start_year: formatYear(education.startYear),
                end_year: formatYear(education.graduationYear), // Will be blank if invalid or empty
                cgpa: cgpaValue,
                percentage: percentageValue,
            }

            let response
            if (education.isNew) {
                // Create new education
                response = await createStudentEducation(payload)

                if (response.success) {
                    // Update the education entry with the backend ID
                    setEducationHistory(prev => prev.map(edu =>
                        edu.id === education.id
                            ? { ...edu, educationId: response.response?.educationId, isNew: false }
                            : edu
                    ))

                    // Mark as saved
                    setSavedEducationIds(prev => new Set(prev).add(education.id))

                    toast({
                        title: "Success",
                        description: "Education added successfully!",
                    })
                } else {
                    throw new Error(response.message || "Failed to add education")
                }
            } else if (education.educationId) {
                // Update existing education
                response = await updateStudentEducation(education.educationId, payload)

                if (response.success) {
                    // Mark as saved
                    setSavedEducationIds(prev => new Set(prev).add(education.id))

                    toast({
                        title: "Success",
                        description: "Education updated successfully!",
                    })
                } else {
                    throw new Error(response.message || "Failed to update education")
                }
            }
        } catch (err: any) {
            console.error("Error saving education:", err)
            toast({
                title: "Error",
                description: err.message || "Failed to save education. Please try again.",
                variant: "destructive",
            })
        } finally {
            setSavingEducationIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(education.id)
                return newSet
            })
        }
    }

    const removeEducation = async (id: string) => {
        const education = educationHistory.find(edu => edu.id === id)

        if (!education) {
            toast({
                title: "Error",
                description: "Education entry not found",
                variant: "destructive",
            })
            return
        }

        // If it's a new unsaved entry, just remove it from the list
        if (education.isNew || !education.educationId) {
            if (educationHistory.length > 1) {
                setEducationHistory((prev) => prev.filter((edu) => edu.id !== id))
                if (expandedEducation === id) {
                    setExpandedEducation(null)
                }
                toast({
                    title: "Removed",
                    description: "Education entry removed",
                })
            }
            return
        }

        // For existing entries, call the delete API
        try {
            setDeletingEducationIds(prev => new Set(prev).add(id))

            const response = await deleteStudentEducation(education.educationId)

            if (response.success) {
                // Remove from local state
                setEducationHistory((prev) => prev.filter((edu) => edu.id !== id))
                if (expandedEducation === id) {
                    setExpandedEducation(null)
                }

                // Remove from saved state if present
                setSavedEducationIds(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(id)
                    return newSet
                })

                toast({
                    title: "Success",
                    description: "Education deleted successfully",
                })
            } else {
                throw new Error(response.message || "Failed to delete education")
            }
        } catch (error: any) {
            console.error("Error deleting education:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to delete education. Please try again.",
                variant: "destructive",
            })
        } finally {
            setDeletingEducationIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(id)
                return newSet
            })
        }
    }

    const toggleEducationExpanded = (id: string) => {
        setExpandedEducation(expandedEducation === id ? null : id)
    }

    const handleUpdatePersonalInfo = async () => {
        setIsUpdatingPersonalInfo(true)
        setPersonalInfoSaved(false)

        try {
            // Format date from YYYY-MM-DD to DD/MM/YYYY for API
            const formatDateForAPI = (dateStr: string) => {
                if (!dateStr) return ""
                const parts = dateStr.split("-")
                if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`
                }
                return dateStr
            }

            const response = await updateStudentProfile({
                date_of_birth: formatDateForAPI(editablePersonalInfo.dateOfBirth),
                gender: editablePersonalInfo.gender.toUpperCase(),
                graduation_level: editablePersonalInfo.graduationLevel.toUpperCase(),
            })

            if (response.success) {
                setPersonalInfoSaved(true)
                setTimeout(() => setPersonalInfoSaved(false), 3000)
            }
        } catch (error) {
            console.error("Error updating personal info:", error)
        } finally {
            setIsUpdatingPersonalInfo(false)
        }
    }

    const handleUpdateUsername = async () => {
        if (!userId) {
            setUsernameError("User ID not found. Please try logging in again.")
            return
        }

        const trimmedUsername = editableUsername.trim().toLowerCase()
        
        // Validate username
        if (trimmedUsername.length < 3) {
            setUsernameError("Username must be at least 3 characters")
            return
        }
        if (trimmedUsername.length > 30) {
            setUsernameError("Username must be less than 30 characters")
            return
        }
        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
            setUsernameError("Username can only contain letters, numbers, and underscores")
            return
        }

        setIsUpdatingUsername(true)
        setUsernameSaved(false)
        setUsernameError(null)

        try {
            const response = await updateUsernameApi(userId, trimmedUsername)

            if (response.success) {
                // Update local storage with new username
                const userData = getEncryptedUser()
                if (userData) {
                    userData.username = trimmedUsername
                    setEncryptedUser(userData, true)
                }
                
                // Update form data
                setFormData(prev => ({ ...prev, username: trimmedUsername }))
                
                setUsernameSaved(true)
                toast({
                    title: "Success",
                    description: "Username updated successfully!",
                })
                setTimeout(() => setUsernameSaved(false), 3000)
            } else {
                setUsernameError(response.message || "Failed to update username")
            }
        } catch (error: any) {
            console.error("Error updating username:", error)
            setUsernameError(error.message || "Failed to update username")
        } finally {
            setIsUpdatingUsername(false)
        }
    }

    const handleUpdatePhone = async () => {
        if (!userId) {
            setPhoneError("User ID not found. Please try logging in again.")
            return
        }

        const trimmedPhone = editablePhone.trim()
        
        // Validate phone
        if (trimmedPhone.length === 0) {
            setPhoneError("Phone number is required")
            return
        }
        if (!/^[\+]?[0-9]{10,15}$/.test(trimmedPhone)) {
            setPhoneError("Phone number must be 10-15 digits with optional + prefix")
            return
        }

        setIsUpdatingPhone(true)
        setPhoneSaved(false)
        setPhoneError(null)

        try {
            const response = await updatePhoneApi(userId, trimmedPhone)

            if (response.success) {
                // Update local storage with new phone
                const userData = getEncryptedUser()
                if (userData) {
                    userData.phone_number = trimmedPhone
                    userData.phone = trimmedPhone
                    setEncryptedUser(userData, true)
                }
                
                // Update form data and state
                setFormData(prev => ({ ...prev, phone: trimmedPhone }))
                setHasPlaceholderPhone(false)
                
                setPhoneSaved(true)
                toast({
                    title: "Success",
                    description: "Phone number updated successfully!",
                })
                setTimeout(() => setPhoneSaved(false), 3000)
            } else {
                setPhoneError(response.message || "Failed to update phone number")
            }
        } catch (error: any) {
            console.error("Error updating phone:", error)
            setPhoneError(error.message || "Failed to update phone number")
        } finally {
            setIsUpdatingPhone(false)
        }
    }

    const handleSave = async () => {
        setIsLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setIsLoading(false)

        // Show success message and redirect
        console.log("Saving data:", { ...formData, educationHistory })
        toast({
            title: "Success",
            description: "Profile updated successfully!",
        })
        router.push("/dashboard/profile")
    }

    const getLevelColor = (level: string) => {
        const colors = {
            "Postgraduate": { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", hover: "hover:bg-purple-100" },
            "Undergraduate": { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", hover: "hover:bg-blue-100" },
            "High School": { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", hover: "hover:bg-green-100" },
            "Doctorate": { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700", hover: "hover:bg-indigo-100" },
        }
        return colors[level as keyof typeof colors] || colors["Undergraduate"]
    }

    // Show skeleton loader while data is being fetched
    if (isFetchingProfile || isFetchingEducation) {
        return (
            <div className="min-h-screen bg-gray-50 animate-pulse">
                <div className="max-w-6xl mx-auto p-6">
                    {/* Header skeleton */}
                    <div className="mb-6">
                        <div className="h-10 w-40 bg-gray-200 rounded-md mb-4" />
                        <div className="h-9 w-48 bg-gray-200 rounded-md mb-2" />
                        <div className="h-5 w-64 bg-gray-200 rounded-md" />
                    </div>

                    <div className="space-y-6">
                        {/* Personal Information skeleton */}
                        <div className="bg-white rounded-xl border-l-4 border-l-gray-200 shadow-lg">
                            <div className="p-6">
                                <div className="h-6 w-48 bg-gray-200 rounded-md mb-4" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i}>
                                            <div className="h-4 w-32 bg-gray-200 rounded-md mb-2" />
                                            <div className="h-10 w-full bg-gray-200 rounded-md" />
                                        </div>
                                    ))}
                                </div>

                                {/* Additional Information skeleton */}
                                <div className="border-t pt-6">
                                    <div className="h-5 w-56 bg-gray-200 rounded-md mb-4" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i}>
                                                <div className="h-4 w-32 bg-gray-200 rounded-md mb-2" />
                                                <div className="h-10 w-full bg-gray-200 rounded-md" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-10 w-48 bg-gray-200 rounded-md" />
                                </div>
                            </div>
                        </div>

                        {/* Education History skeleton */}
                        <div className="bg-white rounded-xl border-l-4 border-l-gray-200 shadow-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-6 w-48 bg-gray-200 rounded-md" />
                                    <div className="h-9 w-36 bg-gray-200 rounded-md" />
                                </div>

                                {/* Education cards skeleton */}
                                <div className="space-y-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200" />
                                                <div className="flex-1">
                                                    <div className="h-5 w-48 bg-gray-200 rounded-md mb-2" />
                                                    <div className="h-4 w-64 bg-gray-200 rounded-md mb-2" />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="h-3 w-full bg-gray-200 rounded-md" />
                                                        <div className="h-3 w-full bg-gray-200 rounded-md" />
                                                    </div>
                                                </div>
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
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-blue-600 hover:bg-blue-50">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Profile
                    </Button>

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
                        <p className="text-gray-600">Update your profile information</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Form Fields */}
                    <div className="space-y-6">
                        {/* Personal Information */}
                        <Card className="border-0 shadow-lg border-l-4 border-l-blue-500">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    <span>Personal Information</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Full Name *</label>
                                        <Input
                                            value={formData.name}
                                            readOnly
                                            disabled
                                            className="border-gray-300 bg-gray-50 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                                            Username {isProfileIncomplete && <span className="text-blue-600 text-xs">(Editable)</span>}
                                        </label>
                                        {isProfileIncomplete ? (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={editableUsername}
                                                        onChange={(e) => {
                                                            setEditableUsername(e.target.value)
                                                            setUsernameError(null)
                                                        }}
                                                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${usernameError ? 'border-red-500' : ''}`}
                                                        placeholder="Enter your username"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={handleUpdateUsername}
                                                        disabled={isUpdatingUsername || editableUsername === formData.username}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 shrink-0"
                                                    >
                                                        {isUpdatingUsername ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : usernameSaved ? (
                                                            <Check className="w-4 h-4" />
                                                        ) : (
                                                            "Update"
                                                        )}
                                                    </Button>
                                                </div>
                                                {usernameError && (
                                                    <p className="text-red-500 text-sm">{usernameError}</p>
                                                )}
                                                {usernameSaved && (
                                                    <p className="text-green-600 text-sm flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Username updated successfully
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <Input
                                                value={formData.username}
                                                readOnly
                                                disabled
                                                className="border-gray-300 bg-gray-50 cursor-not-allowed"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Email Address *</label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            readOnly
                                            disabled
                                            className="border-gray-300 bg-gray-50 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                                            Phone Number {hasPlaceholderPhone || isProfileIncomplete ? "" : "*"}
                                        </label>
                                        {hasPlaceholderPhone || isProfileIncomplete ? (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="tel"
                                                        placeholder="Enter your phone number"
                                                        value={editablePhone}
                                                        onChange={(e) => {
                                                            setEditablePhone(e.target.value)
                                                            setPhoneError(null)
                                                            setPhoneSaved(false)
                                                        }}
                                                        className={`flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${phoneError ? "border-red-500" : ""}`}
                                                        disabled={isUpdatingPhone}
                                                    />
                                                    <Button
                                                        onClick={handleUpdatePhone}
                                                        disabled={isUpdatingPhone || !editablePhone.trim() || phoneSaved}
                                                        size="sm"
                                                        className={phoneSaved ? "bg-green-600 hover:bg-green-700" : ""}
                                                    >
                                                        {isUpdatingPhone ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : phoneSaved ? (
                                                            <>
                                                                <Check className="w-4 h-4 mr-1" />
                                                                Updated
                                                            </>
                                                        ) : (
                                                            "Update"
                                                        )}
                                                    </Button>
                                                </div>
                                                {phoneError && (
                                                    <p className="text-sm text-red-600">
                                                        {phoneError}
                                                    </p>
                                                )}
                                                {hasPlaceholderPhone && !editablePhone && (
                                                    <p className="text-sm text-gray-500">
                                                        Add your phone number to complete your profile
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <Input
                                                value={formData.phone}
                                                readOnly
                                                disabled
                                                className="border-gray-300 bg-gray-50 cursor-not-allowed"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Editable Personal Info Section with Update Button */}
                                <div className="border-t pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                            <Edit className="w-4 h-4" />
                                            Additional Information (Editable)
                                        </h3>
                                        {personalInfoSaved && (
                                            <div className="flex items-center gap-2 text-green-600 text-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Updated successfully!</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 mb-2 block">Date of Birth</label>
                                            <Input
                                                type="date"
                                                value={editablePersonalInfo.dateOfBirth}
                                                onChange={(e) => setEditablePersonalInfo({ ...editablePersonalInfo, dateOfBirth: e.target.value })}
                                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 mb-2 block">Gender</label>
                                            <select
                                                value={editablePersonalInfo.gender}
                                                onChange={(e) => setEditablePersonalInfo({ ...editablePersonalInfo, gender: e.target.value })}
                                                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 mb-2 block">Graduation Level</label>
                                            <select
                                                value={editablePersonalInfo.graduationLevel}
                                                onChange={(e) => setEditablePersonalInfo({ ...editablePersonalInfo, graduationLevel: e.target.value })}
                                                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                            >
                                                <option value="">Select Level</option>
                                                <option value="HIGH_SCHOOL">High School</option>
                                                <option value="UNDERGRADUATE">Undergraduate</option>
                                                <option value="POSTGRADUATE">Postgraduate</option>
                                                <option value="DOCTORATE">Doctorate</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleUpdatePersonalInfo}
                                        disabled={isUpdatingPersonalInfo}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isUpdatingPersonalInfo ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Update Personal Info
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Education History */}
                        <Card className="border-0 shadow-lg border-l-4 border-l-purple-500">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center space-x-2">
                                        <GraduationCap className="w-5 h-5 text-purple-600" />
                                        <span>Education History</span>
                                    </CardTitle>
                                    <Button
                                        onClick={addEducation}
                                        variant="outline"
                                        size="sm"
                                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Education
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Error State */}
                                {educationError && (
                                    <div className="text-center py-12">
                                        <div className="text-red-500 mb-4">{educationError}</div>
                                        <Button
                                            onClick={() => window.location.reload()}
                                            variant="outline"
                                            className="border-purple-300 text-purple-700"
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                )}

                                {/* Education List */}
                                {!educationError && (
                                    <div className="space-y-4">
                                        {educationHistory.map((education, index) => {
                                            const isExpanded = expandedEducation === education.id
                                            const colors = getLevelColor(education.level)

                                            return (
                                                <div
                                                    key={education.id}
                                                    className={`relative rounded-xl border-2 ${colors.border} ${colors.bg} transition-all duration-300 ${isExpanded ? "shadow-lg" : "shadow-sm"
                                                        }`}
                                                >
                                                    {/* Education Header - Always Visible */}
                                                    <div
                                                        className={`p-4 cursor-pointer ${colors.hover} transition-colors rounded-t-xl`}
                                                        onClick={() => toggleEducationExpanded(education.id)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <div className={`w-10 h-10 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
                                                                    <GraduationCap className={`w-5 h-5 ${colors.text}`} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className={`font-semibold ${colors.text} text-base truncate`}>
                                                                        {education.degree || "New Education Entry"}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-600 truncate">
                                                                        {education.institution || "Institution name"}
                                                                        {education.graduationYear && ` • ${education.graduationYear}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs font-semibold ${colors.text} px-3 py-1 rounded-full bg-white border ${colors.border}`}>
                                                                    {education.level}
                                                                </span>
                                                                {educationHistory.length > 1 && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            removeEducation(education.id)
                                                                        }}
                                                                        disabled={deletingEducationIds.has(education.id)}
                                                                        className={`h-8 w-8 p-0 transition-all duration-200 ${deletingEducationIds.has(education.id)
                                                                            ? "text-gray-400 cursor-not-allowed"
                                                                            : "text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                            }`}
                                                                    >
                                                                        {deletingEducationIds.has(education.id) ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="w-4 h-4" />
                                                                        )}
                                                                    </Button>
                                                                )}
                                                                <div className={`transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                                                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Education Details - Expandable */}
                                                    <div
                                                        className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                                            }`}
                                                    >
                                                        <div className="p-6 pt-4 bg-white rounded-b-xl border-t-2 border-gray-100">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                                                        Education Level *
                                                                    </label>
                                                                    <select
                                                                        value={education.level}
                                                                        onChange={(e) =>
                                                                            handleEducationChange(
                                                                                education.id,
                                                                                "level",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                                                                    >
                                                                        <option value="High School">High School</option>
                                                                        <option value="Undergraduate">Undergraduate</option>
                                                                        <option value="Postgraduate">Postgraduate</option>
                                                                        <option value="Doctorate">Doctorate</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                                                        Degree/Certificate *
                                                                    </label>
                                                                    <Input
                                                                        value={education.degree}
                                                                        onChange={(e) =>
                                                                            handleEducationChange(education.id, "degree", e.target.value)
                                                                        }
                                                                        placeholder="e.g., Bachelor of Technology"
                                                                        className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                                                        Field of Study *
                                                                    </label>
                                                                    <Input
                                                                        value={education.field}
                                                                        onChange={(e) =>
                                                                            handleEducationChange(education.id, "field", e.target.value)
                                                                        }
                                                                        placeholder="e.g., Computer Science"
                                                                        className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-2">
                                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                                                        Institution Name *
                                                                    </label>
                                                                    <Input
                                                                        value={education.institution}
                                                                        onChange={(e) =>
                                                                            handleEducationChange(
                                                                                education.id,
                                                                                "institution",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="e.g., Indian Institute of Technology Bombay"
                                                                        className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-2">
                                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                                                        Institution Address *
                                                                    </label>
                                                                    <Input
                                                                        value={education.institutionAddress}
                                                                        onChange={(e) =>
                                                                            handleEducationChange(
                                                                                education.id,
                                                                                "institutionAddress",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="e.g., Powai, Mumbai, Maharashtra"
                                                                        className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                                                        Start Year *
                                                                    </label>
                                                                    <Input
                                                                        value={education.startYear}
                                                                        onChange={(e) =>
                                                                            handleEducationChange(
                                                                                education.id,
                                                                                "startYear",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="e.g., 2018"
                                                                        className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                                                        End Year <span className="text-gray-400 font-normal">(Optional)</span>
                                                                    </label>
                                                                    <Input
                                                                        value={education.graduationYear}
                                                                        onChange={(e) =>
                                                                            handleEducationChange(
                                                                                education.id,
                                                                                "graduationYear",
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        placeholder="e.g., 2022 (Leave blank if ongoing)"
                                                                        className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                                                        CGPA *
                                                                    </label>
                                                                    <Input
                                                                        value={education.cgpa}
                                                                        onChange={(e) =>
                                                                            handleEducationChange(education.id, "cgpa", e.target.value)
                                                                        }
                                                                        placeholder="e.g., 8.9"
                                                                        className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                                                        Percentage *
                                                                    </label>
                                                                    <Input
                                                                        value={education.percentage}
                                                                        onChange={(e) =>
                                                                            handleEducationChange(education.id, "percentage", e.target.value)
                                                                        }
                                                                        placeholder="e.g., 85.5"
                                                                        className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Save Button */}
                                                            <div className="mt-6 flex justify-end">
                                                                <Button
                                                                    onClick={() => saveEducation(education)}
                                                                    disabled={savingEducationIds.has(education.id)}
                                                                    className={`${savedEducationIds.has(education.id)
                                                                        ? "bg-green-600 hover:bg-green-700"
                                                                        : colors.bg === "bg-purple-50"
                                                                            ? "bg-purple-600 hover:bg-purple-700"
                                                                            : colors.bg === "bg-blue-50"
                                                                                ? "bg-blue-600 hover:bg-blue-700"
                                                                                : colors.bg === "bg-green-50"
                                                                                    ? "bg-green-600 hover:bg-green-700"
                                                                                    : "bg-indigo-600 hover:bg-indigo-700"
                                                                        } text-white transition-all`}
                                                                >
                                                                    {savingEducationIds.has(education.id) ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                            Saving...
                                                                        </>
                                                                    ) : savedEducationIds.has(education.id) ? (
                                                                        <>
                                                                            <Check className="w-4 h-4 mr-2" />
                                                                            Saved
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Save className="w-4 h-4 mr-2" />
                                                                            {education.isNew ? "Save Education" : "Update Education"}
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {educationHistory.length === 0 && !educationError && (
                                            <div className="text-center py-12 px-4">
                                                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-500 mb-4">No education entries yet</p>
                                                <Button onClick={addEducation} className="bg-purple-600 hover:bg-purple-700">
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add Your First Education
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Study Preferences - Commented Out */}
                        {/* <Card className="border-0 shadow-lg border-l-4 border-l-green-500">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Award className="w-5 h-5 text-green-600" />
                                    <span>Study Preferences</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Preferred Destinations</label>
                                        <Input
                                            value={formData.preferences.studyDestination}
                                            onChange={(e) => handleInputChange("preferences.studyDestination", e.target.value)}
                                            placeholder="e.g., USA, Canada, UK"
                                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Interested Fields</label>
                                        <Input
                                            value={formData.preferences.interestedFields}
                                            onChange={(e) => handleInputChange("preferences.interestedFields", e.target.value)}
                                            placeholder="e.g., Computer Science, Data Science"
                                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Budget Range</label>
                                        <Input
                                            value={formData.preferences.budgetRange}
                                            onChange={(e) => handleInputChange("preferences.budgetRange", e.target.value)}
                                            placeholder="e.g., $40,000 - $60,000"
                                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Intake Preference</label>
                                        <Input
                                            value={formData.preferences.intakePreference}
                                            onChange={(e) => handleInputChange("preferences.intakePreference", e.target.value)}
                                            placeholder="e.g., Fall 2024, Spring 2025"
                                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card> */}

                        {/* Action Buttons - Removed */}
                        {/* <div className="flex justify-end space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                                <Save className="w-4 h-4 mr-2" />
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}
