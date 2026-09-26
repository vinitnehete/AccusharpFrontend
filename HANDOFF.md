# Accusharp HRMS Frontend — Handoff

Built: 2026-08-05. Updated: 2026-08-09 (auth/roles/permissions catch-up),
2026-08-16 (bulk employee onboarding: structure override, salary revision,
credentials export — see §10), 2026-08-17 (employee Category master + Gender/
UAN/ESIC/bank fields, Employee Master report full CSV export — see §14),
2026-08-22 (bulk-import CSV header detection, DAY_WISE overtime/earn-wage/
ESIC formula fixes, human-readable hours + totals in the attendance UI — see
§15).
GreyHR-style React frontend for the Accusharp HRMS Spring Boot backend. This doc
is for whoever picks this up next — what's here, how it's wired, what's
deliberately missing, and what to do first.

---

## 1. Quick start

Two servers, no build step needed for dev:

```bash
# Backend — H2 in-memory, no MySQL needed, seeds demo data + permissions on boot
cd Accusharp
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
```

```bash
# Frontend
cd Accusharpfrontend/accusharp
npm install   # first time only
npm start     # http://localhost:3000
```

CRA's dev server proxies `/api/*` to `http://localhost:8080` via the `"proxy"` key
in `package.json`. The backend now also has a real CORS filter
(`SecurityConfig.corsConfigurationSource`, allowing `http://localhost:3000` by
default via `app.cors.allowed-origins`) — the proxy is what dev uses day to day,
but a production deploy on a different origin from the API is no longer blocked
outright the way it used to be; just point `app.cors.allowed-origins` at the real
frontend origin.

**Login, not "Acting as."** The app now has a real login screen at `/login`.

**Correction as of 2026-08-16, verified by actually trying it**: this doc
previously listed `HR001`/`SUP001`/`EMP001`/`EMP002` as seeded logins. They do
**not** exist on a fresh boot of the backend as currently checked out —
`DataSeeder.seedOrganisation()` has its entire demo-company/employee block
commented out (only the four shifts and `platform_owner` actually seed; see
`Accusharp/src/main/java/com/accusharp/hrms/config/DataSeeder.java`). Logging
in as `HR001`/`Accusharp@123` returns "Invalid username or password," not a
working session. If that block gets re-enabled later this table becomes true
again, but don't take it on faith — check `DataSeeder.java` first.

The one login that reliably works out of the box is the platform account
(password **`Accusharp@123`**, see `Accusharp/SECURITY.md`):

| User ID | Role | Notes |
|---|---|---|
| `platform_owner` | Platform (`PLATFORM_OWNER`) | Not tied to any company — see §4a |

There is no seeded company `ADMIN` (and, currently, no seeded company at all).
To get an `ADMIN` account — the only way into the company-scoped UI right
now — log in as `platform_owner` and use **Onboard Company**
(`/platform/onboard`), which creates a new company plus its first `ADMIN`
employee and returns a one-time temporary password on screen. That new
company starts with zero departments/designations too — create at least one
of each (`Masters`) before `Add Employee` will let you submit, since both are
required fields with nothing to select otherwise. **Categories are the
exception** (as of 2026-08-17, §14): `DataSeeder.seedCategories()` runs
unconditionally on every boot, not gated behind the commented-out
`seedOrganisation()` block, so a fresh company already has five shared
categories (`WORKER`/`STAFF`/`SUPERVISOR`/`MANAGER`/`DIRECTOR`) to pick from —
and `categoryId` is optional on an employee besides, so it's never a blocker.

Production build: `npm run build` (compiles clean, zero warnings, ~584KB gzipped
main bundle — no code-splitting done, see §7).

---

## 2. What this is

A full HRMS UI covering all 15 backend modules: org masters, employees, shift
scheduling, biometric attendance, leave, payroll, salary slips, reports,
dashboard — plus the backend's full security/authorization layer: JWT login,
permission-gated navigation, admin password reset, dynamic custom roles, and the
audit log. Built against the backend's actual controller/DTO source (not just its
docs), so the API layer in `src/api/*` should match the backend exactly as of
this date.

**Real authentication, real authorization.** The backend enforces JWT auth and a
data-driven permission matrix (`PermissionCode` + `PermissionSeeder`) on every
`/api/**` route — see `Accusharp/SECURITY.md`. The frontend now matches: a login
screen issues and stores a JWT access/refresh token pair, every request carries
`Authorization: Bearer <token>`, and nav/page actions are gated by a
frontend-side mirror of the same role→permission matrix
(`src/constants/permissions.js`). This is real UX gating on top of a real API
boundary, not a decoration — a plain `EMPLOYEE` genuinely cannot reach
`EMPLOYEE_CREATE`-gated endpoints, gated or not, because the backend also refuses
them.

**Known, accepted gap**: there is no backend endpoint for a principal to
discover their own *custom-role*-granted permissions (see §4b) — nav gating is
therefore driven by the static base-role matrix, same as the backend's own fast
path. An employee who gained an extra capability purely through a custom role
won't get an extra nav item for it automatically, but the underlying API call
still works if they reach it by URL. This mirrors a documented limitation in the
backend itself (`Accusharp/ARCHITECTURE.md`'s "Not implemented" list), not
something introduced here.

---

## 3. Architecture

```
src/
  api/            One thin module per backend controller (companies.js, employees.js,
                   attendance.js, leaves.js, payroll.js, reports.js, auth.js,
                   customRoles.js, auditLogs.js, ...). Each function maps 1:1 to an
                   endpoint. client.js holds the axios instance, attaches the stored
                   JWT to every request, silently refreshes-and-retries once on a 401,
                   and a global error interceptor that surfaces backend ApiError.message
                   via notistack.
  context/        AuthContext — the real thing: tokens (persisted to localStorage),
                   principalType/username/role, the logged-in employee's own profile
                   ("me"), the full employee list (for pickers), login()/logout(),
                   and can(permissionCode). ActingAsContext is now a *compatibility
                   shim* over AuthContext (see §4c) — kept so the many pre-existing
                   pages that only ever read `employees`/role booleans/`actingAs`
                   didn't need to change.
  theme/          MUI theme (teal/navy palette, Inter font).
  layout/         AppLayout (sidebar + topbar shell, now with a real user menu -
                   change password / logout - instead of the old employee switcher),
                   navConfig.js (nav items with per-role visibility, plus a separate
                   platformNavConfig for PLATFORM_OWNER/PLATFORM_ADMIN principals).
  components/     Shared bits: DataTable (MUI DataGrid wrapper), PageHeader,
                   ConfirmDialog, StatCard, StatusChip, EmployeePicker /
                   EmployeeMultiPicker (Autocomplete over the employee list),
                   MoneyText (INR formatting), MasterCrudPage + MasterFormDialog
                   (generic list+dialog CRUD, now with a readOnly prop - see §4d),
                   ProtectedRoute (redirects to /login if not authenticated),
                   TempPasswordDialog (reveals a one-time temp password from
                   employee create/reset or company onboarding).
  pages/          One folder per module, routed from App.js. Multi-tab modules
                   (Masters, Roster, Attendance, Leave, Payroll) have a *Layout.jsx
                   that renders MUI Tabs + <Outlet/>. New: Auth/ (Login,
                   ChangePassword), Roles/ (RolesList, RoleDetail - custom role
                   permission editor), AuditLog/ (view + CSV export + purge),
                   Platform/ (OnboardCompany - Companies.jsx is reused for the
                   platform company list, see §4d).
  constants/      enums.js — every backend enum (EmployeeStatus, LeaveType, etc.)
                   with label/color mappings. permissions.js (new) — the
                   role→PermissionCode grant matrix, hand-transcribed from the
                   backend's PermissionSeeder.java; both are kept in sync with the
                   backend by hand.
  utils/          csv.js — client-side CSV export used by the Reports module.
                   download.js (new) — generic blob-download helper, used by the
                   audit log's server-generated CSV export. employeeTemplate.js
                   (new, §11) — builds the styled bulk-import .xlsx template
                   with exceljs.
```

**Routing**: React Router v7, all routes declared in `src/App.js`. `/login` is
public; everything else sits behind `<ProtectedRoute/>` (redirects to `/login` if
not authenticated) wrapping `<AppLayout/>`. The `/` route renders a small
`RootRedirect` that sends a platform principal to `/platform/companies` and a
plain `EMPLOYEE` to `/attendance/me` — neither holds `DASHBOARD_READ`, so neither
can land on the Dashboard. No lazy loading / code splitting.

**Data fetching**: Plain `useEffect` + local component state throughout. No
React Query / SWR / global cache. Every page re-fetches on mount. This was a
reasonable choice given the app's size, but means duplicate fetches across tab
switches (e.g. `/api/employees` refetches often — visible in the network tab).
Worth revisiting if the app grows.

---

## 4. What changed in the auth/roles/permissions catch-up (2026-08-09)

The backend landed ten phases of security work on `feature/attendance-to-
Security-` (JWT auth, permissions, multi-tenant isolation, audit logging,
admin password reset, dynamic custom roles — full detail in
`Accusharp/SECURITY.md`) while this frontend still assumed the old
unauthenticated backend (see the git history of this file / §2 in earlier
revisions). This section is what closed that gap.

### 4a. Two principal types, one login screen

`POST /api/auth/login` returns `{accessToken, refreshToken, principalType,
username, role}` for either an `Employee` (`ADMIN/HR/SUPERVISOR/EMPLOYEE`,
company-scoped) or a `PlatformUser` (`PLATFORM_OWNER/PLATFORM_ADMIN`, no
company). `AuthContext` treats both uniformly for token storage, but the UI
branches hard on `principalType`: a platform principal gets its own minimal
sidebar (`platformNavConfig` — Companies, Onboard Company, Audit Log) instead of
the full company nav, since it holds none of the company-scoped permissions.
`pages/Masters/Companies.jsx` is reused at both `/masters/companies` (company
side, read-only — see §4d) and `/platform/companies` (platform side, full CRUD)
rather than duplicating the page.

### 4b. Custom roles (Phase 10) get a UI

The backend's `CustomRoleController` (create a named role, grant it permissions,
assign it to employees) previously had no frontend at all — flagged as a gap in
`Accusharp/ARCHITECTURE.md`. Now: `/roles` (list + create, ADMIN-only) and
`/roles/:id` (a permission checklist grouped by resource — Employee, Leave,
Payroll, etc. — with platform-only codes like `COMPANY_CREATE` and
`AUDIT_MANAGE` omitted entirely, mirroring `CustomRoleService.setPermissions`'s
hard guard). Assignment to a specific employee lives on that employee's own
detail page (`EmployeeDetail.jsx`'s "Custom roles" card) rather than on the role
page, since the only backend lookup available is *by employee*
(`GET /api/roles/employees/{userId}`), not *by role* — there's no "which
employees have this role" endpoint to build a reverse listing from without an
O(n) fan-out over the whole employee list.

### 4c. `ActingAsContext` is now a compatibility shim, not a real feature

The old "Acting as" employee switcher (client-side only, didn't restrict any API
call) is gone. `AuthContext` is the real implementation now. Rather than touch
the ~21 page files that called `useActingAs()` for the employee list and role
booleans, `context/ActingAsContext.jsx` was rewritten to derive the identical
shape from `useAuth()` — `actingAs` is now the logged-in user's own record
instead of a manually-picked one, everything else is unchanged. If you're
touching one of those pages, know that `useActingAs()` is legacy naming for
"give me role info + the employee list," not a distinct piece of state.

### 4d. Companies master went from full CRUD to conditionally read-only

`COMPANY_CREATE/UPDATE/DELETE` are platform-only (`PermissionSeeder`) — a
company `ADMIN`/`HR` only ever held `COMPANY_READ`. The old Masters → Companies
page didn't know that and would have 403'd on every add/edit/delete for every
company-side user. `MasterCrudPage` gained a `readOnly` prop (hides the Add
button and the actions column); `Masters/Companies.jsx` passes
`readOnly={!isPlatform}`, so the exact same page is full CRUD at
`/platform/companies` and view-only at `/masters/companies`.

### 4e. One-time temporary passwords

`POST /api/employees` and `POST /api/employees/{id}/reset-password` both return
`{employee, temporaryPassword}` now (Phase 9) — the password is shown exactly
once and never recoverable after. `TempPasswordDialog` (new, generic) is the
single place this is displayed, reused for employee creation, admin-triggered
password reset (`EmployeeDetail.jsx`, gated behind `EMPLOYEE_UPDATE` — a plain
`SUPERVISOR` viewing a team member no longer sees an Edit or Reset-password
button, since they lack that permission and would have 403'd), and company
onboarding.

### 4f. Token handling

`localStorage` under one `accusharp.auth` key holds the whole `TokenResponse`.
`api/client.js`'s request interceptor attaches the access token to every call;
its response interceptor does a silent refresh-and-retry exactly once on a 401
(a shared in-flight promise so concurrent 401s don't each trigger their own
refresh call), and clears state + bounces to `/login` if the refresh itself
fails. `POST /api/auth/change-password` revokes every refresh token for that
principal server-side, so `ChangePassword.jsx` forces a logout immediately after
a successful change — there is no "stay logged in" option, by design.

---

## 5. Module → route map

| Module | Routes |
|---|---|
| Auth | `/login` (public), `/change-password` |
| Dashboard | `/` (redirects — see §3 — for `EMPLOYEE` and platform principals) |
| Masters | `/masters/companies` (read-only for company users), `/departments`, `/designations`, `/categories`, `/salary-rule`, `/attendance-rule` |
| Employees | `/employees`, `/employees/new`, `/employees/:id`, `/employees/:id/edit`, `/team` |
| Shifts | `/shifts` |
| Roster | `/roster/planner`, `/bulk`, `/auto-rotate`, `/copy-month`, `/swap` |
| Holidays | `/holidays` |
| Attendance | `/attendance/me`, `/attendance/generate`, `/attendance/records` |
| Leave | `/leave/apply`, `/my`, `/approvals`, `/all`, `/calendar`, `/balances`, `/leave/bulk-import` |
| Payroll | `/payroll/generate`, `/generate-all`, `/list`, `/history` |
| Salary Slips | `/salary-slips`, `/salary-slips/me` |
| Reports | `/reports` (hub) + 13 sub-routes under `/reports/*` |
| Contractors | `/contractors/list`, `/workforce`, `/roster`, `/attendance`, `/reports` — see §17 |
| Custom Roles | `/roles` (ADMIN-only), `/roles/:id` |
| Audit Log | `/audit-logs` (company ADMIN + platform) |
| Platform | `/platform/companies` (full Companies CRUD), `/platform/onboard` |

---

## 6. What was verified

Everything below was clicked through live against the H2-seeded backend over the
course of both build sessions, not just compiled.

**This session (auth/roles/permissions)**:

- Logged in as `HR001`, `SUP001`, `EMP002`, and `platform_owner`; confirmed
  correct landing page per role/principal type, correct nav visibility (the
  Security section — Custom Roles, Audit Log — is invisible to non-ADMIN;
  platform gets its own 3-item nav), and logout.
- Onboarded a new company as `platform_owner`, capturing the returned temp
  password and logging in as the new `ADMIN` with it.
- As that `ADMIN`: created a custom role, granted it `REPORT_READ`, confirmed no
  platform-only codes ever appear in the checklist, assigned the role to an
  employee from the employee detail page, saw the assignment take effect
  (`PUT /api/roles/{id}/permissions` → 200, role chip renders).
- Viewed the Audit Log: rows render scoped to the caller's own company, CSV
  export request succeeds, no Purge control is visible for a company `ADMIN`
  (`AUDIT_MANAGE` is platform-only) but is visible for `platform_owner`.
- Confirmed `Masters → Companies` is read-only (no Add button, no row actions)
  for a company `ADMIN`.
- Confirmed a `SUPERVISOR` viewing a direct report's detail page sees neither
  "Edit" nor "Reset password" (both need `EMPLOYEE_UPDATE`, which `SUPERVISOR`
  lacks).
- Changed password end-to-end: old session invalidated, forced back to
  `/login`, new password logs in successfully.
- `npm run build` — clean, no warnings, after every change.

Three real bugs were found and fixed during this pass, not just theorized about
— see §8.

**2026-08-16 (bulk employee onboarding — see §10)**:

- Onboarded a fresh company as `platform_owner` (the seeded-employee-login
  gap above was discovered doing exactly this), created a department and
  designation, then created an employee via `Add Employee` with the new "I
  already know the exact salary structure" toggle on — confirmed via
  `GET /api/employees/{id}` that Basic+DA landed at the typed value (14,000)
  rather than the rule-derived one (15,000, i.e. 50% of the 30,000 gross
  used), proving the override actually took effect and wasn't coincidence.
- Used that same employee to exercise `EmployeeDetail.jsx`'s new "Revise
  salary" dialog: confirmed it requires the four replacement structure
  fields (and refuses to submit without them) specifically because the
  employee was overridden, applied a revision (₹30,000 → ₹36,000, "Annual
  Increment"), and confirmed both the updated structure and a
  `+20%` row in the new "Salary revision history" table.
- Actually uploaded a CSV file through `BulkImportEmployees.jsx`'s real file
  input (via a scripted `DataTransfer`/`change` event, not just an API call)
  — a 3-row file with one fully-overridden row, one left blank to derive,
  and one with a missing required column. Result matched the backend
  exactly: 2 of 3 created, row 3's error (`employeeCode is required`) shown
  in the results table, and the two successful employees independently
  verified via the API to have exactly the override vs. derive behavior
  each row asked for.
- Checked browser console/network after each of the above — no errors
  traceable to the new code (a few 401/404s were stale-session artifacts
  from restarting the backend mid-session with a fresh in-memory DB while
  an old token was still cached; resolved by logging out and back in).
- `npm run build` (`CI=true`, warnings-as-errors) — clean.

**Prior session (initial build, 2026-08-05)**: created an employee, bulk-
assigned a shift roster, generated and corrected attendance, ran leave apply →
supervisor-endorse → HR-approve end to end, generated payroll and read the
breakdown, viewed a salary slip (including a negative-net-pay edge case),
spot-checked all 13 report pages.

**Not exercised** (either session): payroll `/regenerate` after a real
conflict, attendance `/unlock` after a payroll lock, shift auto-rotate/copy-
month/swap submitted for real, CSV export *file contents* (download triggers
were confirmed, the files themselves weren't opened), print view rendering
(confirmed 200 + correct content-type, not screenshotted), and proactive
access-token expiry (the refresh-on-401 *code path* is exercised implicitly by
normal use, but a token wasn't deliberately expired to watch the refresh fire).

---

## 7. Known gaps / things to do before real use

1. **Token storage is `localStorage`, not an httpOnly cookie.** Standard
   tradeoff for a bearer-token SPA with no server-side session — fine for this
   app's threat model today, but worth knowing if XSS resistance becomes a
   requirement later.
2. **No self-discovery of custom-role-granted permissions** — see §2/§4b. Nav
   only reflects the base-role matrix; someone with an extra permission via a
   custom role can use it (the API allows it) but won't see a nav item for it.
3. **Bundle size** (~584KB gzipped) has no code-splitting. Route-based
   `React.lazy()` would help, especially for the Reports module (13 rarely-all-
   used pages bundled together).
4. **No tests.** Zero unit/integration tests were written for the frontend. The
   backend has its own (`Accusharp/TESTING.md`, `./mvnw test`), but the React app
   has none — this now includes zero coverage of the auth flow, which is the
   highest-value thing to add tests for next.
5. **Duplicate fetching** — see §3. Consider a shared data layer if this grows.
6. **MUI v9 quirks** — this environment has MUI v9 (newer than what most
   documentation assumes). Breaking changes bit us during the original build,
   fixed everywhere they occurred, but worth knowing before adding new code:
   - `Stack` no longer accepts `alignItems` / `justifyContent` / `flexWrap` as
     direct props — they must go inside `sx={{ ... }}` or they silently leak
     onto the DOM node as invalid attributes (React warns in the console).
   - `Autocomplete`'s `renderTags` prop was renamed to `renderValue`, with a
     different callback signature (`(value, getItemProps, ownerState)` instead
     of `(value, getTagProps)`). See `src/components/EmployeeMultiPicker.jsx`
     for the working pattern.
   - `ListItemText`'s `primaryTypographyProps` → `slotProps={{ primary: {...} }}`.
7. **Two implementations of the same bulk-import credentials export.**
   `BulkImportEmployees.jsx`'s "Download passwords CSV" button already builds
   the credentials CSV client-side from the JSON response (`utils/csv.js`).
   The backend separately added `?format=csv` on
   `POST /api/employees/bulk-import` (`Accusharp/SECURITY.md`'s Phase 11)
   that does the same thing server-side. Neither was removed — the frontend
   one works fine and wasn't broken, so wiring in the backend one would have
   been redundant, not a fix. Worth knowing if either one changes: they can
   silently drift out of sync (e.g. one includes a column the other
   doesn't), since nothing enforces they stay identical.
8. **Automated browser clicks on MUI popovers were unreliable** during both
   build sessions — screenshot-space coordinates didn't map cleanly to the real
   viewport for `Select`/`Autocomplete` menus opened via synthetic mouse
   coordinates. Ref-based clicks (from `read_page`) and direct DOM dispatch
   worked reliably; keep that in mind if scripting further browser-driven QA.

---

## 8. Bugs found and fixed during this build

### Backend (initial session, 2026-08-05)

`GET /api/holidays` threw a 500 (`LazyInitializationException`) as soon as any
holiday existed, because `Holiday.company` is a lazy `@ManyToOne` and the backend
runs with `spring.jpa.open-in-view=false` — the Hibernate session was closed
before Jackson tried to serialize the lazy `company` proxy on the list endpoint.

Fixed in the backend (not the frontend) by adding a `JOIN FETCH` query:

- [`Accusharp/src/main/java/com/accusharp/hrms/repository/HolidayRepository.java`](../../Accusharp/src/main/java/com/accusharp/hrms/repository/HolidayRepository.java) —
  added `findAllWithCompany()` and made the date-range finder also fetch `company`.
- [`Accusharp/src/main/java/com/accusharp/hrms/service/HolidayService.java`](../../Accusharp/src/main/java/com/accusharp/hrms/service/HolidayService.java) —
  `getAll()` now calls `findAllWithCompany()`.

Single-record POST/PUT responses were never affected (the service sets a fully
loaded `Company`, not a lazy proxy, when creating/updating).

### Frontend (this session, 2026-08-09)

All three were caught by actually driving the app in a browser against the live
backend, not by reading the code:

- **`EmployeeForm.jsx` create response.** `POST /api/employees` changed shape to
  `{employee, temporaryPassword}` (Phase 9) but the form still did
  `navigate(`/employees/${res.id}`)`, which would have silently navigated to
  `/employees/undefined`. Fixed alongside adding the temp-password reveal.
- **`Masters/Companies.jsx` full CRUD 403s for company users** — see §4d.
- **Intermittent blank landing page for a plain `EMPLOYEE` right after login.**
  `Login.jsx` had both an imperative `navigate()` in its submit handler *and* a
  declarative `<Navigate>` for the `isAuthenticated` case, which raced against
  `RootRedirect`'s own `<Navigate>` at `/`. Depending on render timing, the
  browser could end up on `/` with `RootRedirect` never actually completing its
  own redirect and the page rendering blank. Fixed by deleting the imperative
  call entirely — `isAuthenticated` flipping true after `login()` resolves is
  enough on its own to trigger the declarative branch.

---

## 9. Suggested next steps, roughly in priority order

1. Write smoke-level tests for the auth flow (`AuthContext`, `client.js`'s
   refresh-on-401 logic) and the API layer (`src/api/*`) — the highest-value
   untested surface right now, see §7.4.
2. Decide whether the custom-role self-discovery gap (§2/§4b/§7.2) needs
   closing — it needs a new backend endpoint, not just a frontend change.
3. Code-split the Reports module and Payroll/Attendance consoles with
   `React.lazy()` to bring down initial bundle size.
4. Revisit data fetching — a shared cache (React Query or similar) would cut
   the duplicate `/api/employees` calls visible on nearly every navigation.
5. Consider a forced-password-change flag for temporary passwords (backend
   doesn't set one yet — see `Accusharp/SECURITY.md`'s onboarding section) so
   the frontend can route a first-login temp-password user straight to
   `/change-password` instead of trusting them to do it themselves. Revisited
   and explicitly declined for now during §10's backend work — still open.

---

## 10. Bulk employee onboarding: structure override, salary revision, credentials export (2026-08-16)

The backend added three related things on top of Phase 9-11's work
(`Accusharp/SECURITY.md`): a way to supply an employee's exact salary
structure at create time instead of always deriving it, an audited way to
change gross salary (a "salary revision"), and a downloadable credentials
sheet for bulk imports. This section wires the frontend to all three.

### 10a. Structure override, now reachable from create — not just after

`EmployeeService.applyStructureOverride` on the backend accepts `basicDA`/
`hra`/`conveyanceAllowance`/`educationAllowance` directly on
`POST /api/employees` (and each CSV row of `POST /api/employees/bulk-import`)
as an alternative to deriving them from the salary rule — all four together
or none, never a subset. Before this, the *only* way to pin those four
values was `EmployeeDetail.jsx`'s existing post-creation "Override" dialog
(`PUT /api/employees/{id}/salary-structure`), which is still there and
unchanged.

`EmployeeForm.jsx` gained an "I already know the exact salary structure"
switch, shown only when creating (not editing) — flipping it reveals the
four fields inline in the Salary inputs card. `requiredOk` and the submit
payload both respect it: off, the four fields are omitted from the request
entirely (server behaves exactly as before this existed); on, all four
become required client-side too, so a half-filled toggle can't reach the
server and trigger its all-or-nothing rejection.

`BulkImportEmployees.jsx`'s CSV template, expected-header alert, and
`TEMPLATE_EXAMPLE` all gained the same four columns, left blank in the
downloadable example so it still demonstrates the "derive as usual" path.

### 10b. Salary revision — a fourth action on the Salary structure card

`EmployeeDetail.jsx`'s Salary structure card gained a "Revise salary" button
(next to the existing "Override"/"Regenerate from rule" pair) opening a
dialog for `POST /api/employees/{id}/salary-revision`: new gross salary,
effective date, reason (`SALARY_REVISION_REASON` — new in
`constants/enums.js`, mirroring the backend's `SalaryRevisionReason` enum),
and optional remarks.

The one piece of real logic: the dialog reads `emp.salaryStructureOverridden`
and, when true, requires (and submits) the four replacement structure
fields in the same request — because the backend's re-derivation is skipped
entirely for an overridden employee (same rule §10a's toggle relies on), so
a gross-salary change alone would otherwise leave the structure silently
stale. This isn't a frontend judgment call; it mirrors
`EmployeeService.reviseSalary`'s own validation exactly, including the 400
if those four are missing when required.

A new "Salary revision history" card (below Salary structure, same column)
lists every past revision — effective date, reason, previous → new gross,
computed hike %, who applied it — from
`GET /api/employees/{id}/salary-revisions`, loaded alongside the employee
record on page load.

`api/employees.js` gained `reviseSalary(id, payload)` and
`getSalaryRevisions(id)` for these.

### 10c. Bulk-import credentials export — already solved, left alone

The backend's `?format=csv` on `POST /api/employees/bulk-import` (a
downloadable credentials sheet, for when a batch is too large to read temp
passwords out of the JSON response by eye) was **not** wired into the
frontend. `BulkImportEmployees.jsx` already builds the identical CSV
client-side from the JSON response it already has (`handleDownloadPasswords`,
using `utils/csv.js`) — that predates this session and works fine, so
adding the backend call would have been a second, redundant implementation
of the same button. See §7.7 for the maintenance note this leaves behind.

### 10d. A real gap found while verifying, not introduced by this work

Logging in as `HR001`/`Accusharp@123` to test any of the above failed
outright — see the corrected §1. The seeded demo org
(`DataSeeder.seedOrganisation()`) is currently commented out in the backend,
so there is no seeded company, department, designation, or non-platform
login at all on a fresh boot. Every screenshot and API check in §6's
2026-08-16 entry was done against a company onboarded fresh via
`platform_owner` for exactly this reason. Whoever re-enables that seeding
block later should re-add the `HR001`/`SUP001`/`EMP001`/`EMP002` table to
§1.

---

## 11. Bulk-import CSV number parsing + a styled xlsx template (2026-08-16)

A real user's payroll export failed bulk import with
`grossSalary must be a number, got '41,000.00'` — Excel/Sheets exports
numeric columns with thousands separators by default, and the CSV parser was
feeding that string straight into `BigDecimal`/`Long` with no cleanup. The
values weren't actually invalid; the parser just couldn't read Excel's
number formatting.

### 11a. Backend: numeric columns now tolerate Excel-style formatting

`EmployeeCsvParser.parseDecimal`/`parseLong` and `PayrollCsvParser.parseDecimal`
(`Accusharp/src/main/java/com/accusharp/hrms/util/`) strip commas, `₹`/`$`
symbols, and stray whitespace before parsing — `"41,000.00"`, `"₹ 41,000.00"`,
and `"$15,000.00"` all now parse the same as `"41000.00"`. Genuinely
non-numeric text (`"notanumber"`) still fails with the same error as before;
only formatting decoration is tolerated. Covered by two new cases in
`EmployeeCsvParserTest` (`parsesThousandsSeparatedNumbers`,
`parsesCurrencyDecoratedNumbers`). See `Accusharp/README.md` §3.4.2 and
`Accusharp/TESTING.md`'s "Bulk & CSV endpoints" for the corresponding doc
updates.

### 11b. Frontend: the CSV template became a styled xlsx template

The old "Download template" button (`BulkImportEmployees.jsx`) generated a
plain CSV built inline from `TEMPLATE_COLUMNS`/`TEMPLATE_EXAMPLE` (added in
§10a). Those constants are gone — replaced by `utils/employeeTemplate.js`
(new dependency: `exceljs`), which builds a styled `.xlsx` instead:

- Required columns (`userId`, `employeeCode`, `employeeName`, `status`,
  `grossSalary`, `pfBasic`, `medicalAllowance`, `otherAllowance`) render in
  bold red with a trailing ` *`; everything else is plain bold.
- Columns are grouped under two colored banner rows, "Employee Information"
  and "Salary Structure" (cosmetic only — the backend parser matches columns
  by name, not position).
- `status`/`recordStatus`/`role`/`overtimeEligible` get dropdown data
  validation (200 rows) instead of relying on the user to type an exact enum
  value.
- The previously-missing `recordStatus` column (the parser has always
  accepted it; the old CSV template just never listed it) is now included.
- Row 2 is an instruction banner telling the user to `File → Save As → CSV`
  before uploading, since the upload endpoint itself still only accepts
  `.csv` — this template is fill-then-export, not fill-then-upload directly.
  (A direct-.xlsx-upload path was considered and explicitly declined for now
  — it would need a new backend parser and an accept-type change on
  `CsvFileField`, more surface area than the ask called for.)

Verification for this section was lighter than §6's: `EmployeeCsvParserTest`
passes (backend), the frontend compiles and serves with no console errors
(the app has no route-level code-splitting, so a broken `exceljs` import
would have broken the whole bundle, not just this page), and the actual
generated workbook was inspected by running `employeeTemplate.js`'s logic
standalone through `exceljs` and reading the output back (correct fonts,
fills, merges, and dropdown validations). **Not done:** logging into the
running app and clicking the button for real — see §10d, the same
seeded-org gap blocked it here too.

---

## 12. Attendance rule: the same per-company config `SalaryRule` has, for attendance (2026-08-16)

The app exists to let each customer customize their own attendance
handling, but `AttendanceCalculationService` had three constants
(`entryWindowBufferMinutes`, `fullDayThresholdPercent`,
`halfDayThresholdPercent`) hardcoded identically for every company - the only
attendance-calculation values that weren't already per-company. `Shift`
(grace period, break minutes, overtime window, timings) and `Holiday` were
already company-scoped with a global-default fallback; `SalaryRule` has the
same shape for payroll. This section gives attendance the same treatment.

### 12a. Backend: new `AttendanceRule`, mirroring `SalaryRule` exactly

New entity/repository/service/controller in `Accusharp/src/main/java/com/accusharp/hrms/`
(`entity/AttendanceRule.java`, `repository/AttendanceRuleRepository.java`,
`service/AttendanceRuleService.java`, `controller/AttendanceRuleController.java`,
`dto/AttendanceRuleRequest.java`) - one row per company plus a
`company IS NULL` global default, resolved through `TenantContext` exactly
like `SalaryRuleService`. New permissions `ATTENDANCE_RULE_READ`/`_MANAGE`,
granted to HR/ADMIN only (same tier as `SALARY_RULE_*`).

`AttendanceCalculationService.calculateDay`/`windowStart` now take an
`AttendanceRule` parameter instead of reading `private static final`
constants; `AttendanceService` resolves the caller's (or the target
employee's) company's rule once per call and threads it through
`windowed`/`computeFromPunches`/`correctDay`. `halfDayThresholdPercent` must
be less than `fullDayThresholdPercent` - validated server-side, same
cross-field-validation shape as other business rules in this app (a plain
`BusinessRuleException`, not a bean-validation annotation, since it compares
two fields against each other).

Introducing a fourth company-FK'd table broke every other HTTP test's
`companyRepository.deleteAll()` cleanup the same way `SalaryRule` originally
would have - any earlier test class's leftover per-company `AttendanceRule`
row blocks deleting the company it points at. Fixed by adding
`attendanceRuleRepository.deleteAll()` alongside each existing
`salaryRuleRepository.deleteAll()` call (`SelfServiceScopingHttpTest`,
`CustomRoleHttpTest`, `EmployeeSalaryRevisionHttpTest`,
`CompanyOnboardingHttpTest`, `EmployeeSalaryStructureHttpTest`,
`TenantIsolationHttpTest`) - `CompanyOnboardingHttpTest`'s own Javadoc
already documents exactly why this class of fix is needed (shared H2
instance across test classes in one Maven run).

New `AttendanceRuleHttpTest` (backend) proves per-company isolation (mirrors
`EmployeeSalaryStructureHttpTest`'s pattern for `SalaryRule`) and, more
importantly, that the rule actually changes what `POST /api/attendance/generate`
computes: the same two punches land as `ABSENT` under the default 40%
half-day threshold and `HALF_DAY` after lowering it to 25%, with no shift or
code change in between. Two new unit tests in the existing
`AttendanceCalculationServiceTest` cover the same thing at the calculation
layer directly. Full backend suite: 126 tests across 18 classes, all
passing.

### 12b. Frontend: a fourth Masters tab

`api/attendanceRules.js` and `pages/Masters/AttendanceRule.jsx` mirror
`salaryRules.js`/`SalaryRule.jsx` exactly - three fields
(`entryWindowBufferMinutes`, `fullDayThresholdPercent`,
`halfDayThresholdPercent`), same load/save/skeleton/error pattern. Added as
a fourth tab in `MastersLayout.jsx` and routed at `/masters/attendance-rule`
in `App.js`. `constants/permissions.js` gained `ATTENDANCE_RULE_READ`/`_MANAGE`
in both `HR_ADMIN_PERMISSIONS` and `PERMISSION_CODES`, mirroring the backend
`PermissionSeeder` change.

Unlike `SalaryRule.jsx`, there's no "regenerate all" shortcut button - the
existing `Attendance → Generate` page already re-runs generation for a
chosen month/employees, and duplicating that here would be a second
implementation of the same action for no reason. The page's info banner
points there instead.

Verification: same shape as §11b - the backend HTTP test proves the
underlying behavior end-to-end, and the frontend compiles/serves with no
console errors (again, no code-splitting, so a broken import here would
have broken the whole app, not just this page). **Not done:** logging in
and clicking through the actual page - blocked by the same seeded-org gap
as §10d and §11b.

---

## 13. HR entering an already-approved leave directly, plus its CSV bulk variant (2026-08-16)

The ask: HR/Admin should be able to backfill a leave for a day that already
happened - an employee took time off informally, and at month-end HR wants
attendance/payroll to reflect it correctly - without forcing that through
the full apply → supervisor-endorse → HR-approve chain the self-service
`Apply` page uses. Same "HR bypasses the normal state machine" shape as
§12's `AttendanceRule` work and, further back, `AttendanceService.correctDay`
- but for leave, not attendance.

### 13a. Backend: a second entry point into `APPROVED`, not a second workflow

New `POST /api/leaves/hr-create` (`Accusharp/src/main/java/com/accusharp/hrms/`,
`LeaveService.hrDirectCreate` + `dto/LeaveHrDirectRequest.java`) skips
`apply`/`supervisorApprove` entirely: same date/overlap/balance validations
`apply` runs - **hard-blocks on insufficient balance**, the option chosen
over letting a manual entry silently overdraw it - then goes straight to
`APPROVED` and consumes balance immediately, same as `approve` does. Gated
by the existing `LEAVE_APPROVE` permission (no new permission code - if you
can approve a leave, you can enter one directly). CSV bulk variant is
`POST /api/leaves/bulk-import` (`LeaveCsvParser`, header
`userId,leaveType,fromDate,toDate,duration,reason`), same
`BulkImportResult`-per-row shape as every other bulk/CSV endpoint in this
app.

The one schema change: `LeaveRequest` gained an `origin` column
(`SELF_SERVICE`/`HR_DIRECT`, new enum `LeaveOrigin`) - nothing previously
distinguished an HR-direct-approved leave from a normally-approved one once
both sit at `APPROVED`, the same gap `DailyAttendance.recordStatus`
(`GENERATED`/`MANUAL`) already closes for attendance. `LeaveResponse` grew
an `origin` field to carry it to the frontend.

New `LeaveHrDirectHttpTest` proves: a direct entry lands `APPROVED` with
`origin=HR_DIRECT` and consumes balance immediately; it hard-blocks past the
12-day CASUAL_LEAVE quota with the same message self-apply would give; a
plain EMPLOYEE gets 403; the bulk CSV endpoint handles a mixed
success/overlap/bad-date/unknown-type file the same independent-row way the
employee bulk import does; and - the part that actually matters - a leave
entered this way is picked up by `GET /api/attendance/{userId}` as
`ON_LEAVE`, identical to one that went through the normal chain, with no
extra wiring needed (`LeaveCalculationService` only ever filtered by
`status == APPROVED` and date range, never by provenance). Full suite: 131
tests across 19 classes, all passing.

### 13b. Frontend: an "Add leave" dialog and a bulk-import page

`api/leaves.js` gained `hrDirectCreate`/`bulkImport` (the latter mirrors
`employees.js`'s `bulkImport` exactly, including the `'Content-Type':
undefined` trick so the browser sets the multipart boundary itself).

New `components/AddLeaveDialog.jsx` - a form dialog (employee picker, leave
type, duration, from/to date, reason) wired into `AllLeaves.jsx`'s new "Add
Leave" button. On success it switches the status filter to `APPROVED` so
the new row is visible immediately rather than landing silently in whatever
status the current filter excludes. `AllLeaves.jsx` also gained an `origin`
column (renders "HR entered" vs "Self-service") and a "Bulk Import" button
routed to a new standalone page, `pages/Leave/BulkImportLeaves.jsx` -
outside `LeaveLayout`'s tabs, same as `BulkImportEmployees.jsx` sits outside
`MastersLayout`'s. Its template is a plain CSV (`utils/csv.js`'s
`downloadCsv`), not a styled `.xlsx` like §11's employee template - a
deliberate scope call: this CSV has one free-text column (`userId`) against
mostly enums and dates, a much smaller surface for the kind of formatting
mistakes the xlsx template's red-required-fields/dropdowns were built to
prevent, so building a second `exceljs` generator for it wasn't worth the
duplication.

Verification: same shape as §11b/§12b - the backend HTTP test proves the
underlying behavior end-to-end, and the frontend compiles/serves with no
console errors. One real hiccup this time: the dev server on :3000 (left
running from §12's session) was accepting TCP connections but not actually
responding - a hung `react-scripts start` process, not a code issue. Killed
it and started fresh; not something to read into. **Not done:** logging in
and clicking through the actual page - the same seeded-org gap as §10d,
§11b and §12b.

---

## 14. Employee Category master + Gender/UAN/ESIC/bank fields, full CSV export (2026-08-17)

The ask: six new fields on the employee record - Category (a company-defined
grade: Worker/Supervisor/Manager/Director/...), Gender, UAN No, ESIC IP No,
Bank Account No, Bank IFSC No - all optional, "apply everywhere we use this
emp." Category was explicitly asked to work "like department and designation"
- a company-manageable catalog, not a fixed enum - so it got the full
`Department`/`Designation` treatment rather than being folded into
`EmployeeStatus`-style enum.

### 14a. Backend: a fourth master mirroring `Department`/`Designation` exactly

New `Category` entity/repository/service/controller/DTO
(`Accusharp/src/main/java/com/accusharp/hrms/{entity,repository,service,
controller,dto}/Category*.java`) at `/api/categories` - same per-company +
`company IS NULL` shared-row shape, same code-uniqueness/read/write-scoping
rules as `Department`. New permissions `CATEGORY_MANAGE`/`CATEGORY_READ`,
granted HR/ADMIN (manage) and also SUPERVISOR/EMPLOYEE (read-only) in
`PermissionSeeder` - identical placement to `DEPARTMENT_*`/`DESIGNATION_*`.
`DataSeeder.seedCategories()` seeds five shared defaults (`WORKER`, `STAFF`,
`SUPERVISOR`, `MANAGER`, `DIRECTOR`) unconditionally on every boot - see the
correction added to §1 above for why that's unlike department/designation.

`Employee` gained `category` (FK, nullable), `gender` (new enum `Gender`:
`MALE`/`FEMALE`), `uanNo`, `esicIpNo`, `bankAccountNo`, `bankIfscNo` (plain
optional strings, no validation beyond a max length) - threaded through
`EmployeeRequest` → `EmployeeService.apply()` → `EmployeeMapper` →
`EmployeeResponse`, and through `EmployeeCsvParser`'s CSV header (all six
new columns optional, same as every other non-required column). Full
backend suite: 133 tests across 20 classes, all passing.

### 14b. Frontend: Categories tab, employee form/detail, report export

`api/categories.js` + `pages/Masters/Categories.jsx` mirror
`departments.js`/`Departments.jsx` exactly (`createCrudApi` + `MasterCrudPage`)
- added as a fifth `MastersLayout` tab, routed at `/masters/categories`.

`EmployeeForm.jsx` gained a Category select (Organisation card, optional -
unlike the required Department/Designation selects) and a Gender select
(Identity card), plus a new "Statutory & bank details" card (UAN No, ESIC IP
No, Bank Account No, Bank IFSC No) - all four plain optional text fields,
none affect `requiredOk` or any calculation. `EmployeeDetail.jsx` mirrors the
same two additions for display. `EmployeeList.jsx`/`MyTeam.jsx`/
`Reports/EmployeesReport.jsx` each gained a Category column, consistent with
their existing Department/Designation columns.

`constants/enums.js` gained `GENDER = ['MALE', 'FEMALE']`.
`constants/permissions.js` gained `CATEGORY_MANAGE`/`CATEGORY_READ` in
`HR_ADMIN_PERMISSIONS`, the `SUPERVISOR`/`EMPLOYEE` read-only lists, and
`PERMISSION_CODES` (the custom-role checklist source) - **this was nearly
missed**: nothing in the UI currently calls `can('CATEGORY_READ')` directly
(Masters tabs are gated by role via `navConfig.js`, not by permission code),
so the app would have run fine without this, but `RoleDetail.jsx`'s
custom-role permission checklist reads straight from `PERMISSION_CODES` -
without this fix, an ADMIN building a custom role would never see
`CATEGORY_MANAGE`/`CATEGORY_READ` as grantable options at all, even though
the backend fully supports granting them. Caught by re-reading this file's
own §3 note that `permissions.js` "must be kept in sync with the backend by
hand" - worth remembering for the *next* new permission code too, since
nothing enforces this automatically.

`utils/employeeTemplate.js`'s bulk-import `.xlsx` template gained the same
six columns (`categoryId`, `gender` with dropdown validation, `uanNo`,
`esicIpNo`, `bankAccountNo`, `bankIfscNo`), all optional. This pushed the
sheet to 29 columns, past column Z - `colLetter()` was a bare
`String.fromCharCode(65 + index)` that only ever produced single letters, so
every column reference past Z (`[`, `\`, `]`, ...) would have been silently
wrong. Rewritten as a proper base-26 converter (`Z` → `AA` → `AB` → ...)
before adding the new columns, not after - this was a real bug the template
was one growth-spurt away from hitting regardless of this change, not
something introduced by it.

### 14c. Employee Master report becomes the "export everything" surface

Rather than add a new download button somewhere, `Reports/EmployeesReport.jsx`
(`/reports/employees`, already had `ReportPage`'s built-in "Export CSV")
had its column list widened from 10 fields to the full ~30-field set the
bulk-import template accepts - company/department/designation/category
(as names, not the IDs the import template needs, since this is a read
surface not a re-import file - and bulk-import is create-only besides, so an
ID-based round-trip wouldn't work anyway), supervisor, dates, gender,
employment/role/record status, contact info, the four new statutory/bank
fields, and the full salary structure. "Export CSV" downloads exactly what's
in the grid.

### 14d. Verification

Backend: `./mvnw test` - 133/133 passing (includes existing
`EmployeeCsvParserTest`/`EmployeeSalaryStructureHttpTest`/
`EmployeeSalaryRevisionHttpTest`, none of which needed changes since every
new field is optional). Frontend: `CI=true npx react-scripts build` - clean,
zero warnings, after every change in this section including the
`permissions.js` fix. **Not done:** logging in and clicking through the
actual page - same blocker as §10d/§11b/§12b/§13b, plus this session
specifically found port 8080 already held by the user's own long-running
IntelliJ-launched backend instance (9h uptime) rather than the seeded-org
gap; left it untouched rather than restarting someone else's active dev
session. Whoever picks this up next should restart that backend (a plain
rebuild is enough - `ddl-auto=update` adds the new `category` table and
`employee` columns on its own) before clicking through Categories/the new
employee fields for real.

---

## 15. Bulk-import CSV header detection, DAY_WISE payroll formula fixes, human-readable attendance hours (2026-08-22)

A user reported the employee bulk-import template's downloaded `.xlsx`
(§11b) failing to upload as CSV, then a string of DAY_WISE payroll numbers
that didn't look right, then a request to make attendance hours readable in
the UI. All from the same debugging session; grouped here as one dated entry.

### 15a. Backend: bulk-import CSV header is no longer assumed to be line 1

`§11b`'s styled `.xlsx` template puts a title, instructions and a legend
above the real header row (row 6), with a trailing `" *"` on required-column
headers. Excel's *Save As → CSV* carries those decorative rows into the file
unchanged, so the resulting CSV's first line was literally `Employee Bulk
Import Template,,,,,...` - `CsvRowParser` (shared by all four bulk-import
CSV parsers) always trusted row 1 as the header and choked on it with
`Malformed CSV header: ...`.

`CsvRowParser.parse` (`Accusharp/src/main/java/com/accusharp/hrms/util/`)
now takes a `headerHintColumn` - one of the caller's own required columns
(`employeeCode`, `employeeId`, `shiftCode`, `leaveType` for the four
parsers respectively) - scans for the first row containing it, and treats
everything above as decoration to skip. The same pass strips the trailing
`" *"` marker so required-column headers match by name. `EmployeeCsvParser`/
`PayrollCsvParser`/`ShiftAssignmentCsvParser`/`LeaveCsvParser` each just pass
their hint at the one call site. See `Accusharp/ARCHITECTURE.md`'s "Bulk /
CSV mutation endpoints" section and `Accusharp/README.md` §3.4.2 for the
corresponding doc updates.

### 15b. Backend: DAY_WISE overtime is now measured against present days, with paid leave added on top

`PayrollService.monthlyOvertimeHours` used a flat `dayWiseDaysInMonth x
standardHoursPerDay` baseline (208h at the defaults) for every DAY_WISE
employee regardless of attendance - someone present only 20 of 26 days still
had 208h subtracted from their worked hours before anything counted as
overtime, understating it by exactly `(26 - presentDays) x 8` hours.

Went through two iterations in this session, worth recording since the
first one looked plausible but had a real gap:

1. First attempt: `effectiveDays = min(presentDays + paidLeaveDays, 26)`,
   baseline = `effectiveDays x standardHoursPerDay`. This capped the
   *combined* present+leave days at 26 before computing the baseline - but
   since most DAY_WISE employees are already present close to 26 days, adding
   leave on top almost always got clipped straight back down by the cap,
   so paid leave ended up contributing nothing in the common case despite
   being intended to count.
2. Final: `overtimeHours = max(0, totalHours - min(presentDays,
   dayWiseDaysInMonth) x standardHoursPerDay) + (paidLeaveDays x
   standardHoursPerDay)` - present days alone (not present+leave) are capped
   at the standard month for the worked-hours baseline, and paid leave hours
   are added as a fully separate term afterward, so they're never at risk of
   being absorbed by the cap.

`Accusharp/src/test/java/com/accusharp/hrms/DayWisePayrollOvertimeTest.java`
covers both the present-days-alone cap and the leave-added-on-top behavior
with worked examples.

### 15c. Backend: DAY_WISE payableDays (and the earn-wage lines it drives) no longer includes paid leave

Same root cause as §15b playing out in a second place: `payableDays` for
DAY_WISE was `min(presentDays + paidLeaveDays, dayWiseDaysInMonth)`, so paid
leave contributed to `earnBasicDA`/`earnHra`/`earnConveyance`/
`earnEducation`/`earnMedical`/`earnOther` (all prorated by `payableDays`) the
same way a present day did. Changed to `payableDays = min(presentDays,
dayWiseDaysInMonth)` - paid leave earns its own overtime credit (§15b) but no
longer a share of the fixed salary structure. `Payroll.presentDays` itself
(the stored/displayed field, not just the value used internally for
`payableDays`) is now also capped at `dayWiseDaysInMonth` for DAY_WISE, so it
can't show a number like `28` that the rest of the payslip never actually
paid against.

### 15d. Backend: ESIC now applies to earned basicDA, not earned gross

`DeductionCalculationService.calculateEsic` took the full earned gross
(`earnBasicDA + earnHra + earnConveyance + earnEducation + earnMedical +
earnOther`) for both the 21,000 wage-ceiling test and the deduction
percentage. Changed to take `payroll.getEarnBasicDA()` alone for both -
applies to every employment status, not just DAY_WISE, since it's one shared
function. `Accusharp/TESTING.md` and `Accusharp/WALKTHROUGH.md`'s worked
payroll example (Priya Kulkarni, `EMP005`) had its `esic`/`totalDeduction`/
`netSalary` figures (and everything that echoes them further down each doc -
the salary slip, the CSV export, the regenerate/revision-history example)
recomputed and corrected to match: `esic` goes from `0.00` to `93.60` since
her earned `basicDA` (12480) is well under the ceiling even though her
earned gross (22623) was already over it.

`PayrollDebugRow`/`Payroll` gained three new stored-vs-live field pairs
(`dayWiseDaysInMonth`, `standardHoursPerDay`, `overtimeRateMultiplier`) so
`GET /api/payroll/debug` can flag drift on the rule inputs §15b-§15d's
formulas actually depend on - previously only `basicDaPercent`/`pfPercent`/
`esicPercent` were tracked, so a change to these three would have silently
gone undetected by the one tool that exists to catch exactly this.
`pages/Payroll/Generate.jsx`'s "salary rule changed" warning banner reports
all three alongside the existing percentages.

### 15e. Frontend: human-readable hours, dated in/out times, and a totals line on attendance screens

New `utils/hours.js` (`formatHours`) converts a decimal-hours value (e.g.
`11.80`, meaning 11h48m) into `"11h 48m"` - the raw decimal reads as if it
could mean "11 hours 80 minutes," which it doesn't. Applied to
`workingHours`/`overtimeHours`/`totalHours` wherever they're displayed:
`pages/Attendance/Records.jsx` and `pages/Attendance/MyAttendance.jsx`
(DataGrid columns, the mobile day-card view, and the "Overtime hours" stat
card), and `pages/Reports/AttendanceMonthlyReport.jsx`. The underlying
decimal value is untouched everywhere else (payroll math, sorting, CSV
exports) - this is a display-only change.

The same two pages' `firstIn`/`lastOut` columns now show the date alongside
the time (`"DD MMM, HH:mm"` instead of bare `"HH:mm"`) - a night shift's
`lastOut` (sometimes `firstIn` too) falls on the next calendar day, and a
bare time doesn't say which day that is.

Both pages also show a "Total hours" / "Total overtime" line under the
day-by-day table, summed client-side from the same rows the table displays -
lets HR (or the employee, on their own view) see at a glance that the sum
matches the monthly summary without adding rows up by hand. First attempt
used MUI DataGrid's `pinnedRows` prop for a true footer row inside the grid,
then caught during review that `pinnedRows` is a `@mui/x-data-grid-pro`-only
feature and this project only has the free `@mui/x-data-grid` installed - the
prop would have been silently ignored, not crashed, so it was worth checking
before shipping it. Switched to a plain summary line rendered below the
table instead, which needs no extra dependency.

### 15f. Verification

Backend: `./mvnw test` - 164/164 passing, including the new/updated cases in
`DayWisePayrollOvertimeTest` (4 cases) and a new
`esicIsBasedOnEarnedBasicDaNotEarnedGross` case in
`PayrollFlowIntegrationTest`. Frontend: dev server hot-reloaded the Records/
MyAttendance changes with no console errors (checked via the already-running
`npm start` instance rather than starting a second one). **Not done:**
logging into the running app to click through the totals line and dated
in/out columns for real - same credential constraint as every other section
here; the user confirmed the hours-formatting change directly instead.

---

## 16. Attendance policy engine + configurable employment types, in the UI (2026-09-01)

Two backend features landed that had no frontend at all. Both are additive and
both ship **off**: a company that configures nothing sees exactly the app it saw
before, and is paid exactly what it was paid before. That property is the whole
design of both features, and the UI is built to preserve it — every new
indicator on an existing screen is hidden until it has a number to show.

Source of truth read before writing any of this, in this order:
`Accusharp/docs/design/attendance-policy-engine.md` (the engine, 1083 lines),
`Accusharp/docs/design/dynamic-configuration.md` (why employment types became a
table), `Accusharp/Attendance.md` §11 (the operator-facing version), and then the
controllers, DTOs and services themselves — the design docs describe an
approved design, and §15 of the first one records where the build deviated from
it. Where the two disagreed, the **code** won.

### 16a. What the backend actually added

**The attendance policy engine.** Attendance policy used to be one setting for
everybody: the shift's grace, and two company-wide thresholds on
`attendance_rule`. Late minutes were recorded and then read by nothing at all —
no status, no day fraction, no LOP day, no rupee depended on them. That hole is
what this fills. Policy is now a stack of typed rules resolved per employee per
date, over seven rule types:

| Rule | Scope | Decides |
|---|---|---|
| `MISSING_PUNCH` | day | A lone punch that looks like an arrival becomes a half day instead of `INVALID_PUNCH` |
| `SHORT_HOURS` | day | The full/half-day cut-offs, as a share of the shift **or absolute minutes**, per group |
| `LATE_ARRIVAL` | day | Grace, and what a late arrival costs |
| `DAY_OFF_WORK` | day | Whether a worked weekly off earns overtime or a comp-off credit |
| `OVERTIME` | day | Who earns overtime, after how long, in what blocks |
| `EARLY_EXIT_BUDGET` | **month** | A monthly budget of early-exit minutes, then a penalty per occurrence |
| `LATE_MARK_ACCUMULATION` | **month** | Nth late mark in a month costs a fraction of a day |

Three properties of the API shape the UI more than anything else:

1. **There is no `PUT`.** A rule is never edited. Changing one appends a version
   with a later `effectiveFrom`; ending one appends a version with
   `enabled = false`. `DELETE` only accepts a version that has not started yet.
   So the screen has no Edit button — it has "Change (saves a new version)" and
   "Stop", and it can show the whole history.
2. **`enabled = false` is an answer, not a gap.** Resolution still picks the
   disabled row, and a broader rule does **not** take over. "Managers are not
   tracked for lateness" is a disabled `LATE_ARRIVAL` at `CATEGORY=MANAGER`.
   The UI says this in as many words in three places, because the intuitive
   reading is the opposite.
3. **`POST /preview` re-runs a real past month and writes nothing.** This is the
   only defence against the misconfiguration the design document calls the most
   damaging one available (see 16d), so it is not a separate page somebody might
   never find — it is step 5 of the save flow.

New permissions `ATTENDANCE_POLICY_READ` / `ATTENDANCE_POLICY_MANAGE`, granted
to HR and ADMIN only (deliberately not SUPERVISOR — deviation #2 in the design
doc's §15).

**Configurable employment types.** `EmployeeStatus.isPaidPerAttendedDay()` — one
enum constant — drove seven separate branches in `PayrollService.build`: the
proration base, whether LOP applies, how payable days derive, whether paid leave
adds to them, the stored `presentDays`, the overtime basis, and whether a
mid-month revision is segmented. A company could change the *numbers* those
branches used but never the *behaviour*, and could not add a fifth type at all.
`employment_type` makes each of those a field on an editable row. `PayBasis` and
`OvertimeBasis` stay closed enums of two — unlimited types composed from a
bounded vocabulary, which is the line `dynamic-configuration.md` §2 draws and
explains.

`Employee.employmentType` is **nullable**, and null falls back to the legacy
`EmployeeStatus` semantics. Adoption is opt-in per employee. New permissions
`EMPLOYMENT_TYPE_READ` / `EMPLOYMENT_TYPE_MANAGE`.

**Monthly summary gained two columns**, surfaced on
`GET /api/attendance/{userId}/monthly` only:
`policyLopDays` (the share of `lopDays` somebody *chose*, as against the share
the working-days arithmetic produced) and `compOffCreditDays`, plus a
`policyOutcomes` array carrying one stored explanation sentence per month-rule
penalty.

### 16b. What was built, file by file

**New API modules**

- `api/employmentTypes.js` — the standard CRUD factory plus `seedDefaults()`.
- `api/attendancePolicy.js` — `list`, `create`, `remove`, `effective`,
  `preview`. No `update`, matching the backend, with the reason in a comment so
  nobody adds one later.

**New constants**

- `constants/attendancePolicy.js` — the human half of the rule catalog. Every
  numeric bound in it matches a bean-validation annotation in
  `AttendancePolicyParams`, so a form built from it cannot compose a rule the
  server rejects on a technicality. What it adds is what the enum cannot carry:
  a one-line summary, a paragraph of detail, a "what it changes" line, the
  danger text for the one rule that warrants one, sensible defaults, and a
  `describe()` per type that renders stored params as one plain sentence.
  The scope list deliberately **omits `GLOBAL`** — it exists on the backend as a
  hook for a future shared catalog that ships empty, and a company creating one
  would only get a confusingly-named lowest-priority company rule.
- `constants/enums.js` — `PAY_BASIS` / `OVERTIME_BASIS` and, more usefully,
  `*_LABEL` and `*_HELP` maps. `labelize('PER_CALENDAR_DAY_LESS_LOP')` gives
  "Per calendar day less lop", which is accurate and says nothing to the payroll
  clerk who has to choose between the two options.
- `constants/permissions.js` — the four new codes added to the HR/ADMIN grant
  list and to `PERMISSION_CODES` (which drives the custom-role checklist), in
  the same positions the backend's `PermissionCode` enum puts them.

**New pages**

- `pages/Masters/EmploymentTypes.jsx` — a sixth Masters tab at
  `/masters/employment-types`. Not `MasterCrudPage`: this master has switches,
  two selects whose choices change what the other fields mean, and a
  cross-field rule the backend refuses outright, none of which
  `MasterFormDialog` models. Table shows code, name, pay basis and overtime
  basis as plain English with the technical explanation on hover, the monthly
  base (or "Company default"), the behaviour flags as chips, and active state.
- `pages/Attendance/PolicyRules.jsx` — a third Attendance Console tab at
  `/attendance/policy`. Lists rules grouped into chains, showing only the
  current version of each by default with a "Show past versions" switch.
- `pages/Attendance/PolicyRuleDialog.jsx` — the add/change flow, five numbered
  steps (16d).
- `pages/Attendance/PolicyEffective.jsx` — a fourth tab at
  `/attendance/policy-check`, "Who gets which rule". Pick a person and a date;
  get the winning rule per type, the sentence saying *why* it won, and — the
  point of the endpoint — the rules that matched and lost, collapsed. Without
  those, "why isn't my department's rule applying?" has no answer anywhere.

**Changed pages**

- `pages/Attendance/MyAttendance.jsx` — a `PolicyOutcomes` card rendering the
  stored explanation sentence for each month-rule penalty plus any comp-off
  earned, on both the HR table view and the plain-employee card view; and two
  extra stat cards ("of which, policy penalties", "Comp-off earned") on the HR
  view. **All three render only when they have a non-zero figure**, so a company
  with no policy rules sees precisely the screen it saw yesterday.
- `pages/Employees/EmployeeForm.jsx` — an "Employment type (pay behaviour)"
  select in the Organisation card, next to Employment status. The whole field is
  hidden when the company has defined no types, so nobody is asked about a
  concept they have not adopted. Blank means "use the employment status", spelt
  out in the helper text rather than left as an empty option.
- `pages/Employees/EmployeeDetail.jsx` — the same field, read-only, rendering
  "From employment status" rather than a blank when unset.
- `pages/Attendance/AttendanceConsoleLayout.jsx` / `pages/Masters/MastersLayout.jsx`
  / `App.js` — the new tabs and routes.

### 16c. One backend change was necessary, and it fixes a live data-loss bug

`EmployeeResponse` did not expose the employment type, but `EmployeeRequest`
carries `employmentTypeId` and `EmployeeService.apply` applies it
unconditionally:

```java
employee.setEmploymentType(request.getEmploymentTypeId() == null ? null
        : employmentTypeService.getById(request.getEmploymentTypeId()));
```

A client that cannot read the current value back has no way to send it again.
So **every ordinary employee edit — changing a phone number, fixing a bank
account — silently clears the employment type**, and with it the pay behaviour.
This is true of the app as it stands today, before any of this work: it is
invisible only because there was no UI to set the field in the first place.

Adding a write-only picker to the form would have shipped a feature that
destroys its own data on the next save, so two lines went into the backend:

- `dto/EmployeeResponse.java` — `Long employmentTypeId`, `String employmentTypeName`.
- `mapper/EmployeeMapper.java` — the two null-safe reads, next to the `category`
  read that already proves the mapper runs inside a transaction (both
  associations are `FetchType.LAZY`).

Purely additive: no existing field moved, no existing consumer changed, and
`EmployeeResponse` has exactly one construction site. `./mvnw compile` clean.

### 16d. The design decisions that were about the audience, not the API

The people using this screen configure payroll; they do not read Javadoc. Four
choices follow from that, and each one is a deliberate departure from simply
rendering the API.

**The month test is step 5 of saving, not a separate page.** The design document
is blunt about the worst thing this engine can do: a `LATE_ARRIVAL` rule with
`penaltyStatus: ABSENT` and a small grace, scoped at `COMPANY`, turns everybody
who arrives at 09:06 into a full unpaid day — on a day they worked in full. It
is worse than the old `overtime_window_minutes = 0` bug for one specific reason:
that one produced `INVALID_PUNCH`, which is visibly wrong and shows up in the
summary, while this produces `ABSENT`, which is exactly what a genuinely absent
day looks like. Nothing in the month's figures says anything went wrong.

So `POST /preview` is inlined into the dialog, defaulting to **last** month
(this month is usually half-generated), and it reports employees checked,
employees affected, the LOP delta, the overtime delta, the server's own
warnings, and the first eight affected employees with their changed days and
reasons. Selecting `ABSENT` as the penalty also raises a written warning in the
form itself, before the test is even run.

One detail worth keeping: the preview endpoint **replaces** the stored rule set
rather than merging with it, so sending only the draft would answer a question
nobody asked. `PolicyRules` therefore fetches its list **unfiltered** — the
rule-type filter is applied client-side to the table only — and the dialog
previews *every rule currently in force, with the draft added or replacing its
own predecessor*. That is the month as it would actually be after saving.

**Append-only history is shown as append-only, not disguised as editing.** The
Edit icon is captioned "Change — saves a new version, keeps the old one", the
dialog opens with "This adds version N+1 — it does not edit version N", and
Stop's confirmation says days already worked out keep their result and no wider
rule will take over. Hiding the versioning behind a familiar-looking Edit button
would have been friendlier and would have made the first "why did last month
change?" conversation impossible to have.

**Every rule type is explained where it is chosen.** Selecting a rule renders
its summary, its detail paragraph, an explicit "What it changes" line, and a
chip saying whether it is worked out day by day or once a month — with the
month-scope consequence stated outright: a start date mid-month means it governs
from the **following** month. That is deviation #1 in the design doc's §15,
it has no visible signal anywhere else, and somebody will otherwise set a rule
on the 15th and spend two weeks wondering why nothing happened.

**Illegal combinations are made unreachable rather than rejected.** On the
employment type form, choosing "Paid per day attended" switches LOP off and
disables it, with the reason in place of the help text ("the days not worked are
already unpaid, so deducting again would charge the same absence twice");
choosing the monthly basis clears and disables the monthly base. Both mirror
`EmploymentTypeService.validate()` exactly, so the guard is a disabled control
with an explanation rather than a 400 after the fact.

### 16e. Client-side validation the backend does not have

`SHORT_HOURS` is bean-validated field by field but the two values are never
compared, and `halfDayValue >= fullDayValue` makes the half-day branch
unreachable — short days silently become `ABSENT`. The design document listed
`halfDayValue must be less than fullDayValue` as a refusal; the implementation
does not have it. The form blocks it with that message. `DAY_OFF_WORK`'s
`halfCreditMinutes > fullCreditMinutes` is the same shape and is blocked the
same way. **Both are worth adding to `AttendancePolicyParamsCodec.validate`** —
the UI guard only covers callers that come through this app.

### 16f. Known gaps, in the order they are likely to matter

1. **Bulk employee import cannot set an employment type.** `EmployeeCsvParser`
   has no such column, so the xlsx template in `utils/employeeTemplate.js` has
   none either. Onboarding a company onto configurable types today means editing
   employees one at a time. Backend work.
2. **Per-day policy trace is not surfaced anywhere.** `attendance_policy_application`
   holds one row per day per rule that changed something, with the rendered
   sentence, but `DailyAttendanceResponse` does not carry it —
   §9 of the design doc says `GET /records` "gains a `policyApplications` array
   per day"; the implementation did not add it. So Records shows *that* a day is
   a half day, and the month view explains only the month-scoped penalties. The
   day-level "why" exists in the database and cannot be reached from the UI.
   Backend DTO change, small.
3. **`GET /api/employment-types` has no `shared` flag.** `EmploymentType.company`
   is `@JsonIgnore`, so the UI cannot tell a company-owned row from a shared
   catalog row, and editing a shared one 404s with no forewarning. In practice
   every row a company sees is its own, because `seed-defaults` creates
   company-owned rows for any caller with a company and the shared catalog ships
   empty — but `AttendancePolicyDtos.RuleResponse` already carries exactly this
   `shared` boolean, and the employment type response should too.
4. **`EMPLOYMENT_TYPE` policy scope means the built-in status, not the new
   master.** `assertScopeRefExists` validates that `scopeRef` against
   `EmployeeStatus`, so a rule scoped there matches on `Employee.status` and not
   on the assigned employment type. The two names being near-identical is a real
   trap; the scope's help text says so explicitly. Worth renaming one of them.
5. **Comp-off is recorded, not bookable.** There is no comp-off leave type to
   accrue into (section B of `dynamic-configuration.md`, not built), so the UI
   reports the credit and says so rather than implying a balance exists.
6. **No frontend tests.** Consistent with the rest of this codebase, which has
   none — noted, not defended.

### 16g. Verification

**Done.** `CI=true npx react-scripts build` — compiles clean, zero warnings
(CI mode treats warnings as errors, so this is a real gate). `./mvnw compile`
on the backend — clean, for the two-line `EmployeeResponse`/`EmployeeMapper`
change. Every request and response shape used here was checked field by field
against the controllers and DTOs rather than against the design documents,
which describe an approved design the implementation deviated from in six
recorded places.

Also fixed while here: `AttendanceConsoleLayout` picked its active tab with
`TABS.find(t => pathname.startsWith(t.path))`, which lights up **Policy** when
you are on `/attendance/policy-check`. Now takes the longest match.

**Superseded by 16h — this was written before the live run.** The paragraph below is kept because the `pom.xml` finding in it is still true and still worth fixing.

**Not done at the time of writing: nothing was clicked through in a running app.** The documented
H2 quick start in §1 does not work on this checkout —
`./mvnw spring-boot:run -Dspring-boot.run.profiles=h2` dies with
`Cannot load driver class: org.h2.Driver`, because `pom.xml` puts the H2
`<excludes>` block in the `spring-boot-maven-plugin`'s **plugin-level**
`<configuration>` rather than inside the `repackage` execution, so it strips H2
from `spring-boot:run`'s classpath as well as from the jar. The comment above it
says "leaving it available for local dev and tests"; it does not. Moving those
four lines into `<executions><execution><id>repackage</id>` fixes it. A backend
instance was already running on :8080 against MySQL `julytesting` and was left
alone. So the risks that remain are the ones a compiler cannot see: a rendering
bug, a layout problem on a narrow screen, or a payload the server rejects at
runtime for a reason the DTOs do not state.

**The five minutes that would retire most of that risk**, once a company with
generated attendance is available:

1. Masters → Employment Types → **Set up standard types**. Four rows appear.
   Edit `DAY_WISE`; the monthly base is editable and LOP is disabled with its
   reason showing.
2. Employees → edit anyone → Organisation. The new select appears. Set it, save,
   reopen — it must still be set (this is 16c).
3. Attendance Console → Policy → Add rule → *Late arrival penalty*, category
   scope, grace 15, penalty Half day → **Run the test** against a month that has
   attendance. Confirm the numbers, then set the penalty to Absent and confirm
   both the in-form warning and the server's own warning appear.
4. Save it. Confirm the row reads "In force" / "v1". Hit Change, save v2, switch
   "Show past versions" on and confirm v1 is there marked Replaced.
5. Attendance Console → Who gets which rule → that employee, a date after the
   rule started. Confirm the rule shows as applying, and that a second, broader
   rule of the same type appears under "matched but lost".
6. My Attendance → that employee, that month. With a month rule configured and
   fired, the "Policy applied this month" card and the "of which, policy
   penalties" stat appear. With no rules configured, **neither must appear at
   all** — that is the property the whole feature rests on.


### 16h. Verified live, end to end (2026-09-02)

Everything in 16g's "not done" list was subsequently done. A clean backend was
booted on **port 8081** against a file-based H2, leaving the instance already
running on :8080 untouched, and the dev server was pointed at it on :3001. Two
obstacles and how they were got round, because both will be hit again:

- **`spring-boot:run -Dspring-boot.run.profiles=h2` still does not work** (the
  `pom.xml` plugin-level `<excludes>` described in 16g). Worked round without
  touching `pom.xml` by running the app off the plain dependency classpath,
  which *does* carry H2 at runtime scope:
  `./mvnw dependency:build-classpath -Dmdep.outputFile=cp.txt` then
  `java -cp "target/classes:$(cat cp.txt)" -Dspring.profiles.active=h2 ...`.
- **The app refuses to boot with placeholder secrets** — `JWT_SECRET` and
  `HRMS_SEED_PLATFORM_OWNER_PASSWORD` must both be set to real values. Both
  guards behaved exactly as designed and are a good thing; noting them so the
  next person does not read the stack trace as a failure.

#### The scenario

Four employees, **identical punches every day** (in 09:30, out 18:00, ten
working days of August 2026, loaded straight into `device_logs`), differing only
in category and employment status. Then four `LATE_ARRIVAL` rules, one per
population, all effective 2026-08-01:

| Rule scope | Grace | Penalty |
|---|---|---|
| `COMPANY` | 5 min | Half day |
| `CATEGORY=WORKER` | 10 min | Half day |
| `CATEGORY=STAFF` | — | **disabled** |
| `EMPLOYMENT_TYPE=DAY_WISE` | 45 min | Half day |

#### What actually happened

Before any rule existed, all four employees produced byte-identical months:
`presentDays 10.0, lopDays 16.0, policyLopDays 0, overtime 5.0`, every worked
day `PRESENT`. That is the no-op property holding on real data.

After the rules, on the same punches:

| User | Category | Status | Rule that won | Worked days | Present | LOP |
|---|---|---|---|---|---|---|
| `STF001` | STAFF | Permanent | STAFF rule, **disabled** → nothing applies | 10 × `PRESENT` | 10.0 | 16.0 |
| `WRK001` | WORKER | Permanent | `CATEGORY=WORKER`, 10 min | 10 × `HALF_DAY` | 5.0 | 21.0 |
| `SUP001` | SUPERVISOR | Permanent | `COMPANY`, 5 min (no category rule) | 10 × `HALF_DAY` | 5.0 | 21.0 |
| `DWK001` | (none) | **Day wise** | `EMPLOYMENT_TYPE=DAY_WISE`, 45 min | 10 × `PRESENT` | 10.0 | 16.0 |

Same shift, same punches, four different bills. `SUP001` falling through to the
company rule and `DWK001` being caught by the employment-status rule are the two
that prove the precedence chain rather than just the happy path.

**The preview predicted this before anything was written.** `POST /preview` over
the same rule set returned `checked=4 affected=2 lopDelta=10.0`, named `WRK001`
and `SUP001` with `lop 16.0 → 21.0` each, gave the per-day reason
(`HALF_DAY: in 09:30, 20 min beyond a 10 min grace on a 09:00 shift, rule
LATE_ARRIVAL v0 scoped CATEGORY=WORKER`), and raised its own warning: *"this
rule set adds 10.0 LOP days across 2 of 4 employees - check that is intended
before saving it."* The regeneration afterwards matched the prediction exactly.

**A month-scoped rule was then added** (`EARLY_EXIT_BUDGET` @ `CATEGORY=STAFF`,
60 min budget, 0.5 day per later occurrence). `STF001` went to
`lopDays 20.5 / policyLopDays 4.5`, with the stored sentence *"600 min of early
exit across 10 day(s) against a 60 min monthly budget; budget exhausted
2026-08-03; 9 later early exit(s) … penalised at 0.5 day each = 4.5 LOP days"*.
`WRK001` was untouched by it. Note this rule fired on `earlyExitMinutes`, a
figure the application recorded and read nowhere before the engine existed.

#### Screens confirmed in the browser

- **Attendance → Policy** — all five rules listed with the plain-English
  description, the population ("A category (grade) STAFF", "An employment status
  DAY_WISE", "Everyone in the company"), In force / Stopped, version, and
  day-vs-month scope.
- **Attendance → Who gets which rule** — for `WRK001`: the identity chips, the
  company-wide thresholds it sits on, `Late arrival penalty · Applies ·
  "More than 10 min late makes the day a half day" · Why: most specific match:
  CATEGORY=WORKER`, and the expanded loser: *"Everyone in the company (v1, from
  01 Aug 2026) — More than 5 min late makes the day a half day."* For `STF001`:
  `Not configured` with *"Why: the most specific match (CATEGORY=STAFF) is
  disabled, so this rule type does not apply to this employee"* — the "disabled
  is an answer, not an absence" rule, in words an employee could be shown.
- **My Attendance, signed in as `STF001` (a plain EMPLOYEE)** — the
  "Policy applied this month" card with *"Monthly early-exit budget — 4.5 unpaid
  day(s)"* and the full stored explanation. On September, which has no outcomes,
  the card is correctly **absent**.

#### Two real bugs the live run caught

1. **`display="block"` on `Typography` does nothing in MUI 9.** It was a v5
   system prop; MUI 9 drops it, so eleven captions across `PolicyEffective` and
   `PolicyRuleDialog` rendered as inline `<span>`s and ran into the following
   line — on screen this read
   `"… workers get 10 minWhy: most specific match…"`. Changed to
   `sx={{ display: 'block' }}`, which is what the rest of this codebase already
   uses (e.g. `Records.jsx:141`). **Worth grepping for on any new page.**
2. **`EmployeePicker` had no minimum width** and collapsed to a ~40px box
   reading "Employ…" inside the flex `Stack` that every `PageHeader` puts its
   actions in — it has no natural width of its own the way the date pickers
   beside it do. Given `sx={{ minWidth: 240 }}`. This is **pre-existing** and
   affects Records, MyAttendance and the roster screens too, so the fix is an
   improvement to all of them rather than only to the new page.

Neither was catchable by a compiler, which is exactly why 16g flagged them as
the residual risk.

#### Still not exercised

The **Add rule dialog** was not driven through the browser — the rules above
were created over the API. Its five steps, the in-form `ABSENT` warning, and the
"Run the test" panel are therefore verified only at the level of the endpoints
they call (all four of which were exercised directly) and a clean compile. The
same is true of the **Employment Types** master. Both are the obvious next thing
to click through.

---

## 17. Labour contractors: a separate workforce, a shared shift catalog (2026-09-06)

A client company engages labour contractors and does not care what those
contractors pay their people — it cares that they turned up. This section adds
the whole loop for that: onboard the contractor, register the workers they
deploy, roster those workers onto our shifts, generate their attendance, and
hand the contractor a report they run their own payroll from.

### 17a. The design decision everything else follows from

**A contractor's worker is an `Employee` row with a `contractor_id`, not a row
in a new table.** `ShiftSchedule`, `DailyAttendance`, `DeviceLog` and
`MonthlyAttendanceSummary` are all keyed by the plain `user_id` *string*, and
`Employee.userId` is unique platform-wide precisely because the biometric feed
resolves a punch by it alone. A parallel worker table would have had to either
share that key space anyway — reintroducing the collision the global constraint
exists to prevent — or grow a second copy of the attendance engine. One
nullable foreign key buys the punch window, the night-shift handover, the
policy engine, HR corrections and payroll locking unchanged.

The cost is that "every employee of this company" now means two things, and
the feature turns entirely on getting that right. Full rationale in
[ARCHITECTURE.md](../../Accusharp/ARCHITECTURE.md)'s "Labour contractors"
section; the short version is that `EmployeeService.getActiveEntities()` and
`getAllEntities()` were already the single choke points every company-wide
operation resolved its population through, and both now filter
`contractor IS NULL`. Payroll, the dashboard, `ReportScope` (and therefore
every statutory return), the employee directory and the shift planner all
exclude contractor workers without any of them being edited.

### 17b. Backend

New: `Contractor` entity, `Employee.contractor`, `ContractorRepository`,
`ContractorService` / `ContractorEmployeeService` / `ContractorAttendanceService`
(`service/contractor`), `ContractorAttendanceReportService` (`service/report`),
`ContractorController`, `ContractorMapper`, and the request/response DTOs.
`CONTRACTOR_READ` / `CONTRACTOR_MANAGE` join `PermissionCode` and the seeder.

Three things worth carrying forward:

1. **`ContractorEmployeeRequest` has no salary, statutory, bank or `role`
   field.** Not "ignored if supplied" — *absent*, which is what makes them
   unsettable rather than a comment asking callers not to. The service
   additionally pins `role = EMPLOYEE`, `accountEnabled = false` with no
   password hash, and `status = CONTRACT`.
2. **That `status = CONTRACT` is load-bearing.** `DefaultRosterService` reads
   `EmployeeStatus` to decide who gets a free `GENERAL` roster two months
   ahead; a contractor's workers must not, because they are on site only for
   the days their contractor sends them. Auto-rostering would manufacture
   absent days — and therefore an invoice dispute — for days nobody was
   expected. Same reason `includeUnrostered` defaults to **false** for a
   contractor run and **true** for the company console.
3. **The employee endpoints now 404 a contractor's worker on every write**
   (`getCompanyEmployeeById`), so `PUT /api/employees/{id}` can never write an
   `EmployeeRequest` — gross salary, derived structure, a `role` — over
   somebody this company does not pay.

`ContractorWorkforceHttpTest` (11 tests) pins the isolation properties
specifically, because a regression in any of them is silent in production
until a payslip is generated for somebody else's employee.

### 17c. Frontend

`src/api/contractors.js` and five pages under `src/pages/Contractors/`, behind
`ContractorsLayout`'s tab bar at `/contractors/*`, plus `ContractorPicker` in
`components/`. Its own nav section rather than a row under HR Admin: SUPERVISOR
can see it (they hold `CONTRACTOR_READ` and are the ones assigned to these
workers) while the rest of HR Admin is HR/ADMIN only.

| Page | What it is |
|---|---|
| `ContractorList` | CRUD over the agencies. Deactivate is refused while workers are still on site — the API 409s and the snackbar shows why |
| `ContractorWorkforce` | Every contractor's workers in one table, **contractor name as the first column**, filterable to one. Defaults to all: a company with three agencies wants the whole deployed headcount before it narrows |
| `ContractorRoster` | The company shift catalog, one contractor's workers. Never both populations in one grid — `plannerScope(supervisorUserId, contractorId)` returns one or the other |
| `ContractorAttendance` | The same generate/preview flow as the company console, scoped to one contractor |
| `ContractorReports` | Monthly summary, daily register, and all-contractors — the last being the side-by-side view a multi-contractor company reads |

Exports are server-rendered (`responseType: 'blob'`), not a dump of the grid,
because the monthly sheet appends the contractor's totals below the rows — the
figure they invoice against has to travel in the same file as the rows it came
from.

### 17d. What was verified

Driven in the browser against a real backend (H2 profile) with two contractors
and five workers:

- onboarding a contractor through the dialog, and the list rendering it;
- the workforce table showing both agencies' workers with the contractor name
  against each;
- the contractor roster planner showing **only** the selected contractor's
  three workers, rostered `GENERAL` with Sunday week-offs;
- generate + preview reporting "3 workers processed, 90 days";
- the monthly report, its header card (contact person and email — the people
  the report is sent to), and the all-contractors table listing both agencies
  with their totals;
- **the isolation, positively**: `/employees`, `/reports/employees`, the
  company `/roster/planner` and a company-wide `POST /api/attendance/generate`
  each returned exactly the three own-staff records and none of the five
  contractor workers.

343 backend tests pass, and `CI=true react-scripts build` is clean.

### 17e. Not done

- **No punch data was exercised.** The local instance has no biometric feed, so
  every generated day came back `ABSENT` — correct behaviour, but it means the
  hours/overtime columns on the reports were verified as zeros rather than
  against real punches. Worth re-running once `device_logs` has rows.
- **No CSV bulk import for contractor workers.** The four existing bulk
  endpoints share one shape (`ParsedCsvRow` + `BulkImportResult`); a fifth for
  this would slot straight in and is the obvious next addition — onboarding 200
  workers one dialog at a time is the first thing a real site will complain
  about.
- **Contractor workers have no leave.** They have no login and no balance, so
  the leave module simply never sees them. If a contractor's workers should be
  able to take approved paid leave that affects the attendance report, that is
  a deliberate design decision nobody has made yet.
- **The `h2` profile does not start as documented** (pre-existing, unrelated to
  this work): `spring-boot-maven-plugin`'s `<excludes>` for `com.h2database` is
  configured at plugin level, so it applies to `spring-boot:run` as well as
  `repackage` and the driver is not on the classpath. Workaround used here was
  `-Dspring-boot.excludes=`; the real fix is moving the exclusion inside the
  `repackage` execution.

---

## 18. A public marketing site in front of the login (2026-09-06)

### 18a. The problem this solves

Visiting the app's root put a visitor straight on the sign-in card. That is
correct for a user, and wrong for a demo — a prospect being shown the product
had no page that said who AccuSharp is or what the system does before being
asked for credentials.

Four public pages now sit in front of the login: **Home**, **Services**,
**About us** and **Contact**. Nothing about the application itself changed.

### 18b. Scope discipline

No application functionality was touched. Specifically: no API module, no
`AuthContext`, no `RequireRole`, no `navConfig`, no permission semantics, no
page under `src/pages/` other than the new `Site/` folder, and no change to
the sign-in flow itself. The public pages make **zero** network calls — they
render static copy from one file and nothing else. The only edits to existing
files are the three below.

### 18c. What was added

| File | Role |
|---|---|
| `src/content/siteContent.js` | **All** public copy — the only file to edit to change what the site says |
| `src/layout/SiteLayout.jsx` | Public header (sticky, mobile drawer) + footer + `<Outlet/>` |
| `src/pages/Site/ui.jsx` | Shared primitives: `Section`, `SectionHeading`, `FeatureCard`, `IconTile`, `CtaBand`, icon-name map |
| `src/pages/Site/PageHero.jsx` | Compact hero for the three inner pages |
| `src/pages/Site/Home.jsx` | Hero + stats + module strip + why-us + how-it-works + compliance + who-it's-for + CTA |
| `src/pages/Site/Services.jsx` | The ten product modules, the six engagement services, statutory compliance |
| `src/pages/Site/About.jsx` | Story, mission, values, by-the-numbers, optional leadership |
| `src/pages/Site/Contact.jsx` | Enquiry form (mailto), contact details, what-happens-next |

### 18d. The three edits to existing files

1. **`src/App.js`** — four public routes added inside a `<Route element={<SiteLayout/>}>`
   block, placed *before* `/login`. The protected route tree below it is
   byte-for-byte what it was.
2. **`src/components/ProtectedRoute.jsx`** — one line. An unauthenticated
   visitor at `/` now goes to `/home` instead of `/login`; **any other**
   protected path still goes to `/login` exactly as before. An authenticated
   user at `/` is unaffected — `RootRedirect` still runs and still routes
   platform principals to `/platform/companies` and plain employees to
   `/attendance/me`.
3. **`src/pages/Auth/Login.jsx`** — a "← Back to home" link under the card.
   Purely navigational; the form, the submit handler and the `initializing` /
   `isAuthenticated` branches are untouched.

### 18e. Design decisions worth knowing

- **Same design tokens as the app.** The site imports nothing of its own —
  teal accent, navy (`sidebar.background`), the card border/shadow treatment
  and the type scale all come from `src/theme/theme.js`. A visitor who signs
  in lands somewhere that looks like the site they just left.
- **No images, anywhere.** The hero's "product preview" is composed from MUI
  boxes rather than a screenshot, so there is no asset to keep in sync with a
  UI that is still changing, and it stays crisp at any size. Nothing loads
  from a CDN.
- **Every number on the site is countable in the codebase.** 27 reports (the
  lazy imports in `App.js`), 10 modules, 6 roles, 5 statutory heads. No
  invented customer counts, no invented uptime figure.
- **Fake customers cannot appear by accident.** `testimonials` and
  `about.leadership` are empty arrays, and both sections return `null` while
  empty. Fill them in and the section appears; leave them and a demo shows
  nothing invented.
- **The contact form posts nowhere.** It composes a `mailto:` and hands off to
  the visitor's mail client. This site is public and unauthenticated; an
  enquiry endpoint would be a new unauthenticated write path into the API, and
  there is no mail infrastructure in the app to deliver it anyway (see §7).
  Swap it for a real `POST` the day such an endpoint exists.

### 18f. What still needs the client's own detail

Everything marked `SAMPLE` in `src/content/siteContent.js`: legal name,
founded year, office address, phone, both email addresses, business hours, and
the three paragraphs of `about.story`. The pages render correctly as they
stand — the placeholders are plausible, not lorem ipsum — but they are
placeholders and should be replaced before the site is shown as final.

### 18g. Verified

- `CI=false react-scripts build` → **Compiled successfully**, no warnings.
- Rendered in the browser at 1440px, 1280px and 390px: hero, all four pages,
  the mobile hamburger drawer, and the footer.
- `/` while signed out → redirects to `/home` (confirmed via `location.pathname`).
- `/employees` while signed out → still redirects to `/login`, unchanged.
- The login card renders as before, with the new back-link beneath it.

---

## 19. Product rename (Accusharp → Muster) and a rebuilt sign-in screen (2026-09-06)

### 19a. The name

"Accusharp" was a **client's** name used as a working title through
development. Everything user-visible is now **Muster**; the product is
**Muster HRMS**.

A *muster roll* is the statutory attendance register every Indian factory
already keeps — Form 12 under the Factories Act, and separately required under
the Contract Labour Act. It is the exact word this product's buyers already use
for the exact artifact it produces. Short, a real English word, no spelling to
explain, and meaningful to an HR or payroll team without a sentence of
introduction.

**Before registering it, check `muster.in` / a `.com` variant and run a
trademark search in class 9/42.** "Muster" is a common word and there is at
least one unrelated US SaaS using it.

Runner-up names, if this one is unavailable — each is a one-line change in
`src/constants/brand.js`:

| Name | Why |
|---|---|
| **Kaarya** (कार्य, "work") | Distinctly Indian, trivially trademarkable, no collision risk |
| **Vetan** (वेतन, "wages") | Instantly meaningful to a payroll team; narrower than Muster |
| **Shiftwise** | Plain English, descriptive, safest and least distinctive |

### 19b. One file owns the name

New: **`src/constants/brand.js`** — `name`, `productName`, `legalName`,
`initial`, `tagline`. Everything user-visible reads from it: the public site
(via `siteContent.js`, which spreads `BRAND` into `company`), `SiteLayout`'s
header/footer lockup and tab titles, `AppLayout`'s sidebar wordmark, and the
sign-in screen. Renaming the product again is now five strings in one file.

Deliberately **not** renamed, and why:

- the `accusharp` npm package name and the repo/folder names — not user-visible,
  and renaming churns tooling, IDE run configs and the Dockerfile for nothing;
- **`accusharp.lastActivity`** in `IdleSessionGuard.jsx` — a cross-tab
  `localStorage` contract (see §"Idle session timeout" in REDESIGN_HANDOFF.md).
  Renaming it mid-deploy would leave two tabs on different keys;
- API paths, which carry no brand at all.

`public/index.html` (title + description) and `public/manifest.json` were
updated directly, being static files. The manifest was still carrying CRA's
stock `"React App"` / `"Create React App Sample"` and a black theme colour —
fixed at the same time.

### 19c. The sign-in screen was one small card on an empty page

Rebuilt `src/pages/Auth/Login.jsx` as a two-panel screen:

- **Left, `md` and up:** navy (`sidebar.background`) brand panel with a teal
  radial wash, the lockup, a headline, three value lines, and the copyright.
  Hidden below `md`, where a compact lockup above the card carries the branding
  instead.
- **Right:** the form, now with a page-level `Sign in` heading, a sub-line
  telling a new joiner where their User ID comes from, a **show/hide password
  toggle**, `autoComplete="username"` / `"current-password"` so password
  managers work, and an honest note that password reset is HR-mediated rather
  than a "Forgot password?" link that goes nowhere (there is no self-service
  reset — see the PRD's non-goals).
- **Back to Muster** link under the card, into the public site.

**The authentication behaviour is byte-for-byte what it was.** Same
`login(username, password)` call, same `submitting` handling, same
`initializing` spinner branch, same declarative `<Navigate>` (the comment
explaining why there is no imperative `navigate()` here is preserved verbatim —
that race caused a real intermittent blank landing page). The only new state is
`showPassword`, which toggles the input's `type` and nothing else.

### 19d. Verified

- `CI=false react-scripts build` → **Compiled successfully**, no warnings.
- Sign-in screen rendered at 1440px (split panel) and 390px (stacked lockup).
- Public site re-checked after the rename: `document.body.innerText` on `/home`
  contains no occurrence of the old name, and `/about`'s story paragraphs
  interpolate correctly ("Muster started with…", "Muster HRMS treats…").
- Per-page tab titles confirmed live: `About us · Muster HRMS`.
- `grep -rni accusharp src public` now returns only the three intentional
  exceptions listed in §19b.

---

## 20. Palette change (teal → single-accent blue) and a light sidebar (2026-09-06)

### 20a. Why the teal had to go

The brief was "professional, Apple-like, and mindful of colour in India". Those
two constraints point at the same answer.

**In India, the two obvious "warm brand" choices are loaded.** Saffron reads as
religiously and politically coded — it is the colour of renunciation and of
sadhus' robes, and of a national party. Saturated green carries a strong
association with Islam (paradise, divine mercy), and green next to saffron
reads as the flag. The previous accent, `#0F9D8B`, sat in the green family and
was the single most-used colour in the product.

**Blue is the one hue without that loading.** Ambedkar chose it for the
Scheduled Castes Federation flag in 1942 specifically because it carried no
overt association, and it is the default of Indian enterprise (HDFC, TCS,
Infosys, SBI). Green and red survive in the palette **only as status colours**,
which is a universal interface convention rather than a brand statement.

**Apple's actual formula is achromatic restraint plus one accent.** Near-black
ink `#1D1D1F` on parchment `#F5F5F7`, white surfaces, hairline borders, and a
single interactive blue used for every actionable thing. No second brand hue,
no decorative gradients, and effectively no shadows on chrome — hairlines and
surface contrast do the separating. That is a good fit for a payroll product
independently of taste: if blue is the only non-status colour on screen, then
anything coloured is either actionable or a status, and a dense table reads
faster.

### 20b. The palette

Every value was checked against the surface it is actually used on:

| Token | Value | Contrast |
|---|---|---|
| `accent.main` | `#0A57C2` | 6.7:1 white-on-blue, 6.1:1 blue-on-canvas |
| `accent.dark` | `#08459B` | hover/pressed |
| `accent.light` | `#5B9BE5` | 5.8:1 on ink — dark surfaces only |
| `accent.soft` | `#EAF1FB` | tinted fills, selected nav |
| `text.primary` | `#1D1D1F` | 15.5:1 on canvas |
| `text.secondary` | `#6E6E73` | 5.1:1 on white |
| `neutral.bg` / `surface` / `border` | `#F5F5F7` / `#FFFFFF` / `#E5E5E7` | — |
| `success` / `error` | `#217A46` / `#C0342B` | 5.3:1 / 5.6:1 |
| `warning` | `#965900` | 5.6:1 |

**A real accessibility bug was fixed in passing.** `warning.main` was `#B76E00`
with a comment claiming it had been darkened to clear AA. It measures **4.0:1
on white and 3.7:1 on the canvas** — under AA for normal text. It is now
`#965900` (5.6:1). Everything else in the old palette was fine; this one was
not, and the comment made it look verified.

Two new tokens:

- **`ink`** (`#1D1D1F`) — the deliberately dark surfaces: the marketing
  footer and closing band, and the sign-in brand panel. Previously these
  borrowed `sidebar.background`, which is why they had to be split out before
  the sidebar could change colour independently.
- **`sidebar.backgroundHover` / `sidebar.border`** — needed once the column
  went light.

Marketing CTAs are now pill-shaped (`borderRadius: 999`), which is apple.com's
signature; **application** buttons stay rounded rectangles, because pills on a
dense toolbar read as toy-like. Apple splits the same way.

### 20c. The sidebar: light first, then corrected to ink

**First attempt (wrong for this product).** The sidebar was made light — white
column, hairline edge, soft blue pill for the active item — on the reasoning
that every Apple pro app (Finder, Mail, Notes, Xcode) draws one that way, and
that ~26 nav entries in a navy column is a lot of ink next to the data.

That is correct by the rulebook and wrong here, and the user said so
immediately: *"there is no combination — somewhere I am seeing dark blue and
the sidebar is directly white."* They were right. This product has dark
surfaces on **both sides of the sign-in boundary** — the sign-in brand panel
and the marketing footer/closing band — so a white column between them read as
two unrelated products stitched together. Apple's pro apps get away with a
light sidebar because nothing else in those apps is dark.

**What it is now.** The sidebar is the same `ink` surface as everything else
that is deliberately dark. There is exactly **one** dark colour in the product,
`#1C1D21`, and the app shell, the sign-in panel and the site footer all use it.
Sign in and the dark panel you were looking at simply becomes the dark column
you keep working in.

| Sidebar token | Value | Contrast |
|---|---|---|
| `background` | `#1C1D21` | 15.5:1 vs the canvas |
| `backgroundActive` | `#0B62DE` | 5.5:1 for its white label, 3.1:1 vs the column |
| `backgroundHover` | `rgba(255,255,255,0.07)` | — |
| `text` | `#A1A1A6` | 6.6:1 |
| `sectionLabel` | `#8A8A8F` | 4.9:1 |
| `border` | `rgba(255,255,255,0.08)` | brand divider + right edge |

The active item is a **solid accent pill**, lifted from the base accent
(`#0A57C2` → `#0B62DE`) so it carries on near-black while keeping its white
label above AA. That pill is the only place the brand blue appears in the
chrome, and it is what ties the dark shell to the blue primary buttons in the
content area — the "combination" that was missing.

`AppLayout.jsx` edits, all styling: the drawer paper carries a right hairline,
the brand lockup is separated from the nav list by that same hairline, the
wordmark reads `sidebar.textActive`, and the selected/hover states use
`sidebar.textActive` / `sidebar.backgroundHover` instead of the hardcoded
`#fff` and `rgba(255,255,255,0.06)` they used before.

**The lesson worth keeping:** copying a reference design's rule (light sidebar)
without checking the rest of the surface inventory produced something
defensible on paper and disjointed on screen. The fix was not "go back to
navy" — it was to make every dark surface in the product literally the same
colour.

### 20d. Nav icons: four identical umbrellas

`My Workspace` had **four consecutive items** (`Apply Leave`, `My Leaves`,
`Leave Calendar`, `Leave Balances`) all rendering the same
`BeachAccessRoundedIcon`, plus two more elsewhere. An icon column where four
adjacent rows share a glyph is decoration, not navigation. Now:
`EditCalendar` / `BeachAccess` / `DateRange` / `DonutSmall`, plus
`PendingActions` for approvals and `FactCheck` for All Leaves. Labels, paths,
roles and order are untouched.

### 20e. The structural sidebar problem — analysed, NOT changed

Worth knowing before anyone touches nav again. **The sidebar duplicates
navigation that already exists inside the pages.** The app has six tabbed
layouts (`LeaveLayout`, `AttendanceConsoleLayout`, `PayrollLayout`,
`MastersLayout`, `RosterLayout`, `ContractorsLayout`), and the sidebar *also*
lists the individual tabs as separate top-level entries:

| Section | Sidebar entries today | Entries if the tab owner is listed once |
|---|---|---|
| Leave (self-service) | 4 | 1 |
| Contractors | 5 | 1 |
| Leave (HR) + approvals | 2 | 2 |
| **ADMIN total visible** | **~26** | **~14** |

Published guidance puts the practical ceiling at 5–8 items per group before a
sidebar starts to feel overwhelming; several groups here are well past it.
Collapsing each tabbed module to a single entry would halve the list and lose
nothing — every removed destination stays reachable as the tab it already is.

**Not done in this pass, deliberately.** Changing which destinations are
directly reachable is a navigation change, not a styling one, and it was asked
about rather than asked for. It is a `navConfig.js`-only edit when someone
wants it — no route in `App.js` would change, and `RequireRole` reads only the
exported role constants, not the item list.

### 20f. Verified

- `CI=false react-scripts build` → **Compiled successfully**, no warnings.
- Contrast ratios computed, not eyeballed — see the table in §20b.
- Both sidebar versions were rendered and screenshotted — including the
  selected state, and the second time against a mock top bar, card and primary
  button so the whole composition could be judged — via a **temporary** public
  preview route (`SidebarContent` exported, a throwaway page, one route). All
  of it was removed afterwards both times; `grep -rn "SidebarPreview" src`
  returns nothing. Signing in to look at the real thing was not an option —
  that needs credentials.
- Public site, sign-in screen (1440px split panel and 390px stacked), the
  ink footer and closing band all re-checked after the palette change.
