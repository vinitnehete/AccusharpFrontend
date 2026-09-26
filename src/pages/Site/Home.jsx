import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import {
  hero,
  stats,
  highlights,
  modules,
  howItWorks,
  audience,
  compliance,
  testimonials,
  finalCta,
} from '../../content/siteContent';
import { Section, SectionHeading, FeatureCard, IconTile, CtaBand } from './ui';

// A stylised impression of the product, drawn with plain boxes rather than a
// screenshot — no asset to keep in sync, and it renders crisply at any size.
function ProductPreview() {
  const bars = [58, 74, 46, 88, 65, 92, 70];
  return (
    <Card sx={{ p: { xs: 2, md: 2.5 }, boxShadow: '0 18px 40px rgba(16, 24, 40, 0.10)' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Payroll run
          </Typography>
          <Typography variant="subtitle1">March 2026</Typography>
        </Box>
        <Chip size="small" label="Month locked" color="success" variant="outlined" />
      </Stack>

      <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
        {[
          { label: 'Employees paid', value: '412' },
          { label: 'Payable days', value: '24.5' },
          { label: 'LOP days', value: '18' },
        ].map((tile) => (
          <Grid size={4} key={tile.label}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'background.default',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" className="tabular-nums">
                {tile.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tile.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 2.5 }}>
        <Typography variant="caption" color="text.secondary">
          Attendance captured, last 7 days
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end', height: 92, mt: 1 }}>
          {bars.map((height, index) => (
            <Box
              key={height}
              sx={(theme) => ({
                flex: 1,
                height: `${height}%`,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, index === bars.length - 2 ? 1 : 0.28),
              })}
            />
          ))}
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1.25}>
        {['Punches converted to daily attendance', 'PF, ESIC and PT computed', 'Salary slips issued'].map(
          (line) => (
            <Stack key={line} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <CheckCircleRoundedIcon fontSize="small" sx={{ color: 'success.main' }} />
              <Typography variant="body2" color="text.secondary">
                {line}
              </Typography>
            </Stack>
          )
        )}
      </Stack>
    </Card>
  );
}

function Hero() {
  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
          theme.palette.primary.main,
          0.02
        )} 42%, ${theme.palette.background.default} 100%)`,
      })}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          position: 'absolute',
          top: -180,
          right: -140,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.16)} 0%, transparent 68%)`,
          pointerEvents: 'none',
        })}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 7, md: 12 } }}>
        <Grid container spacing={{ xs: 5, md: 6 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6.5 }}>
            <Chip
              label={hero.eyebrow}
              size="small"
              sx={(theme) => ({
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.dark',
                mb: 2.5,
              })}
            />
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.25rem' } }}
            >
              {hero.title}{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                {hero.titleAccent}
              </Box>
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 2.5, fontSize: '1.0625rem', maxWidth: 560 }}
            >
              {hero.subtitle}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                sx={{ px: 4, borderRadius: 999 }}
              >
                Sign in
              </Button>
              <Button
                component={RouterLink}
                to="/services"
                variant="outlined"
                size="large"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ px: 3.5, borderRadius: 999 }}
              >
                What we do
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={{ xs: 2, sm: 3 }}
              useFlexGap
              sx={{ mt: 4, flexWrap: 'wrap' }}
            >
              {hero.bullets.map((bullet) => (
                <Stack key={bullet} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <CheckRoundedIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    {bullet}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5.5 }}>
            <ProductPreview />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function StatsStrip() {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderY: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Grid container spacing={3}>
          {stats.map((stat) => (
            <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
              <Typography variant="h3" sx={{ color: 'primary.main' }} className="tabular-nums">
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {stat.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function ModuleStrip() {
  return (
    <Section>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-end' }, mb: { xs: 4, md: 5 } }}
      >
        <SectionHeading
          eyebrow="One system"
          title="Everything the month needs, in one place"
          subtitle="Ten modules that share the same employee master, the same shift catalogue and the same rules — so nothing has to be reconciled between them."
          sx={{ mb: 0 }}
        />
        <Button
          component={RouterLink}
          to="/services"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ flexShrink: 0 }}
        >
          See all services
        </Button>
      </Stack>

      {/* Ten modules laid out five to a row, so the strip reads as two even
          rows rather than three-and-a-remainder. */}
      <Grid container spacing={2}>
        {modules.map((module) => (
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={module.title}>
            <Stack
              spacing={1.5}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: 1,
                borderColor: 'divider',
                height: '100%',
                bgcolor: 'background.default',
              }}
            >
              <IconTile name={module.icon} size={40} />
              <Typography variant="subtitle2">{module.title}</Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}

function Highlights() {
  return (
    <Section tone="muted">
      <SectionHeading
        eyebrow="Why teams stay"
        title="Built around the parts of payroll that usually go wrong"
        subtitle="Not a longer feature list — a shorter list of month-end problems that stop happening."
        align="center"
      />
      <Grid container spacing={2.5}>
        {highlights.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.title}>
            <FeatureCard icon={item.icon} title={item.title} description={item.description} />
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section>
      <SectionHeading
        eyebrow="How it works"
        title="Four steps, every month"
        subtitle="The same sequence whether you run one company or nine."
      />
      <Grid container spacing={2.5}>
        {howItWorks.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.step}>
            <Box sx={{ height: '100%' }}>
              <Typography
                variant="h3"
                sx={(theme) => ({ color: alpha(theme.palette.primary.main, 0.28), lineHeight: 1 })}
              >
                {item.step}
              </Typography>
              <Divider sx={{ my: 2, borderColor: 'primary.light' }} />
              <Typography variant="subtitle1">{item.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {item.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}

function Compliance() {
  return (
    <Section tone="muted" id="compliance">
      <Grid container spacing={{ xs: 4, md: 8 }} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionHeading
            eyebrow="Statutory compliance"
            title="Filing-ready, not filing-adjacent"
            subtitle="Rates and slabs are configuration held per company, so a change in a notification is a change you make yourself — the same afternoon."
            sx={{ mb: 0 }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2}>
                {compliance.map((item) => (
                  <Stack key={item} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <CheckCircleRoundedIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography variant="body1">{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Section>
  );
}

function Audience() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Who it’s for"
        title="Organisations where the roster changes and the headcount doesn’t sit still"
        align="center"
      />
      <Grid container spacing={2.5}>
        {audience.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
            <Stack spacing={1.5} sx={{ height: '100%' }}>
              <IconTile name={item.icon} size={48} />
              <Typography variant="subtitle1">{item.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}

// Renders nothing until real quotes are added to siteContent.js — a demo
// should never show an invented customer.
function Testimonials() {
  if (!testimonials.length) return null;
  return (
    <Section tone="muted">
      <SectionHeading eyebrow="In their words" title="What our customers say" align="center" />
      <Grid container spacing={2.5}>
        {testimonials.map((item) => (
          <Grid size={{ xs: 12, md: testimonials.length > 1 ? 6 : 12 }} key={item.name}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <FormatQuoteRoundedIcon sx={{ color: 'primary.light', fontSize: 32 }} />
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {item.quote}
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 2.5 }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {[item.role, item.organisation].filter(Boolean).join(' · ')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <ModuleStrip />
      <Highlights />
      <HowItWorks />
      <Compliance />
      <Audience />
      <Testimonials />
      <CtaBand
        title={finalCta.title}
        subtitle={finalCta.subtitle}
        primaryLabel={finalCta.primaryLabel}
        primaryTo="/contact"
        secondaryLabel={finalCta.secondaryLabel}
        secondaryTo="/login"
      />
    </>
  );
}
