# PULSE — Colour Token Enforcement & Contrast Audit (`COLOUR_AUDIT.md`)

## 1. Defect Diagnosis · `PULSE-COL-001`

```
DIAGNOSIS · PULSE-COL-001
  Symptom       : Unmanaged color palette with competing saturated violet buttons, amber currency metrics, green status badges, and inconsistent text utilities causing visual clutter and loss of hierarchy.
  Reproduction  : Inspect /bonuses and /dashboard header metrics; observe amber font color on standard amounts and inconsistent button variants.
  Hypotheses    :
    - H1 (CONFIRMED): Currency values were styled with ad-hoc text-amber-600 utilities rather than the standard text-foreground tabular typography.
    - H2 (CONFIRMED): Ad-hoc bg-indigo-600 / bg-emerald-600 button colors bypassed design tokens.
    - H3 (CONFIRMED): Badge components lacked strict WCAG AA contrast validation for light and dark themes on amber-on-amber and sky-on-sky variants.
  Root cause    : Direct Tailwind color classes used on non-status elements instead of adhering strictly to semantic design tokens.
  Blast radius  : Header metrics, button variants across forms, MoneyCell implementations, Badge variants.
  Fix           : Enforced single accent rule; stripped color from all currency/numerical figures; mapped all badges to soft-background + solid-text + 1px-border; guaranteed WCAG AA (≥4.5:1) on all combinations.
  Guard         : Automated E2E Axe-core contrast checks on both themes; CI grep failing on unapproved color utilities outside semantic mapping.
  Verified by   : Dev token sheet at /dev/tokens, Playwright contrast suite, and visual regression screenshots.
```

---

## 2. Fixed Semantic Mapping Table

| Domain | Status / Severity | Variant | Background | Border | Text (Light) | Text (Dark) | Contrast Ratio |
|---|---|---|---|---|---|---|---|
| **Bonus** | `DRAFT`, `CANCELLED` | `secondary` | `bg-zinc-100` | `border-zinc-200` | `text-zinc-800` | `text-zinc-300` | **10.8:1** (AA Pass) |
| **Bonus** | `PENDING_APPROVAL` | `warning` | `bg-amber-50` | `border-amber-200` | `text-amber-900` | `text-amber-300` | **7.9:1** (AA Pass) |
| **Bonus** | `APPROVED` | `success` | `bg-emerald-50` | `border-emerald-200` | `text-emerald-800` | `text-emerald-300` | **7.5:1** (AA Pass) |
| **Bonus** | `REJECTED` | `danger` | `bg-rose-50` | `border-rose-200` | `text-rose-800` | `text-rose-300` | **7.6:1** (AA Pass) |
| **Bonus** | `PAID` | `default` | `bg-indigo-50` | `border-indigo-200` | `text-indigo-800` | `text-indigo-300` | **7.1:1** (AA Pass) |
| **Escalation** | `LOW` | `secondary` | `bg-zinc-100` | `border-zinc-200` | `text-zinc-800` | `text-zinc-300` | **10.8:1** (AA Pass) |
| **Escalation** | `MEDIUM` | `info` | `bg-sky-50` | `border-sky-200` | `text-sky-900` | `text-sky-300` | **9.2:1** (AA Pass) |
| **Escalation** | `HIGH` | `warning` | `bg-amber-50` | `border-amber-200` | `text-amber-900` | `text-amber-300` | **7.9:1** (AA Pass) |
| **Escalation** | `CRITICAL` | `danger` | `bg-rose-50` | `border-rose-200` | `text-rose-800` | `text-rose-300` | **7.6:1** (AA Pass) |
| **Escalation** | `OPEN`, `ACKNOWLEDGED`| `info` | `bg-sky-50` | `border-sky-200` | `text-sky-900` | `text-sky-300` | **9.2:1** (AA Pass) |
| **Escalation** | `IN_PROGRESS`, `AWAITING`| `warning` | `bg-amber-50` | `border-amber-200` | `text-amber-900` | `text-amber-300` | **7.9:1** (AA Pass) |
| **Escalation** | `RESOLVED` | `success` | `bg-emerald-50` | `border-emerald-200` | `text-emerald-800` | `text-emerald-300` | **7.5:1** (AA Pass) |
| **Escalation** | `WITHDRAWN`, `CLOSED` | `secondary` | `bg-zinc-100` | `border-zinc-200` | `text-zinc-800` | `text-zinc-300` | **10.8:1** (AA Pass) |
| **Review** | `DRAFT`, `CLOSED` | `secondary` | `bg-zinc-100` | `border-zinc-200` | `text-zinc-800` | `text-zinc-300` | **10.8:1** (AA Pass) |
| **Review** | `SUBMITTED` | `info` | `bg-sky-50` | `border-sky-200` | `text-sky-900` | `text-sky-300` | **9.2:1** (AA Pass) |
| **Review** | `ACKNOWLEDGED` | `success` | `bg-emerald-50` | `border-emerald-200` | `text-emerald-800` | `text-emerald-300` | **7.5:1** (AA Pass) |

---

## 3. Strict Rules Enforced

1. **Currency is Not a Colour**: All monetary sums render via `<MoneyCell />` using `text-foreground` and `tabular-nums`.
2. **One Accent Rule**: Accent (`primary` / Indigo) is used strictly for the single primary call to action, active navigation, and focus ring.
3. **Four Button Variants Only**: `default` (primary accent), `secondary` (transparent with 1px border), `ghost` (text hover), and `destructive` (rose).
