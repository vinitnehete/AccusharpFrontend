import { createTheme } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// Design tokens
//
// Single source of truth for color, spacing, radius, elevation and motion
// primitives. The MUI theme below is assembled from these tokens rather than
// hardcoding values inline, so the whole app can be re-tuned from one place.
//
// The palette follows Apple's formula rather than a brand-color-everywhere
// approach: an achromatic base (near-black ink on off-white parchment, white
// surfaces, hairline borders) with exactly ONE accent hue. Color is therefore
// information, not decoration - on a payroll screen the only blue thing is
// something you can act on, and the only green/red/amber things are statuses.
//
// Why blue, specifically, for an Indian product:
//   - Saffron reads as religiously and politically coded (renunciation, and
//     party colours). Not neutral on a screen used by everyone in a company.
//   - Saturated green carries a strong association with Islam, and green with
//     saffron reads as the flag. The previous teal sat in that family.
//   - Blue is the one hue with no such loading. Ambedkar chose it in 1942
//     precisely because it carried no overt association, and it is the default
//     of Indian enterprise (HDFC, TCS, Infosys, SBI). Green and red survive
//     here only as *status* colours, which is a universal convention rather
//     than a brand statement.
//
// Every value below was checked for WCAG AA (4.5:1) against the surface it is
// actually used on - see the ratios in the comments.
// ---------------------------------------------------------------------------

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const tokens = {
  color: {
    neutral: {
      bg: '#F5F5F7', // canvas
      surface: '#FFFFFF', // cards, sheets, sidebar
      surfaceAlt: '#FAFAFC', // subtle fills, table headers
      border: '#E5E5E7', // hairline
      borderStrong: '#D2D2D7',
    },
    text: {
      primary: '#1D1D1F', // 15.5:1 on canvas
      secondary: '#6E6E73', // 5.1:1 on white
      tertiary: '#76767C', // 4.5:1 on white - labels, not body copy
      disabled: '#AEAEB2',
      inverse: '#FFFFFF',
    },
    // The single accent. 6.7:1 for white-on-blue and 6.1:1 for blue-on-canvas,
    // so it is legible both as a filled button and as small text or an icon.
    accent: {
      main: '#0A57C2',
      dark: '#08459B',
      light: '#5B9BE5', // for use on ink surfaces only (5.8:1 on ink)
      soft: '#EAF1FB',
    },
    // Second hue, categorical charts only - never chrome.
    secondary: { main: '#5E5CE6', soft: '#EDECFD' },
    success: { main: '#217A46', soft: '#E8F4EC' }, // 5.3:1
    // Was #B76E00, which only reached 4.0:1 on white and 3.7:1 on the canvas -
    // under AA for normal text despite the comment that claimed otherwise.
    warning: { main: '#965900', soft: '#FBF0DF' }, // 5.6:1
    error: { main: '#C0342B', soft: '#FBEAE8' }, // 5.6:1
    info: { main: '#0A57C2', soft: '#EAF1FB' },
    // The one dark surface in the product. Every deliberately-dark area uses
    // it and nothing else: the app sidebar, the sign-in brand panel, and the
    // marketing site's closing band and footer. Keeping them literally the
    // same colour is what makes the shell read as one designed thing rather
    // than a white app that happens to have some dark panels in it.
    // Near-black with a faint cool cast, so it sits with the blue rather than
    // fighting it. 15.5:1 against the canvas.
    ink: { main: '#1C1D21', soft: '#26272C' },
    // The sidebar IS that ink surface. A white column next to a dark sign-in
    // panel and a dark footer had no relationship to either - correct by the
    // Apple-pro-app rulebook, wrong for this product, which has dark surfaces
    // on both sides of the sign-in boundary.
    //
    // The active item is a solid accent pill, slightly brighter than the base
    // accent so it carries on near-black (5.5:1 for its white label, 3.1:1
    // against the column). That pill is the one place the brand blue appears
    // in the chrome, and it is what ties the dark shell to the blue buttons
    // in the content area.
    sidebar: {
      background: '#1C1D21',
      backgroundActive: '#0B62DE',
      backgroundHover: 'rgba(255, 255, 255, 0.07)',
      text: '#A1A1A6', // 6.6:1 on the column
      textActive: '#FFFFFF',
      sectionLabel: '#8A8A8F', // 4.9:1
      border: 'rgba(255, 255, 255, 0.08)',
    },
  },
  radius: {
    sm: 8,
    md: 10,
    lg: 14,
    card: 12,
    dialog: 18,
    pill: 999,
  },
  elevation: {
    // Apple puts almost no shadow on chrome and lets hairlines do the
    // separating; depth is reserved for things that genuinely float.
    card: '0 1px 2px rgba(0, 0, 0, 0.03)',
    raised: '0 4px 12px rgba(0, 0, 0, 0.06)',
    dialog: '0 16px 40px rgba(0, 0, 0, 0.16)',
  },
};

// MUI requires exactly 25 shadow levels. The stock theme's defaults are
// heavy/dark; this replaces them with a calm, low-contrast scale so every
// component that elevates (Menu, Popover, Select, Snackbar, Dialog, Drawer)
// gets subtle depth automatically instead of per-component overrides.
const shadow = (y, blur, spread, alpha) => `0 ${y}px ${blur}px ${spread}px rgba(0, 0, 0, ${alpha})`;
const softShadowSteps = [
  'none',
  shadow(1, 2, 0, 0.03),
  shadow(1, 3, 0, 0.05),
  shadow(2, 6, 0, 0.05),
  shadow(4, 10, 0, 0.06),
  shadow(6, 16, -2, 0.07),
  shadow(8, 20, -2, 0.08),
  shadow(12, 28, -4, 0.1),
  shadow(16, 40, -6, 0.14),
];
const shadows = Array.from({ length: 25 }, (_, i) =>
  softShadowSteps[Math.min(i, softShadowSteps.length - 1)]
);

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.color.accent.main,
      dark: tokens.color.accent.dark,
      light: tokens.color.accent.light,
      contrastText: tokens.color.text.inverse,
    },
    secondary: { main: tokens.color.secondary.main },
    background: {
      default: tokens.color.neutral.bg,
      paper: tokens.color.neutral.surface,
    },
    text: {
      primary: tokens.color.text.primary,
      secondary: tokens.color.text.secondary,
      disabled: tokens.color.text.disabled,
    },
    success: tokens.color.success,
    warning: tokens.color.warning,
    error: tokens.color.error,
    info: tokens.color.info,
    divider: tokens.color.neutral.border,
    sidebar: tokens.color.sidebar,
    ink: tokens.color.ink,
  },
  shape: { borderRadius: tokens.radius.md },
  shadows,
  typography: {
    fontFamily,
    // Type scale — Display / Page Title / Section Heading / Card Heading /
    // Body / Secondary / Caption map onto MUI's stock variants below so
    // every page uses the same handful of variants instead of ad hoc sizes.
    // Negative tracking at display sizes is the "Apple tight" cadence; it is
    // deliberately not applied below h5, where it starts to hurt legibility.
    h1: { fontSize: '2.5rem', lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.025em' }, // Display
    h2: { fontSize: '2rem', lineHeight: 1.15, fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.75rem', lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.018em' },
    h4: { fontSize: '1.5rem', lineHeight: 1.25, fontWeight: 700, letterSpacing: '-0.015em' }, // Page Title
    h5: { fontSize: '1.25rem', lineHeight: 1.3, fontWeight: 700, letterSpacing: '-0.01em' }, // Section Heading
    h6: { fontSize: '1.0625rem', lineHeight: 1.4, fontWeight: 700 }, // Dense Card Heading
    subtitle1: { fontSize: '1rem', lineHeight: 1.5, fontWeight: 600 }, // Card Heading
    subtitle2: { fontSize: '0.875rem', lineHeight: 1.45, fontWeight: 600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55, fontWeight: 400 }, // Body
    body2: { fontSize: '0.8125rem', lineHeight: 1.5, fontWeight: 400 }, // Secondary
    caption: { fontSize: '0.75rem', lineHeight: 1.4, fontWeight: 500 }, // Caption / Helper / Error
    overline: {
      fontSize: '0.6875rem',
      lineHeight: 1.4,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
    button: { fontWeight: 600, textTransform: 'none', fontSize: '0.875rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
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
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: `2px solid ${tokens.color.accent.main}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm, boxShadow: 'none' },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        sizeLarge: { minHeight: 48 }, // touch-target friendly for employee-facing screens
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
      defaultProps: { elevation: 0 },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.card,
          border: `1px solid ${tokens.color.neutral.border}`,
          boxShadow: tokens.elevation.card,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.radius.dialog,
          boxShadow: tokens.elevation.dialog,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: tokens.radius.pill },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: tokens.color.text.secondary },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: tokens.color.text.primary,
          borderRadius: tokens.radius.sm,
          fontSize: '0.75rem',
        },
      },
    },
  },
});

export default theme;
