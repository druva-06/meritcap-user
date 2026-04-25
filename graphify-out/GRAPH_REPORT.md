# Graph Report - meritcap-user  (2026-04-25)

## Corpus Check
- 213 files · ~3,904,749 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 545 nodes · 590 edges · 23 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Client & Chat Route|API Client & Chat Route]]
- [[_COMMUNITY_Study India Course Pages|Study India Course Pages]]
- [[_COMMUNITY_Student Education & Utils|Student Education & Utils]]
- [[_COMMUNITY_Profile & Dashboard|Profile & Dashboard]]
- [[_COMMUNITY_Auth & Login Modals|Auth & Login Modals]]
- [[_COMMUNITY_Login & Auth Pages|Login & Auth Pages]]
- [[_COMMUNITY_Toast & Notification Pages|Toast & Notification Pages]]
- [[_COMMUNITY_Signup Flow|Signup Flow]]
- [[_COMMUNITY_Study Destination Pages|Study Destination Pages]]
- [[_COMMUNITY_Course Search|Course Search]]
- [[_COMMUNITY_Loading States|Loading States]]
- [[_COMMUNITY_Search Filter Components|Search Filter Components]]
- [[_COMMUNITY_AI Chatbot|AI Chatbot]]
- [[_COMMUNITY_Online Study Pages|Online Study Pages]]
- [[_COMMUNITY_User Dashboard|User Dashboard]]
- [[_COMMUNITY_Student Community & Whiteboard|Student Community & Whiteboard]]
- [[_COMMUNITY_Post Search Filter Modal|Post Search Filter Modal]]
- [[_COMMUNITY_Admin & College Dashboard|Admin & College Dashboard]]
- [[_COMMUNITY_College & University Detail|College & University Detail]]
- [[_COMMUNITY_Search Result Card|Search Result Card]]
- [[_COMMUNITY_Theme Selector|Theme Selector]]
- [[_COMMUNITY_Mobile Detection Hook|Mobile Detection Hook]]
- [[_COMMUNITY_Deployment Docs|Deployment Docs]]

## God Nodes (most connected - your core abstractions)
1. `toast()` - 22 edges
2. `handleSubmit()` - 20 edges
3. `nextLogos()` - 17 edges
4. `prevLogos()` - 17 edges
5. `setEncryptedUser()` - 15 edges
6. `Loading()` - 14 edges
7. `POST()` - 12 edges
8. `onClose()` - 10 edges
9. `getEncryptedUser()` - 10 edges
10. `fetchCoursesFromApi()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `if()` --calls--> `setEncryptedUser()`  [INFERRED]
  /Users/druva/Documents/Personal/wowcap/website/meritcap-user/app/dashboard/page.tsx → /Users/druva/Documents/Personal/wowcap/website/meritcap-user/lib/encryption.ts
- `handleSave()` --calls--> `toast()`  [INFERRED]
  /Users/druva/Documents/Personal/wowcap/website/meritcap-user/app/dashboard/profile/edit/page.tsx → /Users/druva/Documents/Personal/wowcap/website/meritcap-user/hooks/use-toast.ts
- `handleModalClose()` --calls--> `onClose()`  [INFERRED]
  /Users/druva/Documents/Personal/wowcap/website/meritcap-user/components/modals/quick-login-modal.tsx → /Users/druva/Documents/Personal/wowcap/website/meritcap-user/components/modals/intake-selection-modal.tsx
- `handleSubmit()` --calls--> `toast()`  [INFERRED]
  /Users/druva/Documents/Personal/wowcap/website/meritcap-user/app/login/page.tsx → /Users/druva/Documents/Personal/wowcap/website/meritcap-user/hooks/use-toast.ts
- `handleSubmit()` --calls--> `setRememberMePreference()`  [INFERRED]
  /Users/druva/Documents/Personal/wowcap/website/meritcap-user/app/login/page.tsx → /Users/druva/Documents/Personal/wowcap/website/meritcap-user/lib/auth-session.ts

## Communities

### Community 0 - "API Client & Chat Route"
Cohesion: 0.07
Nodes (22): getToken(), addWishlistItem(), changePassword(), createStudentEducation(), deleteDocument(), getCollegeCourseDetail(), sendEmailOTP(), startCourseRegistration() (+14 more)

### Community 1 - "Study India Course Pages"
Cohesion: 0.09
Nodes (12): saveRefreshToken(), saveToken(), setRefreshToken(), setToken(), handleGoogleCallback(), handleSubmit(), toCanonicalUser(), handleInputChange() (+4 more)

### Community 2 - "Student Education & Utils"
Cohesion: 0.08
Nodes (15): deleteStudentEducation(), getStudentEducation(), getStudentProfile(), resolveCurrentUserIdFromStorage(), updateStudentProfile(), fetchEducationData(), fetchUserData(), handleDrop() (+7 more)

### Community 3 - "Profile & Dashboard"
Cohesion: 0.09
Nodes (16): decryptData(), encryptData(), getEncryptedUser(), migrateToEncryptedStorage(), removeEncryptedUser(), setEncryptedUser(), checkAuthState(), handleAuthChange() (+8 more)

### Community 4 - "Auth & Login Modals"
Cohesion: 0.09
Nodes (12): handleClose(), resetModal(), getRememberMePreference(), handleClose(), onClose(), handleCloseModal(), handleClose(), handleSubmit() (+4 more)

### Community 5 - "Login & Auth Pages"
Cohesion: 0.14
Nodes (13): checkDocumentCompliance(), getAllCourses(), handleAdvancedFiltersClick(), handleApplyNow(), handleClearAllFilters(), handleFilterChange(), handleKeyDown(), handlePageChange() (+5 more)

### Community 6 - "Toast & Notification Pages"
Cohesion: 0.13
Nodes (13): clearTokens(), handleAuthFailure(), confirmForgotPassword(), sendForgotPasswordOtp(), handleLeadFormSubmit(), handleSend(), handleValidate(), addToRemoveQueue() (+5 more)

### Community 7 - "Signup Flow"
Cohesion: 0.12
Nodes (10): savePendingSignup(), setRememberMePreference(), getGoogleAuthUrl(), signup(), handleGoogleLogin(), handleGoogleSignup(), handleSignup(), validateForm() (+2 more)

### Community 8 - "Study Destination Pages"
Cohesion: 0.2
Nodes (2): nextLogos(), prevLogos()

### Community 9 - "Course Search"
Cohesion: 0.14
Nodes (10): searchCollegeCourses(), CourseResultCard(), fetchCoursesFromApi(), findUniversityAndCourse(), createSlug(), getCardImageSrc(), mapCountriesToApi(), mapDurationToMonths() (+2 more)

### Community 10 - "Loading States"
Cohesion: 0.13
Nodes (1): Loading()

### Community 11 - "Search Filter Components"
Cohesion: 0.18
Nodes (4): getFilterOptions(), removeFilter(), toggleArrayFilter(), HorizontalFilters()

### Community 12 - "AI Chatbot"
Cohesion: 0.33
Nodes (7): generateAIResponse(), getContextualWelcome(), getPageContext(), handleKeyPress(), handlePopState(), handleSendMessage(), triggerProactiveHelp()

### Community 13 - "Online Study Pages"
Cohesion: 0.39
Nodes (7): handleDownloadGuide(), handleGetCounseling(), handleStartApplication(), nextCourses(), nextPartnerPage(), prevCourses(), prevPartnerPage()

### Community 14 - "User Dashboard"
Cohesion: 0.22
Nodes (2): Avatar(), if()

### Community 16 - "Student Community & Whiteboard"
Cohesion: 0.33
Nodes (2): draw(), startDrawing()

### Community 17 - "Post Search Filter Modal"
Cohesion: 0.38
Nodes (4): handleComplete(), handleCountryToggle(), handleInputChange(), handleNext()

### Community 19 - "Admin & College Dashboard"
Cohesion: 0.33
Nodes (1): getStatusColor()

### Community 21 - "College & University Detail"
Cohesion: 0.6
Nodes (3): getIconForStat(), nextImage(), prevImage()

### Community 22 - "Search Result Card"
Cohesion: 0.5
Nodes (2): getApplyUrl(), getCourseUrl()

### Community 28 - "Theme Selector"
Cohesion: 1.0
Nodes (2): applyTheme(), handleThemeChange()

### Community 29 - "Mobile Detection Hook"
Cohesion: 0.67
Nodes (1): useIsMobile()

### Community 71 - "Deployment Docs"
Cohesion: 1.0
Nodes (2): meritcap-user, OTP Frontend Deployment Test

## Knowledge Gaps
- **2 isolated node(s):** `OTP Frontend Deployment Test`, `meritcap-user`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Study Destination Pages`** (19 nodes): `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `nextLogos()`, `prevLogos()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Loading States`** (15 nodes): `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `loading.tsx`, `Loading()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `User Dashboard`** (9 nodes): `page.tsx`, `page.tsx`, `Avatar()`, `AvatarFallback()`, `formatDate()`, `handleLogout()`, `if()`, `Progress()`, `switch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Student Community & Whiteboard`** (7 nodes): `page.tsx`, `clearWhiteboard()`, `draw()`, `handleJoinRoom()`, `handleRejoinSession()`, `startDrawing()`, `stopDrawing()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin & College Dashboard`** (6 nodes): `page.tsx`, `page.tsx`, `getPriorityColor()`, `getScoreColor()`, `getStatusColor()`, `handleStatusUpdate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Search Result Card`** (5 nodes): `enhanced-result-card.tsx`, `formatFee()`, `getApplyUrl()`, `getCourseUrl()`, `handleFavorite()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Theme Selector`** (3 nodes): `theme-selector.tsx`, `applyTheme()`, `handleThemeChange()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mobile Detection Hook`** (3 nodes): `use-mobile.tsx`, `use-mobile.tsx`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Deployment Docs`** (2 nodes): `meritcap-user`, `OTP Frontend Deployment Test`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `setEncryptedUser()` connect `Profile & Dashboard` to `Study India Course Pages`, `Student Education & Utils`, `Auth & Login Modals`, `User Dashboard`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `toast()` connect `Toast & Notification Pages` to `API Client & Chat Route`, `Study India Course Pages`, `Student Education & Utils`, `Profile & Dashboard`, `Login & Auth Pages`, `Signup Flow`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `handleSubmit()` connect `Study India Course Pages` to `Profile & Dashboard`, `Login & Auth Pages`, `Toast & Notification Pages`, `Signup Flow`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `toast()` (e.g. with `handleApplyNow()` and `handleLeadFormSubmit()`) actually correct?**
  _`toast()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `handleSubmit()` (e.g. with `toast()` and `setRememberMePreference()`) actually correct?**
  _`handleSubmit()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `setEncryptedUser()` (e.g. with `handleLoginComplete()` and `processCallback()`) actually correct?**
  _`setEncryptedUser()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `OTP Frontend Deployment Test`, `meritcap-user` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._