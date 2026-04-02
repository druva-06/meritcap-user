"use client"

import { Button } from "@/components/ui/button"

interface SearchPaginationProps {
    currentPage: number
    totalPages: number
    totalItems: number
    onPageChange: (page: number) => void
}

export function SearchPagination({ currentPage, totalPages, totalItems, onPageChange }: SearchPaginationProps) {
    const buildPages = () => {
        const pages: Array<number | string> = []

        if (totalPages <= 7) {
            for (let p = 1; p <= totalPages; p++) pages.push(p)
            return pages
        }

        pages.push(1)
        pages.push(2)

        if (currentPage > 4) pages.push("...")

        const start = Math.max(3, currentPage - 1)
        const end = Math.min(totalPages - 2, currentPage + 1)
        for (let p = start; p <= end; p++) {
            if (p > 2 && p < totalPages - 1) pages.push(p)
        }

        if (currentPage < totalPages - 3) pages.push("...")

        pages.push(totalPages)
        return pages
    }

    const pages = buildPages()

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 p-4 bg-white rounded-lg border border-gray-200 pagination-container">
            <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({totalItems} total courses)
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    size="sm"
                >
                    Previous
                </Button>

                <div className="flex items-center gap-2">
                    {pages.map((pageNum, idx) => {
                        if (pageNum === "...") {
                            return (
                                <span key={`el-${idx}`} className="px-2 text-sm text-gray-500">
                                    …
                                </span>
                            )
                        }

                        const num = Number(pageNum)
                        return (
                            <Button
                                key={num}
                                variant={currentPage === num ? "default" : "outline"}
                                onClick={() => onPageChange(num)}
                                size="sm"
                                className="w-8 h-8 p-0"
                            >
                                {num}
                            </Button>
                        )
                    })}
                </div>

                <Button
                    variant="outline"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    size="sm"
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
