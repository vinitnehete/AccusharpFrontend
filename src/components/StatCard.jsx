import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, alpha } from '@mui/material/styles';

function resolveColor(theme, path) {
  if (!path) return theme.palette.primary.main;
  if (path.startsWith('#')) return path;
  const [group, key = 'main'] = path.split('.');
  return theme.palette[group]?.[key] || theme.palette.primary.main;
}

// Label on top, the number large beneath it, the icon tile on the right. With
// no icon, a small dot in the accent colour keeps the card's meaning visible.
export default function StatCard({ label, value, icon, accent = 'primary.main', loading = false }) {
  const theme = useTheme();
  const color = resolveColor(theme, accent);

  return (
    <Card
      sx={{
        height: '100%',
        '&:hover': { borderColor: 'grey.300', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)' },
      }}
    >
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0, width: '100%' }}>
            <Stack direction="row" spacing={0.875} sx={{ alignItems: 'center' }}>
              {!icon && (
                <Box
                  aria-hidden
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }}
                />
              )}
              <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 500 }}>
                {label}
              </Typography>
            </Stack>
            {loading ? (
              <Skeleton variant="text" width="55%" sx={{ fontSize: '1.75rem', mt: 0.5 }} />
            ) : (
              <Typography
                className="tabular-nums"
                sx={{ mt: 0.75, fontSize: '1.625rem', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em' }}
              >
                {value}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(color, 0.1),
                color,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
