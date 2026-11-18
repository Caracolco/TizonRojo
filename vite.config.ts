import { defineConfig } from 'vite';

// Ruta base compatible con GitHub Pages (https://caracolco.github.io/TizonRojo/).
export default defineConfig({
  base: '/TizonRojo/',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
  test: { include: ['tests/**/*.test.ts'] },
});
