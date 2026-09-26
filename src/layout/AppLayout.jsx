import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAuth } from '../context/AuthContext';
import navConfig, { platformNavConfig, visibleNav } from './navConfig';
import { ROLE_COLOR } from '../constants/enums';
import IdleSessionGuard from '../components/IdleSessionGuard';
import { BRAND } from '../constants/brand';

const DRAWER_WIDTH = 260;

// The Drawer's Paper is painted explicitly rather than left to default. When
// the sidebar was navy this fixed a real bug — a nav list taller than the
// viewport left white Paper showing below the coloured Box — and the same
// explicit painting keeps working now that the column is light. The hairline
// on the right is what separates the sidebar from the canvas, in place of the
// colour contrast a dark column used to provide.
const drawerPaperSx = {
  width: DRAWER_WIDTH,
  border: 'none',
  borderRight: '1px solid',
  borderColor: 'sidebar.border',
  bgcolor: 'sidebar.background',
  color: 'sidebar.text',
};

function SidebarContent({ isPlatform, session }) {
  const location = useLocation();
  // Built from the permissions the server sent, so a custom role's pages are
  // offered and nothing is offered that its route guard would turn away.
  const sections = visibleNav(isPlatform ? platformNavConfig : navConfig, session);

  return (
    <Box sx={{ bgcolor: 'sidebar.background', minHeight: '100%', color: 'sidebar.text', pb: 2 }}>
      <Box
        sx={{ px: 3, py: 3, mb: 1, borderBottom: '1px solid', borderColor: 'sidebar.border' }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, width: 36, height: 36 }}>
            {BRAND.initial}
          </Avatar>
          <Box>
            <Typography sx={{ color: 'sidebar.textActive', fontWeight: 800, lineHeight: 1.1 }}>
              {BRAND.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'sidebar.sectionLabel' }}>
              HRMS
            </Typography>
          </Box>
        </Stack>
      </Box>
      {sections.map((section) => {
        const items = section.items;
        return (
          <Box key={section.label} sx={{ px: 1.5, mb: 1 }}>
            <Typography
              variant="overline"
              sx={{ color: 'sidebar.sectionLabel', px: 1.5, letterSpacing: 1 }}
            >
              {section.label}
            </Typography>
            <List dense disablePadding>
              {items.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <ListItemButton
                    key={item.path}
                    component={NavLink}
                    to={item.path}
                    selected={active}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      color: active ? 'sidebar.textActive' : 'sidebar.text',
                      '&.Mui-selected': {
                        bgcolor: 'sidebar.backgroundActive',
                        color: 'sidebar.textActive',
                        '&:hover': { bgcolor: 'sidebar.backgroundActive' },
                      },
                      '&:hover': { bgcolor: 'sidebar.backgroundHover' },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { fontSize: 14, fontWeight: active ? 700 : 500 } }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        );
      })}
    </Box>
  );
}

function UserMenu() {
  const navigate = useNavigate();
  const { me, username, role, isPlatform, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const displayName = me?.employeeName || username;
  const subtitle = isPlatform ? 'Platform account' : me?.companyName || '';

  const handleLogout = () => {
    setAnchorEl(null);
    logout().then(() => navigate('/login', { replace: true }));
  };

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      {role && <Chip label={role} color={ROLE_COLOR[role] || 'default'} size="small" />}
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
          {displayName?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {displayName}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
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
        {!isPlatform && <Divider />}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Stack>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, permissions, isPlatform } = useAuth();
  const session = { role, permissions };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <IdleSessionGuard />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <UserMenu />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': drawerPaperSx,
          }}
        >
          <SidebarContent isPlatform={isPlatform} session={session} />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': drawerPaperSx,
          }}
          open
        >
          <SidebarContent isPlatform={isPlatform} session={session} />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
