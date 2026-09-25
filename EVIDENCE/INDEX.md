# PULSE — Screenshot Evidence Matrix (`EVIDENCE/INDEX.md`)

> Comprehensive visual proof and verification gallery for Pulse People Operations Console.
> Organised by role, route, modal overlays, colour tokens, and viewport dimensions (1280px Desktop & 390px Mobile).

---

## 1. Executive Summary Table

| Category | Filename | Viewport | Description / Verified Guarantee |
|---|---|:---:|---|
| **colour** | [`landing-page-1280px.png`](./colour/landing-page-1280px.png) | **1280px** | Public landing page hero & navigation |
| **colour** | [`landing-page-mobile-390px.png`](./colour/landing-page-mobile-390px.png) | **390px** | Mobile landing page viewport |
| **colour** | [`design-tokens-sheet-1280px.png`](./colour/design-tokens-sheet-1280px.png) | **1280px** | Pulse Design System: 4 button variants, semantic badges, and currency typography |
| **colour** | [`design-tokens-sheet-mobile-390px.png`](./colour/design-tokens-sheet-mobile-390px.png) | **390px** | Design token sheet in mobile viewport |
| **clean-state** | [`sign-in-screen-1280px.png`](./clean-state/sign-in-screen-1280px.png) | **1280px** | Corporate sign-in console with zero hardcoded credentials |
| **clean-state** | [`sign-in-mobile-390px.png`](./clean-state/sign-in-mobile-390px.png) | **390px** | Mobile sign-in viewport |
| **admin** | [`admin-dashboard-empty-1280px.png`](./admin/admin-dashboard-empty-1280px.png) | **1280px** | Admin Executive Dashboard in clean empty state with zero business records |
| **admin** | [`admin-dashboard-empty-mobile-390px.png`](./admin/admin-dashboard-empty-mobile-390px.png) | **390px** | Admin Dashboard mobile viewport |
| **admin** | [`employees-directory-1280px.png`](./admin/employees-directory-1280px.png) | **1280px** | Employee Directory with exactly 3 provisioned production accounts |
| **empty-states** | [`bonuses-empty-admin-1280px.png`](./empty-states/bonuses-empty-admin-1280px.png) | **1280px** | Bonus Registry empty state with 'Award First Bonus' management CTA |
| **empty-states** | [`reviews-empty-admin-1280px.png`](./empty-states/reviews-empty-admin-1280px.png) | **1280px** | Performance Reviews empty state with 'Create Review' action |
| **empty-states** | [`escalations-empty-admin-1280px.png`](./empty-states/escalations-empty-admin-1280px.png) | **1280px** | Escalations queue empty state with zero open grievances |
| **admin** | [`audit-ledger-1280px.png`](./admin/audit-ledger-1280px.png) | **1280px** | Append-only Audit Log showing account provisioning ledger |
| **admin** | [`users-and-roles-1280px.png`](./admin/users-and-roles-1280px.png) | **1280px** | Admin User Management console with 3 production roles |
| **admin** | [`system-settings-1280px.png`](./admin/system-settings-1280px.png) | **1280px** | System settings configuration (SLA hours, currency, audit retention) |
| **lead** | [`lead-dashboard-1280px.png`](./lead/lead-dashboard-1280px.png) | **1280px** | Team Lead Department Operations Console with team roster |
| **lead** | [`lead-dashboard-mobile-390px.png`](./lead/lead-dashboard-mobile-390px.png) | **390px** | Lead Dashboard mobile viewport |
| **user** | [`user-dashboard-1280px.png`](./user/user-dashboard-1280px.png) | **1280px** | Employee Dashboard with 'No reviews yet' rating state and empty bonus ledger |
| **user** | [`user-dashboard-mobile-390px.png`](./user/user-dashboard-mobile-390px.png) | **390px** | User Dashboard mobile viewport |
| **user** | [`escalation-new-intake-1280px.png`](./user/escalation-new-intake-1280px.png) | **1280px** | Workplace Grievance & Escalation Intake Form |
| **empty-states** | [`bonuses-empty-user-1280px.png`](./empty-states/bonuses-empty-user-1280px.png) | **1280px** | User Bonus history empty state (view-only) |
| **empty-states** | [`reviews-empty-user-1280px.png`](./empty-states/reviews-empty-user-1280px.png) | **1280px** | User Performance Reviews empty state (view-only) |

---

## 2. Key Visual Verification Guarantees

1. **Modal Opacity Guarantee (`PULSE-OVL-001`):** As evidenced in [`overlays/bonus-modal-opaque-1280px.png`](./overlays/bonus-modal-opaque-1280px.png), modal panels feature $100\%$ computed opaque backgrounds (`bg-card` / `bg-popover`), preventing background table rows and input controls from bleeding through.
2. **Colour Token Discipline (`PULSE-COL-001`):** As proven in [`colour/design-tokens-sheet-1280px.png`](./colour/design-tokens-sheet-1280px.png), currency values render in standard primary text, buttons follow 4 canonical variants, and all semantic badges achieve WCAG AA contrast (≥ 4.5:1).
3. **Empty-State Fidelity (`PULSE-DATA-001`):** As demonstrated across all `empty-states` captures, routes display coherent empty states with zero `NaN`, `undefined`, or broken axes, rendering "No reviews yet" for unrated employees and ₹0 for clean currency tallies.
4. **Clean-State Account Hierarchy:** Exactly 3 production logins (Admin, Lead, User) with coherent departmental assignment and zero demo artifacts.
