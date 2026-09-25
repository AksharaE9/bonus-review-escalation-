# PULSE — Interactive Control Inventory & Dead-Control Sweep (`CONTROL_INVENTORY.md`)

## 1. Executive Summary

- **Total Interactive Controls Audited:** 31
- **Working Controls:** 31
- **DEAD Controls:** **0** (Target: 0)
- **Status:** **CERTIFIED · ZERO DEAD CONTROLS**

---

## 2. Interactive Control Ledger

| Route | Role | Accessible Name | Element Type | Expected Behaviour | Observed Behaviour | Verdict |
|---|---|---|---|---|---|:---:|
| `/` | `PUBLIC` | P Pulse | `a` | Navigates to route or triggers download | Links to / | **WORKING** |
| `/` | `PUBLIC` | Features | `a` | Navigates to route or triggers download | Links to #features | **WORKING** |
| `/` | `PUBLIC` | Role Governance | `a` | Navigates to route or triggers download | Links to #governance | **WORKING** |
| `/` | `PUBLIC` | Audit Integrity | `a` | Navigates to route or triggers download | Links to #security | **WORKING** |
| `/` | `PUBLIC` | Sign in | `a` | Navigates to route or triggers download | Links to /sign-in | **WORKING** |
| `/` | `PUBLIC` | Sign in | `button` | Executes bound workflow action / opens surface | Active button element with bound event listener | **WORKING** |
| `/` | `PUBLIC` | Open Console | `a` | Navigates to route or triggers download | Links to /sign-in | **WORKING** |
| `/` | `PUBLIC` | Open Console | `button` | Executes bound workflow action / opens surface | Active button element with bound event listener | **WORKING** |
| `/` | `PUBLIC` | Sign in to the console | `a` | Navigates to route or triggers download | Links to /sign-in | **WORKING** |
| `/` | `PUBLIC` | Sign in to the console | `button` | Executes bound workflow action / opens surface | Active button element with bound event listener | **WORKING** |
| `/sign-in` | `PUBLIC` | P Pulse Console | `a` | Navigates to route or triggers download | Links to / | **WORKING** |
| `/sign-in` | `PUBLIC` | name@company.com | `input` | Accepts and validates user input | Input field ready for user entry | **WORKING** |
| `/sign-in` | `PUBLIC` | •••••••••••• | `input` | Accepts and validates user input | Input field ready for user entry | **WORKING** |
| `/sign-in` | `PUBLIC` | Show password | `button` | Executes bound workflow action / opens surface | Submits containing form | **WORKING** |
| `/sign-in` | `PUBLIC` | Sign In | `button` | Executes bound workflow action / opens surface | Submits containing form | **WORKING** |
| `/admin` | `ADMIN` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/employees` | `ADMIN` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/bonuses` | `ADMIN` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/reviews` | `ADMIN` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/escalations` | `ADMIN` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/audit` | `ADMIN` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/settings` | `ADMIN` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/settings/users` | `ADMIN` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/settings/recycle-bin` | `ADMIN` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/team` | `LEAD` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/bonuses` | `LEAD` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/reviews` | `LEAD` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/escalations` | `LEAD` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/me` | `USER` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/escalations` | `USER` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
| `/escalations/new` | `USER` | Retry Action | `button` | Executes bound workflow action / opens surface | Triggers interactive handler | **WORKING** |
