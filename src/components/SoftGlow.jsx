import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';

// Soft, blurred pools of blue light behind a page or hero - the one piece of
// decoration shared by the sign-in screen and the public site. Purely
// presentational: absolutely positioned, ignored by pointer and screen reader.
const LAYOUTS = {
  page: [
    { top: '-12%', left: '8%', width: 520, height: 420, color: '#60A5FA', a: 0.28 },
    { top: '38%', left: '-10%', width: 460, height: 460, color: '#93C5FD', a: 0.3 },
    { bottom: '-18%', right: '-6%', width: 560, height: 520, color: '#60A5FA', a: 0.22 },
    { top: '10%', right: '18%', width: 280, height: 280, color: '#A5B4FC', a: 0.22 },
  ],
  hero: [
    { top: '-30%', left: '-8%', width: 520, height: 420, color: '#93C5FD', a: 0.35 },
    { top: '20%', right: '-10%', width: 520, height: 480, color: '#60A5FA', a: 0.22 },
    { bottom: '-40%', left: '30%', width: 480, height: 360, color: '#A5B4FC', a: 0.2 },
  ],
  band: [
    { top: '-60%', left: '-10%', width: 420, height: 360, color: '#93C5FD', a: 0.45 },
    { bottom: '-70%', right: '-5%', width: 460, height: 380, color: '#A5B4FC', a: 0.35 },
  ],
};

export default function SoftGlow({ variant = 'page' }) {
  return (
    <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {LAYOUTS[variant].map(({ color, a, ...place }, index) => (
        <Box
          key={`${variant}-${index}`}
          sx={{
            position: 'absolute',
            borderRadius: '50%',
            filter: 'blur(60px)',
            bgcolor: alpha(color, a),
            ...place,
          }}
        />
      ))}
    </Box>
  );
}
