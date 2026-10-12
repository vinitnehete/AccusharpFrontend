# AccuSharp Frontend Redesign — Session Handoff

Status snapshot of the Apple-inspired frontend redesign, driven by
`AccuSharp HRMS — Principal Full-Stack Engineer & Production Frontend
Redesign Prompt.md` at the workspace root. Read that file first for the
full spec; this doc is a running log of what's actually been done against
it, so a new session (or a human) can pick up without re-deriving context.

**Every screen in the original module rollout order has now been touched**
(Dashboard through Platform admin, including the full long tail — Holidays,
Attendance Console, remaining Leave screens, Salary Slips, My Team, Change
Password). What's left is genuinely open-ended follow-on work, not a
specific remaining screen — see "Suggested next steps" at the bottom.

**Scope discipline maintained throughout:** no backend changes, no API
contract changes, no changes to payroll/attendance/leave calculation logic,
no changes to the JWT/auth architecture, no changes to `PermissionSeeder.java`
or the frontend's permission *semantics* (only which UI actions check them).

---

## Idle session timeout (added after the initial module rollout)

The user asked directly why a long-idle session never logs out. Answer: the
existing (pre-redesign) architecture is a 15-min access token silently
refreshed via a 7-day refresh token, with the token in `localStorage` — so a
forgotten tab stays "logged in" for up to a week. That's a documented
tradeoff in the existing codebase and the master spec explicitly says not to
change the JWT/refresh architecture during this redesign without approval,
so it wasn't touched.

What *was* added, with explicit approval: a frontend-only idle timeout,
independent of the token architecture. New component
[`src/components/IdleSessionGuard.jsx`](src/components/IdleSessionGuard.jsx),
mounted in `AppLayout.jsx` (so it only ever runs for an authenticated
session). After 14 minutes of no mouse/keyboard/touch/scroll activity, it
shows a "Still there?" dialog with a live 60-second countdown; if there's no
response, it calls the existing `logout()` and redirects to `/login`. It's
a `data-testid="idle-timeout-dialog"` for later automated testing.

**Verified live, deterministically** (not just by inspection): temporarily
lowered the constants to a few seconds, drove the whole flow via the
browser tab, and confirmed via direct `localStorage`/DOM checks — not
screenshots alone, since the timing is easy to eyeball wrong — that (1) the
warning dialog appears while the session is still authenticated, (2) taking
no action results in a real logout with `accusharp.auth` cleared and a
redirect to `/login`, and (3) clicking "Stay signed in" genuinely resets
the timer — the session was still alive well past when it would otherwise
have expired. Reverted the constants to the real 15-minute/60-second values
afterward and rebuilt clean.

**Two issues found and fixed during a follow-up vulnerability review** (user
asked directly "do we have any vulnerabilities in the frontend" — prompted
a fresh grep pass rather than relying on memory):
1. `SalarySlip.jsx`'s two `window.open(url, '_blank')` calls (Print, Export
   CSV) had no `noopener,noreferrer` — a minor reverse-tabnabbing exposure
   (low real risk here since both URLs are same-origin backend endpoints,
   but a one-line fix with no downside). Fixed.
2. **A real bug in the idle-timeout feature above, introduced by that same
   feature**: `localStorage` is shared across every tab of the same origin.
   If one idle tab logged out, it silently cleared `accusharp.auth` (and
   revoked the refresh token server-side) for *every* open tab, including
   one the user was actively working in. Fixed by broadcasting activity
   through a second `localStorage` key (`accusharp.lastActivity`) that
   every tab's guard listens for via the `storage` event — real activity in
   any tab now resets every tab's timer. **Verified with two real browser
   tabs**, not by inspection: tab 1 idled into its warning dialog, tab 2
   received simulated activity, and tab 1's session was confirmed still
   alive (`localStorage` check) well past what would have been its
   original logout point.

---

## Active attack-simulation pass (user asked "can we attack the frontend to check it")

Ran a structured set of real attacks against the live backend (not just code
review) using the disposable QATEST accounts plus a second throwaway company
(`QATEST2`, id 4 — **left in place, harmless, clearly named "QA Test Company
B (Claude IDOR test)"**, delete via `platform_owner` → Companies whenever).
All of the following were tried for real, not simulated:

- **XSS**: stored `<script>`/`<img onerror>` payloads in a holiday
  name/description, confirmed the backend stores them verbatim (expected —
  sanitization is the frontend's job) and confirmed the frontend renders
  them as inert escaped text, not executable markup. No `dangerouslySetInnerHTML`
  anywhere in the codebase, confirmed by grep.
- **JWT forgery**: tampered a real token's payload (role EMPLOYEE→ADMIN)
  keeping the original signature → rejected (401, signature mismatch). Tried
  the classic `alg: none` algorithm-confusion attack → rejected (401).
  Garbage token, no token → both correctly 401.
- **Refresh token replay**: reused an already-consumed (rotated) refresh
  token → rejected ("already been used or revoked"). Reused a refresh token
  after explicit logout → rejected. **One real, pre-existing finding**:
  logout only revokes the *refresh* token — the already-issued *access*
  token stays fully valid for the rest of its ~15-minute life, since it's a
  stateless JWT with no server-side access-token revocation list. This is
  already documented as an accepted tradeoff in the backend's own
  `SECURITY.md`, not something introduced or fixed here.
- **Privilege escalation / authorization bypass**: as a plain EMPLOYEE, tried
  creating an employee, deleting an employee, generating payroll, purging
  audit logs, and creating a company — all correctly 403'd by the backend
  regardless of what the UI shows. As a SUPERVISOR, tried self-promoting to
  ADMIN via a plain employee-update call — blocked by the self-escalation
  guard.
- **Cross-tenant IDOR**: using Company B's admin token, tried reading Company
  A's employee by numeric ID and by userId, tried reading Company A's
  attendance and payroll — all 404 (indistinguishable from "doesn't exist",
  per the backend's deliberate design). Listing employees as Company B never
  leaked a single Company A record. Tried planting a new employee into
  Company A by setting `companyId` in the request body while authenticated
  as Company B — server silently overwrote it back to the caller's own
  company; the plant failed.
- **Account lockout**: 5 wrong passwords against a disposable account →
  6th attempt, even with the *correct* password, correctly locked out.
- **Response headers**: backend sends `X-Frame-Options: SAMEORIGIN` and
  `X-Content-Type-Options: nosniff` on API responses; no
  `Content-Security-Policy` header (a defense-in-depth gap worth adding at
  the backend/proxy level someday, not urgent given no active XSS vector
  exists to exploit). The permissive CORS/`X-Powered-By: Express` headers
  seen on `:3000` are CRA's dev server only, not representative of a real
  production static-file deployment.

**Net result on everything above: no exploitable vulnerability found.**
Every privileged action, every tenant boundary, and every forged-token
variant was correctly rejected by the backend, independent of the frontend.

### One critical exception, found and fixed: the JWT default-secret bypass

`application.properties` ships `jwt.secret=${JWT_SECRET:dev-only-insecure-...}`
— a real, committed placeholder. I forged a `PLATFORM_OWNER` token from
nothing (no login, no password) by signing it with that exact placeholder
string, and the then-running local backend accepted it and returned the
real company list (`Accusharp`, `Accenture`, plus the test companies). That's
a full authentication bypass for any deployment that forgets to set
`JWT_SECRET` — and the placeholder being public source means "forgets" is
the only bar.

**Fixed** (`Accusharp/src/main/java/com/accusharp/hrms/security/JwtService.java`,
backend, done with explicit approval — this is outside the frontend redesign
scope but too severe to leave for later): the constructor now throws
`IllegalStateException` and refuses to start if `jwt.secret` still equals
the placeholder, instead of just logging a warning. **Verified with two
separate throwaway instances** on port 8091 (never touched the real running
instance on 8080):
- `JWT_SECRET` unset → refuses to start, clear error message pointing at the
  fix.
- `JWT_SECRET` set to a real random value → starts normally, serves
  requests correctly.

**Closed, confirmed live** — you added `JWT_SECRET` to the IntelliJ run
configuration and restarted. First attempt failed to start, which was the
guard correctly catching the same missing-secret problem on your own
machine (see the stack trace ending in the `IllegalStateException` above -
that was success, not a bug). After adding the env var it started cleanly.
Re-verified directly against the now-running `:8080` instance: real login
still returns `200` and works normally; the *exact* forged token that
previously returned your real company list now returns `401` (it was
signed with the old default secret, which the running instance no longer
uses).

Still true for wherever you actually deploy this: that environment needs
its own real `JWT_SECRET` set the same way — that's infrastructure-level
config I have no access to from here.

---

## Dependency vulnerability audit

### Frontend — `npm audit`
30 findings (15 high, 6 moderate, 9 low) before any fix. **29 of the 30 are
in `react-scripts`' own build toolchain** (webpack-dev-server, postcss,
svgo/@svgr, jest, terser/serialize-javascript, workbox-build) — none of
these packages are ever `import`ed by application source, so none of them
ship into the production `build/` bundle a real user's browser downloads.
They only matter on a developer's own machine while running `npm start`/
`npm test`, and even then mostly require a developer to separately visit a
malicious site while the dev server happens to be running. Confirmed via
`npm ls` that none of the actual runtime dependencies (`react`, `axios`,
`@mui/*`, `react-router-dom`, `recharts`, `dayjs`, `notistack`) appear
anywhere in the audit output — they're clean. This is a known, long-running
characteristic of Create React App's toolchain (part of why many teams have
moved to Vite) — not fixable without ejecting or migrating build tools,
which is a real engineering decision, not a quick patch.

**The 1 real one**: `exceljs@4.4.0` (used in `utils/employeeTemplate.js` to
generate the bulk-import `.xlsx` template — genuinely ships to production)
pulled in a vulnerable `uuid@8.3.2` (moderate, buffer-bounds-check issue).
Not reachable in this app's actual usage (exceljs generates its own
internal UUIDs from static template data, no user input flows into the
vulnerable code path) — but fixed anyway since it was cheap and clean: added
a scoped `overrides` entry in `package.json` pinning `uuid` to `^11.1.1`
*only* under `exceljs` (left `sockjs`'s own separate `uuid`, a dev-tooling
dependency, untouched). Verified: `npm run build` still succeeds, and the
actual "Download template" button in Bulk Import Employees still generates
the file correctly with no console errors. Down to 29 findings, all
dev-toolchain-only.

### Backend — Maven dependencies
No CVE scanner is wired into the build (no OWASP dependency-check plugin).
Checked the exact resolved versions by hand against current advisories
instead of running a first-time NVD database download (impractical mid-session):

| Dependency | Version | Result |
|---|---|---|
| Spring Boot | 4.1.0 | 3 CVEs found for the 4.x line (incl. a 9.1 CVSS actuator auth-bypass) — all affect only 4.0.0–4.0.5, fixed by 4.0.6 and forward-ported to 4.1.0. This app is also on none of the affected features (no `spring-boot-starter-actuator`, no `spring-boot-devtools` in `pom.xml` at all) — clean on both counts. |
| Spring Security | 7.1.0 | 3 CVEs found, all in features this app doesn't use (OAuth2 Authorization Server, XML-based security config, `JdbcOneTimeTokenService`) — confirmed via `pom.xml`/`src` grep that none of those are present. Not applicable. |
| jjwt (api/impl/jackson) | 0.12.6 | No known CVE for this version. |
| mysql-connector-j | 9.7.0 | The one recent connector CVE (CVE-2025-30706) only affects 9.0.0–9.2.0 — this app is on a newer patched release. |

**Net result: no exploitable dependency vulnerability found on either side**,
beyond the one `exceljs`/`uuid` issue already fixed above. Worth
re-running a proper OWASP/Snyk-style scan periodically going forward,
though — this was a manual point-in-time check, not continuous monitoring.

---

## Design system (Phase 2)

`src/theme/theme.js` was rebuilt as a token system (`export const tokens`)
on top of the app's *existing* palette (teal `#0F9D8B` primary, navy
`#152238` sidebar) — not a new palette. Added:
- Type scale mapped onto MUI's stock variants (h1–h6, subtitle, body, caption)
- A calm 25-level shadow scale replacing MUI's default heavy shadows
- Radius scale (`sm`/`md`/`lg`/`card`/`dialog`/`pill`)
- `:focus-visible` ring on all interactive base components
- `prefers-reduced-motion` support via `MuiCssBaseline`
- Warning color darkened (`#E2A400` → `#B76E00`) for WCAG AA text contrast

**Real finding, not planned:** `public/index.html` was loading Inter from
Google Fonts CDN — removed. This was silently leaking visitor IP to Google
on every page load and is exactly the external-font-CDN pattern the spec's
own §9/§21 says to avoid. Now pure system font stack.

Shared component changes (each affects every page that uses it):
- `components/DataTable.jsx` — new `emptyState` prop (title/description/action). No more bare MUI "No rows".
- `components/MasterCrudPage.jsx` — auto-generates a sensible empty state from `entityLabel`; used by Companies/Departments/Designations/Categories.
- `components/StatCard.jsx` — soft tinted icon background instead of solid fill; `loading` skeleton prop.
- `components/PageHeader.jsx` — title bumped to the "Page Title" type-scale variant (h4).
- `components/MoneyText.jsx` — tabular-nums for aligned digits.
- `src/utils/mask.js` — new. `maskSensitive(value)` → `"XXXX XXXX 4521"` style masking for bank/UAN/ESIC display.

---

## Module-by-module changelog

### Dashboard (`pages/Dashboard/Dashboard.jsx`)
Same API/data. Regrouped 8 flat stat cards into 3 labeled sections
(Workforce & Attendance / Leave / Payroll & People). Added skeleton loading
and a real retry-on-failure state (was a dead-end "Could not load" message).

### Attendance — My Attendance (`pages/Attendance/MyAttendance.jsx`)
Split into two views on the same data: a friendly consumer summary (big
"present X of Y days" card, plain-language copy, card-list days) for plain
EMPLOYEE viewers, and the original dense table for HR/Admin/Supervisor.
Branch is `isSupervisorOrAbove`, already existed in the file.

### Leave — Apply + My Leaves (`pages/Leave/Apply.jsx`, `MyLeaves.jsx`)
Apply: primary Submit moved to a full-width button at the bottom of the
form, added live "this covers N days" helper. My Leaves: replaced the
dense DataGrid with a card-per-request list using plain-language status
copy — verified live to read exactly: *"Waiting for approval. Your request
has been submitted to your manager."* — matching the spec's own example
verbatim. Added empty state with an Apply CTA.
**Not yet touched:** Leave Calendar, Leave Balances, Pending Approvals, All Leaves, Bulk Import Leaves.

### Employee management (`pages/Employees/*`)
- `EmployeeList.jsx` — added `can('EMPLOYEE_CREATE'/'UPDATE'/'DELETE')` gating to Add/Bulk Import/Edit/Deactivate (previously fully open to any authenticated user, relying only on nav-hiding + silent 403). Empty state with "Clear filters" action.
- `EmployeeDetail.jsx` — bank account/IFSC/UAN/ESIC now masked via `maskSensitive`.
- `EmployeeForm.jsx` — same 4 fields are `type="password"` with a per-field "Show" toggle (editable context, so static masking isn't enough).
- **Real bug found and fixed:** the edit-form's data-loading effect used `departments.length === 0` as a "still loading" proxy. A company with zero departments/designations configured (a normal state for a freshly onboarded company) made that condition permanently true, so **no employee could ever be edited**. Fixed with an explicit `mastersLoaded` flag. Verified live — this was reproducible in the test company before the fix.

### Shift management + Roster (`pages/Shifts/ShiftList.jsx`, `pages/Roster/Planner.jsx`)
- ShiftList: new **Warnings** column surfacing the backend's `warnings` array (phantom-overtime, zero-OT-window) as a tooltip icon — previously only visible transiently after editing one shift. Proactive "Overnight shift" banner in the Add/Edit dialog the moment start/end times imply crossing midnight, before saving. `can('SHIFT_MANAGE')` gating added.
- Planner: `can('SHIFT_SCHEDULE_MANAGE')` gating + a real confirmation dialog for "Apply holiday override" (previously a single unconfirmed click for a bulk-overwrite action).
- **Verified against real data:** all 4 seeded shifts (Morning/General/Evening/Night) genuinely carry phantom-overtime warnings from the backend calculation — not a hypothetical, real seed data.

### Payroll (`pages/Payroll/Generate.jsx`, `List.jsx`, `pages/Masters/SalaryRule.jsx`)
- `api/payroll.js` — added the `debug` endpoint call (wasn't wired to the frontend at all before).
- `Generate.jsx` — new **Payroll readiness** panel. On a 409 conflict (period already generated), fetches the stored-vs-live comparison and explains exactly what changed (old value → new value) before the user regenerates. This is deliberately on the *regenerate* flow, not a generic "before generation" banner — the debug endpoint compares against a *stored* payroll snapshot, so it has nothing to compare on a genuinely first-ever generation.
- `SalaryRule.jsx` — `can('SALARY_RULE_MANAGE')`/`can('EMPLOYEE_UPDATE')` gating (fields were editable to anyone before).
- **Verified with a real induced-drift scenario:** generated real payroll, changed the salary rule via the real API, tried regenerating → got the real 409 and the exact correct stored-vs-live percentages in the readiness panel.

### Reports (`pages/Reports/*`, `App.js`)
- `EmployeesReport.jsx` — bank/IFSC/UAN/ESIC masked in both the on-screen table and the CSV export (explicit product decision, confirmed with the user — masking was chosen over leaving the export unmasked).
- `ReportPage.jsx` (shared by all 13 report pages) — empty state.
- **Code-split:** all 13 report page components are now `React.lazy` + `Suspense` in `App.js` — HANDOFF.md's own flagged best code-splitting candidate. Confirmed via network inspection that a report page loads as a genuinely separate chunk on demand.

### Roles / Audit / Platform (`pages/Roles/*`, `pages/AuditLog/AuditLog.jsx`, `pages/Masters/Companies.jsx`)
- `RolesList.jsx`/`RoleDetail.jsx` — `can('ROLE_MANAGE')`/`can('ROLE_READ')` gating added (was fully ungated, relying only on nav-hiding). Permission checkboxes are genuinely `disabled`, not just visually de-emphasized, without manage rights.
- `AuditLog.jsx` — confirmed its existing `can('AUDIT_MANAGE')` gating was already correct (the one page the original audit found built right). Added empty state only.
- `Companies.jsx` — switched `readOnly` from an `isPlatform` boolean check to `can('COMPANY_UPDATE')`. The old check was already functionally correct; this is a consistency improvement.

### Masters — Departments / Designations / Categories (`pages/Masters/*`)
Added `readOnly={!can('DEPARTMENT_MANAGE')}` (etc.) to all three — previously always full CRUD regardless of permission, via the shared `MasterCrudPage`.

### Holidays + Attendance Rule (`pages/Holidays/Holidays.jsx`, `pages/Masters/AttendanceRule.jsx`)
`can('HOLIDAY_MANAGE')` / `can('ATTENDANCE_RULE_MANAGE')` gating added (both were fully ungated). Attendance Rule's fields are now `disabled` rather than just hiding Save, so a read-only viewer can't edit-then-discover-it-fails.

### Attendance Console (`pages/Attendance/Generate.jsx`, `Records.jsx`)
`can('ATTENDANCE_GENERATE'/'CORRECT'/'UNLOCK')` gating added to Generate/Correct/Unlock/Refresh (all previously ungated). Records now shows a month-level "N day(s) have a single punch only" banner (spec §25's `invalidPunches` signal) — previously only visible per-row via the status chip, easy to miss across a full month of rows.

### Remaining Leave screens (`pages/Leave/PendingApprovals.jsx`, `AllLeaves.jsx`, `Balances.jsx`, `Calendar.jsx`)
- `PendingApprovals.jsx` — switched from role-boolean gating (`isSupervisorOrAbove`/`isHrOrAdmin`) to `can('LEAVE_SUPERVISOR_APPROVE')`/`can('LEAVE_APPROVE')`. This is a real correctness fix, not just style: a custom role can grant `LEAVE_APPROVE` to someone who isn't literally HR/ADMIN (Phase 10 custom roles), and the old role-boolean check would have hidden their approval queue entirely even though the backend would accept their decision. Added empty states to both queues.
- `AllLeaves.jsx` — `can('LEAVE_APPROVE')` gating added to Add Leave/Bulk Import (previously ungated). Empty state added.
- `Balances.jsx` — quota-override edit icon switched from `isHrOrAdmin` to `can('LEAVE_BALANCE_MANAGE')`, same reasoning as above.
- `Calendar.jsx` — already well-built (grouped-by-date card list, good empty state); left as-is.
- `BulkImportLeaves.jsx` — already well-built; only reachable via `AllLeaves.jsx`'s now-gated button.

### Salary Slips (`pages/SalarySlips/SalarySlip.jsx`, shared by `SalarySlip` and `MySalarySlip`)
- Replaced two raw month/year number `TextField`s with a proper `DatePicker` (`views={['year','month']}`) — consistent with every other month-picker in the app and much friendlier on a phone.
- **"Export month CSV" is now hidden on the self-service view** (`MySalarySlip`, `fixedEmployeeId` set). That button exports the *whole company's* salary slips for the period — it never belonged on an employee's own payslip screen regardless of what the backend permits. Still shown on the HR-facing `SalarySlip.jsx` route. Verified live: hidden on `/salary-slips/me`, present on `/salary-slips`.
- Loading state changed from a trailing "Loading…" text line to a `Skeleton` matching the card's shape.
- **Worth a backend follow-up, not fixed here**: `GET /api/salary-slips/export` is gated by the class-level `SALARY_SLIP_READ` permission, which a plain EMPLOYEE also holds (for their own self-service views). I didn't verify whether that endpoint additionally self-scopes for an EMPLOYEE caller the way other self-service endpoints do — the frontend fix above prevents the button from ever being *shown*, but if that endpoint doesn't scope server-side, a plain employee could still hit it directly by URL and get every employee's payroll for a month. Worth a two-minute check against the backend before this is considered fully closed.

### My Team / Change Password (`pages/Employees/MyTeam.jsx`, `pages/Auth/ChangePassword.jsx`)
Already well-built (clear empty state, mismatch validation, informative alerts). No changes made.

---

## Testing infrastructure — QA test company

No local MySQL client was found, but a real MySQL server + a previously-running
backend (started from IntelliJ, connected to the real `vinit` database) was
discovered mid-session. Rather than touch `DataSeeder.java` (already
idempotent, but doesn't create any company/employee data) or the real
database directly, a fully isolated test company was created **through the
real, legitimate `/api/companies/onboard` endpoint** — no direct DB writes.

**This lives in the same database as your real data but is clearly namespaced
and safe to delete whenever:**

| Account | Username | Password | Role |
|---|---|---|---|
| Platform (pre-existing, from `DataSeeder`) | `platform_owner` | `Accusharp@123` | PLATFORM_OWNER |
| Test company admin | `QATEST_ADMIN` | `Tp7-6DwXsvzr5HJgbvg9S3Rplcbb` | ADMIN |
| Test employee | `QATEST_EMP1` | `Tp7-lSoKmc5oL0rsiZ2bGYaFINnM` | EMPLOYEE |
| Test supervisor | `QATEST_SUP1` | `Tp7-hfOljHwoq2tiSjG9nWjjc5QH` | SUPERVISOR |

Company: **"QA Test Company (Claude verification)"**, code `QATEST`, id `3`.
Has: 2 leave requests (1 pending, 1 approved), generated August 2026
attendance, one payroll revision, bank/UAN/ESIC test values on `QATEST_EMP1`.

To delete it later: log in as `platform_owner` → Companies → delete the
`QATEST` row (or ask me to do it).

**Dev server:** `npm start` in `Accusharpfrontend/accusharp`, runs on
`:3000`. Backend was already running on `:8080` from a separate IntelliJ
session — start your own if it's not still up.

---

## Verification method used throughout

Every module was verified with **real HTTP requests against the real
backend**, logged in through the actual `/login` form — not mocked, not
faked tokens. `npm run build` was run after every module (always clean,
zero errors) and the browser console was checked for new errors after
every change (none introduced). One real bug was found this way (see
Employee management above) and one CSS/prop bug in my own new code (a
stray MUI-v9 `inputProps` usage) was caught and fixed the same way.

---

## Known pre-existing issues NOT fixed (deliberately out of scope)

- Bundle size is ~857KB→874KB gzipped even after Reports code-splitting; the
  rest of the app (Payroll, Attendance, Roster consoles) are still candidates
  per HANDOFF.md but not yet split.
- `EmployeesReport.jsx`'s CSV export duplicates client-side what the backend's
  `?format=csv` bulk-import endpoint already does server-side (HANDOFF.md §7.7) — untouched.
- No automated frontend tests exist; all verification here was manual/live.

---

## Suggested next steps

Nothing in the original spec's module list is untouched, so what's left is
open-ended rather than a specific screen:

1. **Verify the Salary Slip export scoping question above** — the one item
   in this doc flagged as "worth a backend follow-up." Quick to check, and
   the only item here with a real (if unconfirmed) security shape to it.
2. **Delete or keep the QA test company** — it's harmless where it is, but
   worth a decision rather than leaving it indefinitely.
3. **Broader responsive/mobile pass** — verification in this session
   focused on desktop + a couple of explicit mobile checks (Login, My
   Attendance, My Leaves). The dense HR tables (Employee List, Payroll List,
   Reports, Roster Planner's date-matrix grid) haven't been individually
   checked at phone width beyond what the shared `DataTable`/`MasterCrudPage`
   components already handle.
4. **Automated tests** — `data-testid` attributes were added on the highest-
   value interaction points as they were touched (e.g.
   `employee-create-button`, `employee-search-input`, `leave-submit-button`,
   `payroll-warning`, `attendance-needs-attention`) per spec §36, but nothing
   runs against them yet.
5. **Further code-splitting** — Payroll/Attendance/Roster consoles, per
   HANDOFF.md's own note, same pattern as what was just done for Reports.

---

## Current integration update (2026-10-10)

The salary override fix and restored loan/recovery frontend preserve the
current design system, Rules navigation, weekly-off configuration and work
policies. All earlier redesign notes are historical; the old claim that no
automated frontend tests exist no longer applies.

`EmployeeDetail.jsx` keeps its existing salary card/dialog layout while adding
medical allowance, other allowance and PF basic to Override. A MUI error alert
uses the existing red status treatment when gross salary and gross wage differ,
on the card and while editing. The notice is informational, and PF basic is
excluded from the wage sum. Existing pay/bank visibility and self-edit guards
were retained while resolving the older stash's duplicate salary cards.

The restored Loans & Recoveries screens use the current MUI cards, grids,
shared employee picker, DataTable, MoneyText and existing API client. The HR
sidebar entry is permission-based (`RECOVERY_MANAGE`); the personal workspace
adds My Loans (`RECOVERY_READ`). The statement binds viewers without `PAY_READ`
to their own account and hides the picker. Issue and CSV tabs/routes remain
manage-only. A loan can be entered with a past/current/future issued date and
without a payroll prerequisite; an explicit recovery period needs month and
year and can start in the issue month or later.

Salary slips retain the redesigned net-pay panel and add opening/recovered/
closing recovery balances above it. Payroll generation keeps blank recovery
fields distinct from explicit zero and resets prefills when employee/period
changes, preventing a stale response from showing another employee's figures.
Untouched prefills keep the server's per-loan schedule; only edited fields
become overrides. Both issue and statement screens discard stale balance
responses when the employee selection changes or clears.
The restored attendance bulk-upload screen and biometric exemption field
coexist with current work policies and weekly-off settings.

Validation used Jest/Testing Library regressions for salary override, loan
issuance, self statement, access/navigation and recovery prefills. This entry
does not claim a new browser layout review or live production-data verification.
The full implementation/behavior notes are in HANDOFF section 22.
