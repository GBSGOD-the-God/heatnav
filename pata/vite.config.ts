import { defineConfig } from 'vite';

// Fixed (un-hashed) output names so the service worker can precache a
// deterministic list — required for cold-load with the network off.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
