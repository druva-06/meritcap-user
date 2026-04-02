# 🤖 Copilot Instructions – Unified Project Standards

## 🚨 CORE PRINCIPLES (NON-NEGOTIABLE)

- NEVER remove or break existing features.
- NEVER degrade or change UI/UX unless explicitly required.
- ALWAYS preserve current design, layout, spacing, and behavior.
- ALL changes must be backward-compatible.
- Prefer scalable, maintainable, and production-ready code.

---

# 🎯 FRONTEND RULES (STRICT)

## 1. 🚫 NO MONOLITHIC PAGES

Problem:
Some pages (e.g., page.tsx) contain all logic and UI in a single file.

Rules:

- DO NOT keep everything in one file.
- If a file is large or complex → MUST split into smaller components.
- Any file greater than ~200–300 lines MUST be refactored.
- Large JSX blocks MUST be extracted into components.

Required Structure:

- components/ → reusable UI components
- hooks/ → custom hooks (if needed)
- utils/ → helper functions (if needed)

Example:
Instead of:
page.tsx (large file with all logic)

Refactor into:
page.tsx
components/
Header.tsx
Section.tsx
Card.tsx

Important:

- page.tsx must act only as a composition layer.
- Move UI and logic into components without breaking behavior.

---

## 2. 🧩 COMPONENTIZATION (MANDATORY)

- Each component must follow:
  - Single responsibility
  - Clean props interface
  - Reusability

Must:

- Extract repeated UI into reusable components
- Keep components small and readable

Must NOT:

- Create deeply nested JSX in one file
- Write large inline UI blocks (>50 lines)

---

## 3. 🎨 UI/UX PRESERVATION (CRITICAL)

- DO NOT alter:
  - Layout
  - Styling
  - Spacing
  - Colors
  - Fonts
  - User flow

Rules:

- UI must look exactly the same after refactoring
- Behavior must remain unchanged

Allowed:

- Internal code improvements
- Structural improvements (component splitting)

Not Allowed:

- Visual redesign
- Feature removal
- Layout shifts

---

## 4. 📱 RESPONSIVE DESIGN (MANDATORY)

Current Issue:
UI is mostly desktop-focused and must be improved.

Rules:
All UI must be responsive across:

- Mobile
- Tablet
- Laptop
- Large screens

Breakpoints:

- Mobile: < 640px
- Tablet: 640px – 1024px
- Desktop: > 1024px

Must:

- Use flexible layouts (flex, grid)
- Use relative units (%, rem, vw, vh)
- Ensure no overflow or broken UI

Must NOT:

- Use fixed widths like 1200px
- Break layout on smaller screens

Important:

- Responsiveness must be added WITHOUT changing desktop UI design.

---

## 5. 🔁 SAFE REFACTORING

When modifying existing code:

Must:

- Preserve all features
- Preserve API calls and integrations
- Keep logic intact

Approach:

- Extract components gradually
- Avoid rewriting entire files unnecessarily

---

## 6. ⚡ PERFORMANCE

- Avoid unnecessary re-renders
- Use memoization where required
- Lazy load heavy components when needed

---

## 7. 📂 NAMING CONVENTIONS

Use meaningful names:

- UserCard.tsx
- DashboardHeader.tsx

Avoid:

- Component1.tsx
- Temp.tsx

---

## 8. 🔄 REUSABILITY

Before creating new code:

- Check if similar component already exists
- Reuse or extend instead of duplicating

---

# 🧠 AI BEHAVIOR RULES (VERY IMPORTANT)

- Always analyze file size before editing
- If file is large → refactor into components first
- Do NOT dump all code into a single file
- Prefer modular architecture

---

# 🚀 EXPECTED OUTPUT FROM COPILOT

Copilot must:

- Break large pages into modular components
- Maintain 100% feature parity
- Preserve UI exactly as-is
- Improve responsiveness across all devices
- Produce clean, scalable, production-ready code
