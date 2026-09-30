import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { useActingAs } from '../context/ActingAsContext';

export default function EmployeeMultiPicker({ label = 'Employees', value, onChange, size = 'small', disabled = false }) {
  const { employees } = useActingAs();
  const selected = employees.filter((e) => value?.includes(e.userId));

  return (
    <Autocomplete
      multiple
      size={size}
      disabled={disabled}
      options={employees}
      value={selected}
      getOptionLabel={(opt) => `${opt.employeeName} (${opt.userId})`}
      isOptionEqualToValue={(opt, val) => opt.userId === val?.userId}
      onChange={(_, newValue) => onChange(newValue.map((v) => v.userId))}
      renderValue={(tagValue, getItemProps) =>
        tagValue.map((option, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return <Chip label={option.userId} size="small" {...itemProps} key={key} />;
        })
      }
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}
