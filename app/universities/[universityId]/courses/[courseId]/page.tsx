"use client"

import type React from "react"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { getEncryptedUser } from "@/lib/encryption"
import {
  MapPin,
  Clock,
  Calendar,
  Award,
  CheckCircle,
  MessageCircle,
  FileText,
  Shield,
  DollarSign,
  Phone,
  Zap,
  Target,
  TrendingUp,
  BookOpen,
  Globe,
  Star,
  GraduationCap,
  Briefcase,
  Video,
  Calculator,
} from "lucide-react"
import Image from "next/image"
import { studyAbroadUniversities, studyIndiaColleges } from "@/lib/sample-data"
import { useEffect } from "react"
import { getCollegeCourseDetail, startCourseRegistration } from "@/lib/api/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader } from "lucide-react"
import { IntakeSelectionModal } from "@/components/modals/intake-selection-modal"
import { toast } from "@/hooks/use-toast"
import type { UnifiedUserProfile } from "@/types/user"
import { resolveCurrentUserId } from "@/lib/user-identity"

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseSlug = (params.courseSlug ?? params.courseId) as string
  const [activeTab, setActiveTab] = useState("overview")
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showCostCalculator, setShowCostCalculator] = useState(false)
  const [showIntakeModal, setShowIntakeModal] = useState(false)
  const [userData, setUserData] = useState<UnifiedUserProfile | null>(null)
  const [leadFormData, setLeadFormData] = useState({
    name: "",
    email: "",
    phone: "",
    intake: "",
    moreInfo: "",
  })

  // Loading and success states for intake modal
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)
  const [showIntakeSuccess, setShowIntakeSuccess] = useState(false)
  const [successRegistrationId, setSuccessRegistrationId] = useState<string>("")
  const [successIntakeSession, setSuccessIntakeSession] = useState<string>("")

  // Load user data
  useEffect(() => {
    // Try encrypted storage first
    let parsedUser = getEncryptedUser()

    if (!parsedUser) {
      // Fallback to unencrypted
      const userString = localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
      if (userString) {
        try {
          parsedUser = JSON.parse(userString)
        } catch (error) {
          console.error("Error parsing user data", error)
        }
      }
    }

    if (parsedUser) {
      setUserData(parsedUser)
    }
  }, [])

  const allUniversities = [...studyAbroadUniversities, ...studyIndiaColleges]
  let university: any = null
  let course: any = null
  const [fetchedUniversity, setFetchedUniversity] = useState<any>(null)
  const [fetchedCourse, setFetchedCourse] = useState<any>(null)
  const [isFetchingDetails, setIsFetchingDetails] = useState<boolean>(true)
  let type = "abroad"

  // Try to find course by matching params
  if (params.universityId && params.courseId) {
    university = allUniversities.find((u) => String(u.id) === String(params.universityId))
    if (university) {
      course = university.courses?.find((c: any) => String(c.id) === String(params.courseId) || String(c.slug) === String(params.courseId))
      type = studyAbroadUniversities.some((u) => String(u.id) === String(university.id)) ? "abroad" : "india"
    }
  } else {
    // Fallback to original courseSlug logic
    for (const uni of allUniversities) {
      const foundCourse = uni.courses?.find(
        (c: any) =>
          c.id === courseSlug || c.name?.toLowerCase().replace(/\s+/g, "-") === courseSlug || c.slug === courseSlug,
      )
      if (foundCourse) {
        university = uni
        course = foundCourse
        type = studyAbroadUniversities.some((u) => u.id === uni.id) ? "abroad" : "india"
        break
      }
    }
  }
  // Fetch detail from API regardless of sample-data lookup so page can render API data
  useEffect(() => {
    let mounted = true
    const fetchDetail = async () => {
      try {
        setIsFetchingDetails(true)
        const id = params.courseId || params.courseSlug || params.course
        if (!id) {
          setIsFetchingDetails(false)
          return
        }
        const resp = await getCollegeCourseDetail(id)
        const data = resp?.response
        if (!data) return

        const mappedUniversity: any = { ...(university || {}) }
        if (data.college) {
          mappedUniversity.name = data.college.name || mappedUniversity.name
          mappedUniversity.logo = data.college.collegeLogo || mappedUniversity.logo
          mappedUniversity.location = data.college.campusName || mappedUniversity.location || data.college.country
          mappedUniversity.country = data.college.country || mappedUniversity.country
          mappedUniversity.establishedYear = data.college.establishedYear || mappedUniversity.establishedYear
          mappedUniversity.description = data.college.description || mappedUniversity.description
          mappedUniversity.highlights = mappedUniversity.highlights || []
        }

        const mappedCourse: any = { ...(course || {}) }
        if (data.course) {
          mappedCourse.name = data.course.course_name || mappedCourse.name
          mappedCourse.id = data.course.course_id || mappedCourse.id
          mappedCourse.department = data.course.department || mappedCourse.department
          mappedCourse.degree = data.course.graduation_level || mappedCourse.degree || mappedCourse.level
        }

        mappedCourse.fees = data.tuition_fee || mappedCourse.fees || data.tuitionFee || mappedCourse.fee
        mappedCourse.applicationFee = data.application_fee || mappedCourse.applicationFee
        mappedCourse.duration = data.duration || mappedCourse.duration
        mappedCourse.intake = data.intake_months || data.intakeMonths || data.intake_months || mappedCourse.intake
        mappedCourse.remarks = data.remarks || mappedCourse.remarks
        mappedCourse.min10thScore = data.min10th_score ?? data.min10thScore ?? mappedCourse.min10thScore
        mappedCourse.minInterScore = data.min_inter_score ?? data.minInterScore ?? mappedCourse.minInterScore
        mappedCourse.minGraduationScore = data.min_graduation_score ?? data.minGraduationScore ?? mappedCourse.minGraduationScore
        mappedCourse.toeflMin = data.toefl_min_score ?? mappedCourse.toeflMin
        mappedCourse.ieltsMin = data.ielts_min_score ?? mappedCourse.ieltsMin

        if (!mounted) return
        setFetchedUniversity(mappedUniversity)
        setFetchedCourse(mappedCourse)
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setIsFetchingDetails(false)
      }
    }

    fetchDetail()
    return () => {
      mounted = false
    }
  }, [params.courseId, params.universityId])

  // Prefer fetched data when available
  if (fetchedUniversity) university = fetchedUniversity
  if (fetchedCourse) course = fetchedCourse

  const CourseDetailLoading: React.FC = () => (
    <div className="min-h-screen bg-white">
      <div className="relative bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2">
              <div className="mb-8 space-y-4">
                <Skeleton className="h-10 w-3/4 bg-white/20" />
                <div className="flex gap-3">
                  <Skeleton className="h-6 w-24 bg-white/20" />
                  <Skeleton className="h-6 w-24 bg-white/20" />
                  <Skeleton className="h-6 w-28 bg-white/20" />
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <Skeleton className="h-14 w-14 rounded-xl bg-white/30" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-64 bg-white/20" />
                  <Skeleton className="h-4 w-40 bg-white/10" />
                </div>
              </div>

              <Skeleton className="h-20 w-full bg-white/10 mb-8" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-lg mx-auto mb-3" />
                    <Skeleton className="h-4 w-20 mx-auto bg-white/20 mb-2" />
                    <Skeleton className="h-5 w-24 mx-auto bg-white/30" />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-12 w-44 bg-white/30" />
                <Skeleton className="h-12 w-40 bg-white/20" />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Loader className="w-6 h-6 animate-spin text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Loading counselor form…</div>
                    <div className="text-blue-200 text-xs">Hang tight, setting things up</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Skeleton className="h-9 w-full bg-white/20" />
                  <Skeleton className="h-9 w-full bg-white/20" />
                  <Skeleton className="h-9 w-full bg-white/20" />
                  <Skeleton className="h-9 w-full bg-white/20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1 bg-white/30" />
                    <Skeleton className="h-9 flex-1 bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-40 w-full" />
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if ((!university || !course) && isFetchingDetails) {
    return <CourseDetailLoading />
  }

  if (!university || !course) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <p className="text-gray-600 mb-8">The course you're looking for doesn't exist or has been moved.</p>
        <Button onClick={() => router.push("/search-results")} className="bg-blue-600 hover:bg-blue-700 text-white">
          Browse All Courses
        </Button>
      </div>
    )
  }

  const formatFee = (fee: any) => {
    if (!fee) return "Contact for fees"

    if (typeof fee === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: type === "abroad" ? "USD" : "INR",
        maximumFractionDigits: 0,
      }).format(fee)
    }

    if (typeof fee === "string") {
      const numericFee = Number.parseInt(fee.replace(/[^0-9]/g, ""))
      if (!isNaN(numericFee)) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: type === "abroad" ? "USD" : "INR",
          maximumFractionDigits: 0,
        }).format(numericFee)
      }
      return fee
    }

    return "Contact for fees"
  }

  const getNextIntakeMonth = (intakeData: any) => {
    if (!intakeData) return "Contact"

    // Month mapping
    const monthMap: Record<string, { full: string; short: string; number: number }> = {
      JAN: { full: "January", short: "Jan", number: 0 },
      FEB: { full: "February", short: "Feb", number: 1 },
      MAR: { full: "March", short: "Mar", number: 2 },
      APR: { full: "April", short: "Apr", number: 3 },
      MAY: { full: "May", short: "May", number: 4 },
      JUN: { full: "June", short: "Jun", number: 5 },
      JUL: { full: "July", short: "Jul", number: 6 },
      AUG: { full: "August", short: "Aug", number: 7 },
      SEP: { full: "September", short: "Sep", number: 8 },
      OCT: { full: "October", short: "Oct", number: 9 },
      NOV: { full: "November", short: "Nov", number: 10 },
      DEC: { full: "December", short: "Dec", number: 11 },
    }

    const currentMonth = new Date().getMonth() // 0-11

    // Parse intake months
    let intakeMonths: string[] = []

    if (Array.isArray(intakeData)) {
      intakeMonths = intakeData.map((intake: any) => {
        if (typeof intake === "string") return intake.trim().toUpperCase().slice(0, 3)
        if (typeof intake === "object" && intake?.term) return String(intake.term).trim().toUpperCase().slice(0, 3)
        return ""
      }).filter(Boolean)
    } else if (typeof intakeData === "string") {
      intakeMonths = intakeData.split(/[,\s]+/).map(m => m.trim().toUpperCase().slice(0, 3)).filter(Boolean)
    } else if (typeof intakeData === "object" && intakeData?.term) {
      intakeMonths = [String(intakeData.term).trim().toUpperCase().slice(0, 3)]
    }

    if (intakeMonths.length === 0) return "Contact"

    // Filter valid months and get their numeric values
    const validIntakes = intakeMonths
      .filter(code => monthMap[code])
      .map(code => ({
        code,
        month: monthMap[code].number
      }))
      .sort((a, b) => a.month - b.month)

    if (validIntakes.length === 0) return "Contact"

    // Find the next upcoming intake
    const nextIntake = validIntakes.find(intake => intake.month > currentMonth)

    // If found an upcoming intake this year, return 3-letter code
    if (nextIntake) {
      return nextIntake.code
    }

    // Otherwise, return the first intake code (it will be next year)
    return validIntakes[0].code
  }

  const handleApplyNow = () => {
    // Show intake selection modal before navigating to application
    setShowIntakeModal(true)
  }

  const handleIntakeConfirm = async (selectedMonth: string, selectedYear: number, remarks?: string) => {
    setIsSubmittingApplication(true)

    try {
      const studentIdForApi = resolveCurrentUserId(userData) || undefined

      if (!studentIdForApi) {
        toast({
          title: "Profile issue",
          description: "Cannot determine your student ID. Please complete your profile.",
          variant: "destructive"
        })
        setIsSubmittingApplication(false)
        return
      }

      // Get college course ID from URL params (params.courseId is actually the collegeCourseId)
      const collegeCourseId = Number(params.courseId)
      if (!collegeCourseId || isNaN(collegeCourseId)) {
        toast({
          title: "Invalid course",
          description: "College Course ID is not valid.",
          variant: "destructive"
        })
        setIsSubmittingApplication(false)
        return
      }

      // Format intake session as "MON YYYY" (e.g., "SEP 2025")
      const intakeSession = `${selectedMonth} ${selectedYear}`

      // Call the API to start registration
      const response = await startCourseRegistration({
        student_id: studentIdForApi,
        college_course_id: collegeCourseId,
        intake_session: intakeSession,
        remarks: remarks || undefined,
      })

      if (response?.success) {
        // Store the selected intake in localStorage for the application form
        localStorage.setItem("selected_intake", JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          remarks: remarks || "",
          registrationId: response.response?.registrationId,
          timestamp: new Date().toISOString(),
        }))

        // Show success state in the same modal
        setSuccessRegistrationId(response.response?.registrationId || "")
        setSuccessIntakeSession(intakeSession)
        setShowIntakeSuccess(true)

        // Don't navigate or close modal here - let user see success and click Done
      } else {
        toast({
          title: "Registration Failed",
          description: response?.message || "Failed to start registration. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error starting registration:", error)
      toast({
        title: "Error",
        description: error?.message || "An error occurred while starting your registration.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingApplication(false)
    }
  }

  const handleIntakeModalClose = () => {
    setShowIntakeModal(false)
    // Reset success state
    setShowIntakeSuccess(false)
    setSuccessRegistrationId("")
    setSuccessIntakeSession("")
  }

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Lead form submitted:", leadFormData)
    // Handle lead form submission
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-blue-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-purple-300 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* Left: Course Information */}
            <div className="lg:col-span-2">
              {/* Course Title First */}
              <div className="mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">{course.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <Badge className="bg-blue-500 text-white px-3 py-1 text-sm">{course.degree || course.level}</Badge>
                  <Badge className="bg-green-500 text-white px-3 py-1 text-sm">{course.mode || "Full-time"}</Badge>
                  <Badge className="bg-purple-500 text-white px-3 py-1 text-sm">{course.department || "General"}</Badge>
                </div>
              </div>

              {/* University Info Below Course Name */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <Image
                    src={university.logo || "/placeholder.svg?height=60&width=60&text=Logo"}
                    alt={university.name}
                    width={60}
                    height={60}
                    className="rounded-xl bg-white p-2 shadow-lg"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{university.name}</h2>
                  <div className="flex items-center gap-2 text-blue-200">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {university.location}, {university.country}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xl text-blue-100 leading-relaxed max-w-3xl mb-8">
                {course.description ||
                  "Comprehensive program designed to provide students with advanced knowledge and practical skills in their chosen field."}
              </p>

              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-sm opacity-75 mb-1">Duration</div>
                  <div className="font-bold text-lg">{course.duration}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="text-sm opacity-75 mb-1">Annual Fee</div>
                  <div className="font-bold text-lg">{formatFee(course.fees || course.fee)}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="text-sm opacity-75 mb-1">Next Intake</div>
                  <div className="font-bold text-lg">
                    {getNextIntakeMonth(course.intake)}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="text-sm opacity-75 mb-1">Credits</div>
                  <div className="font-bold text-lg">{course.credits || "120"}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleApplyNow}
                  size="lg"
                  className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-xl"
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Apply Now
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 px-6 py-4 bg-transparent"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Appointment
                </Button>
              </div>
            </div>

            {/* Right: Glass Effect Lead Form */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl sticky top-8 p-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Get Expert Guidance</h3>
                  <p className="text-blue-200 text-sm">Connect with our counselors</p>
                </div>

                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={leadFormData.name}
                    onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={leadFormData.phone}
                    onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={leadFormData.email}
                    onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm"
                    required
                  />
                  <select
                    value={leadFormData.intake}
                    onChange={(e) => setLeadFormData({ ...leadFormData, intake: e.target.value })}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm"
                  >
                    <option value="" className="text-gray-900">
                      Select Intake
                    </option>
                    {(() => {
                      if (!course.intake) {
                        return [
                          <option key="fall" value="fall-2024" className="text-gray-900">
                            Fall 2024
                          </option>,
                          <option key="spring" value="spring-2025" className="text-gray-900">
                            Spring 2025
                          </option>,
                          <option key="fall-next" value="fall-2025" className="text-gray-900">
                            Fall 2025
                          </option>,
                        ]
                      }

                      if (Array.isArray(course.intake)) {
                        return course.intake.map((intake, index) => {
                          const intakeValue =
                            typeof intake === "object" && intake !== null
                              ? intake.term || intake.deadline || intake.seats || `intake-${index}`
                              : String(intake)
                          const intakeLabel =
                            typeof intake === "object" && intake !== null
                              ? `${intake.term || "Term"} - Deadline: ${intake.deadline || "TBD"}`
                              : String(intake)

                          return (
                            <option key={index} value={intakeValue} className="text-gray-900">
                              {intakeLabel}
                            </option>
                          )
                        })
                      }

                      if (typeof course.intake === "object" && course.intake !== null) {
                        const intakeValue =
                          course.intake.term || course.intake.deadline || course.intake.seats || "intake"
                        const intakeLabel = `${course.intake.term || "Term"} - Deadline: ${course.intake.deadline || "TBD"}`
                        return [
                          <option key="intake" value={intakeValue} className="text-gray-900">
                            {intakeLabel}
                          </option>,
                        ]
                      }

                      return [
                        <option key="intake" value={String(course.intake)} className="text-gray-900">
                          {String(course.intake)}
                        </option>,
                      ]
                    })()}
                  </select>
                  <textarea
                    placeholder="More Information"
                    value={leadFormData.moreInfo}
                    onChange={(e) => setLeadFormData({ ...leadFormData, moreInfo: e.target.value })}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm h-16 resize-none"
                  />

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1 bg-white text-blue-900 hover:bg-blue-50 py-2 text-sm font-semibold"
                    >
                      Start Application
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1 border-white text-white hover:bg-white/10 py-2 text-sm bg-transparent"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Ask Expert
                    </Button>
                  </div>
                </form>

                <div className="mt-4 space-y-2 text-center text-xs text-white/80">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-3 h-3" />
                    <span>100% Free Service</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-3 h-3" />
                    <span>Call back within 2 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose This Course Section */}
      <div className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose This Course?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the unique advantages and opportunities this program offers for your career growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Industry-Focused Curriculum</h3>
              <p className="text-gray-600 leading-relaxed">
                Designed with input from leading industry professionals to ensure job readiness and practical skills.
              </p>
            </div>
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">High Placement Rate</h3>
              <p className="text-gray-600 leading-relaxed">
                95% of graduates secure employment within 6 months of completion with competitive salaries.
              </p>
            </div>
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Fast-Track Career Growth</h3>
              <p className="text-gray-600 leading-relaxed">
                Accelerated learning path with practical projects, internships, and industry mentorship programs.
              </p>
            </div>
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Global Recognition</h3>
              <p className="text-gray-600 leading-relaxed">
                Internationally recognized degree that opens doors to global career opportunities and further studies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg mb-8">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="admissions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Admissions
            </TabsTrigger>
            <TabsTrigger value="careers" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Careers
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Testimonials
            </TabsTrigger>
          </TabsList>

          {/* Course Overview */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-2xl">About This Course</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                      The <strong>{course.name}</strong> at <strong>{university.name}</strong> is designed to provide
                      students with comprehensive knowledge and practical skills in their chosen field. This program
                      combines theoretical foundations with hands-on experience, preparing graduates for successful
                      careers in today's competitive job market.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 text-lg">Key Features</h4>
                        <ul className="space-y-3">
                          {[
                            "Industry-relevant curriculum",
                            "Experienced faculty with industry background",
                            "State-of-the-art facilities and labs",
                            "Strong industry connections and partnerships",
                            "Research opportunities",
                            "International exposure programs",
                          ].map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 text-lg">Learning Outcomes</h4>
                        <ul className="space-y-3">
                          {[
                            "Master core concepts and principles",
                            "Develop practical and technical skills",
                            "Build professional network",
                            "Prepare for leadership roles",
                            "Gain research experience",
                            "Develop critical thinking abilities",
                          ].map((outcome, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                              <span className="text-gray-700">{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Highlights */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-2xl">Course Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {(
                        university.highlights || [
                          "World-class faculty",
                          "Industry partnerships",
                          "Research opportunities",
                          "Global recognition",
                        ]
                      ).map((highlight, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                          <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 font-medium">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Quick Facts */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Facts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Degree Level</span>
                      <span className="font-medium">{course.degree || course.level}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Study Mode</span>
                      <span className="font-medium">{course.mode || "Full-time"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Language</span>
                      <span className="font-medium">English</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Credits</span>
                      <span className="font-medium">{course.credits || "120"} Credits</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Department</span>
                      <span className="font-medium text-sm">{course.department || "General"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Scholarship Info */}
                {course.scholarshipAvailable && (
                  <Card className="shadow-lg border-0 bg-green-50 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Award className="w-6 h-6 text-green-600" />
                        <h3 className="font-semibold text-green-900">Scholarships Available</h3>
                      </div>
                      <p className="text-green-800 text-sm mb-4">
                        Multiple scholarship opportunities available for eligible students.
                      </p>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* CTA Card */}
                <Card className="shadow-lg border-0 bg-blue-50 border-blue-200">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-semibold text-gray-900 mb-2">Ready to Apply?</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Start your application today and take the first step towards your future.
                    </p>
                    <Button onClick={handleApplyNow} className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3">
                      Apply Now
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Video className="w-4 h-4 mr-2" />
                      Virtual Campus Tour
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Curriculum */}
          <TabsContent value="curriculum" className="space-y-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Course Structure & Curriculum</h2>
                <p className="text-lg text-gray-600">Comprehensive curriculum designed for industry readiness</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
                    Core Modules ({course.credits || "120"} Credits)
                  </h3>
                  <div className="space-y-4">
                    {(
                      course.curriculum ||
                      course.modules || [
                        "Foundation Courses",
                        "Core Specialization",
                        "Advanced Topics",
                        "Research Project",
                        "Industry Training",
                      ]
                    ).map((subject, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {typeof subject === "string" ? subject : subject.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>4 Credits</span>
                            <span>•</span>
                            <span>Project-Based Learning</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Assessment & Learning Methods</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="text-3xl font-bold text-blue-600 mb-2">40%</div>
                      <div className="font-semibold text-gray-900 mb-1">Coursework & Projects</div>
                      <div className="text-sm text-gray-600">Assignments, presentations, group projects</div>
                    </div>
                    <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="text-3xl font-bold text-green-600 mb-2">35%</div>
                      <div className="font-semibold text-gray-900 mb-1">Examinations</div>
                      <div className="text-sm text-gray-600">Mid-term and final examinations</div>
                    </div>
                    <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GraduationCap className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="text-3xl font-bold text-purple-600 mb-2">25%</div>
                      <div className="font-semibold text-gray-900 mb-1">Thesis/Capstone</div>
                      <div className="text-sm text-gray-600">Final project or research thesis</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Admissions */}
          <TabsContent value="admissions" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl">Admission Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 text-lg">Academic Requirements</h4>
                      <ul className="space-y-2 text-gray-700">
                        {(
                          university.admissionRequirements?.academicRequirements || [
                            "Bachelor's degree from recognized institution",
                            "Minimum GPA of 3.0 or equivalent",
                            "Relevant academic background",
                          ]
                        ).map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 text-lg">Language Requirements</h4>
                      <ul className="space-y-2 text-gray-700">
                        {(
                          university.admissionRequirements?.languageRequirements || [
                            "IELTS 6.5 or TOEFL 90+",
                            "English proficiency certificate",
                          ]
                        ).map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 text-lg">Required Documents</h4>
                      <ul className="space-y-2 text-gray-700">
                        {(
                          university.admissionRequirements?.documents || [
                            "Academic transcripts",
                            "Letters of recommendation",
                            "Statement of purpose",
                            "Passport copy",
                          ]
                        ).map((doc, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl">Application Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      { phase: "Application Opens", date: "October 1, 2024", status: "completed" },
                      {
                        phase: "Application Deadline",
                        date: course.applicationDeadline || "March 15, 2025",
                        status: "current",
                      },
                      { phase: "Admission Results", date: "May 1, 2025", status: "upcoming" },
                      {
                        phase: "Course Begins",
                        date: (() => {
                          if (!course.intake) return "Fall 2025"
                          if (Array.isArray(course.intake)) {
                            const firstIntake = course.intake[0]
                            if (typeof firstIntake === "object" && firstIntake !== null) {
                              return firstIntake.term || firstIntake.deadline || firstIntake.seats || "Fall 2025"
                            }
                            return String(firstIntake)
                          }
                          if (typeof course.intake === "object" && course.intake !== null) {
                            return course.intake.term || course.intake.deadline || course.intake.seats || "Fall 2025"
                          }
                          return String(course.intake)
                        })(),
                        status: "upcoming",
                      },
                    ].map((timeline, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div
                          className={`w-4 h-4 rounded-full ${timeline.status === "completed"
                            ? "bg-green-500"
                            : timeline.status === "current"
                              ? "bg-blue-500 animate-pulse"
                              : "bg-gray-300"
                            }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{timeline.phase}</div>
                          <div className="text-sm text-gray-600">{timeline.date}</div>
                        </div>
                        {timeline.status === "current" && <Badge className="bg-blue-100 text-blue-800">Current</Badge>}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900 mb-1">Application Deadline Approaching</h4>
                        <p className="text-sm text-yellow-800">
                          Don't miss out! Apply before {course.applicationDeadline || "March 15, 2025"} to secure your
                          spot.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Career Outcomes */}
          <TabsContent value="careers" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl">Career Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(
                      course.careerProspects || [
                        "Software Engineer",
                        "Data Scientist",
                        "Product Manager",
                        "Research Analyst",
                      ]
                    ).map((career, index) => {
                      const salaryRanges = [
                        type === "abroad" ? "$80,000 - $120,000" : "₹12-18 LPA",
                        type === "abroad" ? "$100,000 - $150,000" : "₹15-25 LPA",
                        type === "abroad" ? "$90,000 - $130,000" : "₹10-20 LPA",
                        type === "abroad" ? "$120,000 - $180,000" : "₹18-30 LPA",
                      ]
                      const growthLevels = ["High", "Very High", "High", "Very High"]

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">{career}</div>
                              <div className="text-sm text-gray-600">
                                Average Salary: {salaryRanges[index] || "Competitive"}
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={`${growthLevels[index] === "Very High"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                              }`}
                          >
                            {growthLevels[index]} Growth
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl">Employment Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Placement Rate</span>
                        <span className="font-semibold text-green-600">95%</span>
                      </div>
                      <Progress value={95} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Average Salary Increase</span>
                        <span className="font-semibold text-blue-600">150%</span>
                      </div>
                      <Progress value={75} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Industry Satisfaction</span>
                        <span className="font-semibold text-purple-600">4.8/5</span>
                      </div>
                      <Progress value={96} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Alumni Network</span>
                        <span className="font-semibold text-orange-600">50,000+</span>
                      </div>
                      <Progress value={85} className="h-3" />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Top Hiring Companies</h4>
                    <div className="flex flex-wrap gap-2">
                      {(type === "abroad"
                        ? ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix"]
                        : ["TCS", "Infosys", "Wipro", "Accenture", "IBM", "Cognizant"]
                      ).map((company, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Testimonials */}
          <TabsContent value="testimonials" className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Student Success Stories</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Hear from our graduates who have transformed their careers with this program.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Software Engineer at Google",
                  image: "/placeholder.svg?height=80&width=80&text=SJ",
                  testimonial:
                    "This program completely transformed my career. The hands-on projects and industry connections helped me land my dream job at Google. The faculty support was exceptional throughout my journey.",
                  rating: 5,
                  graduation: "Class of 2023",
                },
                {
                  name: "Michael Chen",
                  role: "Data Scientist at Microsoft",
                  image: "/placeholder.svg?height=80&width=80&text=MC",
                  testimonial:
                    "The curriculum is perfectly aligned with industry needs. I gained practical skills that I use every day in my role. The research opportunities opened doors I never imagined possible.",
                  rating: 5,
                  graduation: "Class of 2022",
                },
                {
                  name: "Emily Rodriguez",
                  role: "Product Manager at Amazon",
                  image: "/placeholder.svg?height=80&width=80&text=ER",
                  testimonial:
                    "Beyond the technical skills, this program taught me leadership and critical thinking. The diverse cohort and collaborative environment prepared me for the global workplace.",
                  rating: 5,
                  graduation: "Class of 2023",
                },
                {
                  name: "David Kim",
                  role: "Startup Founder & CEO",
                  image: "/placeholder.svg?height=80&width=80&text=DK",
                  testimonial:
                    "The entrepreneurship track and mentorship program gave me the confidence to start my own company. We've now raised $2M in funding and are growing rapidly.",
                  rating: 5,
                  graduation: "Class of 2021",
                },
              ].map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                  <div className="flex items-center gap-4 mb-6">
                    <Image
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={80}
                      height={80}
                      className="rounded-full"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{testimonial.name}</h3>
                      <p className="text-blue-600 font-medium">{testimonial.role}</p>
                      <p className="text-sm text-gray-500">{testimonial.graduation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <blockquote className="text-gray-700 leading-relaxed italic">"{testimonial.testimonial}"</blockquote>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <div className="bg-blue-50 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Join Our Success Stories</h3>
                <p className="text-gray-600 mb-6">
                  Be part of our growing community of successful graduates making impact worldwide.
                </p>
                <Button
                  onClick={handleApplyNow}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Start Your Journey Today
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-xl text-blue-200 mb-2">
              Join thousands of successful graduates who have transformed their careers with this program.
            </p>
            <p className="text-lg text-blue-300">
              Get expert guidance, application support, and scholarship assistance - all for free.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              onClick={handleApplyNow}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-xl"
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Apply Now - Free Application
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg bg-transparent"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Talk to Counselor
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowCostCalculator(!showCostCalculator)}
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg bg-transparent"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Cost Calculator
            </Button>
          </div>

          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Shield className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-sm text-gray-300">No application fees</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle className="w-8 h-8 text-green-400 mb-2" />
              <span className="text-sm text-gray-300">Free counseling</span>
            </div>
            <div className="flex flex-col items-center">
              <Award className="w-8 h-8 text-yellow-400 mb-2" />
              <span className="text-sm text-gray-300">Scholarship guidance</span>
            </div>
            <div className="flex flex-col items-center">
              <Phone className="w-8 h-8 text-purple-400 mb-2" />
              <span className="text-sm text-gray-300">24/7 support</span>
            </div>
          </div>
        </div>
      </div>

      <IntakeSelectionModal
        isOpen={showIntakeModal}
        onClose={handleIntakeModalClose}
        onConfirm={handleIntakeConfirm}
        availableIntakes={
          Array.isArray(course?.intake)
            ? course.intake.map((i: any) => {
              if (typeof i === 'string') return i
              if (typeof i === 'object' && i?.term) return i.term
              return ''
            }).filter(Boolean)
            : typeof course?.intake === 'string'
              ? course.intake.split(/[,\s]+/).filter(Boolean)
              : []
        }
        courseName={course?.name}
        universityName={university?.name}
        isLoading={isSubmittingApplication}
        showSuccess={showIntakeSuccess}
        registrationId={successRegistrationId}
        intakeSession={successIntakeSession}
      />
    </div>
  )
}
