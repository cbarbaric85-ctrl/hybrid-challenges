import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const norm = id.replace(/\\/g, '/');
          if (norm.includes('node_modules/firebase/') || norm.includes('node_modules/@firebase/')) {
            return 'vendor-firebase';
          }
          if (norm.includes('/src/data/quizzes.js')) {
            return 'data-quizzes';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
