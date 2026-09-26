import { useEffect, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import contractorsApi from '../api/contractors';

/**
 * The contractor selector every screen in this module starts with.
 *
 * <p>Loads active contractors only by default: an inactive contractor has no
 * deployed workforce (deactivation is refused while it does), so offering one
 * would only ever lead to an empty screen.
 *
 * <p>`autoSelectFirst` picks the first contractor when there is no selection
 * yet, because a company with exactly one contractor - the common case -
 * should not have to choose it every time. It fires once per load, so a
 * deliberate "All contractors" choice is never overridden.
 */
export default function ContractorPicker({
  label = 'Contractor',
  value,
  onChange,
  includeAll = false,
  allLabel = 'All contractors',
  activeOnly = true,
  autoSelectFirst = false,
  size = 'small',
  required = false,
  sx,
  helperText,
}) {
  const [contractors, setContractors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    contractorsApi
      .list(activeOnly)
      .then((rows) => {
        if (cancelled) return;
        setContractors(rows);
        if (autoSelectFirst && !value && rows.length > 0) onChange(rows[0].id);
      })
      .catch(() => setContractors([]));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  return (
    <TextField
      select
      size={size}
      label={label}
      required={required}
      value={contractors.length === 0 ? '' : (value ?? '')}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      sx={[{ minWidth: 220 }, ...(Array.isArray(sx) ? sx : [sx])]}
      helperText={
        helperText ?? (contractors.length === 0 ? 'No active contractors onboarded yet' : undefined)
      }
    >
      {includeAll && <MenuItem value="">{allLabel}</MenuItem>}
      {contractors.map((c) => (
        <MenuItem key={c.id} value={c.id}>
          {c.contractorName} ({c.contractorCode})
        </MenuItem>
      ))}
    </TextField>
  );
}
