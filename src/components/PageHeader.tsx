import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: Props) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" component="h1">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
      {action}
    </Stack>
  );
}