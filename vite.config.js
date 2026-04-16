import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: './',
  publicDir: 'public',
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      input: './index.html',
      output: {
        dir: 'dist'
      }
    }
  },
  server: {
    port: 5173,
    open: true,
    strictPort: false
  }
});
