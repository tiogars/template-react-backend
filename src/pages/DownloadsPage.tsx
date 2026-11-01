import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { PageHeader } from '../components/PageHeader';
import { PlatformLogo } from '../components/PlatformLogo';
import {
  fetchReleaseManifest,
  formatBytes,
  releasesBaseUrl,
  type ReleaseArtifact,
  type ReleaseManifest,
  type ReleasePlatform,
} from '../releases';

const platforms: ReadonlyArray<{
  platform: ReleasePlatform;
  name: string;
  format: string;
  instructions: string;
}> = [
  {
    platform: 'android',
    name: 'Android',
    format: 'APK package',
    instructions: 'Open the APK on the device and allow installation from this source.',
  },
  {
    platform: 'linux',
    name: 'Linux',
    format: 'Portable archive (tar.gz)',
    instructions: 'Extract the archive, then run application/application.',
  },
  {
    platform: 'windows',
    name: 'Windows',
    format: 'Portable archive (zip)',
    instructions: 'Extract the archive, then run application\\application.exe.',
  },
];

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; manifest: ReleaseManifest };

export function DownloadsPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetchReleaseManifest(controller.signal)
      .then((manifest) => setState({ status: 'ready', manifest }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to load the release list.',
        });
      });
    return () => controller.abort();
  }, []);

  const artifacts = state.status === 'ready' ? state.manifest.artifacts : [];
  const apiBaseUrl = artifacts.find((artifact) => artifact.apiBaseUrl)?.apiBaseUrl;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 3, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <PageHeader
            title="Download the application"
            description="Install the Tasks application on Android, Linux or Windows."
            action={
              <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
                Tasks Console
              </Button>
            }
          />
          {state.status === 'loading' && (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
              <CircularProgress aria-label="Loading releases" />
            </Box>
          )}
          {state.status === 'error' && <Alert severity="error">{state.message}</Alert>}
          {state.status === 'ready' && (
            <>
              {apiBaseUrl && (
                <Alert severity="info">
                  These builds connect to <strong>{apiBaseUrl}</strong> by default. The address can be
                  changed in the application settings.
                </Alert>
              )}
              {artifacts.length === 0 && (
                <Alert severity="warning">No application build has been published yet.</Alert>
              )}
              <Grid container spacing={3}>
                {platforms.map((item) => (
                  <Grid key={item.platform} size={{ xs: 12, md: 4 }}>
                    <PlatformCard
                      {...item}
                      artifact={artifacts.find((artifact) => artifact.platform === item.platform)}
                    />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

type PlatformCardProps = Readonly<{
  platform: ReleasePlatform;
  name: string;
  format: string;
  instructions: string;
  artifact?: ReleaseArtifact;
}>;

function PlatformCard({ platform, name, format, instructions, artifact }: PlatformCardProps) {
  return (
    <Card
      component="section"
      aria-label={`${name} download`}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <PlatformLogo platform={platform} size={88} />
          <Box>
            <Typography variant="h5" component="h2">
              {name}
            </Typography>
            <Typography color="text.secondary">{format}</Typography>
          </Box>
          {artifact ? (
            <Stack spacing={0.5} sx={{ width: '100%' }}>
              {artifact.version && <Chip label={`Version ${artifact.version}`} size="small" sx={{ alignSelf: 'center' }} />}
              <Typography variant="body2">
                {artifact.fileName} · {formatBytes(artifact.size)}
              </Typography>
              {artifact.builtAt && (
                <Typography variant="body2" color="text.secondary">
                  Built {new Date(artifact.builtAt).toLocaleString()}
                </Typography>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                title={artifact.sha256}
                sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}
              >
                SHA-256 {artifact.sha256}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                {instructions}
              </Typography>
            </Stack>
          ) : (
            <Chip label="Not available" variant="outlined" />
          )}
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
        {artifact ? (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            href={`${releasesBaseUrl}${artifact.path}`}
            {...{ download: artifact.fileName }}
          >
            Download for {name}
          </Button>
        ) : (
          <Button variant="contained" startIcon={<DownloadIcon />} disabled>
            Download for {name}
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
