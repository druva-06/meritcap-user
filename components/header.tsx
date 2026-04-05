"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  GraduationCap,
  Globe,
  BookOpen,
  CreditCard,
  Users,
  Trophy,
  ChevronRight,
  MapPin,
  Building,
  Monitor,
  FileText,
  Calculator,
  Languages,
  Mic,
  BrainCircuit,
  Plane,
  Home,
  MessageSquare,
  Calendar,
  Briefcase,
  DollarSign,
  MoreHorizontal,
  Bell,
  Settings,
  Key,
  UserCircle,
} from "lucide-react"
import { getEncryptedUser } from "@/lib/encryption"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [profilePicture, setProfilePicture] = useState("")
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const router = useRouter()
  const profileRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const checkAuthState = () => {
      try {
        // Try to get encrypted user data first
        let user = getEncryptedUser()

        // Fallback to unencrypted data
        if (!user) {
          const userData = localStorage.getItem("meritcap_user") || sessionStorage.getItem("meritcap_user")
          if (userData) {
            user = JSON.parse(userData)
          }
        }

        if (user) {
          setIsLoggedIn(true)
          setUserName(user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User")
          setProfilePicture(user.profile_picture || "")
          return
        }

        // fallback: check for access token presence
        const token = localStorage.getItem("meritcap_access_token") || sessionStorage.getItem("meritcap_access_token")
        if (token) {
          setIsLoggedIn(true)
          setUserName("User")
          setProfilePicture("")
          return
        }

        setIsLoggedIn(false)
        setUserName("")
        setProfilePicture("")
      } catch (e) {
        setIsLoggedIn(false)
        setUserName("")
        setProfilePicture("")
      }
    }

    // Check initial state
    checkAuthState()

    // Listen for storage changes (when user logs in from other components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "meritcap_user") {
        checkAuthState()
      }
    }

    // Listen for custom events (for immediate updates)
    const handleAuthChange = () => {
      checkAuthState()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("authStateChanged", handleAuthChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("authStateChanged", handleAuthChange)
    }
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!profileRef.current) return
      const target = e.target as Node
      if (!profileRef.current.contains(target)) {
        setIsProfileDropdownOpen(false)
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isProfileDropdownOpen])

  const handleLogout = () => {
    try {
      // Remove encrypted data
      const { removeEncryptedUser } = require("@/lib/encryption")
      removeEncryptedUser()

      // Remove unencrypted data
      localStorage.removeItem("meritcap_user")
      localStorage.removeItem("meritcap_documents")
      localStorage.removeItem("meritcap_applications")
      localStorage.removeItem("meritcap_tasks")
      sessionStorage.removeItem("meritcap_user")
    } catch (e) { }
    // clear tokens
    try {
      localStorage.removeItem("meritcap_access_token")
      localStorage.removeItem("meritcap_refresh_token")
      sessionStorage.removeItem("meritcap_access_token")
      sessionStorage.removeItem("meritcap_refresh_token")
    } catch (e) { }

    // notify other components
    try {
      window.dispatchEvent(new Event("authStateChanged"))
    } catch (e) { }

    setIsLoggedIn(false)
    setUserName("")
    router.push("/")
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-xl border-b border-gray-100/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Premium Logo - Always redirect to homepage */}
          <Link href="/" className="flex items-center space-x-4 group py-2">
            <div className="relative">
              <div className="text-4xl group-hover:scale-110 transition-all duration-300 drop-shadow-sm">🎓</div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm"></div>
            </div>
            <div className="flex flex-col">
              <div className="text-2xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-800 bg-clip-text text-transparent tracking-tight">
                MeritCap
              </div>
              <div className="text-xs text-gray-500 font-medium tracking-wider -mt-1">EDUCATION PLATFORM</div>
            </div>
          </Link>

          {/* Premium Desktop Navigation - Full Menu for All Users */}
          <nav className="hidden lg:flex items-center space-x-2">
            {/* Study Dropdown - Compact Version */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-slate-900 transition-all duration-300 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 font-semibold text-sm group">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Study</span>
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-all duration-300" />
              </button>
              <div className="absolute top-full left-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 border border-gray-100/50 z-50">
                <div className="p-3">
                  {/* Study Abroad */}
                  <div className="relative group/abroad">
                    <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Study Abroad</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                    {/* Study Abroad Submenu */}
                    <div className="absolute left-full top-0 ml-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl opacity-0 invisible group-hover/abroad:opacity-100 group-hover/abroad:visible transition-all duration-300 border border-gray-100/50">
                      <div className="p-2">
                        <div className="grid grid-cols-1 gap-1">
                          {[
                            { href: "/study/abroad/usa", name: "USA" },
                            { href: "/study/abroad/uk", name: "UK" },
                            { href: "/study/abroad/canada", name: "Canada" },
                            { href: "/study/abroad/australia", name: "Australia" },
                            { href: "/study/abroad/germany", name: "Germany" },
                            { href: "/study/abroad/france", name: "France" },
                            { href: "/study/abroad/dubai", name: "Dubai" },
                            { href: "/study/abroad/ireland", name: "Ireland" },
                            { href: "/study/abroad/singapore", name: "Singapore" },
                            { href: "/study/abroad/newzealand", name: "New Zealand" },
                          ].map((country) => (
                            <Link
                              key={country.href}
                              href={country.href}
                              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            >
                              <MapPin className="w-3 h-3 text-blue-500" />
                              <span className="font-medium">{country.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Study in India */}
                  <div className="relative group/india mt-1">
                    <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Study in India</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                    {/* Study in India Submenu */}
                    <div className="absolute left-full top-0 ml-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl opacity-0 invisible group-hover/india:opacity-100 group-hover/india:visible transition-all duration-300 border border-gray-100/50">
                      <div className="p-2">
                        <div className="grid grid-cols-1 gap-1">
                          {/* Courses Section */}
                          <div className="relative group/courses">
                            <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer">
                              <div className="flex items-center space-x-2">
                                <GraduationCap className="w-3 h-3 text-orange-500" />
                                <span className="font-medium">Courses</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            </div>
                            {/* Courses Submenu */}
                            <div className="absolute left-full top-0 ml-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl opacity-0 invisible group-hover/courses:opacity-100 group-hover/courses:visible transition-all duration-300 border border-gray-100/50">
                              <div className="p-2">
                                <div className="grid grid-cols-1 gap-1">
                                  <Link
                                    href="/study/india/courses/mba-management"
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                  >
                                    <Building className="w-3 h-3 text-orange-500" />
                                    <span className="font-medium">MBA & Management</span>
                                  </Link>
                                  <Link
                                    href="/study/india/courses/engineering"
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                  >
                                    <Building className="w-3 h-3 text-orange-500" />
                                    <span className="font-medium">Engineering</span>
                                  </Link>
                                  <Link
                                    href="/study/india/courses/medicine"
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                  >
                                    <Building className="w-3 h-3 text-orange-500" />
                                    <span className="font-medium">Medicine & Healthcare</span>
                                  </Link>
                                  <Link
                                    href="/study/india/courses/law"
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                  >
                                    <Building className="w-3 h-3 text-orange-500" />
                                    <span className="font-medium">Law</span>
                                  </Link>
                                  <Link
                                    href="/study/india/courses/design"
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                  >
                                    <Building className="w-3 h-3 text-orange-500" />
                                    <span className="font-medium">Design & Arts</span>
                                  </Link>
                                  <Link
                                    href="/study/india/courses/computer-science"
                                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                  >
                                    <Building className="w-3 h-3 text-orange-500" />
                                    <span className="font-medium">Computer Science</span>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Cities Section */}
                          <div className="relative group/cities">
                            <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200 cursor-pointer">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-3 h-3 text-orange-500" />
                                <span className="font-medium">Cities</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            </div>
                            {/* Cities Submenu */}
                            <div className="absolute left-full top-0 ml-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl opacity-0 invisible group-hover/cities:opacity-100 group-hover/cities:visible transition-all duration-300 border border-gray-100/50">
                              <div className="p-2">
                                <div className="grid grid-cols-1 gap-1">
                                  {[
                                    { href: "/study/india/delhi", name: "Delhi NCR" },
                                    { href: "/study/india/mumbai", name: "Mumbai" },
                                    { href: "/study/india/bangalore", name: "Bangalore" },
                                    { href: "/study/india/hyderabad", name: "Hyderabad" },
                                    { href: "/study/india/pune", name: "Pune" },
                                    { href: "/study/india/chennai", name: "Chennai" },
                                    { href: "/study/india/kolkata", name: "Kolkata" },
                                    { href: "/study/india/ahmedabad", name: "Ahmedabad" },
                                  ].map((city) => (
                                    <Link
                                      key={city.href}
                                      href={city.href}
                                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                    >
                                      <MapPin className="w-3 h-3 text-orange-500" />
                                      <span className="font-medium">{city.name}</span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Study Online */}
                  <div className="relative group/online mt-1">
                    <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-green-50 rounded-lg transition-all duration-200 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Study Online</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                    {/* Study Online Submenu */}
                    <div className="absolute left-full top-0 ml-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl opacity-0 invisible group-hover/online:opacity-100 group-hover/online:visible transition-all duration-300 border border-gray-100/50">
                      <div className="p-2">
                        <div className="grid grid-cols-1 gap-1">
                          <Link
                            href="/study/online/ug"
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                          >
                            <GraduationCap className="w-3 h-3 text-green-500" />
                            <span className="font-medium">UG Programs</span>
                          </Link>
                          <Link
                            href="/study/online/pg"
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                          >
                            <BookOpen className="w-3 h-3 text-green-500" />
                            <span className="font-medium">PG Programs</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Prep Dropdown - Simplified */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-slate-900 transition-all duration-300 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 font-semibold text-sm">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Test Prep</span>
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-all duration-300" />
              </button>
              <div className="absolute top-full left-0 mt-3 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 border border-gray-100/50">
                <div className="p-2">
                  <div className="space-y-1">
                    {[
                      { href: "/test-prep/ielts", name: "IELTS", icon: FileText },
                      { href: "/test-prep/toefl", name: "TOEFL", icon: FileText },
                      { href: "/test-prep/gre", name: "GRE", icon: BookOpen },
                      { href: "/test-prep/gmat", name: "GMAT", icon: BookOpen },
                      { href: "/test-prep/cat", name: "CAT", icon: Calculator },
                      { href: "/test-prep/mat", name: "MAT", icon: Calculator },
                      { href: "/test-prep/french", name: "French", icon: Languages },
                      { href: "/test-prep/german", name: "German", icon: Languages },
                      { href: "/test-prep/spoken-english", name: "Spoken English", icon: Mic },
                    ].map((test) => (
                      <Link
                        key={test.href}
                        href={test.href}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                      >
                        <test.icon className="w-3 h-3 text-purple-500" />
                        <span className="font-medium">{test.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Community Link - Premium */}
            <Link
              href="/student-community"
              className="flex items-center space-x-2 text-gray-700 hover:text-slate-900 transition-all duration-300 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 font-semibold text-sm"
            >
              <Users className="w-4 h-4 text-pink-600" />
              <span>Community</span>
            </Link>

            {/* Success Stories Link - Premium */}
            <Link
              href="/stories"
              className="flex items-center space-x-2 text-gray-700 hover:text-slate-900 transition-all duration-300 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 font-semibold text-sm"
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Stories</span>
            </Link>

            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-slate-900 transition-all duration-300 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 font-semibold text-sm">
                <MoreHorizontal className="w-4 h-4 text-slate-600" />
                <span>More</span>
                <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-all duration-300" />
              </button>

              {/* More Mega Dropdown */}
              <div className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] max-w-[800px] bg-white/95 backdrop-blur-xl rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 border border-gray-100/50 z-50">
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-6">
                    {/* Career Services Column */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Career Services</h3>
                      </div>
                      <div className="space-y-2">
                        <Link
                          href="/services/career-guidance"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                          <BrainCircuit className="w-3 h-3 text-blue-500" />
                          <span className="font-medium">Career Guidance</span>
                        </Link>
                        <Link
                          href="/services/psychometric-test"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                          <BrainCircuit className="w-3 h-3 text-blue-500" />
                          <span className="font-medium">Psychometric Test</span>
                        </Link>
                        <Link
                          href="/services/mock-interviews"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                          <MessageSquare className="w-3 h-3 text-blue-500" />
                          <span className="font-medium">Mock Interviews</span>
                        </Link>
                        <Link
                          href="/services/interview-preparation"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                          <FileText className="w-3 h-3 text-blue-500" />
                          <span className="font-medium">Interview Preparation</span>
                        </Link>
                      </div>
                    </div>

                    {/* University Support Column */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                          <Building className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">University Support</h3>
                      </div>
                      <div className="space-y-2">
                        <Link
                          href="/services/university-selection"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                        >
                          <Building className="w-3 h-3 text-green-500" />
                          <span className="font-medium">University Selection</span>
                        </Link>
                        <Link
                          href="/services/campus-visits"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                        >
                          <MapPin className="w-3 h-3 text-green-500" />
                          <span className="font-medium">Campus Visit Facility</span>
                        </Link>
                        <Link
                          href="/services/university-onspots"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                        >
                          <Calendar className="w-3 h-3 text-green-500" />
                          <span className="font-medium">University OnSpots</span>
                        </Link>
                        <Link
                          href="/services/education-fairs"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                        >
                          <Users className="w-3 h-3 text-green-500" />
                          <span className="font-medium">Education Fairs</span>
                        </Link>
                      </div>
                    </div>

                    {/* Student Services Column */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <Users className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wide">Student Services</h3>
                      </div>
                      <div className="space-y-2">
                        <Link
                          href="/services/accommodation-support"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                        >
                          <Home className="w-3 h-3 text-purple-500" />
                          <span className="font-medium">Accommodation Support</span>
                        </Link>
                        <Link
                          href="/services/flight-booking"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                        >
                          <Plane className="w-3 h-3 text-purple-500" />
                          <span className="font-medium">Flight Booking</span>
                        </Link>
                        <Link
                          href="/services/visa-assistance"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                        >
                          <FileText className="w-3 h-3 text-purple-500" />
                          <span className="font-medium">Visa Assistance</span>
                        </Link>
                        <Link
                          href="/services/pre-departure"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                        >
                          <Briefcase className="w-3 h-3 text-purple-500" />
                          <span className="font-medium">Pre-Departure Guidance</span>
                        </Link>
                      </div>
                    </div>

                    {/* Financial Services Column */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wide">
                          Financial Services
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <Link
                          href="/funds/education-loan"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                        >
                          <CreditCard className="w-3 h-3 text-yellow-500" />
                          <span className="font-medium">Education Loans</span>
                        </Link>
                        <Link
                          href="/funds/forex-cards"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                        >
                          <CreditCard className="w-3 h-3 text-yellow-500" />
                          <span className="font-medium">Forex Services</span>
                        </Link>
                        <Link
                          href="/funds/credit-cards"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                        >
                          <CreditCard className="w-3 h-3 text-yellow-500" />
                          <span className="font-medium">Credit Cards</span>
                        </Link>
                        <Link
                          href="/services/scholarship-assistance"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                        >
                          <Trophy className="w-3 h-3 text-yellow-500" />
                          <span className="font-medium">Scholarship Assistance</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Bottom CTA */}
                  <div className="mt-6 pt-4 border-t border-gray-200/50">
                    <div className="text-center">
                      <Link
                        href="/services"
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-lg hover:from-slate-700 hover:to-gray-800 transition-all duration-200 font-medium text-sm"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                        <span>View All Services</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Premium Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-slate-900 transition-all duration-300 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 font-semibold text-sm">
                    <User className="w-4 h-4 text-slate-600" />
                    <span>Login</span>
                    <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-all duration-300" />
                  </button>
                  <div className="absolute top-full right-0 mt-3 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 border border-gray-100/50 z-50">
                    <div className="p-2">
                      <div className="space-y-1">
                        {[
                          { href: "/login", name: "Student Login", icon: User },
                          { href: "/admin/login", name: "Admin Login", icon: User },
                          { href: "/agent/login", name: "Agent Login", icon: User },
                          { href: "/counselor/login", name: "Counselor Login", icon: User },
                          { href: "/college/login", name: "College Login", icon: User },
                        ].map((login) => (
                          <Link
                            key={login.href}
                            href={login.href}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                          >
                            <login.icon className="w-3 h-3 text-slate-500" />
                            <span className="font-medium">{login.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3 rounded-xl font-semibold text-sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              /* Enhanced profile dropdown with notifications and dashboard moved inside */
              <div className="flex items-center space-x-4">
                {/* Profile Dropdown with all user functions */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-slate-900 transition-all duration-300 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 font-semibold text-sm"
                  >
                    <div className="relative">
                      <img
                        src={profilePicture || "/professional-student-profile.png"}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                      />
                      {/* Notification badge positioned on profile photo */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold leading-none">3</span>
                      </div>
                    </div>
                    <span>{userName}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-all duration-300 ${isProfileDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100/50 z-50">
                      <div className="p-2">
                        <div className="space-y-1">
                          {/* Notifications Section */}
                          <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wide font-semibold border-b border-gray-100">
                            Quick Access
                          </div>

                          <Link
                            href="/dashboard"
                            className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <UserCircle className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">My Dashboard</div>
                              <div className="text-xs text-gray-500">View your progress</div>
                            </div>
                          </Link>

                          <button
                            className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-orange-50 rounded-lg transition-all duration-200 w-full text-left"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center relative">
                              <Bell className="w-4 h-4 text-orange-600" />
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white font-bold">3</span>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Notifications</div>
                              <div className="text-xs text-gray-500">3 unread messages</div>
                            </div>
                          </button>

                          <div className="border-t border-gray-100 my-2"></div>

                          {/* Profile Management Section */}
                          <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wide font-semibold">
                            Profile Management
                          </div>

                          <Link
                            href="/dashboard/profile"
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">View Profile</span>
                          </Link>
                          <Link
                            href="/dashboard/profile/edit"
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <Settings className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">Edit Profile</span>
                          </Link>
                          <Link
                            href="/dashboard/profile/change-password"
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <Key className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">Change Password</span>
                          </Link>
                          <Link
                            href="/dashboard/settings"
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <Settings className="w-4 h-4 text-slate-500" />
                            <span className="font-medium">Account Settings</span>
                          </Link>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={() => {
                              handleLogout()
                              setIsProfileDropdownOpen(false)
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 w-full text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="font-medium">Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Premium Mobile Menu Button */}
          <button
            className="lg:hidden p-3 rounded-xl text-gray-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 transition-all duration-300 shadow-lg"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden">
            {!isLoggedIn ? (
              /* Full mobile menu for non-logged users */
              <div className="px-4 pt-4 pb-6 space-y-4 bg-white/95 backdrop-blur-xl border-t border-gray-100/50">
                <div className="space-y-4">
                  {/* Mobile Study Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-blue-800">Study Abroad</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { href: "/study/abroad/usa", flag: "🇺🇸", name: "USA" },
                        { href: "/study/abroad/uk", flag: "🇬🇧", name: "UK" },
                        { href: "/study/abroad/canada", flag: "🇨🇦", name: "Canada" },
                        { href: "/study/abroad/australia", flag: "🇦🇺", name: "Australia" },
                        { href: "/study/abroad/germany", flag: "🇩🇪", name: "Germany" },
                        { href: "/study/abroad/france", flag: "🇫🇷", name: "France" },
                        { href: "/study/abroad/dubai", flag: "🇦🇪", name: "Dubai" },
                        { href: "/study/abroad/ireland", flag: "🇮🇪", name: "Ireland" },
                        { href: "/study/abroad/singapore", flag: "🇸🇬", name: "Singapore" },
                        { href: "/study/abroad/newzealand", flag: "🇳🇿", name: "New Zealand" },
                      ].map((country) => (
                        <Link
                          key={country.href}
                          href={country.href}
                          className="flex items-center space-x-2 px-3 py-3 text-sm text-gray-700 hover:text-slate-900 hover:bg-white/80 rounded-xl transition-all duration-300 shadow-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="text-base">{country.flag}</span>
                          <span className="font-medium">{country.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Study India Section */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🏛️</span>
                      </div>
                      <span className="text-sm font-bold text-orange-800">Study in India</span>
                    </div>

                    {/* Cities Grid */}
                    {/* Courses Section */}
                    <div className="grid grid-cols-1 gap-2">
                      <Link
                        href="/study/india/courses"
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-white/80 rounded-lg transition-all duration-300 shadow-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <GraduationCap className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Courses</span>
                      </Link>
                      <Link
                        href="/study/india/cities"
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-white/80 rounded-lg transition-all duration-300 shadow-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Cities</span>
                      </Link>
                    </div>
                  </div>

                  {/* Mobile Study Online Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-green-800">Study Online</span>
                    </div>
                    <div className="space-y-2">
                      <Link
                        href="/study/online/ug"
                        className="flex items-center space-x-3 px-3 py-3 text-sm text-gray-700 hover:text-slate-900 hover:bg-white/80 rounded-xl transition-all duration-300 shadow-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <GraduationCap className="w-4 h-4 text-green-600" />
                        <span className="font-medium">UG Programs</span>
                      </Link>
                      <Link
                        href="/study/online/pg"
                        className="flex items-center space-x-3 px-3 py-3 text-sm text-gray-700 hover:text-slate-900 hover:bg-white/80 rounded-xl transition-all duration-300 shadow-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BookOpen className="w-4 h-4 text-green-600" />
                        <span className="font-medium">PG Programs</span>
                      </Link>
                    </div>
                  </div>

                  {/* Mobile Test Prep Section */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-purple-800">Test Prep</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { href: "/test-prep/ielts", code: "IE", name: "IELTS" },
                        { href: "/test-prep/toefl", code: "TO", name: "TOEFL" },
                        { href: "/test-prep/gre", code: "GR", name: "GRE" },
                        { href: "/test-prep/gmat", code: "GM", name: "GMAT" },
                        { href: "/test-prep/cat", code: "CA", name: "CAT" },
                        { href: "/test-prep/mat", code: "MA", name: "MAT" },
                        { href: "/test-prep/french", code: "FR", name: "French" },
                        { href: "/test-prep/german", code: "DE", name: "German" },
                      ].map((test) => (
                        <Link
                          key={test.href}
                          href={test.href}
                          className="flex items-center space-x-2 px-3 py-3 text-sm text-gray-700 hover:text-slate-900 hover:bg-white/80 rounded-xl transition-all duration-300 shadow-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="text-purple-600 font-bold text-xs">{test.code}</span>
                          <span className="font-medium">{test.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Other Links */}
                  <div className="space-y-2">
                    <Link
                      href="/student-community"
                      className="flex items-center space-x-3 px-4 py-4 text-sm text-gray-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 rounded-xl transition-all duration-300 shadow-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold">Community</span>
                    </Link>

                    <Link
                      href="/stories"
                      className="flex items-center space-x-3 px-4 py-4 text-sm text-gray-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 rounded-xl transition-all duration-300 shadow-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold">Success Stories</span>
                    </Link>

                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-4 shadow-lg">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-slate-500 to-gray-600 rounded-lg flex items-center justify-center">
                          <MoreHorizontal className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">More Services</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href="/services/career-guidance"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-white/80 rounded-lg transition-all duration-300 shadow-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <BrainCircuit className="w-3 h-3 text-slate-500" />
                          <span className="font-medium">Career Guidance</span>
                        </Link>
                        <Link
                          href="/funds/education-loan"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-white/80 rounded-lg transition-all duration-300 shadow-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          <span className="font-medium">Education Loans</span>
                        </Link>
                        <Link
                          href="/services/mock-interviews"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-white/80 rounded-lg transition-all duration-300 shadow-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <MessageSquare className="w-3 h-3 text-slate-500" />
                          <span className="font-medium">Mock Interviews</span>
                        </Link>
                        <Link
                          href="/services"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-slate-900 hover:bg-white/80 rounded-lg transition-all duration-300 shadow-sm"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <MoreHorizontal className="w-3 h-3 text-slate-500" />
                          <span className="font-medium">View All</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Premium Mobile Auth Buttons */}
                  <div className="pt-4 border-t border-gray-200/50">
                    {!isLoggedIn ? (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-4 shadow-lg">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-slate-600 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-bold text-gray-800">Login Options</span>
                          </div>
                          <div className="space-y-2">
                            {[
                              { href: "/login", name: "Student Login", color: "blue" },
                              { href: "/admin/login", name: "Admin Login", color: "red" },
                              { href: "/agent/login", name: "Agent Login", color: "yellow" },
                              { href: "/counselor/login", name: "Counselor Login", color: "green" },
                              { href: "/college/login", name: "College Login", color: "purple" },
                            ].map((login) => (
                              <Link key={login.href} href={login.href} onClick={() => setIsMenuOpen(false)}>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start text-blue-600 hover:bg-white/80 rounded-xl shadow-sm"
                                >
                                  <User className="w-4 h-4 mr-3" />
                                  {login.name}
                                </Button>
                              </Link>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                            <Button className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white shadow-xl rounded-xl py-4 font-semibold">
                              Sign Up
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 shadow-lg">
                          <div className="px-3 py-2 text-sm text-gray-600 mb-3 font-medium">Welcome, {userName}</div>
                          <div className="space-y-2">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                handleLogout()
                                setIsMenuOpen(false)
                              }}
                              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                            >
                              <LogOut className="w-4 h-4 mr-3" />
                              Logout
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Simplified mobile menu for logged-in users */
              <div className="px-4 pt-4 pb-6 space-y-4 bg-white/95 backdrop-blur-xl border-t border-gray-100/50">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 shadow-lg">
                    <div className="px-3 py-2 text-sm text-gray-600 mb-3 font-medium">Welcome, {userName}</div>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleLogout()
                          setIsMenuOpen(false)
                        }}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
