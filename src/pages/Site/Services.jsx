import { Link as RouterLink } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { modules, engagement, compliance, finalCta } from '../../content/siteContent';
import { Section, SectionHeading, FeatureCard, IconTile, CtaBand } from './ui';
import PageHero from './PageHero';

export default function Services() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="What we do"
        subtitle="A single system for the whole employee month — records, roster, attendance, leave, payroll and statutory filing — plus the help to get your own data running on it."
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            component={RouterLink}
            to="/contact"
            variant="contained"
            size="large"
            sx={{ px: 4, borderRadius: 999 }}
          >
            Talk to us
          </Button>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            size="large"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ px: 3.5, borderRadius: 999 }}
          >
            Sign in
          </Button>
        </Stack>
      </PageHero>

      <Section>
        <SectionHeading
          eyebrow="The product"
          title="Ten modules on one employee master"
          subtitle="Each one reads the same records, so a change made in one place is never re-keyed in another."
        />
        <Grid container spacing={2.5}>
          {modules.map((module) => (
            <Grid size={{ xs: 12, md: 6 }} key={module.title}>
              <FeatureCard
                icon={module.icon}
                title={module.title}
                description={module.summary}
                points={module.points}
              />
            </Grid>
          ))}
        </Grid>
      </Section>

      <Section tone="muted">
        <SectionHeading
          eyebrow="Working with us"
          title="You are not handed a login and left to it"
          subtitle="Getting an HRMS live is mostly a data and configuration exercise. That part is ours as much as yours."
        />
        <Grid container spacing={2.5}>
          {engagement.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.title}>
              <FeatureCard icon={item.icon} title={item.title} description={item.description} />
            </Grid>
          ))}
        </Grid>
      </Section>

      <Section id="compliance">
        <Grid container spacing={{ xs: 4, md: 8 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <SectionHeading
              eyebrow="Statutory compliance"
              title="Everything the month close has to produce"
              subtitle="Contributions computed from a per-company rule, and the returns exported in the shape the portal expects."
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
                <Stack direction="row" spacing={1.75} sx={{ mt: 3, alignItems: 'center' }}>
                  <IconTile name="audit" size={40} />
                  <Typography variant="body2" color="text.secondary">
                    Every rate that drives these numbers is stored per company and snapshotted onto
                    the payroll run that used it.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Section>

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
