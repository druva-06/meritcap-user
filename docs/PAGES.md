# User Pages

Document every page added or significantly changed. Use the template below for each entry.

---

## Page Template

```
## /route
**Purpose**: one-line description of what this page does

**Auth**: Required | Public
**Roles**: STUDENT (list roles allowed; omit if public)

### Components
| Component | File | Purpose |
|---|---|---|
| `ComponentA` | `components/path/ComponentA.tsx` | what it renders |
| `ComponentB` | `components/path/ComponentB.tsx` | what it renders |

### State & Data Fetching
| Variable | Type | Source |
|---|---|---|
| `data` | `DataType[]` | `GET /api/endpoint` on mount |
| `isLoading` | `boolean` | local — controls skeleton |

### API Calls
| Method | Endpoint | Triggered by | Purpose |
|---|---|---|---|
| GET | /api/example | page mount | fetch initial data |
| POST | /api/example | form submit | create new record |

### User Flow
1. User navigates to the page → skeleton shown
2. `GET /api/example` resolves → content renders
3. User interacts → action triggered
4. On success: feedback shown, state updated
5. On error: error message shown inline

### Notes
- any non-obvious behaviour, auth guards, redirects, edge cases
```

---

<!-- Add page entries below this line -->
