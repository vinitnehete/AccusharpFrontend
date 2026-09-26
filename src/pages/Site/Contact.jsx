import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import { alpha } from '@mui/material/styles';
import { contact, company, nextSteps } from '../../content/siteContent';
import { Section, SectionHeading } from './ui';
import PageHero from './PageHero';

const EMPTY = { name: '', organisation: '', email: '', phone: '', message: '' };

function ContactRow({ icon, label, children }) {
  return (
    <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
      <Box
        sx={(theme) => ({
          width: 38,
          height: 38,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
          flexShrink: 0,
        })}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Box sx={{ mt: 0.25 }}>{children}</Box>
      </Box>
    </Stack>
  );
}

// The enquiry form hands off to the visitor's own mail client rather than
// posting anywhere. This site is public and unauthenticated - there is no
// enquiry endpoint on the API, and inventing one would mean an unauthenticated
// write path into the application. A mailto: keeps the form useful with zero
// backend surface. Swap this for a real POST the day an endpoint exists.
export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState(false);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const subject = `Enquiry from ${form.name}${form.organisation ? ` (${form.organisation})` : ''}`;
    const body = [
      `Name: ${form.name}`,
      form.organisation && `Organisation: ${form.organisation}`,
      `Email: ${form.email}`,
      form.phone && `Phone: ${form.phone}`,
      '',
      form.message,
    ]
      .filter(Boolean)
      .join('\n');

    window.location.href = `mailto:${contact.salesEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Tell us what your month-end looks like"
        subtitle="Headcount, how many companies, which attendance devices you run, and where the current process hurts. That is enough for us to show you something useful rather than generic."
      />

      <Section>
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <Typography variant="h5">Send an enquiry</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Fill this in and it will open in your email app, ready to send to{' '}
                  {contact.salesEmail}.
                </Typography>

                {sent && (
                  <Alert severity="success" sx={{ mt: 2.5 }}>
                    Your email app should have opened with the message ready. If nothing happened,
                    write to us directly at {contact.salesEmail}.
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Your name"
                        value={form.name}
                        onChange={set('name')}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Organisation"
                        value={form.organisation}
                        onChange={set('organisation')}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Phone"
                        value={form.phone}
                        onChange={set('phone')}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        label="How can we help?"
                        value={form.message}
                        onChange={set('message')}
                        fullWidth
                        required
                        multiline
                        minRows={4}
                        placeholder="Headcount, number of companies, attendance devices in use, and what you would like to fix first."
                      />
                    </Grid>
                    <Grid size={12}>
                      <Button type="submit" variant="contained" size="large" sx={{ px: 4, borderRadius: 999 }}>
                        Send enquiry
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Typography variant="h5">Reach us directly</Typography>
                <Stack spacing={3} sx={{ mt: 3 }}>
                  <ContactRow icon={<MailOutlineRoundedIcon fontSize="small" />} label="Email">
                    <Link href={`mailto:${contact.email}`} underline="hover" variant="body1">
                      {contact.email}
                    </Link>
                  </ContactRow>
                  <ContactRow icon={<PhoneInTalkRoundedIcon fontSize="small" />} label="Phone">
                    <Link
                      href={`tel:${contact.phone.replace(/\s/g, '')}`}
                      underline="hover"
                      variant="body1"
                    >
                      {contact.phone}
                    </Link>
                  </ContactRow>
                  <ContactRow icon={<PlaceOutlinedIcon fontSize="small" />} label="Office">
                    <Stack>
                      {contact.addressLines.map((line) => (
                        <Typography key={line} variant="body1">
                          {line}
                        </Typography>
                      ))}
                    </Stack>
                  </ContactRow>
                  <ContactRow icon={<ScheduleRoundedIcon fontSize="small" />} label="Hours">
                    <Typography variant="body1">{contact.hours}</Typography>
                  </ContactRow>
                </Stack>

                <Divider sx={{ my: 3.5 }} />

                <Typography variant="subtitle2">Already using {company.productName}?</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Employees, supervisors and HR sign in here. If you have forgotten your password,
                  your HR team can issue a new one.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  startIcon={<LoginRoundedIcon />}
                  sx={{ mt: 2 }}
                >
                  Sign in
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Section>

      <Section tone="muted">
        <SectionHeading
          eyebrow="What happens next"
          title="Three steps, no surprises"
          subtitle="We would rather you saw the system working on your own month than sat through a slide deck."
        />
        <Grid container spacing={2.5}>
          {nextSteps.map((item) => (
            <Grid size={{ xs: 12, md: 4 }} key={item.step}>
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
            </Grid>
          ))}
        </Grid>
      </Section>
    </>
  );
}
