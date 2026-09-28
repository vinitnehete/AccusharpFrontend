import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAuth } from '../context/AuthContext';
import navConfig, { platformNavConfig, visibleNav } from './navConfig';
import { activePath, activeTrail, initialsOf } from './shell';
import { ROLE_COLOR } from '../constants/enums';
import IdleSessionGuard from '../components/IdleSessionGuard';
import { BRAND } from '../constants/brand';
import { tokens } from '../theme/theme';

// The shell is an "app in a frame": sidebar, top bar and page are three white
// panels floating on the grey canvas, GAP apart.
const SIDEBAR_WIDTH = 264;
const RAIL_WIDTH = 76;
const GAP = 12;
const TOPBAR_HEIGHT = 60;

// Per-browser layout preferences only - nothing here is needed for the app to
// work, so every read and write tolerates storage being blocked.
const COLLAPSED_KEY = 'accusharp.ui.sidebarCollapsed';
const CLOSED_SECTIONS_KEY = 'accusharp.ui.closedSections';

function readStored(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStored(key, fallback));
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or blocked storage: the preference just won't persist.
    }
  }, [key, value]);
  return [value, setValue];
}

const slide = `${tokens.motion.base} ${tokens.motion.easing}`;

function BrandMark({ size = 34 }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: '10px',
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        color: 'common.white',
        fontWeight: 700,
        fontSize: size * 0.46,
        background: 'linear-gradient(140deg, #4F8BF9 0%, #2563EB 55%, #1D4ED8 100%)',
        boxShadow: `inset 0 1px 0 ${alpha('#FFFFFF', 0.25)}, 0 2px 6px ${alpha('#2563EB', 0.3)}`,
      }}
    >
      {BRAND.initial}
    </Box>
  );
}

function SidebarHeader({ collapsed, onToggleCollapse }) {
  const toggle = onToggleCollapse && (
    <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
      <IconButton
        size="small"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        sx={{ color: 'text.secondary', bgcolor: collapsed ? 'transparent' : 'surfaceAlt' }}
      >
        {collapsed ? <MenuRoundedIcon fontSize="small" /> : <MenuOpenRoundedIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );

  if (collapsed) {
    return (
      <Stack spacing={1} sx={{ alignItems: 'center', pt: 2, pb: 1 }}>
        <BrandMark />
        {toggle}
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.25, pt: 2.25, pb: 1.5 }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
        <BrandMark />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            {BRAND.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'sidebar.sectionLabel', letterSpacing: '0.04em' }}>
            HRMS
          </Typography>
        </Box>
      </Stack>
      {toggle}
    </Stack>
  );
}

function NavItem({ item, active, collapsed, onNavigate }) {
  const Icon = item.icon;
  const button = (
    <ListItemButton
      component={NavLink}
      to={item.path}
      selected={active}
      onClick={onNavigate}
      aria-label={collapsed ? item.label : undefined}
      sx={{
        position: 'relative',
        minHeight: 40,
        mb: 0.25,
        px: collapsed ? 0 : 1.25,
        justifyContent: collapsed ? 'center' : 'flex-start',
        color: 'sidebar.text',
        '& .MuiListItemIcon-root': { color: 'text.tertiary', transition: `color ${slide}` },
        '&:hover': { bgcolor: 'sidebar.backgroundHover', color: 'sidebar.textActive' },
        '&.Mui-selected': {
          bgcolor: 'sidebar.backgroundActive',
          color: 'sidebar.textActive',
          '&:hover': { bgcolor: 'sidebar.backgroundActive' },
          '& .MuiListItemIcon-root': { color: 'sidebar.iconActive' },
          // The accent notch on the sidebar's edge that marks where you are.
          '&::before': {
            content: '""',
            position: 'absolute',
            left: -12,
            top: 9,
            bottom: 9,
            width: 3,
            borderRadius: '0 3px 3px 0',
            bgcolor: 'primary.main',
          },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34 }}>
        <Icon sx={{ fontSize: 20 }} />
      </ListItemIcon>
      {!collapsed && (
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              noWrap: true,
              sx: { fontSize: '0.90625rem', fontWeight: active ? 600 : 500, letterSpacing: '-0.003em' },
            },
          }}
        />
      )}
    </ListItemButton>
  );

  if (!collapsed) return button;
  return (
    <Tooltip title={item.label} placement="right">
      {button}
    </Tooltip>
  );
}

function SidebarContent({ isPlatform, session, collapsed = false, onToggleCollapse, onNavigate }) {
  const location = useLocation();
  // Built from the permissions the server sent, so a custom role's pages are
  // offered and nothing is offered that its route guard would turn away.
  const sections = visibleNav(isPlatform ? platformNavConfig : navConfig, session);
  const currentPath = activePath(sections, location.pathname);
  const [closed, setClosed] = useStoredState(CLOSED_SECTIONS_KEY, {});

  const toggleSection = (label) => setClosed((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <SidebarHeader collapsed={collapsed} onToggleCollapse={onToggleCollapse} />

      <Box
        component="nav"
        aria-label="Main"
        sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', px: 1.5, pb: 1.5 }}
      >
        {sections.map((section, index) => {
          const hasActive = section.items.some((item) => item.path === currentPath);
          // A section holding the current page never hides it.
          const open = collapsed || hasActive || !closed[section.label];
          const listId = `nav-section-${index}`;

          return (
            <Box key={section.label} sx={{ mt: index === 0 ? 0.5 : collapsed ? 0.5 : 1.25 }}>
              {collapsed ? (
                index > 0 && <Divider sx={{ mx: 1, mb: 1 }} />
              ) : (
                <ButtonBase
                  onClick={() => toggleSection(section.label)}
                  aria-expanded={open}
                  aria-controls={listId}
                  sx={{
                    width: '100%',
                    justifyContent: 'space-between',
                    px: 1.25,
                    py: 0.75,
                    mb: 0.25,
                    borderRadius: '8px',
                    color: 'sidebar.sectionLabel',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'inherit' }}>
                    {section.label}
                  </Typography>
                  <ExpandMoreRoundedIcon
                    sx={{
                      fontSize: 18,
                      transition: `transform ${slide}`,
                      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </ButtonBase>
              )}
              <Collapse in={open} timeout={200} id={listId}>
                <List dense disablePadding>
                  {section.items.map((item) => (
                    <NavItem
                      key={item.path}
                      item={item}
                      active={item.path === currentPath}
                      collapsed={collapsed}
                      onNavigate={onNavigate}
                    />
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ p: 1.25, borderTop: 1, borderColor: 'sidebar.border' }}>
        <UserMenu variant="sidebar" collapsed={collapsed} />
      </Box>
    </Box>
  );
}

function UserMenu({ variant = 'topbar', collapsed = false }) {
  const navigate = useNavigate();
  const { me, username, role, isPlatform, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const displayName = me?.employeeName || username;
  const subtitle = isPlatform ? 'Platform account' : me?.companyName || '';
  const initials = initialsOf(displayName);
  const inSidebar = variant === 'sidebar';

  const handleLogout = () => {
    setAnchorEl(null);
    logout().then(() => navigate('/login', { replace: true }));
  };

  let trigger;
  if (inSidebar) {
    const avatar = (
      <Avatar sx={{ width: 36, height: 36, fontSize: 13, bgcolor: '#EEF1F5', color: 'text.primary' }}>
        {initials}
      </Avatar>
    );
    trigger = (
      <ButtonBase
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="Account menu"
        aria-haspopup="menu"
        sx={{
          width: '100%',
          borderRadius: '12px',
          p: 1,
          gap: 1.25,
          justifyContent: collapsed ? 'center' : 'flex-start',
          textAlign: 'left',
          transition: `background-color ${slide}`,
          '&:hover': { bgcolor: 'sidebar.backgroundHover' },
        }}
      >
        {avatar}
        {!collapsed && (
          <>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.25 }}>
                {displayName}
              </Typography>
              {(subtitle || role) && (
                <Typography
                  noWrap
                  sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.tertiary', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                >
                  {subtitle || role}
                </Typography>
              )}
            </Box>
            <UnfoldMoreRoundedIcon sx={{ fontSize: 18, color: 'text.tertiary' }} />
          </>
        )}
      </ButtonBase>
    );
  } else {
    trigger = (
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        {role && <Chip label={role} color={ROLE_COLOR[role] || 'default'} size="small" />}
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="Account menu"
          aria-haspopup="menu"
          sx={{ p: 0.25, borderRadius: '50%' }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              fontSize: 13,
              color: 'common.white',
              background: 'linear-gradient(140deg, #4F8BF9 0%, #2563EB 60%, #1D4ED8 100%)',
            }}
          >
            {initials}
          </Avatar>
        </IconButton>
      </Stack>
    );
  }

  return (
    <>
      {trigger}
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={inSidebar ? { vertical: 'top', horizontal: 'left' } : { vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={inSidebar ? { vertical: 'bottom', horizontal: 'left' } : { vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220, mt: inSidebar ? -0.75 : 0.75 } } }}
      >
        <ListSubheader
          sx={{ position: 'static', bgcolor: 'transparent', lineHeight: 1.3, px: 1.25, pt: 0.75, pb: 1 }}
        >
          <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}>
            {displayName}
          </Typography>
          {subtitle && (
            <Typography noWrap variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </ListSubheader>
        <Divider sx={{ my: 0.5 }} />
        {!isPlatform && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              navigate('/change-password');
            }}
          >
            <ListItemIcon>
              <LockResetRoundedIcon fontSize="small" />
            </ListItemIcon>
            Change password
          </MenuItem>
        )}
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}

function TopBar({ trail, onOpenNav }) {
  return (
    <Box
      component="header"
      sx={{
        height: TOPBAR_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 1.25, sm: 2.25 },
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '16px',
      }}
    >
      <IconButton
        onClick={onOpenNav}
        aria-label="Open navigation"
        sx={{ display: { md: 'none' }, color: 'text.primary' }}
      >
        <MenuRoundedIcon />
      </IconButton>

      {trail && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
          >
            {trail.section}
          </Typography>
          <ChevronRightRoundedIcon
            sx={{ fontSize: 18, color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}
          />
          <Typography variant="subtitle2" noWrap>
            {trail.item}
          </Typography>
        </Stack>
      )}

      <Box sx={{ flexGrow: 1 }} />

      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: 'center', color: 'text.secondary', display: { xs: 'none', sm: 'flex' } }}
      >
        <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {dayjs().format('ddd, D MMM YYYY')}
        </Typography>
      </Stack>
      <Divider orientation="vertical" flexItem sx={{ my: 2, display: { xs: 'none', sm: 'block' } }} />
      <UserMenu variant="topbar" />
    </Box>
  );
}

// A short fade-and-rise when moving between modules, run on the existing
// page element rather than by re-mounting it, so no page state is lost.
function usePageEnter(ref, pathname) {
  const moduleKey = pathname.split('/')[1] || 'home';
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof node.animate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    node.animate(
      [
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 260, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
    );
  }, [ref, moduleKey]);
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useStoredState(COLLAPSED_KEY, false);
  const { role, permissions, isPlatform } = useAuth();
  const location = useLocation();
  const pageRef = useRef(null);
  const session = { role, permissions };
  const sidebarWidth = collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH;
  const trail = activeTrail(
    visibleNav(isPlatform ? platformNavConfig : navConfig, session),
    location.pathname
  );

  usePageEnter(pageRef, location.pathname);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <IdleSessionGuard />

      {/* Desktop: a floating panel, fixed to the viewport, with its own scroll. */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: sidebarWidth + GAP,
          flexShrink: 0,
          transition: `width ${slide}`,
        }}
      >
        <Box
          sx={{
            position: 'fixed',
            top: GAP,
            bottom: GAP,
            left: GAP,
            width: sidebarWidth,
            bgcolor: 'sidebar.background',
            border: 1,
            borderColor: 'sidebar.border',
            borderRadius: '20px',
            overflow: 'hidden',
            transition: `width ${slide}`,
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          <SidebarContent
            isPlatform={isPlatform}
            session={session}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
        </Box>
      </Box>

      {/* Mobile: the same content in a slide-over drawer that closes on navigation. */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            border: 'none',
            borderRadius: '0 20px 20px 0',
            bgcolor: 'sidebar.background',
          },
        }}
      >
        <SidebarContent
          isPlatform={isPlatform}
          session={session}
          onNavigate={() => setMobileOpen(false)}
        />
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, px: `${GAP}px`, pb: `${GAP}px` }}>
        {/* The strip behind the top bar is canvas-coloured, so content scrolling
            up disappears cleanly under it instead of showing through the gap. */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            bgcolor: 'background.default',
            pt: `${GAP}px`,
            pb: `${GAP}px`,
          }}
        >
          <TopBar trail={trail} onOpenNav={() => setMobileOpen(true)} />
        </Box>
        <Box
          ref={pageRef}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: '20px',
            p: { xs: 2, sm: 3, lg: 3.5 },
            minHeight: `calc(100vh - ${TOPBAR_HEIGHT + GAP * 3}px)`,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
