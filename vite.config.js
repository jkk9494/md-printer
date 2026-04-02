import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react(),
  ],
  base: command === 'build' ? '/md-printer/' : '/', // 빌드 시에는 GitHub Pages 경로, 로컬 서버에서는 루트 경로 사용
}))
