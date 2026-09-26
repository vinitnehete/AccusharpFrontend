import { BRAND } from '../constants/brand';

// ---------------------------------------------------------------------------
// Public website copy — the ONLY file you need to edit to change what the
// marketing pages say.
//
// Nothing in here touches the application. These are plain strings and arrays
// read by the four public pages (Home, Services, About, Contact) and the
// public header/footer.
//
// Anything marked `SAMPLE` below is a placeholder to be replaced with the real
// detail (address, phone, registration numbers, story, team). Everything else
// is factual and derived from what the product actually does today.
//
// Two arrays — `about.leadership` and `testimonials` — ship EMPTY on purpose.
// Their sections simply don't render while they're empty, so a demo never
// shows an invented person or an invented quote. Fill them in and the section
// appears.
// ---------------------------------------------------------------------------

export const company = {
  ...BRAND,
  shortPitch: 'Workforce, attendance and payroll on one system.',
  foundedYear: '2019', // SAMPLE
};

export const contact = {
  email: 'hello@muster.in', // SAMPLE
  salesEmail: 'sales@muster.in', // SAMPLE
  phone: '+91 00000 00000', // SAMPLE
  addressLines: [
    BRAND.legalName, // SAMPLE
    '2nd Floor, <Building name>',
    '<Street>, <Area>',
    'Pune, Maharashtra 411000',
  ],
  hours: 'Monday to Saturday, 9:30 am – 6:30 pm IST', // SAMPLE
};

export const hero = {
  eyebrow: 'HRMS for manufacturing & services',
  title: 'From biometric punch to compliant payslip',
  titleAccent: 'without the spreadsheets.',
  subtitle:
    `${BRAND.productName} turns raw attendance-device data into reviewed attendance, approved leave and statutory-ready payroll — for every company you run, on one system.`,
  bullets: [
    'Multi-company from day one',
    'PF · ESIC · PT · MLWF · TDS built in',
    'Corrections that survive regeneration',
  ],
};

// Every number here is real and countable in the product today.
export const stats = [
  { value: '27', label: 'Ready-to-run reports' },
  { value: '10', label: 'Connected modules' },
  { value: '6', label: 'Permission-based roles' },
  { value: '5', label: 'Statutory heads covered' },
];

export const highlights = [
  {
    icon: 'attendance',
    title: 'Attendance you can actually correct',
    description:
      'A correction made by HR is never silently destroyed by the next regeneration. Every day carries its own record status, and a closed month can be locked.',
  },
  {
    icon: 'payroll',
    title: 'Payroll that stays reproducible',
    description:
      'Each run is an immutable revision with the salary rule snapshotted onto it. Last quarter’s payslip still prints exactly as it was issued.',
  },
  {
    icon: 'compliance',
    title: 'Compliance as configuration',
    description:
      'PF, ESIC, Professional Tax, MLWF and TDS rates live in a per-company rule you edit. When a notification changes a slab, you change a field — not the software.',
  },
  {
    icon: 'company',
    title: 'One install, many companies',
    description:
      'Each legal entity’s data is isolated on the server, not merely hidden by the interface. Group companies share an installation without sharing records.',
  },
  {
    icon: 'bulk',
    title: 'Bulk is the normal case',
    description:
      'Import 500 employees, assign a month of shifts, run payroll for a whole company. Every bulk action reports row by row, so one bad row never fails the batch.',
  },
  {
    icon: 'audit',
    title: 'Every sensitive action is logged',
    description:
      'Granular, role-based permissions on the server plus a searchable audit trail of who changed what, and when.',
  },
];

export const howItWorks = [
  {
    step: '01',
    title: 'Set up',
    description:
      'Companies, departments, designations, categories and employment types — then your employees, one at a time or by bulk import from the spreadsheet you already keep.',
  },
  {
    step: '02',
    title: 'Roster',
    description:
      'Assign shifts for the month. Plan on a calendar, bulk-assign, auto-rotate, copy last month forward, or swap two people in a click.',
  },
  {
    step: '03',
    title: 'Generate & review',
    description:
      'The attendance engine converts device punches into daily attendance — grace, night shifts, week-offs and holidays included. Review the exceptions, correct what’s wrong, lock the month.',
  },
  {
    step: '04',
    title: 'Pay & file',
    description:
      'Run payroll for one employee or the whole company, issue salary slips, and export the registers, bank advice and statutory returns.',
  },
];

// The Services page. Each entry becomes one card.
export const modules = [
  {
    icon: 'employees',
    title: 'Employee master',
    summary:
      'One record per person, covering the full lifecycle — personal and statutory identifiers, department, designation, category, employment type and salary structure.',
    points: [
      'Bulk onboarding from CSV with per-row error reporting',
      'Salary structures and mid-year revisions, in bulk if needed',
      'One-time temporary passwords for new joiners',
      'Complete employee master export',
    ],
  },
  {
    icon: 'attendance',
    title: 'Attendance engine',
    summary:
      'Raw biometric punches become reviewable daily attendance — present, half-day, absent, late, overtime — against the shift each person was actually rostered on.',
    points: [
      'Grace periods, night shifts crossing midnight, week-offs and holidays',
      'Manual corrections that survive the next regeneration',
      'Configurable attendance policy rules, per company',
      'Month locking, so paid periods stop moving',
    ],
  },
  {
    icon: 'roster',
    title: 'Shift & roster planning',
    summary:
      'A month of shifts for a whole plant, planned on one screen instead of a wall chart.',
    points: [
      'Calendar planner with drag-free, click-to-assign editing',
      'Bulk assign, CSV upload and month-to-month copy',
      'Automatic rotation patterns',
      'Two-person shift swap',
    ],
  },
  {
    icon: 'leave',
    title: 'Leave management',
    summary:
      'Application, approval and balance in one place, with the leave calendar the whole team can see.',
    points: [
      'Self-service application and approval chain',
      'Team leave calendar and live balances',
      'Direct entry by HR for leave agreed offline',
      'Bulk import for opening balances and back-dated leave',
    ],
  },
  {
    icon: 'payroll',
    title: 'Payroll',
    summary:
      'Monthly payroll computed from locked attendance — not from raw punches — so the number on the payslip can always be explained.',
    points: [
      'Single employee, whole company, or bulk generation',
      'Immutable revisions; a reissue supersedes rather than overwrites',
      'Per-company salary rules with a global fallback',
      'A debug view that shows exactly which inputs produced a figure',
    ],
  },
  {
    icon: 'payslip',
    title: 'Salary slips',
    summary:
      'Print-ready salary slips for the month, and self-service access so employees can fetch their own without asking HR.',
    points: [
      'Printable slip for any past month',
      'Employee self-service view',
      'Bulk print and CSV export for the payroll team',
    ],
  },
  {
    icon: 'reports',
    title: 'Reports & registers',
    summary:
      '27 ready-to-run reports covering attendance, leave, payroll and statutory filing — each filterable and exportable.',
    points: [
      'Payroll register, payslip register and monthly payroll audit',
      'Bank transfer advice and full & final settlement',
      'Attendance exceptions, late coming, absenteeism, overtime and LOP',
      'PF ECR, ESI return, PT register, TDS 24Q and gratuity accrual',
    ],
  },
  {
    icon: 'contractors',
    title: 'Contractor workforce',
    summary:
      'Contract labour tracked as its own workforce — rostered and attended against the same shift catalogue, kept out of employee payroll.',
    points: [
      'Contractor and worker registers',
      'Roster and attendance for contract labour',
      'Reassignment between contractors',
      'Contractor-wise reporting',
    ],
  },
  {
    icon: 'masters',
    title: 'Configuration masters',
    summary:
      'The policy behind the numbers, kept as data you control rather than settings only a developer can reach.',
    points: [
      'Departments, designations, categories, employment types',
      'Salary rule — PF, ESIC, PT, MLWF and TDS parameters per company',
      'Attendance rule — grace, half-day and overtime thresholds',
      'Holiday calendar per company',
    ],
  },
  {
    icon: 'audit',
    title: 'Roles, permissions & audit',
    summary:
      'Six built-in roles, custom roles when those aren’t enough, and a record of every sensitive action.',
    points: [
      'Granular permissions enforced on the server, not just in the UI',
      'Custom roles built from the same permission set',
      'Searchable audit log',
      'Idle-session timeout and forced password change on first login',
    ],
  },
];

// Services we provide around the product, not inside it.
export const engagement = [
  {
    icon: 'masters',
    title: 'Implementation & configuration',
    description:
      'We map your company structure, shift patterns, salary rules and statutory rates onto the system with you — so the first payroll you run is already yours, not a template.',
  },
  {
    icon: 'bulk',
    title: 'Data migration',
    description:
      'Existing employee master, salary structures, opening leave balances and past attendance brought across from the spreadsheets you keep today, with a reconciliation you can check.',
  },
  {
    icon: 'attendance',
    title: 'Attendance device onboarding',
    description:
      'Your existing biometric devices feed the system directly. We help set up that feed and verify a full cycle of punches before you depend on it.',
  },
  {
    icon: 'people',
    title: 'Role-wise training',
    description:
      'Separate sessions for the payroll team, for supervisors approving leave and rosters, and for employees using self-service — each on the screens they will actually use.',
  },
  {
    icon: 'compliance',
    title: 'Support through the close',
    description:
      'Help when the month-end is tight, and configuration updates when a PF, ESIC or Professional Tax notification changes a slab.',
  },
  {
    icon: 'reports',
    title: 'Reports on request',
    description:
      'The register your auditor or your group office asks for, in the format they ask for it — added to your installation rather than rebuilt in Excel each month.',
  },
];

export const compliance = [
  'Provident Fund (EPF & EPS), with ECR-ready export',
  'ESIC contributions and the monthly return',
  'Professional Tax, per-state slabs and register',
  'Maharashtra Labour Welfare Fund',
  'TDS with Form 24Q output',
  'Gratuity accrual and full & final settlement',
];

export const audience = [
  {
    icon: 'factory',
    title: 'Manufacturing plants',
    description:
      'Biometric attendance, rotating shifts, overtime and contract labour — the case this system was built around first.',
  },
  {
    icon: 'company',
    title: 'Multi-entity groups',
    description:
      'Several legal entities that need separate books, separate statutory rates and one place to administer them.',
  },
  {
    icon: 'contractors',
    title: 'Contractor-heavy operations',
    description:
      'Sites where a large part of the daily headcount is contract labour that still has to be rostered and reported.',
  },
  {
    icon: 'services',
    title: 'Services companies on shifts',
    description:
      'Facilities, logistics, security and support teams where the roster changes every month.',
  },
];

export const about = {
  intro:
    'We build software for the people who have to close attendance on the 1st and pay salaries by the 7th.',
  // SAMPLE — replace with your own story.
  story: [
    `${BRAND.name} started with a problem our first customers described the same way every time: the biometric device was working perfectly, and payroll was still being assembled by hand. Punch data went into a spreadsheet, the spreadsheet went to a second spreadsheet, and by the time a payslip was issued nobody could say with confidence how a number had been arrived at.`,
    `So we built the missing middle. ${BRAND.productName} treats attendance as a reviewed, correctable record rather than something recalculated on the fly — which is what makes payroll reproducible months later, and what makes an auditor’s question answerable in a minute rather than a morning.`,
    'Today the same system handles employee records, rosters, leave, contract labour, payroll and statutory filing for organisations running several legal entities on one installation.',
  ],
  mission:
    'Make the month-end close boring — accurate, explainable and finished on time, without a single spreadsheet in the chain.',
  values: [
    {
      icon: 'accuracy',
      title: 'Accuracy over assumptions',
      description:
        'Money is calculated exactly, rounded once, and traceable back to the inputs that produced it.',
    },
    {
      icon: 'compliance',
      title: 'Compliance by default',
      description:
        'Statutory rates are configuration, not code, so a change in the law is a change you can make the same day.',
    },
    {
      icon: 'people',
      title: 'Built for the operator',
      description:
        'The screens are designed around how an HR or payroll team actually works through a month, not around our database.',
    },
    {
      icon: 'transparency',
      title: 'No black boxes',
      description:
        'Every generated figure can be opened up and explained. If we can’t show you why, we don’t ship it.',
    },
  ],
  // Add your team and this section appears on the About page. Shape:
  // { name: 'Full Name', role: 'Title', bio: 'One or two lines.' }
  leadership: [],
};

// Add customer quotes and the section appears on the Home page. Shape:
// { quote: '…', name: 'Full Name', role: 'Head of HR', organisation: 'Company' }
export const testimonials = [];

// Shown under the enquiry form, so a visitor knows what follows.
export const nextSteps = [
  {
    step: '01',
    title: 'A short call',
    description:
      'Headcount, how many legal entities, which attendance devices, and how the month is closed today. Twenty minutes is usually enough.',
  },
  {
    step: '02',
    title: 'A walkthrough on your numbers',
    description:
      'We configure a sandbox with your salary structure, your shift patterns and your statutory rates, and show you the screens with data you recognise.',
  },
  {
    step: '03',
    title: 'A parallel month',
    description:
      'Run one month alongside your current process and compare the output line by line before anything depends on it.',
  },
];

export const finalCta = {
  title: 'See it running on your own data',
  subtitle:
    'We’ll set up a walkthrough with your shifts, your salary structure and your statutory rates — not a generic demo.',
  primaryLabel: 'Talk to us',
  secondaryLabel: 'Employee sign in',
};

export const footerNote =
  `${BRAND.productName} — employee lifecycle, attendance, leave and payroll for multi-company operations.`;
