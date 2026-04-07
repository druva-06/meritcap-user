"use client"

import { AlertTriangle, FileText, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"

export interface MissingDocument {
  documentTypeName: string
  documentTypeCode: string
  required: number
  uploaded: number
  isRequired?: boolean
}

interface MissingDocumentsModalProps {
  isOpen: boolean
  onClose: () => void
  missingDocuments: MissingDocument[]
  countryName?: string
  autoRedirectOnClose?: boolean
}

export function MissingDocumentsModal({
  isOpen,
  onClose,
  missingDocuments,
  countryName,
  autoRedirectOnClose = true,
}: MissingDocumentsModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  function handleGoToDocuments() {
    router.push("/dashboard?tab=documents")
  }

  function handleCloseModal() {
    if (autoRedirectOnClose) {
      router.push("/dashboard?tab=documents")
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Documents Required</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {countryName
                    ? `To apply to a college in ${countryName}`
                    : "To complete your application"}
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-4">
            Please upload the following documents before applying:
          </p>

          <div className="space-y-3">
            {missingDocuments.map((doc) => (
              <div
                key={doc.documentTypeCode}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  doc.isRequired
                    ? "bg-red-50 border-red-100"
                    : "bg-amber-50 border-amber-100"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  doc.isRequired
                    ? "bg-red-100"
                    : "bg-amber-100"
                }`}>
                  <FileText className={`w-4 h-4 ${doc.isRequired ? "text-red-500" : "text-amber-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.documentTypeName}
                    </p>
                    {doc.isRequired && (
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${doc.isRequired ? "text-red-500" : "text-amber-600"}`}>
                    {doc.uploaded} of {doc.required} uploaded
                  </p>
                </div>
                <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                  {doc.documentTypeCode}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleCloseModal}
            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleGoToDocuments}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Documents
          </button>
        </div>
      </div>
    </div>
  )
}
