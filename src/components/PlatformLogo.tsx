import type { ReleasePlatform } from '../releases';

type Props = Readonly<{
  platform: ReleasePlatform;
  size?: number;
}>;

const labels: Record<ReleasePlatform, string> = {
  android: 'Android logo',
  linux: 'Linux logo',
  windows: 'Windows logo',
};

export function PlatformLogo({ platform, size = 64 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={labels[platform]}>
      {platform === 'android' && (
        <g fill="#3ddc84" stroke="#3ddc84" strokeLinecap="round">
          <path d="M10 46a22 22 0 0 1 44 0z" stroke="none" />
          <line x1="21" y1="28" x2="15" y2="17" strokeWidth="3.5" />
          <line x1="43" y1="28" x2="49" y2="17" strokeWidth="3.5" />
          <circle cx="23" cy="37" r="3" fill="#fff" stroke="none" />
          <circle cx="41" cy="37" r="3" fill="#fff" stroke="none" />
        </g>
      )}
      {platform === 'linux' && (
        <g>
          <ellipse cx="32" cy="35" rx="17" ry="23" fill="#1d1d1b" />
          <ellipse cx="32" cy="41" rx="11" ry="15" fill="#fff" />
          <circle cx="26.5" cy="22" r="3.6" fill="#fff" />
          <circle cx="37.5" cy="22" r="3.6" fill="#fff" />
          <circle cx="27.2" cy="22.6" r="1.7" fill="#1d1d1b" />
          <circle cx="36.8" cy="22.6" r="1.7" fill="#1d1d1b" />
          <path d="M26 28q6-4 12 0q-6 6-12 0z" fill="#f4b400" />
          <ellipse cx="22" cy="58" rx="8" ry="3.5" fill="#f4b400" />
          <ellipse cx="42" cy="58" rx="8" ry="3.5" fill="#f4b400" />
        </g>
      )}
      {platform === 'windows' && (
        <g fill="#0078d4">
          <rect x="8" y="8" width="22" height="22" rx="1" />
          <rect x="34" y="8" width="22" height="22" rx="1" />
          <rect x="8" y="34" width="22" height="22" rx="1" />
          <rect x="34" y="34" width="22" height="22" rx="1" />
        </g>
      )}
    </svg>
  );
}
