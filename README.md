# Muster web app (Accusharp HRMS frontend)

The React web client for the Accusharp HRMS backend (`../../Accusharp`): org
masters, employees, rosters, attendance, leave, payroll, salary slips, reports,
roles and the audit log - everything HR and admins do, plus the employee
self-service screens. Employees and supervisors on the shop floor also have a
phone app, [`../../AccusharpMobile`](../../AccusharpMobile/README.md), that reads the
same API.

- React 19, Create React App, MUI, React Router
- Navigation and route guards follow the **permission list the server sends at
  sign-in** (`src/constants/access.js`), not the role name
- Access token in memory, refresh token an httpOnly cookie (`src/api/client.js`)

## Run it

```bash
npm install
npm start          # http://localhost:3000, proxies /api to http://localhost:8080
npm test           # jest, interactive; add --watchAll=false for one run
npm run build      # production bundle in build/
```

The backend must be running; the quickest way is its H2 profile - see
[`../../Accusharp/README.md`](../../Accusharp/README.md) section 1. In a release the
app is served by nginx (`nginx.conf`, `Dockerfile`) in front of the API, as in
`../../deploy/`.

## Where to read next

| Doc | What it holds |
|---|---|
| [HANDOFF.md](HANDOFF.md) | How the app is wired, module by module, what was verified, known gaps. Sections 1-20 are dated; the notes marked "out of date" were corrected on 2026-10-03. Section 21 is about the mobile client and the web behaviours it deliberately does not copy |
| [REDESIGN_HANDOFF.md](REDESIGN_HANDOFF.md) | The Apple-inspired visual redesign: a running log of what was done per screen against the redesign brief at the workspace root |
| `../../Accusharp/SECURITY.md` | Why sign-in, refresh and authorization work the way they do |

## Two things that catch people out

- **The ADMIN login is a company account, not an employee.** The server signs it in
  as an `EMPLOYEE` principal holding every permission, so a screen must not decide
  a personal workspace from permissions: `ACCESS.workspace` excludes the role.
- **A month that is still running is a preview**: days that have not happened read
  `ABSENT` and are already counted in `lopDays`. `MyAttendance.jsx` lists days up to
  today only and holds back the LOP total until the month ends
  (`pages/Attendance/runningMonth.js`, HANDOFF section 21). Anything new that reads
  `GET /api/attendance/{id}/monthly` needs the same care, and so does anything that
  lists stored records: generating a running month stores every day of it
  (`Records.jsx` hides the ones to come; HANDOFF section 21).
