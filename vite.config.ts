import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { miyeonApiProxy } from './plugins/miyeon-api-proxy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      miyeonApiProxy({
        ktoKey: env.KTO_SERVICE_KEY,
        googleKey: env.GOOGLE_PLACES_API_KEY,
      }),
    ],
  };
});

