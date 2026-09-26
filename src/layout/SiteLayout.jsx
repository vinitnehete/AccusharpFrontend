// Chrome for the public marketing pages: header, footer and the outlet the
// four public pages render into. Deliberately separate from AppLayout — the
// signed-in application keeps its own sidebar shell, untouched.
import { useEffect, useState } from 'react';
import { Link as RouterLink, NavLink, Outlet, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import { alpha } from '@mui/material/styles';
import { BRAND } from '../constants/brand';
import { company, contact, footerNote } from '../content/siteContent';

const NAV = [
  { label: 'Home', to: '/home' },
  { label: 'Services', to: '/services' },
  { label: 'About us', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

// The app itself never sets a document title, so the public pages set one and
// put it back on the way out - otherwise a visitor who signs in from /services
// keeps "Services - Muster HRMS" in the tab for the rest of the session.
const BASE_TITLE = BRAND.productName;
const PAGE_TITLES = {
  '/services': 'Services',
  '/about': 'About us',
  '/contact': 'Contact',
};

export function BrandMark({ onDark = false, size = 36 }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, width: size, height: size }}>
        {BRAND.initial}
      </Avatar>
      <Box>
        <Typography
          sx={{ fontWeight: 800, lineHeight: 1.1, color: onDark ? 'common.white' : 'text.primary' }}
        >
          {company.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: onDark ? alpha('#FFFFFF', 0.6) : 'text.secondary', letterSpacing: '0.04em' }}
        >
          HRMS
        </Typography>
      </Box>
    </Stack>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha('#FFFFFF', 0.88),
          backdropFilter: 'blur(10px)',
          borderBottom: 1,
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 2, md: 3 }, gap: 2 }}>
            <Box component={RouterLink} to="/home" sx={{ textDecoration: 'none' }}>
              <BrandMark />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {NAV.map((item) => (
                <Button
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  sx={{
                    px: 1.75,
                    color: 'text.secondary',
                    fontWeight: 500,
                    '&.active': { color: 'text.primary', fontWeight: 700 },
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                px: 2.75,
                ml: { md: 1.5 },
                borderRadius: 999,
              }}
            >
              Sign in
            </Button>

            <IconButton
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              sx={{ display: { md: 'none' } }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 280 } } }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.75 }}
        >
          <BrandMark size={32} />
          <IconButton aria-label="Close menu" onClick={() => setOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Divider />
        <List>
          {NAV.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              onClick={() => setOpen(false)}
              sx={{ '&.active .MuiListItemText-primary': { fontWeight: 700 } }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ px: 2, pt: 1 }}>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            fullWidth
            size="large"
            sx={{ borderRadius: 999 }}
            onClick={() => setOpen(false)}
          >
            Sign in
          </Button>
        </Box>
      </Drawer>
    </>
  );
}

function FooterHeading({ children }) {
  return (
    <Typography variant="overline" sx={{ color: alpha('#FFFFFF', 0.5), display: 'block', mb: 1.5 }}>
      {children}
    </Typography>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      component={RouterLink}
      to={to}
      underline="none"
      variant="body2"
      sx={{ color: alpha('#FFFFFF', 0.72), '&:hover': { color: 'common.white' } }}
    >
      {children}
    </Link>
  );
}

function SiteFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: 'ink.main', color: 'common.white' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 4, md: 8 }}
          sx={{ justifyContent: 'space-between' }}
        >
          <Box sx={{ maxWidth: 340 }}>
            <BrandMark onDark />
            <Typography variant="body2" sx={{ mt: 2, color: alpha('#FFFFFF', 0.65) }}>
              {footerNote}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 4, sm: 8 }}>
            <Box>
              <FooterHeading>Company</FooterHeading>
              <Stack spacing={1}>
                <FooterLink to="/home">Home</FooterLink>
                <FooterLink to="/about">About us</FooterLink>
                <FooterLink to="/contact">Contact</FooterLink>
              </Stack>
            </Box>
            <Box>
              <FooterHeading>Product</FooterHeading>
              <Stack spacing={1}>
                <FooterLink to="/services">What we do</FooterLink>
                <FooterLink to="/services#compliance">Statutory compliance</FooterLink>
                <FooterLink to="/login">Employee sign in</FooterLink>
              </Stack>
            </Box>
            <Box>
              <FooterHeading>Reach us</FooterHeading>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <MailOutlineRoundedIcon fontSize="small" sx={{ color: alpha('#FFFFFF', 0.5) }} />
                  <Link
                    href={`mailto:${contact.email}`}
                    underline="none"
                    variant="body2"
                    sx={{ color: alpha('#FFFFFF', 0.72), '&:hover': { color: 'common.white' } }}
                  >
                    {contact.email}
                  </Link>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <PhoneInTalkRoundedIcon fontSize="small" sx={{ color: alpha('#FFFFFF', 0.5) }} />
                  <Link
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    underline="none"
                    variant="body2"
                    sx={{ color: alpha('#FFFFFF', 0.72), '&:hover': { color: 'common.white' } }}
                  >
                    {contact.phone}
                  </Link>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ my: { xs: 4, md: 5 }, borderColor: alpha('#FFFFFF', 0.12) }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.5) }}>
            © {new Date().getFullYear()} {company.legalName}. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.5) }}>
            {company.tagline}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export default function SiteLayout() {
  const { pathname, hash } = useLocation();

  // Route changes on a marketing site should land at the top of the new page,
  // not wherever the previous page happened to be scrolled to. An in-page
  // hash link (e.g. /services#compliance) keeps its own anchor behaviour.
  useEffect(() => {
    const page = PAGE_TITLES[pathname];
    document.title = page ? `${page} · ${BASE_TITLE}` : BASE_TITLE;
  }, [pathname]);

  useEffect(() => () => {
    document.title = BASE_TITLE;
  }, []);

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SiteHeader />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      <SiteFooter />
    </Box>
  );
}
