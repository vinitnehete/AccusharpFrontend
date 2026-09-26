import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Skeleton from '@mui/material/Skeleton';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import customRolesApi from '../../api/customRoles';
import { labelize } from '../../constants/enums';
import { PERMISSION_GROUPS } from '../../constants/permissions';
import { useAuth } from '../../context/AuthContext';

export default function RoleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canManage = can('ROLE_MANAGE');
  const [role, setRole] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    customRolesApi
      .get(id)
      .then((data) => {
        setRole(data);
        setSelected(new Set(data.permissionCodes || []));
      })
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, [id]);

  const toggle = (code) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);
    customRolesApi
      .setPermissions(id, Array.from(selected))
      .then((updated) => {
        setRole(updated);
        enqueueSnackbar('Permissions saved', { variant: 'success' });
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  if (loading) return <Skeleton variant="rounded" height={500} />;
  if (!role) return <Typography color="text.secondary">Role not found.</Typography>;

  return (
    <>
      <PageHeader
        title={role.name}
        subtitle={role.description || 'No description'}
        actions={
          <>
            <Button color="inherit" onClick={() => navigate('/roles')}>
              Back
            </Button>
            {canManage && (
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                Save permissions
              </Button>
            )}
          </>
        }
      />

      <Grid container spacing={2}>
        {PERMISSION_GROUPS.map((group) => (
          <Grid key={group.label} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardHeader title={<Typography variant="subtitle2">{group.label}</Typography>} />
              <CardContent sx={{ pt: 0 }}>
                <FormGroup>
                  {group.codes.map((code) => (
                    <FormControlLabel
                      key={code}
                      control={
                        <Checkbox
                          checked={selected.has(code)}
                          onChange={() => toggle(code)}
                          disabled={!canManage}
                          size="small"
                        />
                      }
                      label={labelize(code)}
                    />
                  ))}
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
