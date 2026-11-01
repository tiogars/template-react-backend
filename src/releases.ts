export type ReleasePlatform = 'android' | 'linux' | 'windows';

export type ReleaseArtifact = {
  platform: ReleasePlatform;
  fileName: string;
  path: string;
  size: number;
  sha256: string;
  version: string | null;
  apiBaseUrl: string | null;
  builtAt: string | null;
};

export type ReleaseManifest = {
  generatedAt: string;
  artifacts: ReleaseArtifact[];
};

export const releasesBaseUrl = `${import.meta.env.BASE_URL}releases/`;

export async function fetchReleaseManifest(signal?: AbortSignal): Promise<ReleaseManifest> {
  const response = await fetch(`${releasesBaseUrl}manifest.json`, { signal, cache: 'no-cache' });
  if (response.status === 404) return { generatedAt: '', artifacts: [] };
  if (!response.ok) throw new Error(`Unable to load the release list (HTTP ${response.status}).`);
  const contentType = response.headers.get('content-type') ?? '';
  // The SPA fallback answers unknown paths with index.html when no build was published.
  if (!contentType.includes('json')) return { generatedAt: '', artifacts: [] };
  return (await response.json()) as ReleaseManifest;
}

export function formatBytes(size: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}
