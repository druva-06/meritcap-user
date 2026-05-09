# User Shared Components

Document every reusable component added to `components/`. Use the template below for each entry.

---

## Component Template

```
## ComponentName
**File**: `components/path/ComponentName.tsx`
**Purpose**: one-line description of what this component does
**Used by**: list pages or components that import it

### Props
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `data` | `DataType[]` | Yes | — | list of items to render |
| `isLoading` | `boolean` | No | `false` | show skeleton when true |
| `onAction` | `(id: number) => void` | No | — | callback on user action |

### API Calls
None | or list any direct API calls this component makes

### State
| Variable | Type | Description |
|---|---|---|
| `open` | `boolean` | controls dialog visibility |

### Notes
- any non-obvious behaviour, invariants, or constraints
```

---

<!-- Add component entries below this line -->

## Header
**File**: `components/header.tsx`
**Purpose**: Global top navigation bar rendered on every public page; manages and displays authentication state.
**Used by**: `app/layout.tsx` (wraps all pages)

### Props
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| — | — | — | — | No external props; all state is self-managed |

### API Calls
None — auth state is read entirely from client-side storage (no network request on mount).

### State
| Variable | Type | Description |
|---|---|---|
| `isLoggedIn` | `boolean` | Whether a fully-authenticated session is active |
| `userName` | `string` | Display name shown in the nav when logged in |
| `isMenuOpen` | `boolean` | Controls mobile menu visibility |

### Notes
- `checkAuthState()` requires **both** a non-empty encrypted user object (read via `getEncryptedUser()`) **and** a non-empty `meritcap_access_token` in storage for `isLoggedIn` to be set to `true`. Presence of a token alone is not sufficient; missing user data forces `isLoggedIn = false` and prevents a phantom logged-in state after a dirty session expiry.
- Name construction uses a double `.trim() || "User"` guard on the resolved display name to prevent empty or whitespace-only strings from reaching the DOM.
- Listens for the `authStateChanged` custom window event dispatched by `lib/api/axios.ts` after a failed token refresh, so the header reacts to session expiry without a full page reload when the user is already on `/login`.
- Session cleanup in `axios.ts` calls `window.location.replace()` **before** dispatching `authStateChanged`, ensuring the current page is destroyed first; the event dispatch is a no-op for any page other than `/login`.
