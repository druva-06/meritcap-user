"use client"

import { Button } from "@/components/ui/button"

interface ComparisonStripProps {
    comparisonList: string[]
    sortedCourses: any[]
    onClear: () => void
}

export function ComparisonStrip({ comparisonList, sortedCourses, onClear }: ComparisonStripProps) {
    if (comparisonList.length === 0) return null

    return (
        <div className="bg-blue-50 border-b border-blue-200">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-900">Compare ({comparisonList.length}/3):</span>
                        <div className="flex gap-2">
                            {comparisonList.map((id) => {
                                const course = sortedCourses.find((c) => c.id === id)
                                return course ? (
                                    <span key={id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {(course.courseName || "Unknown").substring(0, 20)}...
                                    </span>
                                ) : null
                            })}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            Compare Now
                        </Button>
                        <Button size="sm" variant="outline" onClick={onClear}>
                            Clear
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
