/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  plugins: [vue()],
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
