"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getEncryptedUser } from "@/lib/encryption"
import {
  Search,
  Globe,
  GraduationCap,
  Briefcase,
  BookOpen,
  Users,
  ChevronRight,
  Clock,
  CheckCircle,
  Zap,
  Brain,
  X,
  Loader,
} from "lucide-react"
import type { UnifiedUserProfile } from "@/types/user"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { QuickLoginModal } from "@/components/modals/quick-login-modal"

type Vertical = "study-abroad" | "study-india" | "study-online" | "trainings" | "jobs"

export default function HomePage() {
  const [activeVertical, setActiveVertical] = useState<Vertical>("study-abroad")
  const [searchQuery, setSearchQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showQuestionsModal, setShowQuestionsModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [showAiPopup, setShowAiPopup] = useState(false)
  const [showCounselorBooking, setShowCounselorBooking] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState("")
  const [appointmentNote, setAppointmentNote] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState<UnifiedUserProfile | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showQuickLoginModal, setShowQuickLoginModal] = useState(false)
  const [pendingSearchParams, setPendingSearchParams] = useState<URLSearchParams | null>(null)
  const router = useRouter()

  // Filter states
  const [selectedCountry, setSelectedCountry] = useState("all")
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedIntake, setSelectedIntake] = useState("all")

  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    country: false,
    city: false,
    level: false,
    intake: false,
  })

  const [isOpen, setIsOpen] = useState(false)
  const [showBenefitsModal, setShowBenefitsModal] = useState(false)
  const [showAllAwards, setShowAllAwards] = useState(false)
  const [onlineScrollPosition, setOnlineScrollPosition] = useState(0)
  const verticals = [
    { id: "study-abroad", label: "Study Abroad", icon: Globe, active: true },
    { id: "study-india", label: "Study in India", icon: GraduationCap },
    { id: "study-online", label: "Study Online", icon: BookOpen },
    { id: "trainings", label: "Trainings", icon: Users },
    { id: "jobs", label: "Jobs", icon: Briefcase },
  ]

  const mediaFeatures = [
    { name: "Times of India", logo: "/times-of-india-logo.png" },
    { name: "The Hindu", logo: "/the-hindu-logo.png" },
    { name: "Economic Times", logo: "/economic-times-logo.png" },
    { name: "NDTV", logo: "/generic-news-logo.png" },
    { name: "CNN News18", logo: "/cnn-news18-logo.png" },
    { name: "India Today", logo: "/india-today-logo.png" },
    { name: "Hindustan Times", logo: "/hindustan-times-logo.png" },
  ]

  const internationalCollaborations = [
    { name: "Oxford University", logo: "/oxford-university-crest.png", slug: "oxford-university" },
    { name: "Cambridge University", logo: "/cambridge-university-crest.png", slug: "cambridge-university" },
    { name: "University of Toronto", logo: "/university-of-toronto-logo.png", slug: "university-of-toronto" },
    { name: "University of Melbourne", logo: "/university-of-melbourne-logo.png", slug: "university-of-melbourne" },
    { name: "ETH Zurich", logo: "/eth-zurich-logo.png", slug: "eth-zurich" },
  ]

  const indianCollaborations = [
    { name: "IIM Ahmedabad", logo: "/iim-ahmedabad-logo.png", slug: "iim-ahmedabad" },
    { name: "IIM Bangalore", logo: "/iim-bangalore-logo.png", slug: "iim-bangalore" },
    { name: "IIM Calcutta", logo: "/iim-calcutta-logo.png", slug: "iim-calcutta" },
    { name: "IIT Delhi", logo: "/iit-delhi-logo.png", slug: "iit-delhi" },
    { name: "IIT Bombay", logo: "/iit-bombay-logo.png", slug: "iit-bombay" },
    { name: "IIT Madras", logo: "/iit-madras-logo.png", slug: "iit-madras" },
    { name: "AIIMS Delhi", logo: "/aiims-delhi-logo.png", slug: "aiims-delhi" },
    { name: "ISB Hyderabad", logo: "/isb-hyderabad-logo.png", slug: "isb-hyderabad" },
    { name: "XLRI Jamshedpur", logo: "/xlri-logo.png", slug: "xlri-jamshedpur" },
    { name: "FMS Delhi", logo: "/fms-delhi-logo.png", slug: "fms-delhi" },
    { name: "JBIMS Mumbai", logo: "/jbims-logo.png", slug: "jbims-mumbai" },
    { name: "MDI Gurgaon", logo: "/mdi-gurgaon-logo.png", slug: "mdi-gurgaon" },
  ]

  const bankPartners = [
    { name: "State Bank of India", logo: "/sbi-logo.png" },
    { name: "HDFC Bank", logo: "/hdfc-bank-logo.png" },
    { name: "ICICI Bank", logo: "/icici-bank-logo.png" },
    { name: "Axis Bank", logo: "/axis-bank-logo.png" },
    { name: "Kotak Mahindra", logo: "/kotak-mahindra-logo.png" },
    { name: "Punjab National Bank", logo: "/pnb-logo.png" },
  ]

  const awards = [
    { name: "ISO 9001:2015 Certified", logo: "/iso-9001-certification-logo.png" },
    { name: "NAFSA Member", logo: "/nafsa-member-organization-logo.png" },
    { name: "ICEF Certified", logo: "/icef-certified-education-agent-logo.png" },
    { name: "British Council Partner", logo: "/british-council-partner-logo.png" },
    { name: "Education Excellence Award", logo: "/education-excellence-award-certificate.png" },
  ]

  const successStories = [
    {
      title: "IELTS 8.5 in First Attempt: My Strategy",
      description: "Complete preparation strategy that helped me achieve IELTS 8.5 band...",
      name: "Ravi Kumar",
      readTime: "4 min read",
      image: "/happy-indian-student-with-ielts-certificate-celebr.png",
    },
    {
      title: "From Engineering to Data Science: Career Switch",
      description: "How I transitioned from mechanical engineering to becoming a data...",
      name: "Meera Joshi",
      readTime: "9 min read",
      image: "/professional-woman-working-on-data-science-compute.png",
    },
    {
      title: "Scholarship Success: Full Funding for PhD",
      description: "My journey in securing full scholarship for PhD in Germany",
      name: "Karthik Reddy",
      readTime: "6 min read",
      image: "/indian-student-with-scholarship-certificate-at-ger.png",
    },
    {
      title: "Parent's Guide: Supporting Your Child's Dreams",
      description: "A parent's perspective on navigating the study abroad process",
      name: "Mrs. Kavitha Reddy",
      readTime: "5 min read",
      image: "/indian-mother-and-child-looking-at-university-broc.png",
    },
  ]

  const awardsRecognitions = [
    { name: "Best Education Consultant 2024", logo: "/best-education-consultant-award-trophy-2024.png" },
    { name: "Student Choice Award", logo: "/student-choice-award-certificate-with-stars.png" },
    { name: "Excellence in Career Guidance", logo: "/career-guidance-excellence-award-medal.png" },
    { name: "Top Study Abroad Consultant", logo: "/top-study-abroad-consultant-award-plaque.png" },
    { name: "Innovation in Education", logo: "/innovation-in-education-award-trophy.png" },
    { name: "Global Education Partner", logo: "/global-education-partner-certificate-with-world-ma.png" },
  ]

  const onlineCourseTieups = [
    { name: "Manipal University", logo: "/manipal-university-official-logo.png", slug: "manipal-university" },
    { name: "Jain University", logo: "/jain-university-logo.png", slug: "jain-university-online" },
    { name: "Amity University", logo: "/amity-university-logo.png", slug: "amity-university-online" },
    {
      name: "Arizona State University",
      logo: "/arizona-state-university-logo.png",
      slug: "arizona-state-university",
    },
    { name: "BITS Pilani", logo: "/bits-pilani-logo.png", slug: "bits-pilani-online" },
    {
      name: "Symbiosis International",
      logo: "/symbiosis-international-logo.png",
      slug: "symbiosis-international-online",
    },
    { name: "Lovely Professional University", logo: "/lpu-logo.png", slug: "lpu-online" },
    {
      name: "Chandigarh University",
      logo: "/chandigarh-university-logo.png",
      slug: "chandigarh-university-online",
    },
    { name: "SRM University", logo: "/srm-university-logo.png", slug: "srm-university-online" },
    { name: "VIT University", logo: "/vit-university-online.png", slug: "vit-university-online" },
    { name: "Sharda University", logo: "/sharda-university-logo.png", slug: "sharda-university-online" },
    { name: "Bennett University", logo: "/bennett-university-logo.png", slug: "bennett-university-online" },
  ]

  // Helper functions
  const handleQuickLoginComplete = (userData: any) => {
    // Update user state
    setUserData(userData)
    setIsLoggedIn(true)

    // Auto-resume pending search if exists
    if (pendingSearchParams) {
      router.push(`/search-results?${pendingSearchParams.toString()}`)
      setPendingSearchParams(null)
    }
  }

  const getCoursePlaceholder = () => {
    switch (activeVertical) {
      case "study-abroad":
        return "Search study abroad programs..."
      case "study-india":
        return "Search colleges, courses, cities..."
      case "study-online":
        return "Search online programs, certifications..."
      case "trainings":
        return "Search training programs, skills..."
      case "jobs":
        return "Search jobs, companies, positions..."
      default:
        return "Search..."
    }
  }

  const handleCounselorSelect = (type: "human" | "ai") => {
    if (type === "human") {
      setShowCounselorBooking(true)
    } else {
      setShowAiPopup(true)
    }
  }

  const getFilterOptions = () => {
    switch (activeVertical) {
      case "study-abroad":
        return {
          firstFilter: {
            label: "Country",
            options: [
              { value: "all", label: "All Countries" },
              { value: "United States of America", label: "United States of America" },
              { value: "United Kingdom", label: "United Kingdom" },
              { value: "Canada", label: "Canada" },
              { value: "Australia", label: "Australia" },
              { value: "Germany", label: "Germany" },
              { value: "Singapore", label: "Singapore" },
            ],
          },
          secondFilter: {
            label: "Level",
            options: [
              { value: "all", label: "All Levels" },
              { value: "MASTER", label: "MASTER" },
              { value: "POSTGRADUATE", label: "POSTGRADUATE" },
              { value: "PHD", label: "PHD" },
            ],
          },
          thirdFilter: {
            label: "Intake",
            options: [
              { value: "all", label: "All Intakes" },
              { value: "Jan", label: "January" },
              { value: "Feb", label: "February" },
              { value: "Mar", label: "March" },
              { value: "Apr", label: "April" },
              { value: "May", label: "May" },
              { value: "Jun", label: "June" },
              { value: "Jul", label: "July" },
              { value: "Aug", label: "August" },
              { value: "Sep", label: "September" },
              { value: "Oct", label: "October" },
              { value: "Nov", label: "November" },
              { value: "Dec", label: "December" },
            ],
          },
        }
      case "study-india":
        return {
          firstFilter: {
            label: "City",
            options: [
              { value: "all", label: "All Cities" },
              { value: "delhi", label: "Delhi" },
              { value: "mumbai", label: "Mumbai" },
              { value: "bangalore", label: "Bangalore" },
              { value: "chennai", label: "Chennai" },
              { value: "pune", label: "Pune" },
              { value: "hyderabad", label: "Hyderabad" },
            ],
          },
          secondFilter: {
            label: "Level",
            options: [
              { value: "all", label: "All Levels" },
              { value: "undergraduate", label: "Undergraduate" },
              { value: "diploma", label: "Diploma" },
            ],
          },
          thirdFilter: {
            label: "Year",
            options: [
              { value: "all", label: "All Years" },
              { value: "2024", label: "2024" },
              { value: "2025", label: "2025" },
              { value: "2026", label: "2026" },
            ],
          },
        }
      case "study-online":
        return {
          firstFilter: null,
          secondFilter: {
            label: "Level",
            options: [
              { value: "all", label: "All Levels" },
              { value: "certificate", label: "Certificate" },
              { value: "diploma", label: "Diploma" },
              { value: "degree", label: "Degree" },
              { value: "masters", label: "Masters" },
            ],
          },
          thirdFilter: {
            label: "Year",
            options: [
              { value: "all", label: "All Years" },
              { value: "2024", label: "2024" },
              { value: "2025", label: "2025" },
              { value: "2026", label: "2026" },
            ],
          },
        }
      case "trainings":
        return {
          firstFilter: {
            label: "Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "general", label: "General" },
              { value: "fast-track", label: "Fast Track" },
              { value: "long-term", label: "Long Term" },
              { value: "advance", label: "Advance & Fast Track" },
            ],
          },
          secondFilter: {
            label: "Start",
            options: [
              { value: "all", label: "All Start Times" },
              { value: "immediately", label: "Immediately" },
              { value: "3-months", label: "Within 3 Months" },
              { value: "6-months", label: "After 6 Months" },
            ],
          },
          thirdFilter: null,
        }
      case "jobs":
        return {
          firstFilter: {
            label: "Location",
            options: [
              { value: "all", label: "All Locations" },
              { value: "remote", label: "Remote" },
              { value: "delhi", label: "Delhi" },
              { value: "mumbai", label: "Mumbai" },
              { value: "bangalore", label: "Bangalore" },
            ],
          },
          secondFilter: {
            label: "Experience",
            options: [
              { value: "all", label: "All Experience" },
              { value: "fresher", label: "Fresher" },
              { value: "1-3", label: "1-3 Years" },
              { value: "3-5", label: "3-5 Years" },
              { value: "5+", label: "5+ Years" },
            ],
          },
          thirdFilter: {
            label: "Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "full-time", label: "Full Time" },
              { value: "part-time", label: "Part Time" },
              { value: "internship", label: "Internship" },
            ],
          },
        }
      default:
        return {
          firstFilter: null,
          secondFilter: null,
          thirdFilter: null,
        }
    }
  }

  const renderFilters = () => {
    const filterOptions = getFilterOptions()

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mt-4">
        <div
          className={`grid grid-cols-1 gap-3 ${filterOptions.firstFilter && filterOptions.secondFilter && filterOptions.thirdFilter
            ? "md:grid-cols-3"
            : (filterOptions.firstFilter && filterOptions.secondFilter) ||
              (filterOptions.secondFilter && filterOptions.thirdFilter)
              ? "md:grid-cols-2"
              : "md:grid-cols-1"
            }`}
        >
          {filterOptions.firstFilter && (
            <div>
              <label className="block text-sm font-medium text-white mb-1">{filterOptions.firstFilter.label}</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder={filterOptions.firstFilter.options[0].label} />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.firstFilter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterOptions.secondFilter && (
            <div>
              <label className="block text-sm font-medium text-white mb-1">{filterOptions.secondFilter.label}</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder={filterOptions.secondFilter.options[0].label} />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.secondFilter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterOptions.thirdFilter && (
            <div>
              <label className="block text-sm font-medium text-white mb-1">{filterOptions.thirdFilter.label}</label>
              <Select value={selectedIntake} onValueChange={setSelectedIntake}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder={filterOptions.thirdFilter.options[0].label} />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.thirdFilter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {isSearching && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white/95 rounded-2xl p-8 w-[90%] max-w-xl text-center shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <Loader className="w-12 h-12 animate-spin text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Searching universities & courses...</h3>
            <p className="text-gray-600 mb-4">This uses our intelligent search to find the best matches for you. Please wait a moment.</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-sm font-medium text-blue-700">Ranked Matches</div>
                <div className="text-xs text-gray-500">Prioritizing fit & ranking</div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="text-sm font-medium text-green-700">Scholarships</div>
                <div className="text-xs text-gray-500">Found if available</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <div className="text-sm font-medium text-yellow-700">Intakes</div>
                <div className="text-xs text-gray-500">Matching next available</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-pulse-slow bg-gradient-to-r from-white/20 to-blue-300/30"></div>
          <div className="absolute top-40 right-20 w-48 h-48 rounded-full blur-xl animate-pulse-slow bg-gradient-to-r from-blue-300/25 to-blue-400/25"></div>
          <div className="absolute bottom-20 left-1/4 w-48 h-48 rounded-full blur-xl animate-pulse-slow bg-gradient-to-r from-blue-300/25 to-blue-500/25"></div>
        </div>
        <div className="absolute inset-0 bg-white/2 backdrop-blur-sm"></div>

        <div className="relative z-10 min-h-screen flex flex-col justify-center">
          <div className="container mx-auto px-4 py-20">
            {/* Main Headline */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent drop-shadow-lg">
                  Find Your Perfect Path
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
                Discover amazing opportunities with AI-powered intelligent search
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {verticals.map((vertical) => {
                const Icon = vertical.icon
                const isActive = activeVertical === vertical.id
                return (
                  <button
                    key={vertical.id}
                    onClick={() => setActiveVertical(vertical.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${isActive
                      ? "bg-white text-blue-600 shadow-lg transform scale-105"
                      : "bg-white/20 text-white hover:bg-white/30 hover:scale-105"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {vertical.label}
                  </button>
                )
              })}
            </div>

            {/* Search Section */}
            <div className="max-w-5xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getCoursePlaceholder()}
                  className="w-full px-6 py-4 pr-32 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-md text-white placeholder-white/70 focus:outline-none focus:border-white/50 text-lg"
                />
                <button
                  onClick={async () => {
                    setIsSearching(true)
                    if (activeVertical === "study-online") {
                      const params = new URLSearchParams()
                      params.set("vertical", "study-online")
                      if (searchQuery.trim()) params.set("q", searchQuery.trim())
                      if (selectedLevel && selectedLevel !== "all") params.set("level", selectedLevel)
                      if (selectedIntake && selectedIntake !== "all") params.set("year", selectedIntake)
                      router.push(`/search-results?${params.toString()}`)
                    } else {
                      const params = new URLSearchParams()
                      params.set("vertical", activeVertical)
                      if (searchQuery.trim()) {
                        params.set("q", searchQuery.trim())
                      }

                      if (activeVertical === "study-abroad") {
                        if (selectedCountry && selectedCountry !== "all") params.set("country", selectedCountry)
                        if (selectedLevel && selectedLevel !== "all") params.set("level", selectedLevel)
                        if (selectedIntake && selectedIntake !== "all") params.set("intake", selectedIntake)

                        // For study-abroad, call backend search (requires auth)
                        try {
                          let hasUser = false
                          if (typeof window !== 'undefined') {
                            // Try encrypted storage first
                            const userData = getEncryptedUser()
                            hasUser = !!userData

                            // Fallback to unencrypted
                            if (!hasUser) {
                              const userString = localStorage.getItem('meritcap_user') || sessionStorage.getItem('meritcap_user')
                              hasUser = !!userString
                            }
                          }

                          const token = (typeof window !== 'undefined') ? (localStorage.getItem('meritcap_access_token') || sessionStorage.getItem('meritcap_access_token')) : null
                          if (!hasUser && !token) {
                            // Not logged in -> store search params and open quick login modal
                            const searchParams = new URLSearchParams()
                            searchParams.set("vertical", activeVertical)
                            if (searchQuery.trim()) searchParams.set("q", searchQuery.trim())
                            if (selectedCountry && selectedCountry !== "all") searchParams.set("country", selectedCountry)
                            if (selectedLevel && selectedLevel !== "all") searchParams.set("level", selectedLevel)
                            if (selectedIntake && selectedIntake !== "all") searchParams.set("intake", selectedIntake)
                            
                            setPendingSearchParams(searchParams)
                            setShowQuickLoginModal(true)
                            setIsSearching(false)
                            return
                          }

                          // Build payload according to API contract
                          const mapLevelToApi = (lvl: string) => {
                            if (!lvl) return null
                            const v = lvl.toLowerCase()
                            if (v === "undergraduate" || v === "ug" || v === "bachelor") return "UNDERGRADUATE"
                            if (v === "postgraduate" || v === "pg" || v === "master" || v === "post grad") return "MASTER"
                            if (v === "phd" || v === "doctorate") return "PHD"
                            return null
                          }

                          const mapCountryToApi = (c: string) => {
                            if (!c) return null
                            const v = c.toLowerCase()
                            // Map known dropdown values to backend-expected full country names
                            if (v === "usa" || v === "us" || v === "united states" || v === "united states of america")
                              return "UNITED STATES OF AMERICA"
                            if (v === "uk" || v === "united kingdom" || v === "great britain") return "UNITED KINGDOM"
                            if (v === "canada") return "CANADA"
                            if (v === "australia") return "AUSTRALIA"
                            if (v === "germany") return "GERMANY"
                            if (v === "singapore") return "SINGAPORE"
                            // Fallback: return uppercased label
                            return c.toUpperCase()
                          }

                          const mapIntakeToMonths = (intake: string) => {
                            if (!intake) return []
                            const raw = intake.toString().trim()
                            // If value is 'all' or similar, return empty to not filter
                            if (raw.toLowerCase() === 'all') return []

                            // Normalize common variants to 3-letter month codes
                            const m = raw.slice(0, 3).toUpperCase()
                            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
                            if (months.includes(m)) return [m]

                            // Handle full words like 'January', 'February'
                            const monthNames: Record<string, string> = {
                              january: 'JAN', february: 'FEB', march: 'MAR', april: 'APR', may: 'MAY', june: 'JUN',
                              july: 'JUL', august: 'AUG', september: 'SEP', october: 'OCT', november: 'NOV', december: 'DEC'
                            }
                            const lower = raw.toLowerCase()
                            for (const [k, v] of Object.entries(monthNames)) {
                              if (lower.startsWith(k) || lower.includes(k)) return [v]
                            }

                            // Common season names
                            if (lower.includes('fall') || lower.includes('autumn')) return ['SEP']
                            if (lower.includes('spring')) return ['JAN']
                            if (lower.includes('summer')) return ['MAY']

                            // fallback: try to extract any 3-letter month token
                            const match = raw.match(/([A-Za-z]{3})/)
                            if (match) {
                              const code = match[1].toUpperCase()
                              if (months.includes(code)) return [code]
                            }

                            return []
                          }

                          const graduationLevels = selectedLevel && selectedLevel !== "all" ? [mapLevelToApi(selectedLevel)].filter(Boolean) : []
                          const countries = selectedCountry && selectedCountry !== "all" ? [mapCountryToApi(selectedCountry)].filter(Boolean) : []
                          const intakeMonths = selectedIntake && selectedIntake !== "all" ? mapIntakeToMonths(selectedIntake) : []

                          const payload = {
                            pagination: { page: 1, size: 5 },
                            filters: {
                              courses: [],
                              departments: [],
                              graduationLevels,
                              countries,
                              duration: { minMonths: 0, maxMonths: 48 },
                              intakeMonths,
                            },
                            search: { term: searchQuery || "" },
                          }

                          // Lazy import the API client to avoid SSR issues
                          const { searchCollegeCourses } = await import('@/lib/api/client')
                          const res = await searchCollegeCourses(payload)

                          if (res && res.response && Array.isArray(res.response.data)) {
                            try {
                              localStorage.setItem('meritcap_search_results', JSON.stringify(res.response))
                            } catch (e) {
                              // fallback: ignore storage errors
                            }
                          }

                          // navigate to search results page with params
                          router.push(`/search-results?${params.toString()}`)
                        } catch (err) {
                          // on error, redirect to login as a safe fallback
                          router.push('/login')
                        } finally {
                          setIsSearching(false)
                        }
                        return
                      } else if (activeVertical === "study-india") {
                        if (selectedCountry && selectedCountry !== "all") params.set("city", selectedCountry)
                        if (selectedLevel && selectedLevel !== "all") params.set("level", selectedLevel)
                        if (selectedIntake && selectedIntake !== "all") params.set("year", selectedIntake)
                      } else if (activeVertical === "trainings") {
                        if (selectedCountry && selectedCountry !== "all") params.set("type", selectedCountry)
                        if (selectedLevel && selectedLevel !== "all") params.set("start", selectedLevel)
                      }

                      router.push(`/search-results?${params.toString()}`)
                      setIsSearching(false)
                    }
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors duration-300 flex items-center gap-2 text-sm font-medium"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
              {renderFilters()}
            </div>
          </div>
        </div>
      </div>

      {/* Limited Time Offer banner */}
      <div
        className="bg-gradient-to-r from-blue-500 to-blue-600 py-4 cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg"
        onClick={() => router.push("/pricing")}
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-base font-semibold text-white hover:text-blue-100 transition-colors duration-300">
            🎉 Limited Time Offer: 70% OFF on Premium Subscription - Unlock Advanced Filters & AI Counseling! 🎉
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight tracking-tight animate-fade-in-up">
              <span className="inline-block animate-text-reveal">HOW IT WORKS</span>
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              Your journey to success in 4 simple steps
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto gap-4">
            {/* Step 1 */}
            <div className="text-center group flex-1">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 group-hover:bg-white/25 transition-all duration-300 shadow-xl">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Search & Shortlist</h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Discover universities using our AI-powered search
                </p>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="hidden md:block text-white/60">
              <ChevronRight className="w-8 h-8" />
            </div>

            {/* Step 2 */}
            <div className="text-center group flex-1">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 group-hover:bg-white/25 transition-all duration-300 shadow-xl">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Expert Guidance</h3>
                <p className="text-white/80 text-sm leading-relaxed">Get personalized counseling from experts</p>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="hidden md:block text-white/60">
              <ChevronRight className="w-8 h-8" />
            </div>

            {/* Step 3 */}
            <div className="text-center group flex-1">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 group-hover:bg-white/25 transition-all duration-300 shadow-xl">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Apply & Track</h3>
                <p className="text-white/80 text-sm leading-relaxed">Submit applications and track progress</p>
              </div>
            </div>

            {/* Arrow 3 */}
            <div className="hidden md:block text-white/60">
              <ChevronRight className="w-8 h-8" />
            </div>

            {/* Step 4 */}
            <div className="text-center group flex-1">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 group-hover:bg-white/25 transition-all duration-300 shadow-xl">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-700 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Success!</h3>
                <p className="text-white/80 text-sm leading-relaxed">Start your educational journey</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book Your Counselling Session */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              Book Your Counselling Session
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Choose between Human Expert or AI-Powered guidance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Human Counselor */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Human Counselor</h3>
              <p className="text-white/80 mb-6 leading-relaxed">
                Get personalized guidance from our experienced education counselors
              </p>
              <div className="text-sm text-white/70 mb-6 space-y-1">
                <p>• 1-on-1 session • Expert guidance • University selection • Application help</p>
              </div>
              <button
                onClick={() => {
                  window.open("https://calendly.com/meritcap-counseling/30min", "_blank")
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium transition-colors duration-300 w-full"
              >
                📞 Book Human Counselor
              </button>
            </div>

            {/* AI Counselor */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Counselor</h3>
              <p className="text-white/80 mb-6 leading-relaxed">
                Get instant, intelligent guidance powered by advanced AI technology
              </p>
              <div className="text-sm text-white/70 mb-6 space-y-1">
                <p>• 24/7 availability • Data-driven • Quick matching • Free consultation</p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(true)
                  setTimeout(() => {
                    const welcomeMessage =
                      "Hi! Welcome to Advanced AI Career Guidance. 🎓\n\nImportant: You've skipped the Human Counselor option. As an AI, I recommend human counselors are often best - they speak from experience and emotions, while I work with data. However, I'm here to help!\n\nPlease ask your query and I'll assist you with career guidance. 🤖"

                    // Add the welcome message to chatbot
                    const chatbotComponent = document.querySelector("[data-chatbot]") as any
                    if (chatbotComponent && chatbotComponent.addMessage) {
                      chatbotComponent.addMessage(welcomeMessage, "bot")
                    }
                  }, 500)
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-full font-medium transition-all duration-300 w-full"
              >
                🤖 Book AI Counselor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Indian Collaborations */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              Top Indian Collaborations
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Partnered with India's premier institutions
            </p>
          </div>

          <div className="relative overflow-hidden">
            <div className="flex animate-scroll space-x-8">
              {/* First set of logos */}
              {indianCollaborations.map((collab, index) => (
                <div
                  key={index}
                  onClick={() => router.push(`/study/india/${collab.slug}`)}
                  className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer hover:scale-105 min-w-[200px]"
                >
                  <img
                    src={collab.logo || "/placeholder.svg"}
                    alt={collab.name}
                    className="w-16 h-16 mx-auto mb-3 rounded-lg object-contain"
                  />
                  <p className="text-white text-sm font-medium">{collab.name}</p>
                </div>
              ))}
              {/* Duplicate set for seamless scrolling */}
              {indianCollaborations.map((collab, index) => (
                <div
                  key={`duplicate-${index}`}
                  onClick={() => router.push(`/study/india/${collab.slug}`)}
                  className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer hover:scale-105 min-w-[200px]"
                >
                  <img
                    src={collab.logo || "/placeholder.svg"}
                    alt={collab.name}
                    className="w-16 h-16 mx-auto mb-3 rounded-lg object-contain"
                  />
                  <p className="text-white text-sm font-medium">{collab.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              Recent Events
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              Stay updated with our latest events and activities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/events/global-university-fair-2024" className="block">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors duration-300">
                <img
                  src="/university-fair-students.png"
                  alt="Global University Fair"
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h3 className="text-lg font-bold text-white mb-2">Global University Fair 2024</h3>
                <p className="text-white/80 text-sm mb-3">Meet representatives from 50+ universities</p>
                <div className="flex items-center text-white/70 text-xs">
                  <span>📅 December 15, 2024</span>
                </div>
              </div>
            </Link>

            <Link href="/events/ielts-preparation-workshop" className="block">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors duration-300">
                <img
                  src="/ielts-classroom-study.png"
                  alt="IELTS Workshop"
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h3 className="text-lg font-bold text-white mb-2">IELTS Preparation Workshop</h3>
                <p className="text-white/80 text-sm mb-3">Free workshop on IELTS strategies</p>
                <div className="flex items-center text-white/70 text-xs">
                  <span>📅 December 20, 2024</span>
                </div>
              </div>
            </Link>

            <Link href="/events/scholarship-guidance-seminar" className="block">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors duration-300">
                <img
                  src="/scholarship-seminar.png"
                  alt="Scholarship Seminar"
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h3 className="text-lg font-bold text-white mb-2">Scholarship Guidance Seminar</h3>
                <p className="text-white/80 text-sm mb-3">Learn about scholarship opportunities</p>
                <div className="flex items-center text-white/70 text-xs">
                  <span>📅 December 25, 2024</span>
                </div>
              </div>
            </Link>

            <Link href="/events/study-in-canada-session" className="block">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors duration-300">
                <img
                  src="/canada-flag-campus-students.png"
                  alt="Study in Canada"
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h3 className="text-lg font-bold text-white mb-2">Study in Canada Session</h3>
                <p className="text-white/80 text-sm mb-3">Canadian universities and visa process</p>
                <div className="flex items-center text-white/70 text-xs">
                  <span>📅 January 5, 2025</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/events"
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full font-medium transition-colors duration-300 border border-white/30 inline-block"
            >
              See Our Recent Events Here →
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              Top International Collaborations
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Partnered with world's leading universities
            </p>
          </div>

          <div className="relative overflow-hidden">
            <div className="flex animate-scroll space-x-8">
              {[...internationalCollaborations, ...internationalCollaborations].map((collab, index) => (
                <div
                  key={index}
                  onClick={() =>
                    router.push(`/universities/${collab.slug || collab.name.toLowerCase().replace(/\s+/g, "-")}`)
                  }
                  className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer hover:scale-105 min-w-[180px]"
                >
                  <img
                    src={collab.logo || "/placeholder.svg"}
                    alt={collab.name}
                    className="w-16 h-16 mx-auto mb-4 rounded-lg object-contain"
                  />
                  <p className="text-white text-sm font-medium">{collab.name}</p>
                </div>
              ))}
            </div>
          </div>

          <style jsx>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .animate-scroll {
              animation: scroll 30s linear infinite;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
          `}</style>
        </div>
      </div>

      <div className="py-16 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-4 left-4 w-8 h-8 bg-white/30 rounded-full blur-sm"></div>
          <div className="absolute top-8 right-8 w-6 h-6 bg-blue-200/40 rounded-full blur-sm"></div>
          <div className="absolute bottom-4 left-1/3 w-4 h-4 bg-indigo-200/50 rounded-full blur-sm"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight tracking-tight">
              Personalized Skills & Career Insights
            </h2>
            <p className="text-blue-100 text-base max-w-2xl mx-auto">
              Take our psychometric test to discover your ideal career path
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
              {/* Three main features in a row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3 border border-white/20 bg-blue-600">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">Personality Analysis</h4>
                  <p className="text-sm text-blue-100">
                    Understand your strengths, traits & work style → so you find careers that fit YOU.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3 border border-white/20">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">Skills Assessment</h4>
                  <p className="text-sm text-blue-100">
                    Evaluate technical & soft skills → track your growth and readiness over time.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3 border border-white/20">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">Career Matching</h4>
                  <p className="text-sm text-blue-100">
                    AI-powered recommendations based on your results → know where to focus.
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-8 py-6 border-t border-white/20">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4 text-blue-200 mr-2" />
                    <span className="text-xl font-bold text-white">15-20</span>
                  </div>
                  <p className="text-sm text-blue-100">Minutes Duration</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="w-4 h-4 text-green-300 mr-2" />
                    <span className="text-xl font-bold text-white">98%</span>
                  </div>
                  <p className="text-sm text-blue-100">Scientifically Validated</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4 text-yellow-300 mr-2" />
                    <span className="text-xl font-bold text-white">Instant</span>
                  </div>
                  <p className="text-sm text-blue-100">Results & Analysis</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="text-center space-y-3">
                <button className="bg-gradient-to-r from-white/20 to-white/30 hover:from-white/30 hover:to-white/40 backdrop-blur-sm text-white px-10 py-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/30 bg-violet-700">
                  <span className="flex items-center justify-center">
                    <Brain className="w-5 h-5 mr-3" />
                    Start My Career Assessment →
                  </span>
                </button>
                <div>
                  <button
                    onClick={() => setShowBenefitsModal(true)}
                    className="text-blue-100 hover:text-white text-sm font-medium underline underline-offset-2 hover:underline-offset-4 transition-all duration-200"
                  >
                    Why take this test?
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showBenefitsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-200 bg-indigo-600 text-center">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Why Take Our Career Assessment?</h3>
                  <button
                    onClick={() => setShowBenefitsModal(false)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <h4 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    Key Benefits
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">
                        Discover careers that match your personality and interests
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">Identify your strengths and areas for improvement</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">Get personalized study and career recommendations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">Make informed decisions about your future</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h4 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">?</span>
                    </div>
                    Frequently Asked Questions
                  </h4>
                  <div className="space-y-5">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-2">How accurate is the assessment?</h5>
                      <p className="text-gray-600 leading-relaxed">
                        Our assessment is 98% scientifically validated and based on proven psychological frameworks used
                        by career counselors worldwide.
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-2">How long does it take?</h5>
                      <p className="text-gray-600 leading-relaxed">
                        The complete assessment takes 15-20 minutes, and you'll get instant results with detailed
                        analysis.
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-2">Is my data secure?</h5>
                      <p className="text-gray-600 leading-relaxed">
                        Yes, all your responses are encrypted and stored securely. We never share your personal data
                        with third parties.
                      </p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-blue-900 mb-2">Can I retake the assessment?</h5>
                      <p className="text-gray-600 leading-relaxed">
                        Yes, you can retake the assessment anytime to track your growth and changing interests.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Our Banking Partners */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              Our Banking Partners
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Trusted by leading banks for education loans
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {bankPartners.map((bank, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20 hover:bg-white/20 transition-colors duration-300"
              >
                <img
                  src={bank.logo || "/placeholder.svg"}
                  alt={bank.name}
                  className="w-16 h-16 mx-auto mb-2 rounded-lg"
                />
                <p className="text-white text-xs font-medium">{bank.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Online Study Tieups */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Online Study Tieups</h2>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
              Partner universities offering accredited UG and PG degree programs online
            </p>
          </div>

          <div className="relative">
            {/* Left scroll button */}
            <button
              onClick={() => {
                const container = document.getElementById("online-tieups-container")
                if (container) {
                  container.scrollBy({ left: -720, behavior: "smooth" })
                }
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 border border-white/30 transition-all duration-300"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right scroll button */}
            <button
              onClick={() => {
                const container = document.getElementById("online-tieups-container")
                if (container) {
                  container.scrollBy({ left: 720, behavior: "smooth" })
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 border border-white/30 transition-all duration-300"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              id="online-tieups-container"
              className="flex gap-6 overflow-x-auto scrollbar-hide text-left px-2 md:px-7 w-full max-w-[864px] mx-auto"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                scrollSnapType: "x mandatory",
                overflowX: "scroll",
              }}
            >
              {onlineCourseTieups.map((university, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center group cursor-pointer flex-shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                  onClick={() => router.push(`/universities/${university.slug}`)}
                >
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 group-hover:border-white/60 group-hover:bg-white/30 transition-all duration-300 mb-3">
                    <img
                      src={university.logo || "/placeholder.svg"}
                      alt={university.name}
                      className="w-14 h-14 object-contain rounded-full"
                    />
                  </div>
                  <p className="text-white text-sm font-medium text-center leading-tight group-hover:text-white/90 transition-colors duration-300 max-w-28">
                    {university.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              Certifications and Accreditations
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Recognized for excellence in education consulting
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {awards.map((award, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20 hover:bg-white/20 transition-colors duration-300"
              >
                <img
                  src={award.logo || "/placeholder.svg"}
                  alt={award.name}
                  className="w-16 h-16 mx-auto mb-2 rounded-lg"
                />
                <p className="text-white text-sm font-medium">{award.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              Awards and Recognitions
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Honored for our commitment to student success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {awardsRecognitions.slice(0, showAllAwards ? awardsRecognitions.length : 4).map((award, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <img
                  src={award.logo || "/placeholder.svg?height=200&width=200&query=education award certificate"}
                  alt={award.name}
                  className="w-48 h-48 mx-auto mb-4 rounded-lg object-contain"
                />
                <p className="text-white text-base font-medium leading-relaxed">{award.name}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setShowAllAwards(!showAllAwards)}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full font-medium transition-colors duration-300 border border-white/30"
            >
              {showAllAwards ? "Show Less Awards" : "View All Awards"} →
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              Featured In Media
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Recognized by leading media outlets
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {mediaFeatures.map((media, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20 hover:bg-white/20 transition-colors duration-300"
              >
                <img
                  src={media.logo || "/placeholder.svg"}
                  alt={media.name}
                  className="w-16 h-16 mx-auto mb-2 rounded-lg"
                />
                <p className="text-white text-sm font-medium">{media.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              SUCCESS STORIES
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mb-6"></div>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Real journeys, real success, real inspiration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {successStories.map((story, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
              >
                <div className="relative mb-4">
                  <img
                    src={
                      story.image || `/placeholder.svg?height=192&width=300&query=student success story ${index + 1}`
                    }
                    alt={story.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {index === 0
                        ? "Test Prep"
                        : index === 1
                          ? "Career Change"
                          : index === 2
                            ? "Scholarship"
                            : "Parent Story"}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-200 transition-colors duration-300">
                  {story.title}
                </h3>
                <p className="text-white/80 text-sm mb-4 line-clamp-3">{story.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{story.name}</p>
                    <p className="text-white/60 text-xs">{story.readTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full font-medium transition-colors duration-300 border border-white/30">
              View All Stories →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Login Modal */}
      <QuickLoginModal 
        isOpen={showQuickLoginModal}
        onClose={() => setShowQuickLoginModal(false)}
        onLoginComplete={handleQuickLoginComplete}
        pendingSearchParams={pendingSearchParams?.toString()}
      />
    </>
  )
}
