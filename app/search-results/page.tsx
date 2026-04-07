"use client"

import { useEffect, useState, useRef } from "react"
import type React from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { getEncryptedUser, setEncryptedUser, removeEncryptedUser } from "@/lib/encryption"
import { studyAbroadUniversities, studyIndiaUniversities, studyOnlineCourses } from "@/lib/sample-data"
import { AuthLoginModal } from "@/components/modals/auth-login-modal"
import { ProfileCompletionModal } from "@/components/modals/profile-completion-modal"
import { IntakeSelectionModal } from "@/components/modals/intake-selection-modal"
import { MissingDocumentsModal, type MissingDocument } from "@/components/modals/missing-documents-modal"
import { TopBanner } from "@/components/search-results/top-banner"
import { AdBanner } from "@/components/search-results/ad-banner"
import { HorizontalFilters } from "@/components/search-results/horizontal-filters"
import { SearchToolbar } from "@/components/search-results/search-toolbar"
import { ComparisonStrip } from "@/components/search-results/comparison-strip"
import { CourseResultCard } from "@/components/search-results/course-result-card"
import { SearchPagination } from "@/components/search-results/search-pagination"
import { AuthLoadingView, SearchLoadingSkeleton, SearchEmptyState } from "@/components/search-results/search-results-state-views"
import type { UnifiedUserProfile } from "@/types/user"
import { toast } from "@/hooks/use-toast"
import { addWishlistItem, startCourseRegistration, checkDocumentCompliance } from "@/lib/api/client"
import { resolveCurrentUserId } from "@/lib/user-identity"
import {
  mapLevelsToApi,
  mapCountriesToApi,
  mapDurationToMonths,
  mapIntakeToMonthsLocal,
  applyFilters,
  sortCourses,
  isLikelyLogoImage,
  getCardImageSrc,
  formatFee,
  formatIntake,
  createSlug,
} from "@/lib/search-results-utils"


interface FilterState {
  countries: string[]
  levels: string[]
  duration: [number, number]
  exams: string[]
  feeRange: [number, number]
}

const initialFilters: FilterState = {
  countries: [],
  levels: [],
  duration: [0, 10],
  exams: [],
  feeRange: [0, 5000000],
}

function SearchResultsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const vertical = searchParams.get("vertical") || "study-abroad"
  const queryFromUrl = searchParams.get("q") || ""

  console.log("[v0] SearchResults: Component mounted", { vertical, queryFromUrl })

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showIntakeModal, setShowIntakeModal] = useState(false)
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)
  // Success state (integrated into intake modal)
  const [showIntakeSuccess, setShowIntakeSuccess] = useState(false)
  const [successRegistrationId, setSuccessRegistrationId] = useState<string>("")
  const [successIntakeSession, setSuccessIntakeSession] = useState<string>("")
  const [searchInput, setSearchInput] = useState(queryFromUrl)
  const [searchQuery, setSearchQuery] = useState(queryFromUrl)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState<UnifiedUserProfile | null>(null)
  const [sortBy, setSortBy] = useState("relevance")
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage] = useState(5)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [loading, setLoading] = useState(false)
  const [apiCourses, setApiCourses] = useState<any[] | null>(null)
  const [apiPagination, setApiPagination] = useState<{ currentPage: number; pageSize: number; totalPages: number; totalItems: number } | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [wishlistLoading, setWishlistLoading] = useState<Record<string, boolean>>({})
  const [comparisonList, setComparisonList] = useState<string[]>([])
  const [pendingApplication, setPendingApplication] = useState<{ universityId: string; courseId: string; collegeCourseId: string; intake: string[]; courseName: string; universityName: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showMissingDocsModal, setShowMissingDocsModal] = useState(false)
  const [missingDocuments, setMissingDocuments] = useState<MissingDocument[]>([])
  const [missingDocsCountryName, setMissingDocsCountryName] = useState<string>("")

  useEffect(() => {
    console.log("[v0] SearchResults: Auth check starting")
    // Try encrypted storage first
    let parsedUser = getEncryptedUser()

    if (!parsedUser) {
      // Fallback to unencrypted
      const userString = localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
      if (userString) {
        try {
          parsedUser = JSON.parse(userString)
        } catch (error) {
          console.error("[v0] SearchResults: Error parsing user data", error)
          removeEncryptedUser()
          localStorage.removeItem("meritcap_user")
          sessionStorage.removeItem("meritcap_user")
          setAuthLoading(false)
          setShowLoginModal(true)
          return
        }
      }
    }

    if (parsedUser) {
      setIsLoggedIn(true)
      setUserData(parsedUser)
      setAuthLoading(false)
      console.log("[v0] SearchResults: User found, logged in")
    } else {
      setAuthLoading(false)
      setShowLoginModal(true)
      console.log("[v0] SearchResults: No user found, showing login modal")
    }

    const savedFavorites = localStorage.getItem("meritcap_favorites")
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (error) {
        console.error("[v0] SearchResults: Error parsing favorites", error)
        localStorage.removeItem("meritcap_favorites")
      }
    }

    const savedComparison = localStorage.getItem("meritcap_comparison")
    if (savedComparison) {
      try {
        setComparisonList(JSON.parse(savedComparison))
      } catch (error) {
        console.error("[v0] SearchResults: Error parsing comparison list", error)
        localStorage.removeItem("meritcap_comparison")
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("meritcap_favorites", JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem("meritcap_comparison", JSON.stringify(comparisonList))
  }, [comparisonList])


  const debounceRef = useRef<number | null>(null)
  const fetchInProgressRef = useRef(false)
  const lastFetchKeyRef = useRef<string | null>(null)

  // Fetch server results when vertical is study-abroad, on mount and when filters/searchQuery changes
  useEffect(() => {
    if (vertical !== "study-abroad") return
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    // On initial mount, if we have cached backend results from the home page
    // use them directly to avoid an immediate duplicate API call.
    try {
      const cached = localStorage.getItem("meritcap_search_results")
      if (cached && !apiCourses) {
        const parsed = JSON.parse(cached)
        if (parsed && Array.isArray(parsed.data)) {
          setApiCourses(parsed.data)
          const pagination = parsed.pagination || null
          if (pagination) {
            setApiPagination({
              currentPage: pagination.currentPage || currentPage,
              pageSize: pagination.pageSize || resultsPerPage,
              totalPages: pagination.totalPages || Math.max(1, Math.ceil((pagination.totalItems || parsed.data.length) / resultsPerPage)),
              totalItems: pagination.totalItems || parsed.data.length,
            })
          }
          // record last fetch key so we don't immediately re-fetch the same payload
          try {
            const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
            const intakeParamForKey = sp ? (sp.get('intake') || sp.get('intakeMonths') || '') : ''
            const keyObj = { page: (pagination && pagination.currentPage) || currentPage, q: queryFromUrl || searchQuery, filters, intake: intakeParamForKey }
            lastFetchKeyRef.current = JSON.stringify(keyObj)
          } catch (e) {
            // ignore
          }
          // don't immediately fetch from API when cached results exist
          return
        }
      }
    } catch (e) {
      // proceed to fetch if cache parsing fails
    }

    // debounce filter changes by 350ms
    debounceRef.current = window.setTimeout(() => {
      const pageToFetch = Math.max(1, currentPage)
      void fetchCoursesFromApi(pageToFetch)
    }, 350)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertical, searchQuery, filters, isLoggedIn])

  const handleLoginComplete = (newUserData: UnifiedUserProfile) => {
    setIsLoggedIn(true)
    setUserData(newUserData)
    setShowLoginModal(false)

    // Store encrypted user data
    const rememberMe = localStorage.getItem("meritcap_remember_me") === "true"
    setEncryptedUser(newUserData, !rememberMe)

    window.dispatchEvent(new Event("authStateChanged"))

    // Show profile modal immediately if profile not completed
    if (!newUserData.profileCompleted) {
      setTimeout(() => {
        setShowProfileModal(true)
      }, 100)
    } else if (pendingApplication) {
      // Show intake selection modal instead of directly navigating
      setShowIntakeModal(true)
    }
  }

  const handleProfileComplete = (completeProfileData: UnifiedUserProfile) => {
    setUserData(completeProfileData)
    setShowProfileModal(false)

    window.dispatchEvent(new Event("authStateChanged"))

    if (pendingApplication) {
      // Show intake selection modal instead of directly navigating
      setShowIntakeModal(true)
    }
  }

  const handleProfileSkip = () => {
    setShowProfileModal(false)

    if (pendingApplication) {
      // Show intake selection modal instead of directly navigating
      setShowIntakeModal(true)
    }
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  // Build and send search request to server for study-abroad vertical
  const fetchCoursesFromApi = async (page: number) => {
    // Prevent duplicate fetches when same request is already in progress or just completed
    try {
      const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const intakeParamForKey = sp ? (sp.get('intake') || sp.get('intakeMonths') || '') : ''
      const keyObj = { page, q: searchQuery, filters, intake: intakeParamForKey }
      const key = JSON.stringify(keyObj)
      if (fetchInProgressRef.current) {
        console.log('[v0] SearchResults: fetch already in progress, skipping duplicate')
        return
      }
      if (lastFetchKeyRef.current === key) {
        console.log('[v0] SearchResults: fetch payload identical to last fetch, skipping')
        return
      }
      lastFetchKeyRef.current = key
      fetchInProgressRef.current = true
    } catch (e) {
      // continue if key computation fails
    }

    setLoading(true)
    try {
      const { searchCollegeCourses } = await import("@/lib/api/client")

      // Normalize filters for API
      const apiLevels = mapLevelsToApi(filters.levels || [])
      const apiCountries = mapCountriesToApi(filters.countries || [])
      const apiDuration = mapDurationToMonths(filters.duration || [0, 0])

      // Determine intakeMonths: prefer URL param 'intake', then filters (if any)
      const intakeParam = (() => {
        try {
          const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
          if (sp) return sp.get('intake') || sp.get('intakeMonths') || null
        } catch (e) {
          return null
        }
        return null
      })()

      // Map internal filters to API payload shape
      const payload = {
        pagination: {
          page: Math.max(1, page),
          size: resultsPerPage,
        },
        filters: {
          courses: [],
          departments: [],
          graduationLevels: apiLevels,
          countries: apiCountries,
          duration: apiDuration,
          // If URL contains an intake parameter, use it. Otherwise use empty array so backend returns all.
          intakeMonths: intakeParam ? mapIntakeToMonthsLocal(intakeParam) : [],
        },
        search: {
          term: searchQuery || "",
        },
      }

      const res = await searchCollegeCourses(payload)

      // Normalize possible response shapes
      const list = res?.data || res?.response?.data || res?.response || res || { data: [] }
      const pagination = res?.pagination || res?.response?.pagination || null

      // If API returned top-level object containing data and pagination
      const dataArray = Array.isArray(list) ? list : list.data || []

      setApiCourses(dataArray)
      try {
        const storeObj = { data: dataArray, pagination }
        localStorage.setItem("meritcap_search_results", JSON.stringify(storeObj))
      } catch (e) {
        // ignore storage errors
      }

      if (pagination) {
        setApiPagination({
          currentPage: pagination.currentPage || page,
          pageSize: pagination.pageSize || resultsPerPage,
          totalPages: pagination.totalPages || Math.max(1, Math.ceil((pagination.totalItems || dataArray.length) / resultsPerPage)),
          totalItems: pagination.totalItems || dataArray.length,
        })
      } else {
        setApiPagination({ currentPage: page, pageSize: resultsPerPage, totalPages: Math.max(1, Math.ceil(dataArray.length / resultsPerPage)), totalItems: dataArray.length })
      }
    } catch (err) {
      console.error("[v0] SearchResults: Error fetching courses from API", err)
      setApiCourses([])
      setApiPagination({ currentPage: page, pageSize: resultsPerPage, totalPages: 1, totalItems: 0 })
    } finally {
      setLoading(false)
      fetchInProgressRef.current = false
    }
  }

  const handleAdvancedFiltersClick = () => {
    // Handle advanced filters modal
  }

  const handleAddToWishlist = async (course: any) => {
    try {
      if (!isLoggedIn || !userData) {
        setShowLoginModal(true)
        return
      }

      const key = course.id as string
      if (wishlistLoading[key]) return
      setWishlistLoading((prev) => ({ ...prev, [key]: true }))

      const studentIdForApi = resolveCurrentUserId(userData) || undefined

      if (!studentIdForApi) {
        toast({ title: "Profile issue", description: "Cannot determine your student ID.", variant: "destructive" })
        return
      }

      const courseIdForApi = course.collegeCourseId || course.courseId
      if (!courseIdForApi) {
        toast({ title: "Missing course info", description: "Course identifier is not available.", variant: "destructive" })
        return
      }

      const res = await addWishlistItem(studentIdForApi, courseIdForApi)
      if (res?.success) {
        setFavorites((prev) => (prev.includes(key) ? prev : [...prev, key]))
        toast({ title: "Added to wishlist", description: res?.message || "Item added to wishlist" })
      } else {
        const msg = res?.message || "Could not add to wishlist"
        // If already exists, mark as favorite locally for UI consistency
        if (/already\s+in\s+the\s+wishlist/i.test(msg)) {
          setFavorites((prev) => (prev.includes(key) ? prev : [...prev, key]))
        }
        toast({ title: "Wishlist", description: msg, variant: res?.success ? undefined : "destructive" })
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to add to wishlist"
      toast({ title: "Wishlist error", description: String(msg), variant: "destructive" })
    } finally {
      setWishlistLoading((prev) => {
        const copy = { ...prev }
        delete copy[course.id]
        return copy
      })
    }
  }

  const toggleComparison = (id: string) => {
    setComparisonList((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else if (prev.length < 3) {
        return [...prev, id]
      } else {
        alert("You can compare maximum 3 courses at a time")
        return prev
      }
    })
  }

  const getAllCourses = () => {
    console.log("[v0] SearchResults: Getting courses for vertical:", vertical)
    let sourceData: any[] = []

    try {
      // If study-abroad, prefer backend results saved in localStorage
      if (vertical === "study-abroad") {
        try {
          const backend = localStorage.getItem("meritcap_search_results")
          if (backend) {
            const parsed = JSON.parse(backend)
            if (parsed && Array.isArray(parsed.data)) {
              sourceData = parsed.data.map((item: any) => ({
                // normalize to previous sample-data university shape
                id: String(item.collegeId || "unknown"),
                collegeCourseId: item.collegeCourseId || "unknown",
                name: item.collegeName || "Unknown College",
                city: item.campusName || "",
                country: item.country || "",
                logo: item.collegeImage || null,
                ranking: item.universityRanking || 999,
                rating: item.rating || 4.5,
                reviewCount: item.reviewCount || 0,
                courses: [
                  {
                    id: item.courseId || item.collegeCourseId || "unknown",
                    name: item.courseName || "Unknown Course",
                    fee: item.tuitionFee || 0,
                    duration: item.duration || "2 years",
                    intake: Array.isArray(item.intakeMonths) ? item.intakeMonths : (item.intakeMonths || item.intakeYear || ""),
                    courseRaw: item,
                  },
                ],
              }))
              console.log('[v0] SearchResults: Using backend search results count:', sourceData.length)
            }
          }
        } catch (e) {
          console.error('[v0] SearchResults: Error parsing backend search results', e)
        }
      }

      if (vertical === "study-abroad") {
        // If backend returned no results, do NOT fall back to mock/sample data.
        // Leave `sourceData` empty so the UI can show a clear "No results" state.
        if (!sourceData || sourceData.length === 0) {
          console.log("[v0] SearchResults: No backend results for study-abroad")
        } else {
          console.log("[v0] SearchResults: Using backend search results count:", sourceData.length)
        }
      } else if (vertical === "study-india") {
        sourceData = studyIndiaUniversities || []
        console.log("[v0] SearchResults: Using studyIndiaUniversities, count:", sourceData.length)
      } else if (vertical === "study-online") {
        sourceData = studyOnlineCourses || []
        console.log("[v0] SearchResults: Using studyOnlineCourses, count:", sourceData.length)
      } else {
        sourceData = [...(studyAbroadUniversities || []), ...(studyIndiaUniversities || [])]
        console.log("[v0] SearchResults: Using combined data, count:", sourceData.length)
      }

      const courses = sourceData.flatMap((uni) => {
        if (!uni || !uni.courses || !Array.isArray(uni.courses)) {
          console.warn("[v0] SearchResults: Invalid university data", uni)
          return []
        }

        return uni.courses
          .map((course) => {
            if (!course) {
              console.warn("[v0] SearchResults: Invalid course data", course)
              return null
            }

            let parsedFee = 0
            if (typeof course.fee === "number") {
              parsedFee = course.fee
            } else if (typeof course.fee === "string") {
              const feeMatch = course.fee.replace(/[^0-9]/g, "")
              parsedFee = feeMatch ? Number.parseInt(feeMatch, 10) : 0
            }

            return {
              id: `${uni.id || "unknown"}-${course.id || "unknown"}`,
              collegeCourseId: course.collegeCourseId || "unknown",
              courseId: course.id || "unknown",
              universityId: uni.id || "unknown",
              courseName: course.name || "Unknown Course",
              universityName: uni.name || "Unknown University",
              location: `${uni.city || uni.location || "Unknown City"}, ${uni.country || "Unknown Country"}`,
              country: uni.country || "Unknown Country",
              city: uni.city || uni.location || "Unknown City",
              fee: parsedFee,
              duration: course.duration || "2 years",
              level: course.level || course.degree || "Graduate",
              intake: Array.isArray(course.intake) ? course.intake.join(", ") : course.intake || "Rolling",
              universityLogo:
                uni.logo ||
                `/placeholder.svg?height=60&width=120&text=${encodeURIComponent(uni.name || "University")}&query=${encodeURIComponent(uni.name || "University")} university logo`,
              universityRanking: uni.ranking || 999,
              rating: uni.rating || 4.5,
              reviewCount: uni.reviewCount || 120,
              scholarshipAvailable: course.scholarshipAvailable || false,
              applicationDeadline: course.applicationDeadline || "Rolling admissions",
              accreditations: Array.isArray(uni.accreditation)
                ? uni.accreditation
                : uni.accreditation
                  ? [uni.accreditation]
                  : ["Accredited"],
              campusImage:
                uni.image ||
                `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(uni.name || "University")}-Campus&query=${encodeURIComponent(uni.name || "University")} university campus building`,
              courseImage: `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(course.name || "Course")}&query=${encodeURIComponent(course.name || "Course")} course ${(course.name || "course").toLowerCase()} classroom students`,
              courseAge: course.startDate ? `Updated ${new Date(course.startDate).getFullYear()}` : "Recently Updated",
              lastUpdated: course.startDate || "2024-01-01",
            }
          })
          .filter(Boolean) // Remove null entries
      })

      console.log("[v0] SearchResults: Total courses generated:", courses.length)
      return courses
    } catch (error) {
      console.error("[v0] SearchResults: Error processing course data", error)
      return []
    }
  }


  // If apiCourses is provided (study-abroad), use server-driven pagination and counts.
  const allCourses = apiCourses ? apiCourses.map((item: any) => {
    // map server item into UI course shape similar to previous mapping
    return {
      id: `${item.collegeId || item.collegeCourseId || 'unknown'}-${item.courseId || item.collegeCourseId || 'unknown'}`,
      courseId: item.courseId || 'unknown',
      collegeCourseId: item.collegeCourseId || 'unknown',
      universityId: String(item.collegeId || item.collegeCourseId || 'unknown'),
      courseName: item.courseName || 'Unknown Course',
      universityName: item.collegeName || 'Unknown University',
      location: `${item.campusName || ''}, ${item.country || ''}`,
      country: item.country || 'Unknown Country',
      countryId: item.countryId ?? item.country_id ?? null,
      city: item.campusName || item.city || 'Unknown City',
      fee: Number(item.tuitionFee) || 0,
      duration: item.duration || '2 years',
      level: item.graduationLevel || 'Graduate',
      intake: Array.isArray(item.intakeMonths) ? item.intakeMonths : item.intakeMonths || item.intakeYear || '',
      universityLogo: item.collegeImage || `/placeholder.svg?height=40&width=80&text=${encodeURIComponent(item.collegeName || 'University')}`,
      universityRanking: item.universityRanking || 999,
      rating: item.rating || 4.5,
      reviewCount: item.reviewCount || 0,
      scholarshipAvailable: item.scholarshipAvailable || false,
      applicationDeadline: item.applicationDeadline || 'Rolling admissions',
      accreditations: item.accreditation ? (Array.isArray(item.accreditation) ? item.accreditation : [item.accreditation]) : ['Accredited'],
      campusImage: item.campusImage && !isLikelyLogoImage(item.campusImage) ? item.campusImage : '',
      courseImage: item.courseImage && !isLikelyLogoImage(item.courseImage)
        ? item.courseImage
        : item.bannerImage && !isLikelyLogoImage(item.bannerImage)
          ? item.bannerImage
          : '',
      courseAge: item.startDate ? `Updated ${new Date(item.startDate).getFullYear()}` : 'Recently Updated',
      lastUpdated: item.startDate || '2024-01-01',
    }
  }) : getAllCourses()

  const filteredCourses = apiCourses ? allCourses : applyFilters(allCourses, searchQuery, filters)
  const sortedCourses = sortCourses(filteredCourses, sortBy)

  const totalPages = apiPagination ? Math.max(1, apiPagination.totalPages) : Math.max(1, Math.ceil(sortedCourses.length / resultsPerPage))
  const startIndex = apiPagination ? Math.max(0, (apiPagination.currentPage - 1) * (apiPagination.pageSize || resultsPerPage)) : Math.max(0, (currentPage - 1) * resultsPerPage)
  const endIndex = apiPagination ? Math.min(startIndex + (apiPagination.pageSize || resultsPerPage), apiPagination.totalItems || sortedCourses.length) : Math.min(startIndex + resultsPerPage, sortedCourses.length)
  const paginatedCourses = apiPagination ? sortedCourses : sortedCourses.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    // If we have API pagination info, clamp to available pages
    const maxPage = apiPagination?.totalPages || totalPages
    const clamped = Math.max(1, Math.min(page, maxPage))
    if (clamped === currentPage) return
    setCurrentPage(clamped)
    // Fetch the requested page from server if study-abroad
    if (vertical === "study-abroad") {
      void fetchCoursesFromApi(clamped)
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 100)
  }

  const handleSearch = () => {
    setSearchQuery(searchInput)
    setCurrentPage(1)
    const params = new URLSearchParams(searchParams)
    params.set("q", searchInput)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleClearAllFilters = () => {
    setSearchInput("")
    setSearchQuery("")
    setFilters(initialFilters)
    setCurrentPage(1)
    router.push(pathname + `?vertical=${vertical}`)
  }

  const areFiltersActive = searchQuery !== "" || JSON.stringify(filters) !== JSON.stringify(initialFilters)

  const handleApplyNow = async (course: any) => {
    const searchData = {
      query: searchQuery,
      vertical: vertical,
      country: searchParams.get("country") || "all",
      city: searchParams.get("city") || "all",
      level: searchParams.get("level") || "all",
      intake: searchParams.get("intake") || "all",
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem("search_parameters", JSON.stringify(searchData))

    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }

    // Parse intake months from course data
    let intakeMonths: string[] = []
    if (Array.isArray(course.intake)) {
      intakeMonths = course.intake
    } else if (typeof course.intake === 'string') {
      intakeMonths = course.intake.split(/[,\s]+/).filter(Boolean)
    }

    // Pre-check document compliance
    try {
      const studentIdForApi = resolveCurrentUserId(userData)
      if (studentIdForApi && course.countryId) {
        const complianceResponse = await checkDocumentCompliance(studentIdForApi, course.countryId)

        // ApiSuccessResponse wraps data in the "response" field
        const complianceData = complianceResponse?.response ?? complianceResponse?.data

        if (complianceResponse?.success && !complianceData?.compliant) {
          const missing = (complianceData?.missingDocuments ?? []) as MissingDocument[]
          setMissingDocuments(missing)
          sessionStorage.setItem("missing_doc_codes", JSON.stringify(missing.map((d) => d.documentTypeCode)))
          setMissingDocsCountryName(course.universityName)
          setShowMissingDocsModal(true)
          return
        }
      }
    } catch (error: any) {
      console.error("Error checking document compliance:", error)
      // Continue with the application flow even if the check fails
    }

    // Set pending application with intake data
    setPendingApplication({
      universityId: course.universityId,
      courseId: course.courseId,
      collegeCourseId: course.collegeCourseId,
      intake: intakeMonths,
      courseName: course.courseName,
      universityName: course.universityName,
    })

    // Show intake selection modal
    setShowIntakeModal(true)
  }

  const handleIntakeConfirm = async (selectedMonth: string, selectedYear: number, remarks?: string) => {
    if (!pendingApplication) return

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

      // Get college course ID from pending application (use collegeCourseId, NOT courseId)
      const collegeCourseId = Number(pendingApplication.collegeCourseId)
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

        // Don't reset pendingApplication here - it will be reset when modal closes
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
    setPendingApplication(null)
    // Reset success state
    setShowIntakeSuccess(false)
    setSuccessRegistrationId("")
    setSuccessIntakeSession("")
  }

  if (authLoading) {
    console.log("[v0] SearchResults: Showing auth loading")
    return <AuthLoadingView />
  }

  if (!isLoggedIn) {
    console.log("[v0] SearchResults: Showing login modal")
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthLoginModal
          isOpen={showLoginModal}
          onClose={() => {
            router.push("/")
          }}
          onLoginComplete={handleLoginComplete}
        />
      </div>
    )
  }

  console.log("[v0] SearchResults: Rendering main content")
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-6">
        <TopBanner />
      </div>

      <SearchToolbar
        searchInput={searchInput}
        sortBy={sortBy}
        areFiltersActive={areFiltersActive}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        onKeyDown={handleKeyDown}
        onSortChange={setSortBy}
        onClearAll={handleClearAllFilters}
      />

      <HorizontalFilters
        onFilterChange={handleFilterChange}
        vertical={vertical}
        onAdvancedFiltersClick={handleAdvancedFiltersClick}
      />

      <ComparisonStrip
        comparisonList={comparisonList}
        sortedCourses={sortedCourses}
        onClear={() => setComparisonList([])}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {loading ? (
              <SearchLoadingSkeleton />
            ) : sortedCourses.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {startIndex + 1}-{endIndex} of {sortedCourses.length} courses
                </div>

                <div className="space-y-4">
                  {paginatedCourses.map((course) => (
                    <CourseResultCard
                      key={course.id}
                      course={course}
                      vertical={vertical}
                      comparisonList={comparisonList}
                      favorites={favorites}
                      wishlistLoading={wishlistLoading}
                      getCardImageSrc={getCardImageSrc}
                      createSlug={createSlug}
                      formatFee={formatFee}
                      formatIntake={formatIntake}
                      onToggleComparison={toggleComparison}
                      onAddToWishlist={handleAddToWishlist}
                      onApplyNow={handleApplyNow}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <SearchPagination
                    currentPage={apiPagination ? apiPagination.currentPage : currentPage}
                    totalPages={totalPages}
                    totalItems={apiPagination ? apiPagination.totalItems : sortedCourses.length}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <SearchEmptyState
                isLoggedIn={isLoggedIn}
                onClearFilters={() => {
                  setFilters(initialFilters)
                  setSearchInput("")
                  setSearchQuery("")
                  setCurrentPage(1)
                }}
                onRefineFilters={handleAdvancedFiltersClick}
                onLoginClick={() => setShowLoginModal(true)}
              />
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            <AdBanner type="loan" />
            <AdBanner type="scholarship" />
            <AdBanner type="counseling" />
          </div>
        </div>
      </div>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
        onSkip={handleProfileSkip}
        userData={userData}
      />

      <IntakeSelectionModal
        isOpen={showIntakeModal}
        onClose={handleIntakeModalClose}
        onConfirm={handleIntakeConfirm}
        availableIntakes={pendingApplication?.intake || []}
        courseName={pendingApplication?.courseName}
        universityName={pendingApplication?.universityName}
        isLoading={isSubmittingApplication}
        showSuccess={showIntakeSuccess}
        registrationId={successRegistrationId}
        intakeSession={successIntakeSession}
      />

      <MissingDocumentsModal
        isOpen={showMissingDocsModal}
        onClose={() => setShowMissingDocsModal(false)}
        missingDocuments={missingDocuments}
        countryName={missingDocsCountryName}
        autoRedirectOnClose={true}
      />
    </div>
  )
}

export default function SearchResultsPage() {
  console.log("[v0] SearchResults: Page component rendering")
  return <SearchResultsContent />
}
