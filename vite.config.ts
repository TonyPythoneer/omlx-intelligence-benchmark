/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8080,
    host: 'localhost'
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  test: {
    include: ['lib/**/*.test.mjs', 'composables/**/*.test.ts'],
    globals: true
  }
});
