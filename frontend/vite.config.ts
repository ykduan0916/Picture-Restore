import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 开发时 /api 转发到本地 FastAPI，避免跨域配置随端口漂移
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:8888',
    },
  },
})
