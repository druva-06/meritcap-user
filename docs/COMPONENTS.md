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
