import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@moyu/game-core': path.resolve(rootDir, '../game-core/src/index.ts'),
    },
  },
  server: {
    /** 单进程监听，localhost 与 127.0.0.1 同一套代码 */
    host: true,
    port: 5173,
    strictPort: true,
    open: false,
  },
});
