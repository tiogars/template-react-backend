import { Link as RouterLink } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { apiBaseUrl } from '../config';
import { formatDate } from '../taskUtils';
import { useTasks } from '../hooks/useTasks';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';

export function DashboardPage() {
  const { templates, loading, error } = useTasks();
  const latest = [...templates]
    .sort((a, b) => Date.parse(b.lastModifiedDate) - Date.parse(a.lastModifiedDate))
    .slice(0, 10);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Dashboard"
        description="Global overview of Tasks and recent activity."
        action={
          <Button
            component={RouterLink}
            to="/tasks/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Create
          </Button>
        }
      />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <MetricCard label="Total tasks" value={String(templates.length)} />
        <MetricCard
          label="Last update"
          value={latest[0] ? formatDate(latest[0].lastModifiedDate) : 'No activity'}
        />
        <MetricCard label="API target" value={apiBaseUrl} />
      </Stack>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Last 10 Tasks
          </Typography>
          {loading && <CircularProgress aria-label="Loading dashboard tasks" />}
          {error && <Alert severity="error">{error}</Alert>}
          {!loading && !error && latest.length === 0 && (
            <Typography color="text.secondary">No Tasks found.</Typography>
          )}
          <List disablePadding>
            {latest.map((template) => (
              <ListItem
                key={template.id}
                divider
                secondaryAction={
                  <Button component={RouterLink} to={`/tasks/${template.id}`} size="small">
                    View
                  </Button>
                }
              >
                <ListItemText
                  primary={template.label}
                  secondary={`${template.code} · ${formatDate(template.lastModifiedDate)}`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
}
