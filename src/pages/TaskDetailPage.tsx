import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import type { Task } from '@organization_template/react-client';
import { taskClient } from '@organization_template/react-client';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { DetailField } from '../components/DetailField';
import { PageHeader } from '../components/PageHeader';
import { PrintPdfButton } from '../components/PrintPdfButton';
import { formatDate, parseTaskId, toErrorMessage } from '../taskUtils';
import { useTaxonomies } from '../hooks/useTaxonomies';
import { taxonomyLabel, nomenclaturePath } from '../taxonomyUtils';

function AuditInformation({ template }: { template: Task }) {
  return (
    <Accordion
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        '&:before': { display: 'none' },
        '&.Mui-expanded': { margin: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="task-audit-content"
        id="task-audit-header"
        aria-label="Audit information"
        sx={{
          px: { xs: 2, sm: 3 },
          '& .MuiAccordionSummary-content': { gap: 1.5, alignItems: 'center' },
        }}
      >
        <HistoryIcon color="action" fontSize="small" />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Audit information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Creation and update history
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: { xs: 2, sm: 3 },
          }}
        >
          <DetailField label="Created" value={formatDate(template.createdDate)} />
          <DetailField label="Created by" value={template.createdBy ?? 'Not available'} />
          <DetailField label="Last modified" value={formatDate(template.lastModifiedDate)} />
          <DetailField
            label="Last modified by"
            value={template.lastModifiedBy ?? 'Not available'}
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export function TaskDetailPage() {
  const taxonomy = useTaxonomies();
  const { id } = useParams();
  const templateId = parseTaskId(id);
  const [template, setTemplate] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (templateId === null) {
      setError('Invalid Task id.');
      setLoading(false);
      return;
    }
    let active = true;
    taskClient
      .findById(templateId)
      .then((value) => {
        if (active) setTemplate(value);
      })
      .catch((caught) => setError(toErrorMessage(caught)))
      .finally(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [templateId]);

  if (loading) {
    return (
      <Box sx={{ display: 'grid', minHeight: 280, placeItems: 'center' }}>
        <CircularProgress aria-label="Loading Task" />
      </Box>
    );
  }
  if (error || !template) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error ?? 'Task not found.'}
      </Alert>
    );
  }

  return (
    <Stack spacing={3} useFlexGap className="print-surface">
      <PageHeader
        title={template.label}
        description={`${template.code} · ID ${template.id}`}
        action={
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: 'wrap' }}
            className="no-print"
          >
            <PrintPdfButton label="Print" loadPdf={() => taskClient.print(template.id)} />
            <Button
              component={RouterLink}
              to={`/tasks/${template.id}/edit`}
              variant="contained"
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
          </Stack>
        }
      />
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          borderInlineStart: 4,
          borderInlineStartColor: 'primary.main',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <ArticleOutlinedIcon color="primary" />
              <Box>
                <Typography variant="h6" component="h2">
                  Task details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Core information for this Task
                </Typography>
              </Box>
            </Stack>
            <Divider />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: { xs: 2, sm: 3 },
              }}
            >
              <DetailField label="ID" value={String(template.id)} />
              <DetailField label="Code" value={template.code} />
              <DetailField label="Label" value={template.label} />
              <DetailField
                label="Status"
                value={(template.status ?? 'TODO').replaceAll('_', ' ')}
              />
              <DetailField label="Priority" value={template.priority ?? 'NORMAL'} />
              <DetailField label="Due date" value={template.dueDate || 'None'} />
              <DetailField label="Assigned to" value={template.assignedTo || 'Unassigned'} />
              <DetailField
                label="Tags"
                value={
                  (template.tagIds ?? [])
                    .map((id) => taxonomyLabel(id, taxonomy.tags))
                    .join(', ') || 'None'
                }
              />
              <DetailField
                label="Nomenclature"
                value={nomenclaturePath(template.nomenclatureId, taxonomy.nomenclatures)}
              />
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <DetailField label="Description" value={template.description || 'No description'} />
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <AuditInformation template={template} />
      {taxonomy.error && (
        <Alert severity="error">{taxonomy.error} Relationship labels could not be loaded.</Alert>
      )}
    </Stack>
  );
}
