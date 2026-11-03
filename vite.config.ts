/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' : chemins relatifs, ce qui marche à la fois sur GitHub Pages
// (https://antojobless.github.io/Recettes-lyonnaises/) et en fichier unique
// ouvert par double-clic.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'single' ? { outDir: 'dist-single', emptyOutDir: true } : { outDir: 'dist', chunkSizeWarningLimit: 4000 },
  test: { globals: true, environment: 'node', include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'] },
}));
