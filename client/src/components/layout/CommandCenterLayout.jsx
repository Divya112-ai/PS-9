import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReportIcon from '@mui/icons-material/Report';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CircleIcon from '@mui/icons-material/Circle';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, to: '/dashboard' },
  { label: 'Incidents', icon: <ReportIcon />, to: '/incidents' },
  { label: 'Resources', icon: <LocalShippingIcon />, to: '/resources' },
  { label: 'Alerts', icon: <NotificationsIcon />, to: '/alerts' },
  { label: 'Analytics', icon: <AnalyticsIcon />, to: '/analytics' },
];

export default function CommandCenterLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'var(--bg-base)' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'var(--sidebar-bg)',
            color: 'var(--sidebar-text)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Brand */}
        <Box sx={{ p: 2.5, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: 20 }}>🚨</span>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: 'var(--accent-primary)',
                letterSpacing: '-0.3px',
                fontSize: 18,
              }}
            >
              Rakshak AI
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: 'var(--sidebar-text-muted)',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              fontWeight: 600,
              ml: 0.5,
            }}
          >
            Command Center
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'var(--border-subtle)' }} />

        {/* Navigation */}
        <List sx={{ pt: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <ListItem key={item.to} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.to}
                  sx={{
                    mx: 1,
                    my: 0.25,
                    borderRadius: 'var(--radius-md)',
                    bgcolor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    borderLeft: isActive
                      ? '3px solid var(--sidebar-active-border)'
                      : '3px solid transparent',
                    '&:hover': { bgcolor: 'var(--sidebar-hover-bg)' },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive
                        ? 'var(--sidebar-active-border)'
                        : 'var(--sidebar-text-muted)',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--sidebar-text)',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Bottom: user status */}
        <Box
          sx={{
            mt: 'auto',
            p: 2,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 1,
              borderRadius: 'var(--radius-md)',
              bgcolor: 'var(--bg-surface)',
            }}
          >
            <CircleIcon
              sx={{ fontSize: 8, color: 'var(--accent-success)' }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textTransform: 'capitalize',
                  lineHeight: 1.2,
                }}
              >
                {user?.name || user?.role || 'Operator'}
              </Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: 1.4,
                }}
              >
                {user?.role || 'online'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'var(--bg-base)',
          minWidth: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}