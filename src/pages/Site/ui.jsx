// Shared building blocks for the four public pages. Nothing here is used by
// the signed-in application — it exists so Home / Services / About / Contact
// stay consistent with each other and with the app's own design tokens.
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { alpha } from '@mui/material/styles';

import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import BeachAccessRoundedIcon from '@mui/icons-material/BeachAccessRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import EngineeringRoundedIcon from '@mui/icons-material/EngineeringRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import FactoryRoundedIcon from '@mui/icons-material/FactoryRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SoftGlow from '../../components/SoftGlow';

// siteContent.js stores an icon *name* rather than a component, so the copy
// file stays plain data that anyone can edit without touching imports.
const ICONS = {
  employees: BadgeRoundedIcon,
  attendance: EventAvailableRoundedIcon,
  roster: CalendarMonthRoundedIcon,
  leave: BeachAccessRoundedIcon,
  payroll: PaymentsRoundedIcon,
  payslip: ReceiptLongRoundedIcon,
  reports: AssessmentRoundedIcon,
  contractors: EngineeringRoundedIcon,
  masters: ApartmentRoundedIcon,
  audit: AdminPanelSettingsRoundedIcon,
  compliance: GavelRoundedIcon,
  bulk: UploadFileRoundedIcon,
  company: ApartmentRoundedIcon,
  factory: FactoryRoundedIcon,
  services: SupportAgentRoundedIcon,
  people: GroupsRoundedIcon,
  accuracy: RuleRoundedIcon,
  transparency: VisibilityRoundedIcon,
};

export function iconFor(key) {
  return ICONS[key] || LayersRoundedIcon;
}

export function SiteIcon({ name, fontSize = 'small' }) {
  const Icon = iconFor(name);
  return <Icon fontSize={fontSize} />;
}

const TONES = {
  default: { bgcolor: 'background.paper' },
  muted: { bgcolor: 'background.default' },
  dark: { bgcolor: 'ink.main', color: 'common.white' },
};

/** A full-width band with consistent vertical rhythm and a max-width container. */
export function Section({ id, tone = 'default', dense = false, sx, children }) {
  return (
    <Box
      id={id}
      component="section"
      sx={{ py: dense ? { xs: 6, md: 8 } : { xs: 8, md: 12 }, ...TONES[tone], ...sx }}
    >
      <Container maxWidth="lg">{children}</Container>
    </Box>
  );
}

export function Eyebrow({ children, onDark = false }) {
  return (
    <Typography
      variant="overline"
      sx={{ color: onDark ? 'primary.light' : 'primary.main', display: 'block' }}
    >
      {children}
    </Typography>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'left', onDark = false, sx }) {
  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: align === 'center' ? 'auto' : 0,
        textAlign: align,
        mb: { xs: 4, md: 6 },
        ...sx,
      }}
    >
      {eyebrow && <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>}
      <Typography variant="h4" sx={{ mt: eyebrow ? 1 : 0, color: onDark ? 'common.white' : 'text.primary' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body1"
          sx={{ mt: 1.5, color: onDark ? alpha('#FFFFFF', 0.72) : 'text.secondary' }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

/** Square tinted tile behind a module/value icon — same treatment as StatCard. */
export function IconTile({ name, size = 44 }) {
  return (
    <Box
      sx={(theme) => ({
        width: size,
        height: size,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(theme.palette.primary.main, 0.12),
        color: 'primary.main',
        flexShrink: 0,
      })}
    >
      <SiteIcon name={name} fontSize={size >= 52 ? 'medium' : 'small'} />
    </Box>
  );
}

export function FeatureCard({ icon, title, description, points }) {
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'box-shadow 200ms ease, border-color 200ms ease, transform 200ms ease',
        '&:hover': {
          borderColor: alpha('#2563EB', 0.3),
          boxShadow: '0 12px 28px rgba(30, 64, 175, 0.08)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <IconTile name={icon} />
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
        {points?.length > 0 && (
          <Stack component="ul" spacing={1} sx={{ mt: 2, pl: 0, mb: 0, listStyle: 'none' }}>
            {points.map((point) => (
              <Stack
                key={point}
                component="li"
                direction="row"
                spacing={1.25}
                sx={{ alignItems: 'flex-start' }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    mt: '7px',
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {point}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

/** Closing call-to-action, reused at the bottom of every public page: a soft
    blue card rather than a dark band, so it doesn't merge into the footer. */
export function CtaBand({ title, subtitle, primaryLabel, primaryTo, secondaryLabel, secondaryTo }) {
  return (
    <Section dense>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '28px',
          border: 1,
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #EEF3FE 0%, #F7F9FF 55%, #EEF0FD 100%)',
          px: { xs: 3, md: 6 },
          py: { xs: 4, md: 6 },
        }}
      >
        <SoftGlow variant="band" />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          sx={{ position: 'relative', alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Box sx={{ maxWidth: 620 }}>
            <Typography variant="h4" component="h2">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexShrink: 0 }}>
            <Button
              component={RouterLink}
              to={primaryTo}
              variant="contained"
              size="large"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{ px: 3.5, borderRadius: '12px' }}
            >
              {primaryLabel}
            </Button>
            {secondaryLabel && (
              <Button
                component={RouterLink}
                to={secondaryTo}
                size="large"
                variant="outlined"
                sx={{ px: 3.5, borderRadius: '12px' }}
              >
                {secondaryLabel}
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </Section>
  );
}
