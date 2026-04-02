export function mapLevelsToApi(levels: string[]) {
  if (!levels || levels.length === 0) return []
  return levels
    .map((l) => (l || "").toString().trim().toLowerCase())
    .map((l) => {
      if (["master", "masters", "m", "pg", "postgraduate", "post-graduate", "post graduate"].includes(l)) return "MASTER"
      if (["undergraduate", "ug", "bachelor", "bachelors", "bachelors degree"].includes(l)) return "UNDERGRADUATE"
      if (["phd", "doctorate", "doctor", "doctoral"].includes(l)) return "PHD"
      return l.toUpperCase()
    })
}

export function mapCountriesToApi(countries: string[]) {
  if (!countries || countries.length === 0) return []
  return countries.map((c) => {
    const v = (c || "").toString().trim().toLowerCase()
    if (["us", "usa", "united states", "united states of america", "united state"].includes(v)) return "United States of America"
    if (["uk", "gb", "great britain", "united kingdom", "england"].includes(v)) return "United Kingdom"
    return c
  })
}

export function mapDurationToMonths(duration: [number, number]) {
  const minY = Math.max(0, Math.floor(duration?.[0] ?? 0))
  const maxY = Math.max(minY, Math.floor(duration?.[1] ?? minY))

  if (minY === maxY) {
    switch (minY) {
      case 1:
        return { minMonths: 0, maxMonths: 12 }
      case 2:
        return { minMonths: 13, maxMonths: 24 }
      case 3:
        return { minMonths: 25, maxMonths: 36 }
      default:
        return { minMonths: 37, maxMonths: 240 }
    }
  }

  const minMonths = minY <= 1 ? 0 : minY * 12
  const maxMonths = maxY >= 4 ? 240 : maxY * 12
  return { minMonths, maxMonths }
}

export function mapIntakeToMonthsLocal(intakeValue: string | null) {
  if (!intakeValue) return []
  const v = intakeValue.toString().trim()
  if (!v) return []
  const tokens = v.split(/[ ,|]+/).map((t) => t.trim()).filter(Boolean)
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
  const normalized: string[] = []
  for (const t of tokens) {
    const code = t.slice(0, 3).toUpperCase()
    if (months.includes(code)) normalized.push(code)
    else {
      const lower = t.toLowerCase()
      if (lower.includes("jan")) normalized.push("JAN")
      else if (lower.includes("feb")) normalized.push("FEB")
      else if (lower.includes("mar")) normalized.push("MAR")
      else if (lower.includes("apr")) normalized.push("APR")
      else if (lower.includes("may")) normalized.push("MAY")
      else if (lower.includes("jun")) normalized.push("JUN")
      else if (lower.includes("jul")) normalized.push("JUL")
      else if (lower.includes("aug")) normalized.push("AUG")
      else if (lower.includes("sep")) normalized.push("SEP")
      else if (lower.includes("oct")) normalized.push("OCT")
      else if (lower.includes("nov")) normalized.push("NOV")
      else if (lower.includes("dec")) normalized.push("DEC")
    }
  }
  return Array.from(new Set(normalized))
}

export function applyFilters(courses: any[], searchQuery: string, filters: { countries: string[]; levels: string[]; duration: [number, number]; feeRange: [number, number] }) {
  try {
    return courses.filter((course) => {
      if (!course) return false

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          (course.courseName || "").toLowerCase().includes(query) ||
          (course.universityName || "").toLowerCase().includes(query) ||
          (course.location || "").toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      if (filters.countries.length > 0 && !filters.countries.includes(course.country)) return false
      if (filters.levels.length > 0 && !filters.levels.includes(course.level)) return false

      const courseFee = course.fee || 0
      if (courseFee < filters.feeRange[0] || courseFee > filters.feeRange[1]) return false

      let durationYears = 2
      if (course.duration) {
        const durationMatch = course.duration.toString().match(/(\d+(?:\.\d+)?)/)
        if (durationMatch) durationYears = Number.parseFloat(durationMatch[1]) || 2
      }
      if (durationYears < filters.duration[0] || durationYears > filters.duration[1]) return false

      return true
    })
  } catch {
    return courses
  }
}

export function sortCourses(courses: any[], sortBy: string) {
  try {
    const sorted = [...courses]
    switch (sortBy) {
      case "ranking":
        return sorted.sort((a, b) => (a.universityRanking || 999) - (b.universityRanking || 999))
      case "fees-low":
        return sorted.sort((a, b) => (a.fee || 0) - (b.fee || 0))
      case "fees-high":
        return sorted.sort((a, b) => (b.fee || 0) - (a.fee || 0))
      case "rating":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      default:
        return sorted
    }
  } catch {
    return courses
  }
}

export function isLikelyLogoImage(url?: string) {
  if (!url) return false
  const normalized = url.toLowerCase()
  return [
    "logo",
    "icon",
    "avatar",
    "badge",
    "emblem",
    "thumb",
    "thumbnail",
    "college_logo",
    "width=40",
    "height=40",
    "width=80",
    "height=60",
    ".svg",
  ].some((token) => normalized.includes(token))
}

export function getCardImageSrc(course: any) {
  const candidates = [course.campusImage, course.courseImage].filter(Boolean)
  if (candidates.length === 0) {
    return "/placeholder.svg?height=300&width=400&text=Course-Image&query=university course classroom"
  }

  const nonLogo = candidates.find((src: string) => !isLikelyLogoImage(src))
  return nonLogo || "/placeholder.svg?height=300&width=400&text=Course-Image&query=university course classroom"
}

export function formatFee(fee: number) {
  if (!fee || fee === 0) return "Contact for fees"
  return `₹${fee.toLocaleString()}/year`
}

export function formatIntake(intake: string | string[] | undefined) {
  try {
    if (!intake) return "Rolling"

    let codes: string[] = []
    if (Array.isArray(intake)) codes = intake.map((s) => (s || "").toString().trim().toUpperCase().slice(0, 3))
    else codes = intake.toString().split(/[ ,|]+/).map((s) => (s || "").toString().trim().toUpperCase().slice(0, 3)).filter(Boolean)

    if (codes.length === 0) return "Rolling"
    const validCodes = codes.filter((c) => c.length === 3)
    return validCodes.length > 0 ? validCodes.join(", ") : "Rolling"
  } catch {
    return "Rolling"
  }
}

export function createSlug(text: string) {
  if (!text) return "unknown"
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}
