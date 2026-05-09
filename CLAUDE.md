## Documentation Rule

**Update the relevant file in `docs/` after every change. Never skip documentation to finish faster.**

| Change | File |
|---|---|
| New or significantly changed page | `docs/PAGES.md` |
| New shared component | `docs/COMPONENTS.md` |
| New backend endpoint called by this frontend | `docs/API_USAGE.md` |

**Every new page in `PAGES.md` must include all of these sections** (template is at the top of that file):
- `Purpose` — one-line description
- `Auth` + `Roles` — who can access it
- `Components` — table of components used (name, file, purpose)
- `State & Data Fetching` — every state variable, its type, and where the data comes from
- `API Calls` — method, endpoint, what triggers it, and its purpose
- `User Flow` — numbered steps describing exactly what the user experiences end-to-end
- `Notes` — auth guards, redirects, edge cases

**Every new component in `COMPONENTS.md` must include:**
- `Purpose` + `Used by`
- `Props` table (name, type, required, default, description)
- `API Calls` (if any)
- `State` (if any)
- `Notes`

Rules:
- **Never write documentation directly in the main agent.** After all code changes are complete, spawn a `general-purpose` sub-agent via the `Agent` tool to write/update the doc files.
- The sub-agent prompt must include: what page/component was added or changed, which files were modified, which doc file(s) to update, and the relevant template from the top of the target doc file.
- Run the sub-agent in the background (`run_in_background: true`) so the main agent is not blocked.
- Create the doc file if it does not exist.

---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
