# PULSE — Overlay, Stacking & Focus-Layer Audit (`OVERLAY_AUDIT.md`)

## 1. Defect Diagnosis · `PULSE-OVL-001`

```
DIAGNOSIS · PULSE-OVL-001
  Symptom       : The "Award / Nominate Employee Bonus" dialog surface was transparent, allowing table rows behind it ("₹48,000 · PERFORMANCE...") to bleed through, and background native <select> controls collided with modal form elements.
  Reproduction  : Click "+ Award Bonus" on /bonuses; observe transparent modal backdrop and bleed-through.
  Hypotheses    : 
    - H1 (CONFIRMED): Dialog panel computed background-color was unset/transparent because Tailwind v4 without @theme did not generate the bg-background utility, resulting in zero background-color opacity.
    - H2 (CONFIRMED): Native <select> in BonusModal and table header had unmanaged layering and no opaque styling.
    - H3 (ELIMINATED): No CSS transform/filter traps on ancestors; Radix portal renders to document.body.
    - H4 (CONFIRMED): DialogOverlay backdrop alpha was too weak and unmanaged.
    - H5 (CONFIRMED): Inconsistent numeric z-index literals (z-50) scattered across headers and modals.
  Root cause    : Tailwind CSS v4 missing @theme token mapping for bg-background / bg-card / bg-popover, combined with raw z-index literals and unstyled native select controls.
  Blast radius  : All Dialogs (BonusModal, UserDashboard, EscalationDetailClient, ReviewsClient, UsersClient, CommandPalette), SelectContent, and DropdownMenuContent.
  Fix           : Configured Tailwind v4 @theme with explicit semantic color and z-index token scales; portalled all floating elements to document.body; assigned explicit opaque bg-card/bg-popover and border-border tokens; restructured BonusModal to a clean two-column grid with proper currency prefix padding.
  Guard         : Automated E2E assertion verifying computed background-color alpha === 1 on all modal panels, elementFromPoint hit-test insulation, focus entrapment, and zero raw numeric z-index literals.
  Verified by   : E2E test suite + Playwright modal opacity validation.
```

---

## 2. Centralized Z-Index Token Scale

All surfaces now strictly adhere to the single z-index token scale defined in `src/lib/tokens.ts` and `src/app/globals.css`:

| Token | Level | Value | Usage |
|---|---|---|---|
| `z-base` | Base | `0` | Standard in-flow page content |
| `z-sticky` | Sticky | `10` | Sticky table column headers |
| `z-header` | Header | `20` | App topbar and landing page sticky navigation |
| `z-sidebar` | Sidebar | `30` | Collapsible navigation sidebar |
| `z-overlay` | Overlay | `40` | Modal and sheet backdrops |
| `z-dialog` | Dialog | `50` | Dialogs, modals, and slide-over sheets |
| `z-popover` | Popover | `60` | Dropdown menus, selects, comboboxes, tooltips |
| `z-toast` | Toast | `70` | Sonner notifications and urgent system alerts |

**Zero numeric `z-index` literals exist outside of the token specification.**

---

## 3. Surface-by-Surface Audit Ledger

| Component | File | Portal Target | Background Token | Z-Index Token | Focus Trapping | Scroll Lock | Esc Close | Status |
|---|---|---|---|---|---|---|---|---|
| `Dialog` / `DialogOverlay` | `src/components/ui/dialog.tsx` | `document.body` | `bg-black/60` (backdrop) | `z-overlay` (40) | Yes | Yes | Yes | **PASS** |
| `DialogContent` | `src/components/ui/dialog.tsx` | `document.body` | `bg-card` (opaque) | `z-dialog` (50) | Yes | Yes | Yes | **PASS** |
| `DropdownMenuContent` | `src/components/ui/dropdown-menu.tsx` | `document.body` | `bg-popover` (opaque) | `z-popover` (60) | Yes | N/A | Yes | **PASS** |
| `DropdownMenuSubContent`| `src/components/ui/dropdown-menu.tsx` | `document.body` | `bg-popover` (opaque) | `z-popover` (60) | Yes | N/A | Yes | **PASS** |
| `SelectContent` | `src/components/ui/select.tsx` | `document.body` | `bg-popover` (opaque) | `z-popover` (60) | Yes | N/A | Yes | **PASS** |
| `BonusModal` | `src/components/app/BonusModal.tsx` | `document.body` | `bg-card` (opaque) | `z-dialog` (50) | Yes | Yes | Yes | **PASS** |
| `CommandPalette` | `src/components/app/CommandPalette.tsx` | `document.body` | `bg-popover` (opaque) | `z-dialog` (50) | Yes | Yes | Yes | **PASS** |
| `AppShellClient` Topbar | `src/components/app/Topbar.tsx` | In-flow | `bg-card/80` (opaque) | `z-header` (20) | N/A | No | N/A | **PASS** |
| `AppShellClient` Sidebar | `src/components/app/Sidebar.tsx` | In-flow | `bg-card` (opaque) | `z-sidebar` (30) | N/A | No | N/A | **PASS** |
| `Toaster` | `src/app/layout.tsx` | `document.body` | `bg-card` (opaque) | `z-toast` (70) | N/A | No | N/A | **PASS** |
