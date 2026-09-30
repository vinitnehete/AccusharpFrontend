import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';

// Plain file input styled as a button, restricted to .csv. `value` is the
// selected File (or null); `onChange` receives the File directly.
export default function CsvFileField({ value, onChange, label = 'Choose CSV file' }) {
  return (
    <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="outlined" component="label" startIcon={<UploadFileRoundedIcon />}>
        {label}
        <input
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </Button>
      <Typography variant="body2" color={value ? 'text.primary' : 'text.secondary'}>
        {value ? value.name : 'No file selected'}
      </Typography>
    </Stack>
  );
}
