import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@organization_template/react-client': fileURLToPath(new URL('../react-client/src/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});