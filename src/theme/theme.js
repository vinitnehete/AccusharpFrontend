import { createTheme, alpha } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// Design tokens
//
// Single source of truth for color, spacing, radius, elevation and motion
// primitives. The MUI theme below is assembled from these tokens rather than
// hardcoding values inline, so the whole app can be re-tuned from one place.
//
// The look is a light "app in a frame": a cool grey canvas, and white rounded
// panels floating on it - sidebar, top bar and the page itself - separated by
// hairlines rather than heavy shadows. There is exactly ONE accent hue, so
// color stays information, not decoration: the only blue thing on a payroll
// screen is something you can act on, and the only green/red/amber things are
// statuses.
//
// Why blue, specifically, for an Indian product:
//   - Saffron reads as religiously and politically coded (renunciation, and
//     party colours). Not neutral on a screen used by everyone in a company.
//   - Saturated green carries a strong association with Islam, and green with
//     saffron reads as the flag.
//   - Blue is the one hue with no such loading. Ambedkar chose it in 1942
//     precisely because it carried no overt association, and it is the default
//     of Indian enterprise (HDFC, TCS, Infosys, SBI). Green and red survive
//     here only as *status* colours, which is a universal convention rather
//     than a brand statement.
//
// Every text colour below was checked for WCAG AA (4.5:1) against the surface
// it is actually used on - see the ratios in the comments.
// ---------------------------------------------------------------------------

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

// Used sparingly, for the italic half of a display headline on the public
// site and the sign-in screen. System serifs only: the production CSP allows
// fonts from 'self' alone, so a web font would silently fail to load there.
const serifFamily = 'ui-serif, "New York", "Iowan Old Style", "Palatino Linotype", Georgia, serif';

export const tokens = {
  font: { sans: fontFamily, serif: serifFamily },
  color: {
    neutral: {
      bg: '#F3F5F9', // canvas - the frame around the white panels
      surface: '#FFFFFF', // panels, cards, sheets, sidebar
      surfaceAlt: '#F8FAFC', // table headers, card header strips, subtle fills
      hover: '#F4F6FA', // row / nav hover
      border: '#E5E8EF', // hairline
      borderSoft: '#EEF1F5', // row separators inside a table
      borderStrong: '#D4D9E2', // input and secondary-button outlines
    },
    text: {
      primary: '#16181D', // 16.3:1 on canvas
      secondary: '#5B6472', // 6.0:1 on white, 5.7:1 on surfaceAlt
      tertiary: '#6B7280', // 4.8:1 on white - labels, not body copy
      disabled: '#A3AAB6',
      inverse: '#FFFFFF',
    },
    // The single accent. 5.2:1 for white-on-blue and 4.7:1 for blue-on-canvas,
    // so it is legible both as a filled button and as small text or an icon.
    accent: {
      main: '#2563EB',
      dark: '#1D4ED8', // 5.9:1 on accent.soft - active nav text and icons
      light: '#60A5FA',
      soft: '#EBF1FE', // active nav pill, soft buttons, selected rows
      softer: '#F5F8FF',
    },
    // Second hue, categorical charts only - never chrome.
    secondary: { main: '#4F46E5', soft: '#EEEDFD' }, // 5.4:1 on its soft
    success: { main: '#217A46', soft: '#E8F4EC' }, // 5.3:1 on white
    warning: { main: '#965900', soft: '#FDF3E1' }, // 4.9:1 on its soft
    error: { main: '#C0342B', soft: '#FDECEA' }, // 4.8:1 on its soft
    info: { main: '#1D4ED8', soft: '#EAF1FF' }, // 5.9:1 on its soft
    // The one dark surface in the product: the public site's footer and
    // closing band. The signed-in shell is deliberately light now.
    ink: { main: '#16181D', soft: '#23262D' },
    sidebar: {
      background: '#FFFFFF',
      backgroundActive: '#EBF1FE',
      backgroundHover: '#F4F6FA',
      text: '#3F4654', // 9.9:1 on white
      textActive: '#16181D',
      iconActive: '#1D4ED8',
      sectionLabel: '#6B7280', // 4.8:1
      border: '#E5E8EF',
    },
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 12,
    lg: 16,
    card: 16,
    panel: 20,
    dialog: 20,
    pill: 999,
  },
  elevation: {
    // Hairlines do the separating; depth is reserved for things that
    // genuinely float (menus, dialogs, the sticky top bar once scrolled).
    card: 'none',
    hover: '0 6px 20px rgba(15, 23, 42, 0.06)',
    raised: '0 8px 24px rgba(15, 23, 42, 0.08)',
    menu: '0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)',
    dialog: '0 24px 64px rgba(15, 23, 42, 0.18)',
  },
  motion: {
    fast: '140ms',
    base: '200ms',
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
  },
};

const { color, radius, elevation, motion } = tokens;
const ease = (props) =>
  props.map((p) => `${p} ${motion.base} ${motion.easing}`).join(', ');

// MUI requires exactly 25 shadow levels. The stock theme's defaults are
// heavy/dark; this replaces them with a calm, low-contrast scale so every
// component that elevates (Menu, Popover, Select, Snackbar, Dialog, Drawer)
// gets subtle depth automatically instead of per-component overrides.
const shadow = (y, blur, spread, a) => `0 ${y}px ${blur}px ${spread}px rgba(15, 23, 42, ${a})`;
const softShadowSteps = [
  'none',
  shadow(1, 2, 0, 0.04),
  shadow(1, 3, 0, 0.06),
  shadow(2, 6, 0, 0.06),
  shadow(4, 12, 0, 0.07),
  shadow(6, 16, -2, 0.08),
  shadow(8, 24, -2, 0.1),
  shadow(12, 32, -4, 0.12),
  shadow(16, 44, -6, 0.16),
];
const shadows = Array.from({ length: 25 }, (_, i) =>
  softShadowSteps[Math.min(i, softShadowSteps.length - 1)]
);

const STATUS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];
const SOFT = {
  primary: { bg: color.accent.soft, fg: color.accent.dark },
  secondary: { bg: color.secondary.soft, fg: color.secondary.main },
  success: { bg: color.success.soft, fg: color.success.main },
  warning: { bg: color.warning.soft, fg: color.warning.main },
  error: { bg: color.error.soft, fg: color.error.main },
  info: { bg: color.info.soft, fg: color.info.main },
};

const focusRing = `0 0 0 3px ${alpha(color.accent.main, 0.16)}`;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: color.accent.main,
      dark: color.accent.dark,
      light: color.accent.light,
      contrastText: color.text.inverse,
    },
    secondary: { main: color.secondary.main },
    background: {
      default: color.neutral.bg,
      paper: color.neutral.surface,
    },
    text: {
      primary: color.text.primary,
      secondary: color.text.secondary,
      tertiary: color.text.tertiary,
      disabled: color.text.disabled,
    },
    success: color.success,
    warning: color.warning,
    error: color.error,
    info: color.info,
    divider: color.neutral.border,
    action: {
      hover: 'rgba(15, 23, 42, 0.04)',
      selected: alpha(color.accent.main, 0.08),
    },
    sidebar: color.sidebar,
    ink: color.ink,
    surfaceAlt: color.neutral.surfaceAlt,
    // Read by @mui/x-data-grid's theme adapter.
    DataGrid: { bg: color.neutral.surface, headerBg: color.neutral.surfaceAlt },
  },
  // Kept at 10: every `borderRadius: n` in page sx multiplies this, so moving
  // it would quietly re-round hundreds of boxes. Component radii are set in
  // pixels below instead.
  shape: { borderRadius: 10 },
  shadows,
  typography: {
    fontFamily,
    // Type scale — Display / Page Title / Section Heading / Card Heading /
    // Body / Secondary / Caption map onto MUI's stock variants below so
    // every page uses the same handful of variants instead of ad hoc sizes.
    // Headings are semibold rather than bold: calmer, and closer to how the
    // product sounds - a quiet tool, not a billboard.
    h1: { fontSize: '2.75rem', lineHeight: 1.08, fontWeight: 700, letterSpacing: '-0.03em' }, // Display
    h2: { fontSize: '2.125rem', lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontSize: '1.75rem', lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontSize: '1.625rem', lineHeight: 1.25, fontWeight: 600, letterSpacing: '-0.02em' }, // Page Title
    h5: { fontSize: '1.25rem', lineHeight: 1.3, fontWeight: 600, letterSpacing: '-0.012em' }, // Section Heading
    h6: { fontSize: '1.0625rem', lineHeight: 1.4, fontWeight: 600, letterSpacing: '-0.005em' }, // Dense Card Heading
    subtitle1: { fontSize: '1rem', lineHeight: 1.5, fontWeight: 600, letterSpacing: '-0.005em' }, // Card Heading
    subtitle2: { fontSize: '0.875rem', lineHeight: 1.45, fontWeight: 600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55, fontWeight: 400 }, // Body
    body2: { fontSize: '0.8125rem', lineHeight: 1.5, fontWeight: 400 }, // Secondary
    caption: { fontSize: '0.75rem', lineHeight: 1.4, fontWeight: 500 }, // Caption / Helper / Error
    overline: {
      fontSize: '0.6875rem',
      lineHeight: 1.4,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
    button: { fontWeight: 600, textTransform: 'none', fontSize: '0.875rem', letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: color.neutral.bg },
        '::selection': { backgroundColor: alpha(color.accent.main, 0.18) },
        // notistack toasts: one calm dark card for every message, with the
        // status carried by the icon colour rather than a solid colour block.
        '.notistack-MuiContent': {
          backgroundColor: `${color.ink.main} !important`,
          color: '#FFFFFF',
          borderRadius: `${radius.md}px !important`,
          boxShadow: `${elevation.menu} !important`,
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '6px 16px 6px 12px !important',
          '& #notistack-snackbar svg': { marginInlineEnd: '10px !important' },
        },
        '.notistack-MuiContent-success #notistack-snackbar svg': { color: '#4ADE80' },
        '.notistack-MuiContent-error #notistack-snackbar svg': { color: '#F87171' },
        '.notistack-MuiContent-warning #notistack-snackbar svg': { color: '#FBBF24' },
        '.notistack-MuiContent-info #notistack-snackbar svg': { color: '#60A5FA' },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.001ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.001ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },

    // ---- Buttons ---------------------------------------------------------
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: `2px solid ${color.accent.main}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          boxShadow: 'none',
          paddingInline: 16,
          minHeight: 38,
          transition: ease(['background-color', 'border-color', 'color', 'box-shadow', 'transform']),
          '&:active': { transform: 'translateY(0.5px)' },
        },
        sizeSmall: { minHeight: 32, paddingInline: 12, fontSize: '0.8125rem' },
        sizeLarge: { minHeight: 46, paddingInline: 22, fontSize: '0.9375rem' }, // touch-target friendly
        contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        containedPrimary: {
          boxShadow: `0 1px 2px ${alpha(color.accent.main, 0.24)}, inset 0 1px 0 ${alpha('#FFFFFF', 0.12)}`,
          '&:hover': {
            backgroundColor: color.accent.dark,
            boxShadow: `0 4px 12px ${alpha(color.accent.main, 0.24)}`,
          },
        },
        text: { '&:hover': { backgroundColor: color.accent.softer } },
      },
      variants: [
        // Secondary actions read as calm neutral buttons rather than blue
        // outlines, so the one filled button on a screen stays the obvious
        // next step. Coloured outlines (error, success...) keep their colour.
        {
          props: { variant: 'outlined', color: 'primary' },
          style: {
            color: color.text.primary,
            borderColor: color.neutral.borderStrong,
            backgroundColor: color.neutral.surface,
            '&:hover': {
              borderColor: '#BCC4D0',
              backgroundColor: color.neutral.hover,
            },
          },
        },
        {
          props: { variant: 'outlined', color: 'inherit' },
          style: { borderColor: color.neutral.borderStrong },
        },
      ],
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          transition: ease(['background-color', 'color']),
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderColor: color.neutral.borderStrong,
          '&.Mui-selected': {
            backgroundColor: color.accent.soft,
            color: color.accent.dark,
            '&:hover': { backgroundColor: '#DFE8FD' },
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: { root: { boxShadow: elevation.raised } },
    },

    // ---- Surfaces --------------------------------------------------------
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: color.neutral.border },
        rounded: { borderRadius: radius.md },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: radius.card,
          border: `1px solid ${color.neutral.border}`,
          boxShadow: elevation.card,
          transition: ease(['border-color', 'box-shadow']),
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: { padding: '18px 20px 10px' },
        action: { alignSelf: 'center', margin: 0 },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          padding: 20,
          '&:last-child': { paddingBottom: 20 },
          // Phones: the page panel already pads 16px, so nested cards give
          // a little back to the content.
          [t.breakpoints.down('sm')]: { padding: 16, '&:last-child': { paddingBottom: 16 } },
        }),
      },
    },
    MuiCardActions: {
      styleOverrides: { root: { padding: '12px 20px 18px' } },
    },
    MuiAccordion: {
      defaultProps: { disableGutters: true },
      styleOverrides: {
        root: {
          border: `1px solid ${color.neutral.border}`,
          borderRadius: radius.md,
          '&::before': { display: 'none' },
          '& + &': { marginTop: 8 },
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: color.neutral.border } },
    },

    // ---- Overlays --------------------------------------------------------
    MuiDialog: {
      styleOverrides: {
        root: {
          '& .MuiBackdrop-root:not(.MuiBackdrop-invisible)': {
            backgroundColor: 'rgba(15, 23, 42, 0.32)',
            backdropFilter: 'blur(3px)',
          },
        },
        paper: {
          borderRadius: radius.dialog,
          border: `1px solid ${color.neutral.border}`,
          boxShadow: elevation.dialog,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          paddingTop: 20,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '12px 24px 20px', gap: 4 },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: radius.md,
          border: `1px solid ${color.neutral.border}`,
          boxShadow: elevation.menu,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: radius.md,
          border: `1px solid ${color.neutral.border}`,
          boxShadow: elevation.menu,
          marginTop: 4,
        },
        list: { padding: 6 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
          minHeight: 36,
          '&:hover': { backgroundColor: color.neutral.hover },
          '&.Mui-selected': {
            backgroundColor: color.accent.soft,
            color: color.accent.dark,
            fontWeight: 600,
            '&:hover, &.Mui-focusVisible': { backgroundColor: '#DFE8FD' },
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: radius.md,
          border: `1px solid ${color.neutral.border}`,
          boxShadow: elevation.menu,
          marginTop: 4,
        },
        listbox: {
          padding: 6,
          '& .MuiAutocomplete-option': {
            borderRadius: 8,
            fontSize: '0.875rem',
            '&[aria-selected="true"]': { backgroundColor: color.accent.soft },
          },
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          backgroundColor: color.ink.main,
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 10px',
        },
        arrow: { color: color.ink.main },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderColor: color.neutral.border },
      },
    },

    // ---- Inputs ----------------------------------------------------------
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          backgroundColor: color.neutral.surface,
          transition: ease(['box-shadow']),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: color.neutral.borderStrong,
            transition: ease(['border-color']),
          },
          '&:hover:not(.Mui-disabled):not(.Mui-error):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: '#AEB7C4',
          },
          '&.Mui-focused:not(.Mui-error)': { boxShadow: focusRing },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1.5 },
          '&.Mui-disabled': { backgroundColor: color.neutral.surfaceAlt },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.9375rem' },
      },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginLeft: 2 } },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: { '&.Mui-checked + .MuiSwitch-track': { opacity: 1 } },
        track: { borderRadius: 999, backgroundColor: '#C3CAD5', opacity: 1 },
        thumb: { boxShadow: '0 1px 3px rgba(15, 23, 42, 0.2)' },
      },
    },

    // ---- Data display ----------------------------------------------------
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: radius.pill,
          letterSpacing: '0.005em',
        },
        sizeSmall: { height: 24, fontSize: '0.75rem' },
        filled: {
          '& .MuiChip-icon': { color: 'inherit' },
        },
      },
      // Soft, tinted status chips instead of solid colour blocks: a page of
      // twenty "Approved" pills reads as a calm list, not a wall of green.
      variants: [
        {
          props: { variant: 'filled', color: 'default' },
          style: {
            backgroundColor: '#EEF1F5',
            color: '#374151',
            '&.MuiChip-clickable:hover': { backgroundColor: '#E3E7EE' },
          },
        },
        ...STATUS.map((c) => ({
          props: { variant: 'filled', color: c },
          style: {
            backgroundColor: SOFT[c].bg,
            color: SOFT[c].fg,
            '&.MuiChip-clickable:hover, &.MuiChip-clickable.Mui-focusVisible': {
              backgroundColor: alpha(SOFT[c].fg, 0.14),
            },
            '& .MuiChip-deleteIcon': {
              color: alpha(SOFT[c].fg, 0.55),
              '&:hover': { color: SOFT[c].fg },
            },
          },
        })),
        {
          props: { variant: 'outlined' },
          style: { borderColor: color.neutral.borderStrong },
        },
      ],
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState, theme: t }) => ({
          borderRadius: radius.md,
          alignItems: 'center',
          ...(ownerState.variant === 'standard' && {
            border: `1px solid ${alpha(
              t.palette[ownerState.color || ownerState.severity || 'success'].main,
              0.2
            )}`,
          }),
        }),
        message: { paddingBlock: 6 },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, height: 6, backgroundColor: color.neutral.borderSoft },
        bar: { borderRadius: 999 },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(15, 23, 42, 0.06)' },
        rounded: { borderRadius: radius.md },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          transition: ease(['background-color', 'color']),
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44 },
        indicator: { height: 2.5, borderRadius: '2px 2px 0 0' },
        // A scrollable strip kept an invisible 40px "scroll back" button at
        // its start, so the first tab never lined up with the page title.
        scrollButtons: {
          width: 32,
          transition: ease(['width', 'opacity']),
          '&.Mui-disabled': { width: 0, opacity: 0 },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 0,
          paddingInline: 14,
          fontWeight: 600,
          fontSize: '0.875rem',
          color: color.text.secondary,
          borderRadius: `${radius.sm}px ${radius.sm}px 0 0`,
          transition: ease(['color', 'background-color']),
          '&:hover': { color: color.text.primary, backgroundColor: color.neutral.hover },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: color.neutral.borderSoft },
        head: {
          fontWeight: 600,
          fontSize: '0.8125rem',
          color: color.text.secondary,
          backgroundColor: color.neutral.surfaceAlt,
          borderBottomColor: color.neutral.border,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': { backgroundColor: color.neutral.hover },
          '&:last-child > td': { borderBottom: 0 },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        toolbar: { minHeight: 52 },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '--DataGrid-rowBorderColor': color.neutral.borderSoft,
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: color.text.secondary,
          },
          '& .MuiDataGrid-columnSeparator': { color: color.neutral.border },
          '& .MuiDataGrid-row': { transition: ease(['background-color']) },
          '& .MuiDataGrid-row:hover': { backgroundColor: color.neutral.hover },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
            outline: `2px solid ${alpha(color.accent.main, 0.35)}`,
            outlineOffset: -2,
          },
          '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within': {
            outlineColor: alpha(color.accent.main, 0.35),
          },
          '& .MuiDataGrid-footerContainer': { borderTopColor: color.neutral.border },
          // Row action buttons (edit / delete stacks) sat at the top of the
          // cell while the text beside them sat in the middle.
          '& .MuiDataGrid-cell:has(> .MuiStack-root)': { display: 'flex', alignItems: 'center' },
        },
      },
    },
  },
});

export default theme;
