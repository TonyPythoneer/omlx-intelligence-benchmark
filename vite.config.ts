import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  server: {
    port: 8080,
    host: 'localhost'
  },
  test: {
    include: ['lib/**/*.test.mjs'],
    globals: true
  }
});
