"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getEncryptedUser, setEncryptedUser } from "@/lib/encryption"
import { getProfileDocumentRequirements, getCountryDocumentRequirements, getCountriesForDocConfig } from "@/lib/api/client"
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  ArrowLeft,
  FileImage,
  FileSpreadsheet,
  Clock,
  Share2,
  Building,
  Crown,
  Zap,
  Shield,
  Plus,
  X,
  Download,
  MapPin,
  BookOpen,
  Star,
} from "lucide-react"

interface Document {
  id: string
  name: string
  fileName: string
  type: "sop" | "lor" | "transcript" | "test-score" | "passport" | "degree" | "financial" | "other"
  required: boolean
  status: "pending" | "uploaded" | "verified" | "rejected"
  file?: File
  uploadDate?: string
  size?: string
  comments?: string
  description: string
  isShared?: boolean
  universitySpecific?: boolean
  category: "shared" | "university-specific"
  allowMultiple?: boolean
  documents?: Document[] // For multiple document support
}

interface SharedDocument {
  id: string
  name: string
  fileName: string
  type: string
  file: File
  uploadDate: string
  size: string
  category: string
}

const getSharedDocumentTemplates = (): Omit<Document, "id" | "status" | "uploadDate" | "size" | "file">[] => [
  {
    name: "Academic Transcripts",
    fileName: "transcripts",
    type: "transcript",
    required: true,
    description: "Official transcripts from all previously attended institutions",
    isShared: true,
    universitySpecific: false,
    category: "shared",
    allowMultiple: true,
    documents: [],
    comments:
      "Upload all semester/year transcripts. You can upload multiple files with different names like 'Semester-1-Transcript', 'Semester-2-Transcript', etc.",
  },
  {
    name: "Degree Certificate",
    fileName: "degree-certificate",
    type: "degree",
    required: true,
    description: "Official degree certificate from your university",
    isShared: true,
    universitySpecific: false,
    category: "shared",
    allowMultiple: true,
    documents: [],
    comments: "Upload your final degree certificate. If you have multiple degrees, upload each with clear names.",
  },
  {
    name: "Test Score Reports",
    fileName: "test-scores",
    type: "test-score",
    required: false,
    description: "IELTS, TOEFL, GRE, GMAT or other standardized test scores",
    isShared: true,
    universitySpecific: false,
    category: "shared",
    allowMultiple: true,
    documents: [],
    comments:
      "Upload official score reports. You can upload multiple test scores with names like 'IELTS-Score', 'TOEFL-Score', etc.",
  },
  {
    name: "Passport Copy",
    fileName: "passport",
    type: "passport",
    required: true,
    description: "Clear copy of your passport (all pages)",
    isShared: true,
    universitySpecific: false,
    category: "shared",
    allowMultiple: false,
    documents: [],
    comments: "Upload clear scanned copy of all passport pages including blank pages.",
  },
  {
    name: "Financial Documents",
    fileName: "financial-docs",
    type: "financial",
    required: false,
    description: "Bank statements, financial aid documents, scholarship letters",
    isShared: true,
    universitySpecific: false,
    category: "shared",
    allowMultiple: true,
    documents: [],
    comments:
      "Upload bank statements, income certificates, or scholarship documents. Use descriptive names like 'Bank-Statement-2024', 'Scholarship-Letter', etc.",
  },
]

const getCountrySpecificRequirements = (country: string) => {
  const requirements = {
    USA: {
      lor: 3,
      sop: true,
      transcript: true,
      testScore: ["GRE", "TOEFL/IELTS"],
      financial: true,
      passport: true,
      additional: ["I-20 Form", "Visa Application"],
    },
    UK: {
      lor: 2,
      sop: true,
      transcript: true,
      testScore: ["IELTS"],
      financial: true,
      passport: true,
      additional: ["CAS Letter", "TB Test Certificate"],
    },
    Canada: {
      lor: 2,
      sop: true,
      transcript: true,
      testScore: ["IELTS/TOEFL"],
      financial: true,
      passport: true,
      additional: ["Study Permit", "Medical Exam"],
    },
    Australia: {
      lor: 2,
      sop: true,
      transcript: true,
      testScore: ["IELTS/TOEFL"],
      financial: true,
      passport: true,
      additional: ["COE", "Health Insurance"],
    },
    Germany: {
      lor: 1,
      sop: true,
      transcript: true,
      testScore: ["IELTS/TOEFL", "TestDaF (for German programs)"],
      financial: true,
      passport: true,
      additional: ["APS Certificate", "Blocked Account"],
    },
    India: {
      lor: 1,
      sop: false,
      transcript: true,
      testScore: [],
      financial: false,
      passport: false,
      additional: ["Entrance Exam Scores"],
    },
  }

  return requirements[country as keyof typeof requirements] || requirements["USA"]
}

const getSampleDocuments = () => [
  {
    id: "sop-sample",
    name: "Statement of Purpose Sample",
    type: "SOP",
    description: "Professional SOP template with examples",
    premium: true,
  },
  {
    id: "lor-sample",
    name: "Letter of Recommendation Sample",
    type: "LOR",
    description: "Academic LOR template from professor",
    premium: true,
  },
  {
    id: "bank-statement-sample",
    name: "Bank Statement Sample",
    type: "Financial",
    description: "Properly formatted bank statement example",
    premium: false,
  },
]

export default function DocumentUploadPage({ params }: { params: { applicationId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetup = searchParams.get("setup") === "true"

  const [application, setApplication] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([])
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<"shared" | "university-specific">("shared")
  const [user, setUser] = useState<any>(null)
  const [customDocName, setCustomDocName] = useState("")
  const [showCustomUpload, setShowCustomUpload] = useState(false)
  // Dynamic requirements loaded from API
  const [apiProfileRequirements, setApiProfileRequirements] = useState<any[]>([])
  const [apiCountryRequirements, setApiCountryRequirements] = useState<any[]>([])

  useEffect(() => {
    // Load user data - try encrypted storage first
    let userData = getEncryptedUser()

    if (!userData) {
      // Fallback to unencrypted
      const userDataString = localStorage.getItem("meritcap_user")
      if (userDataString) {
        userData = JSON.parse(userDataString)
      }
    }

    if (userData) {
      setUser(userData)
    }

    if (isSetup) {
      // Document vault setup mode
      setActiveView("shared")
      initializeSharedDocuments()
    } else {
      // Application document mode
      loadApplicationData()
    }
  }, [params.applicationId, isSetup])

  const initializeSharedDocuments = async () => {
    // Try loading profile requirements from API, fall back to hardcoded
    let templates: Omit<Document, "id" | "status" | "uploadDate" | "size" | "file">[]
    try {
      const res = await getProfileDocumentRequirements()
      const apiReqs = res?.response || res?.data || []
      if (Array.isArray(apiReqs) && apiReqs.length > 0) {
        setApiProfileRequirements(apiReqs)
        templates = apiReqs.map((r: any) => ({
          name: r.documentTypeName,
          fileName: r.documentTypeCode.toLowerCase(),
          type: "other" as const,
          required: r.isRequired,
          description: `${r.documentTypeName} (min: ${r.minCount})`,
          isShared: true,
          universitySpecific: false,
          category: "shared" as const,
          allowMultiple: r.allowMultiple,
          documents: [],
          comments: r.allowMultiple
            ? `You can upload multiple ${r.documentTypeName} files.`
            : undefined,
        }))
      } else {
        templates = getSharedDocumentTemplates()
      }
    } catch {
      templates = getSharedDocumentTemplates()
    }

    const docs: Document[] = templates.map((template, index) => ({
      ...template,
      id: `shared-${index}`,
      status: "pending",
    }))
    setDocuments(docs)

    // Load existing shared documents
    const savedShared = localStorage.getItem("meritcap_shared_documents")
    if (savedShared) {
      setSharedDocuments(JSON.parse(savedShared))
    }
  }

  const loadApplicationData = () => {
    const savedApplications = localStorage.getItem("meritcap_applications")
    if (savedApplications) {
      const applications = JSON.parse(savedApplications)
      const currentApp = applications.find((app: any) => app.id === params.applicationId)
      if (currentApp) {
        setApplication(currentApp)
        initializeDocumentsForApplication(currentApp)
      } else {
        router.push("/dashboard")
      }
    } else {
      router.push("/dashboard")
    }
  }

  const initializeDocumentsForApplication = async (app: any) => {
    // Fetch profile (shared) requirements from API
    let sharedTemplates: Omit<Document, "id" | "status" | "uploadDate" | "size" | "file">[]
    try {
      const profileRes = await getProfileDocumentRequirements()
      const profileReqs = profileRes?.response || profileRes?.data || []
      if (Array.isArray(profileReqs) && profileReqs.length > 0) {
        setApiProfileRequirements(profileReqs)
        sharedTemplates = profileReqs.map((r: any) => ({
          name: r.documentTypeName,
          fileName: r.documentTypeCode.toLowerCase(),
          type: "other" as const,
          required: r.isRequired,
          description: `${r.documentTypeName} (min: ${r.minCount})`,
          isShared: true,
          universitySpecific: false,
          category: "shared" as const,
          allowMultiple: r.allowMultiple,
          documents: [],
        }))
      } else {
        sharedTemplates = getSharedDocumentTemplates()
      }
    } catch {
      sharedTemplates = getSharedDocumentTemplates()
    }

    // Fetch country-specific requirements from API
    let universityTemplates: Omit<Document, "id" | "status" | "uploadDate" | "size" | "file">[]
    try {
      // Resolve country ID from country name
      const countriesRes = await getCountriesForDocConfig()
      const countries: any[] = countriesRes?.response || countriesRes?.data || []
      const matchedCountry = countries.find(
        (c: any) => c.name?.toLowerCase() === app.country?.toLowerCase() ||
                    c.code?.toLowerCase() === app.country?.toLowerCase()
      )
      if (matchedCountry) {
        const countryRes = await getCountryDocumentRequirements(matchedCountry.id)
        const countryReqs: any[] = countryRes?.response || countryRes?.data || []
        if (Array.isArray(countryReqs) && countryReqs.length > 0) {
          setApiCountryRequirements(countryReqs)
          universityTemplates = countryReqs.map((r: any) => ({
            name: r.documentTypeName,
            fileName: r.documentTypeCode.toLowerCase(),
            type: "other" as const,
            required: r.isRequired,
            description: `Required for ${matchedCountry.name} applications (min: ${r.minCount})`,
            isShared: false,
            universitySpecific: true,
            category: "university-specific" as const,
            allowMultiple: r.allowMultiple,
            documents: [],
          }))
        } else {
          universityTemplates = getUniversitySpecificTemplates(app.university, app.country)
        }
      } else {
        universityTemplates = getUniversitySpecificTemplates(app.university, app.country)
      }
    } catch {
      universityTemplates = getUniversitySpecificTemplates(app.university, app.country)
    }

    const allDocs: Document[] = [
      ...sharedTemplates.map((template, index) => ({
        ...template,
        id: `shared-${index}`,
        status: "pending" as const,
      })),
      ...universityTemplates.map((template, index) => ({
        ...template,
        id: `university-${index}`,
        status: "pending" as const,
      })),
    ]

    setDocuments(allDocs)

    // Load existing shared documents
    const savedShared = localStorage.getItem("meritcap_shared_documents")
    if (savedShared) {
      const shared = JSON.parse(savedShared)
      setSharedDocuments(shared)

      // Update shared document status
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.isShared) {
            const sharedDoc = shared.find((s: any) => s.type === doc.type)
            if (sharedDoc) {
              return { ...doc, status: "uploaded", uploadDate: sharedDoc.uploadDate, size: sharedDoc.size }
            }
          }
          return doc
        }),
      )
    }
  }

  const getUniversitySpecificTemplates = (
    universityName: string,
    country = "USA",
  ): Omit<Document, "id" | "status" | "uploadDate" | "size" | "file">[] => {
    const countryReqs = getCountrySpecificRequirements(country)
    const templates = []

    // SOP - based on country requirement
    if (countryReqs.sop) {
      templates.push({
        name: `Statement of Purpose - ${universityName}`,
        fileName: `sop-${universityName.toLowerCase().replace(/\s+/g, "-")}`,
        type: "sop",
        required: true,
        description: `Personal essay explaining your academic goals and why you want to study at ${universityName}`,
        isShared: false,
        universitySpecific: true,
        category: "university-specific",
        allowMultiple: false,
        documents: [],
        comments: `Write a compelling SOP specifically tailored for ${universityName}. Mention specific programs, professors, or opportunities at this university.`,
      })
    }

    // LOR - based on country requirement
    for (let i = 1; i <= countryReqs.lor; i++) {
      templates.push({
        name: `Letter of Recommendation #${i} - ${universityName}`,
        fileName: `lor-${i}-${universityName.toLowerCase().replace(/\s+/g, "-")}`,
        type: "lor",
        required: true,
        description: `${i === 1 ? "Academic" : "Professional"} recommendation letter specifically for ${universityName}`,
        isShared: false,
        universitySpecific: true,
        category: "university-specific",
        allowMultiple: false,
        documents: [],
        comments: `Get a recommendation letter from your ${i === 1 ? "professor" : "employer"}. The letter should be on official letterhead and specifically mention ${universityName}.`,
      })
    }

    return templates
  }

  const addNewDocument = (parentDocId: string) => {
    const parentDoc = documents.find((doc) => doc.id === parentDocId)
    if (!parentDoc || !parentDoc.allowMultiple) return

    const newDocId = `${parentDocId}-${Date.now()}`
    const newDoc: Document = {
      ...parentDoc,
      id: newDocId,
      name: `${parentDoc.name} #${(parentDoc.documents?.length || 0) + 2}`,
      status: "pending",
    }

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === parentDocId) {
          return {
            ...doc,
            documents: [...(doc.documents || []), newDoc],
          }
        }
        return doc
      }),
    )
  }

  const removeSubDocument = (parentDocId: string, subDocId: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === parentDocId) {
          return {
            ...doc,
            documents: doc.documents?.filter((subDoc) => subDoc.id !== subDocId) || [],
          }
        }
        return doc
      }),
    )
  }

  const handleFileUpload = async (docId: string, files: FileList | File[], parentDocId?: string) => {
    const file = files[0]
    if (!file) return

    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit. Please choose a smaller file.")
      return
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload PDF, DOC, DOCX, JPG, or PNG files only.")
      return
    }

    setUploadingDoc(docId)

    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const uploadedDoc = {
      status: "uploaded" as const,
      file,
      uploadDate: new Date().toISOString().split("T")[0],
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    }

    // Update document
    setDocuments((prev) =>
      prev.map((doc) => {
        if (parentDocId && doc.id === parentDocId) {
          return {
            ...doc,
            documents:
              doc.documents?.map((subDoc) => (subDoc.id === docId ? { ...subDoc, ...uploadedDoc } : subDoc)) || [],
          }
        } else if (doc.id === docId) {
          const updatedDoc = { ...doc, ...uploadedDoc }

          // If shared document, save to shared storage
          if (doc.isShared) {
            const sharedDoc: SharedDocument = {
              id: doc.id,
              name: doc.name,
              fileName: file.name,
              type: doc.type,
              file,
              uploadDate: uploadedDoc.uploadDate,
              size: uploadedDoc.size,
              category: doc.category,
            }

            const existingShared = JSON.parse(localStorage.getItem("meritcap_shared_documents") || "[]")
            const updatedShared = existingShared.filter((s: any) => s.id !== doc.id)
            updatedShared.push(sharedDoc)
            localStorage.setItem("meritcap_shared_documents", JSON.stringify(updatedShared))
            setSharedDocuments(updatedShared)
          }

          return updatedDoc
        }
        return doc
      }),
    )

    setUploadingDoc(null)
  }

  const handleDrop = useCallback((e: React.DragEvent, docId: string, parentDocId?: string) => {
    e.preventDefault()
    setDragOver(null)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(docId, files, parentDocId)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, docId: string) => {
    e.preventDefault()
    setDragOver(docId)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
  }, [])

  const removeDocument = (docId: string, parentDocId?: string) => {
    if (parentDocId) {
      removeSubDocument(parentDocId, docId)
    } else {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === docId) {
            // Remove from shared storage if applicable
            if (doc.isShared) {
              const existingShared = JSON.parse(localStorage.getItem("meritcap_shared_documents") || "[]")
              const updatedShared = existingShared.filter((s: any) => s.id !== docId)
              localStorage.setItem("meritcap_shared_documents", JSON.stringify(updatedShared))
              setSharedDocuments(updatedShared)
            }

            return {
              ...doc,
              status: "pending" as const,
              file: undefined,
              uploadDate: undefined,
              size: undefined,
            }
          }
          return doc
        }),
      )
    }
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "sop":
      case "lor":
        return FileText
      case "transcript":
      case "degree":
        return FileSpreadsheet
      case "test-score":
      case "passport":
      case "financial":
        return FileImage
      default:
        return FileText
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploaded":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "verified":
        return "bg-green-50 text-green-700 border-green-200"
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-slate-50 text-slate-600 border-slate-200"
    }
  }

  const completedDocuments = documents.filter((doc) => {
    if (doc.allowMultiple && doc.documents?.length) {
      return doc.documents.some((subDoc) => subDoc.status === "uploaded" || subDoc.status === "verified")
    }
    return doc.status === "uploaded" || doc.status === "verified"
  }).length

  const progress = documents.length > 0 ? (completedDocuments / documents.length) * 100 : 0

  const sharedDocs = documents.filter((doc) => doc.category === "shared")
  const universityDocs = documents.filter((doc) => doc.category === "university-specific")

  const handleCustomDocumentUpload = async (files: FileList | File[]) => {
    if (!customDocName.trim()) {
      alert("Please enter a document name")
      return
    }

    const file = files[0]
    if (!file) return

    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit. Please choose a smaller file.")
      return
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload PDF, DOC, DOCX, JPG, or PNG files only.")
      return
    }

    const customDoc: Document = {
      id: `custom-${Date.now()}`,
      name: customDocName,
      fileName: file.name,
      type: "other",
      required: false,
      status: "uploaded",
      file,
      uploadDate: new Date().toISOString().split("T")[0],
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      description: "Custom uploaded document",
      isShared: false,
      universitySpecific: false,
      category: "university-specific",
      allowMultiple: false,
      documents: [],
    }

    setDocuments((prev) => [...prev, customDoc])
    setCustomDocName("")
    setShowCustomUpload(false)
  }

  const handleSampleDownload = (sampleId: string) => {
    const sample = getSampleDocuments().find((s) => s.id === sampleId)
    if (!sample) return

    if (sample.premium && !user?.isPremium) {
      alert("This sample is available for premium users only. Please upgrade your plan or contact our support team.")
      return
    }

    // Simulate download
    alert(`Downloading ${sample.name}...`)
  }

  const handleComplete = () => {
    if (isSetup) {
      // Update user's document vault setup status - use encrypted storage
      let userData = getEncryptedUser()

      if (!userData) {
        // Fallback to unencrypted
        const userDataString = localStorage.getItem("meritcap_user")
        userData = userDataString ? JSON.parse(userDataString) : {}
      }

      userData.documentVaultSetup = true
      const rememberMe = localStorage.getItem("meritcap_remember_me") === "true"
      setEncryptedUser(userData, !rememberMe)

      router.push("/dashboard?tab=overview&vault-setup=complete")
    } else {
      // Complete application
      const missingRequired = documents.filter((doc) => doc.required && doc.status === "pending")
      if (missingRequired.length > 0) {
        alert(`Please upload required documents: ${missingRequired.map((doc) => doc.name).join(", ")}`)
        return
      }

      router.push("/dashboard?tab=applications&success=documents-uploaded")
    }
  }

  const renderUploadArea = (doc: Document, parentDocId?: string) => {
    const isUploading = uploadingDoc === doc.id
    const isDragOver = dragOver === doc.id

    return (
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${isDragOver
            ? "border-blue-400 bg-blue-50 shadow-lg scale-[1.02]"
            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
          }`}
        onDragOver={(e) => handleDragOver(e, doc.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, doc.id, parentDocId)}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mb-3"></div>
            <p className="text-sm font-medium text-slate-700">Uploading...</p>
            <p className="text-xs text-slate-500">Please wait</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700 mb-2">Drop your file here</h4>
            <p className="text-sm text-slate-500 mb-4">or click to browse from your computer</p>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files) handleFileUpload(doc.id, e.target.files, parentDocId)
              }}
              className="hidden"
              id={`file-${doc.id}`}
            />
            <Label
              htmlFor={`file-${doc.id}`}
              className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Label>
            <p className="text-xs text-slate-400 mt-3">PDF, DOC, DOCX, JPG, PNG • Max 10MB</p>
          </>
        )}
      </div>
    )
  }

  const renderUploadedFile = (doc: Document, parentDocId?: string) => (
    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{doc.file?.name || doc.fileName}</p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              {doc.size && <span>{doc.size}</span>}
              {doc.uploadDate && <span>Uploaded {doc.uploadDate}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-slate-600 border-slate-300 hover:bg-slate-50 bg-transparent"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeDocument(doc.id, parentDocId)}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  )

  const renderDocumentCard = (doc: Document) => {
    const IconComponent = getDocumentIcon(doc.type)
    const hasUploaded = doc.status === "uploaded" || doc.status === "verified"
    const hasSubDocuments = doc.documents && doc.documents.length > 0

    return (
      <Card key={doc.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasUploaded ? "bg-emerald-100" : "bg-slate-100"
                  }`}
              >
                {hasUploaded ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <X className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base flex items-center">
                  {doc.name}
                  {doc.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {doc.required && (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">
                      Required
                    </Badge>
                  )}
                  {doc.isShared && (
                    <Badge className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border-blue-200">
                      <Share2 className="w-3 h-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                  {doc.universitySpecific && (
                    <Badge className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 border-purple-200">
                      <Building className="w-3 h-3 mr-1" />
                      University Specific
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Badge className={`text-xs px-3 py-1 border flex items-center gap-1 ${getStatusColor(doc.status)}`}>
              {doc.status === "pending" ? (
                <>
                  <X className="w-3 h-3" />
                  Not Uploaded
                </>
              ) : doc.status === "uploaded" ? (
                <>
                  <CheckCircle className="w-3 h-3" />✓ Received
                </>
              ) : doc.status === "verified" ? (
                <>
                  <CheckCircle className="w-3 h-3" />✓ Verified
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Rejected
                </>
              )}
            </Badge>
          </div>

          <p className="text-sm text-slate-600 mb-4">{doc.description}</p>

          {/* Main document upload */}
          {doc.status === "pending" ? renderUploadArea(doc) : renderUploadedFile(doc)}

          {/* Multiple documents section */}
          {doc.allowMultiple && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-700">Additional Documents</h4>
                <Button
                  onClick={() => addNewDocument(doc.id)}
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add More
                </Button>
              </div>

              {hasSubDocuments && (
                <div className="space-y-4">
                  {doc.documents?.map((subDoc) => (
                    <div key={subDoc.id} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{subDoc.name}</span>
                        <Button
                          onClick={() => removeSubDocument(doc.id, subDoc.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {subDoc.status === "pending"
                        ? renderUploadArea(subDoc, doc.id)
                        : renderUploadedFile(subDoc, doc.id)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {doc.comments && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Tips</p>
                  <p className="text-sm text-blue-700">{doc.comments}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Set Up Your Document Vault</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Upload your documents once and use them for all university applications. This will save you time and make
              applying to multiple universities much faster.
            </p>
          </div>

          {/* Progress */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Setup Progress</h2>
                  <p className="text-sm text-slate-600">
                    {completedDocuments} of {documents.length} documents uploaded
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</div>
                  <div className="text-sm text-slate-600">Complete</div>
                </div>
              </div>
              <Progress value={progress} className="h-3" />
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center p-6 border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2 text-slate-900">Save Time</h3>
              <p className="text-sm text-slate-600">
                Upload once, use everywhere. No need to upload same documents repeatedly.
              </p>
            </Card>
            <Card className="text-center p-6 border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-slate-900">Secure Storage</h3>
              <p className="text-sm text-slate-600">Your documents are stored securely and can be accessed anytime.</p>
            </Card>
            <Card className="text-center p-6 border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-slate-900">Quick Applications</h3>
              <p className="text-sm text-slate-600">
                Apply to multiple universities in minutes with pre-uploaded documents.
              </p>
            </Card>
          </div>

          {/* Documents */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Upload Your Documents</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{sharedDocs.map(renderDocumentCard)}</div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="border-slate-300 text-slate-600"
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Setup
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard?tab=applications")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Applications
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">Documents Upload</h1>
              <p className="text-slate-600">Upload all required documents</p>
            </div>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Progress */}
            <Card className="mb-6 border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Document Upload Progress</h2>
                    <p className="text-sm text-slate-600">
                      {completedDocuments} of {documents.length} documents uploaded
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</div>
                    <div className="text-sm text-slate-600">Complete</div>
                  </div>
                </div>
                <Progress value={progress} className="h-3" />
              </CardContent>
            </Card>

            {/* Document Categories */}
            <div className="flex gap-4 mb-6">
              <Button
                variant={activeView === "shared" ? "default" : "outline"}
                onClick={() => setActiveView("shared")}
                className={`flex items-center gap-2 ${activeView === "shared"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <Share2 className="w-4 h-4" />
                Shared Documents ({sharedDocs.length})
              </Button>
              <Button
                variant={activeView === "university-specific" ? "default" : "outline"}
                onClick={() => setActiveView("university-specific")}
                className={`flex items-center gap-2 ${activeView === "university-specific"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <Building className="w-4 h-4" />
                University Specific ({universityDocs.length})
              </Button>
            </div>

            {/* Document Grid */}
            <div className="space-y-6">
              {activeView === "shared" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Shared Documents</h2>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">Use for all applications</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-6">{sharedDocs.map(renderDocumentCard)}</div>
                </>
              )}

              {activeView === "university-specific" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">University Specific Documents</h2>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      Only for {application?.university || "this university"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-6">{universityDocs.map(renderDocumentCard)}</div>

                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Custom Documents</h3>
                        <Button
                          onClick={() => setShowCustomUpload(!showCustomUpload)}
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Custom Document
                        </Button>
                      </div>

                      {showCustomUpload && (
                        <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-blue-50">
                          <div className="mb-4">
                            <Label htmlFor="custom-doc-name" className="text-sm font-medium text-slate-700">
                              Document Name
                            </Label>
                            <Input
                              id="custom-doc-name"
                              value={customDocName}
                              onChange={(e) => setCustomDocName(e.target.value)}
                              placeholder="Enter document name (e.g., Additional Certificate, Portfolio)"
                              className="mt-1"
                            />
                          </div>

                          <div className="text-center">
                            <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                            <h4 className="text-base font-semibold text-slate-700 mb-2">Upload Custom Document</h4>
                            <p className="text-sm text-slate-500 mb-4">Drop your file here or click to browse</p>
                            <Input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                if (e.target.files) handleCustomDocumentUpload(e.target.files)
                              }}
                              className="hidden"
                              id="custom-file-upload"
                            />
                            <Label
                              htmlFor="custom-file-upload"
                              className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                            </Label>
                            <p className="text-xs text-slate-400 mt-3">PDF, DOC, DOCX, JPG, PNG • Max 10MB</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                <p>
                  Need help?{" "}
                  <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                    Contact Support
                  </Button>
                </p>
              </div>
              <Button
                onClick={handleComplete}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Upload
              </Button>
            </div>
          </div>

          <div className="w-80 space-y-6">
            {/* Country Requirements Checklist */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">{application?.country || "USA"} Requirements</h3>
                </div>

                {(() => {
                  const countryReqs = getCountrySpecificRequirements(application?.country || "USA")
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Letters of Recommendation</span>
                        <Badge variant="outline" className="text-xs">
                          {countryReqs.lor} required
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Statement of Purpose</span>
                        <Badge variant={countryReqs.sop ? "default" : "secondary"} className="text-xs">
                          {countryReqs.sop ? "Required" : "Optional"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Academic Transcripts</span>
                        <Badge variant="default" className="text-xs">
                          Required
                        </Badge>
                      </div>

                      {countryReqs.testScore.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Test Scores</span>
                          <Badge variant="outline" className="text-xs">
                            {countryReqs.testScore.join(", ")}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Financial Documents</span>
                        <Badge variant={countryReqs.financial ? "default" : "secondary"} className="text-xs">
                          {countryReqs.financial ? "Required" : "Optional"}
                        </Badge>
                      </div>

                      {countryReqs.additional.length > 0 && (
                        <div className="pt-3 border-t border-slate-200">
                          <p className="text-sm font-medium text-slate-700 mb-2">Additional Documents:</p>
                          {countryReqs.additional.map((doc, index) => (
                            <div key={index} className="flex items-center gap-2 mb-1">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                              <span className="text-xs text-slate-600">{doc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Sample Documents */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Sample Documents</h3>
                </div>

                <div className="space-y-3">
                  {getSampleDocuments().map((sample) => (
                    <div key={sample.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-slate-900">{sample.name}</p>
                          {sample.premium && <Crown className="w-3 h-3 text-amber-500" />}
                        </div>
                        <p className="text-xs text-slate-600">{sample.description}</p>
                      </div>
                      <Button
                        onClick={() => handleSampleDownload(sample.id)}
                        size="sm"
                        variant="outline"
                        className="ml-2 text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Premium Access</p>
                      <p className="text-xs text-amber-700">
                        Upgrade to premium for access to all sample documents and expert guidance.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Status Summary */}
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Summary</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Documents</span>
                    <Badge variant="outline">{documents.length}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Completed</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">{completedDocuments}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Pending</span>
                    <Badge variant="secondary">{documents.length - completedDocuments}</Badge>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Progress</span>
                      <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
