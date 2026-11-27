import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// GitHub Pages publica el sitio en https://<propietario>.github.io/<repositorio>/.
export default defineConfig({
  base: '/__NOMBRE__/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx'],
      reporter: ['text', 'cobertura'],
    },
  },
});
