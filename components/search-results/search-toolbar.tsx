"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowUpDown, X } from "lucide-react"

interface SearchToolbarProps {
    searchInput: string
    sortBy: string
    areFiltersActive: boolean
    onSearchInputChange: (value: string) => void
    onSearch: () => void
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
    onSortChange: (value: string) => void
    onClearAll: () => void
}

export function SearchToolbar({
    searchInput,
    sortBy,
    areFiltersActive,
    onSearchInputChange,
    onSearch,
    onKeyDown,
    onSortChange,
    onClearAll,
}: SearchToolbarProps) {
    return (
        <div className="bg-white shadow-sm border-b sticky top-0 z-40 backdrop-blur-sm bg-white/95">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Search courses, universities, locations..."
                            value={searchInput}
                            onChange={(e) => onSearchInputChange(e.target.value)}
                            onKeyDown={onKeyDown}
                            className="pl-12 pr-28 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm"
                        />
                        <Button onClick={onSearch} className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2">
                            Search
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={sortBy} onValueChange={onSortChange}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <ArrowUpDown className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="relevance">Relevance</SelectItem>
                                <SelectItem value="ranking">University Ranking</SelectItem>
                                <SelectItem value="fees-low">Fees: Low to High</SelectItem>
                                <SelectItem value="fees-high">Fees: High to Low</SelectItem>
                                <SelectItem value="rating">Rating</SelectItem>
                            </SelectContent>
                        </Select>
                        {areFiltersActive && (
                            <Button variant="ghost" onClick={onClearAll} className="text-sm text-blue-600">
                                <X className="w-4 h-4 mr-1" />
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
