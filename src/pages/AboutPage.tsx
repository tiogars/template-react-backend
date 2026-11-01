import { Button, Card, CardContent, Link, Stack, Typography } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import ApiIcon from '@mui/icons-material/Api';
import { PageHeader } from '../components/PageHeader';
import { apiBaseUrl, docsBaseUrl, githubBaseUrl } from '../config';

export function AboutPage() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 840 }}>
      <PageHeader title="About" description="Operational console for Task management." />
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography>
              This webapp manages Tasks through the Task API and its TypeScript client.
            </Typography>
            <Typography>
              API target: <strong>{apiBaseUrl}</strong>
            </Typography>
            <Typography>
              GitHub repository: <strong>{githubBaseUrl}</strong>
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button component={Link} href={docsBaseUrl} target="_blank" rel="noreferrer" startIcon={<LocalLibraryIcon />}>
                Documentation
              </Button>
              <Button
                component={Link}
                href={githubBaseUrl}
                target="_blank"
                rel="noreferrer"
                startIcon={<GitHubIcon />}
              >
                GitHub
              </Button>
              <Button
                component={Link}
                href={`${apiBaseUrl}/swagger-ui.html`}
                target="_blank"
                rel="noreferrer"
                startIcon={<ApiIcon />}
              >
                Swagger UI
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
