import { Card, CardContent, Typography } from '@mui/material';

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card sx={{ flex: 1 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h6" sx={{ overflowWrap: 'anywhere' }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}