"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Clock, Calendar, DollarSign, Award, BookOpen, User, Check } from "lucide-react"

interface CourseResultCardProps {
    course: any
    vertical: string
    comparisonList: string[]
    favorites: string[]
    wishlistLoading: Record<string, boolean>
    getCardImageSrc: (course: any) => string
    createSlug: (text: string) => string
    formatFee: (fee: number) => string
    formatIntake: (intake: string | string[] | undefined) => string
    onToggleComparison: (id: string) => void
    onAddToWishlist: (course: any) => void
    onApplyNow: (course: any) => void
}

export function CourseResultCard({
    course,
    vertical,
    comparisonList,
    favorites,
    wishlistLoading,
    getCardImageSrc,
    createSlug,
    formatFee,
    formatIntake,
    onToggleComparison,
    onAddToWishlist,
    onApplyNow,
}: CourseResultCardProps) {
    const placeholderHero = "/placeholder.svg?height=300&width=400&text=Course-Image&query=university course classroom"
    const [heroSrc, setHeroSrc] = useState<string>(getCardImageSrc(course))

    useEffect(() => {
        setHeroSrc(getCardImageSrc(course))
    }, [course, getCardImageSrc])

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 course-card">
            <div className="flex search-result-card">
                <div className="w-48 relative flex-shrink-0 h-48 leading-8">
                    <Image
                        src={heroSrc || placeholderHero}
                        alt={`${course.courseName || "Course"} at ${course.universityName || "University"}`}
                        fill
                        className="object-cover rounded-l-lg"
                        sizes="(max-width: 768px) 100vw, 192px"
                        onError={() => setHeroSrc(placeholderHero)}
                    />

                    <div className="absolute top-2 left-2">
                        <button
                            onClick={() => onToggleComparison(course.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors comparison-checkbox ${comparisonList.includes(course.id)
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-white border-gray-300 hover:border-blue-400"
                                }`}
                        >
                            {comparisonList.includes(course.id) && <Check className="w-3 h-3" />}
                        </button>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-white p-1.5 rounded-md shadow-md border border-gray-100">
                        <Image
                            src={
                                course.universityLogo ||
                                `/placeholder.svg?height=40&width=80&text=${encodeURIComponent(course.universityName || "University")}&query=${encodeURIComponent(course.universityName || "University")} logo`
                            }
                            alt={`${course.universityName || "University"} logo`}
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    </div>
                </div>

                <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                            <Link
                                href={
                                    vertical === "study-india" || course.country === "India"
                                        ? `/college/${course.universityId}/${createSlug(course.courseName)}`
                                        : `/universities/${course.universityId}/courses/${course.collegeCourseId}`
                                }
                            >
                                <h2 className="text-base font-bold text-gray-900 hover:text-blue-700 hover:underline cursor-pointer mb-1 leading-tight">
                                    {course.courseName || "Unknown Course"}
                                </h2>
                            </Link>

                            <Link href={`/universities/${course.universityId}`}>
                                <h3 className="text-sm text-gray-600 hover:text-blue-600 hover:underline cursor-pointer mb-2">
                                    {course.universityName || "Unknown University"}
                                </h3>
                            </Link>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-blue-500" />
                                    <span>
                                        {course.city || "Unknown City"}, {course.country || "Unknown Country"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-blue-500" />
                                    <span>{course.duration || "2 years"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-green-500" />
                                    <span className="text-green-600 font-medium">{course.courseAge || "Recently Updated"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onAddToWishlist(course)}
                                disabled={!!wishlistLoading[course.id]}
                                className={`transition-colors p-1 flex items-center gap-1 favorite-button ${favorites.includes(course.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                            >
                                <Heart className={`w-4 h-4 ${favorites.includes(course.id) ? "fill-red-500 text-red-500" : ""}`} />
                                <span className="text-xs text-gray-500 hidden sm:inline">
                                    {favorites.includes(course.id) ? "Added" : (wishlistLoading[course.id] ? "Adding..." : "Add to list")}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-3">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-gray-500">Fees:</span>
                            <span className="font-medium text-xs text-gray-900">{formatFee(course.fee)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-gray-500">Intake:</span>
                            <span className="font-medium text-xs text-gray-900">{formatIntake(course.intake)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Award className="w-3 h-3 text-orange-600" />
                            <span className="text-xs text-gray-500">NIRF Rank:</span>
                            <span className="font-medium text-xs text-gray-900">{course.universityRanking < 999 ? course.universityRanking : "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-3 h-3 text-purple-600" />
                            <span className="text-xs text-gray-500">Accreditations:</span>
                            <div className="flex gap-1">
                                {(course.accreditations || ["Accredited"]).slice(0, 3).map((acc: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className="inline-block px-1 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded text-[10px]"
                                    >
                                        {acc}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs font-medium h-7 rounded"
                            onClick={() => onApplyNow(course)}
                        >
                            Apply Now
                        </Button>
                        <Button
                            variant="outline"
                            className="flex items-center gap-1 px-2 py-1 text-xs border-gray-300 hover:bg-gray-50 bg-transparent h-7 rounded"
                            onClick={() => console.log("AI Agent clicked")}
                        >
                            <User className="w-3 h-3" />
                            AI Agent
                        </Button>
                        <Button
                            variant="outline"
                            className="flex items-center gap-1 px-2 py-1 text-xs border-gray-300 hover:bg-gray-50 bg-transparent h-7 rounded"
                            onClick={() => console.log("Counselor clicked")}
                        >
                            <User className="w-3 h-3" />
                            Counselor
                        </Button>
                        <Button
                            variant="outline"
                            className="px-2 py-1 text-xs border-gray-300 hover:bg-gray-50 bg-transparent h-7 rounded"
                            onClick={() => console.log("Brochure clicked")}
                        >
                            <BookOpen className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
