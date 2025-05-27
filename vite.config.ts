import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    open: true,
    host: true,
  },
  worker: {
    format: 'es',
    plugins: () => []
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    include: ['webcodecs-encoder']
  },
  assetsInclude: ['**/*.js'], // webcodecs-encoderのworker.jsを含める
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'es'
      }
    },
    sourcemap: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.DEBUG': JSON.stringify(process.env.DEBUG || 'app:*'),
    // Service Worker無効化フラグ（開発環境用）
    '__DISABLE_SW__': JSON.stringify(process.env.NODE_ENV === 'development'),
  }
});
