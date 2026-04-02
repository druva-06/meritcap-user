"use client"

import { Card, CardContent } from "@/components/ui/card"

export function AuthLoadingView() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
            </div>
        </div>
    )
}

export function SearchLoadingSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
                    <div className="flex gap-4">
                        <div className="w-48 h-36 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

interface SearchEmptyStateProps {
    isLoggedIn: boolean
    onClearFilters: () => void
    onRefineFilters: () => void
    onLoginClick: () => void
}

export function SearchEmptyState({ isLoggedIn, onClearFilters, onRefineFilters, onLoginClick }: SearchEmptyStateProps) {
    return (
        <div className="w-full">
            <Card>
                <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-semibold">No Courses Found</h3>
                    <p className="text-gray-500 mt-2">We couldn't find any courses matching your search.</p>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" onClick={onClearFilters}>
                            Clear Filters
                        </button>

                        <button className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded" onClick={onRefineFilters}>
                            Refine Filters
                        </button>

                        {!isLoggedIn && (
                            <button className="text-blue-600 underline px-4 py-2 bg-transparent" onClick={onLoginClick}>
                                Login to see personalized results
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
