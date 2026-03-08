import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // localhost 대신 숫자로 된 로컬 주소 사용
    port: 5173,
    strictPort: true
  }
})