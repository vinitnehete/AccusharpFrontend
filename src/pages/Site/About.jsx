import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import { about, company, contact, stats, finalCta } from '../../content/siteContent';
import { Section, SectionHeading, IconTile, CtaBand } from './ui';
import PageHero from './PageHero';

const quickFacts = [
  { label: 'Founded', value: company.foundedYear },
  { label: 'Focus', value: 'Attendance-driven payroll' },
  { label: 'Built for', value: 'Multi-company operations' },
  { label: 'Based in', value: contact.addressLines[contact.addressLines.length - 1] },
];

function Story() {
  return (
    <Section>
      <Grid container spacing={{ xs: 4, md: 8 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionHeading eyebrow="Our story" title="Why we built this" sx={{ mb: 3 }} />
          <Stack spacing={2.5}>
            {about.story.map((paragraph) => (
              <Typography key={paragraph.slice(0, 32)} variant="body1" color="text.secondary">
                {paragraph}
              </Typography>
            ))}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ position: { md: 'sticky' }, top: 96 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography variant="overline" color="text.secondary">
                At a glance
              </Typography>
              <Stack divider={<Divider flexItem />} spacing={2} sx={{ mt: 1.5 }}>
                {quickFacts.map((fact) => (
                  <Box key={fact.label}>
                    <Typography variant="body2" color="text.secondary">
                      {fact.label}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mt: 0.25 }}>
                      {fact.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Section>
  );
}

function Mission() {
  return (
    <Section tone="dark" dense>
      <Box sx={{ maxWidth: 860 }}>
        <Typography variant="overline" sx={{ color: 'primary.light' }}>
          Our mission
        </Typography>
        <Typography
          variant="h4"
          sx={{ mt: 1.5, color: 'common.white', fontSize: { xs: '1.5rem', md: '1.875rem' } }}
        >
          {about.mission}
        </Typography>
      </Box>
    </Section>
  );
}

function Values() {
  return (
    <Section tone="muted">
      <SectionHeading
        eyebrow="What we hold to"
        title="Four things we don’t trade away"
        align="center"
      />
      <Grid container spacing={2.5}>
        {about.values.map((value) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={value.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <IconTile name={value.icon} size={48} />
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  {value.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {value.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}

function ByTheNumbers() {
  return (
    <Section dense>
      <SectionHeading
        eyebrow="The system today"
        title="What is running, not what is planned"
        sx={{ mb: 4 }}
      />
      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
            <Typography variant="h3" className="tabular-nums" sx={{ color: 'primary.main' }}>
              {stat.value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {stat.label}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}

// Hidden until real people are listed in siteContent.js.
function Leadership() {
  if (!about.leadership.length) return null;
  return (
    <Section tone="muted">
      <SectionHeading eyebrow="The team" title="Who you will be working with" align="center" />
      <Grid container spacing={2.5} sx={{ justifyContent: 'center' }}>
        {about.leadership.map((person) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={person.name}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Avatar
                  sx={(theme) => ({
                    width: 56,
                    height: 56,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                    fontWeight: 700,
                  })}
                >
                  {person.name?.charAt(0)}
                </Avatar>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                  {person.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'primary.main' }}>
                  {person.role}
                </Typography>
                {person.bio && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    {person.bio}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}

export default function About() {
  return (
    <>
      <PageHero eyebrow="About us" title={about.intro} subtitle={company.shortPitch} />
      <Story />
      <Mission />
      <Values />
      <ByTheNumbers />
      <Leadership />
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
