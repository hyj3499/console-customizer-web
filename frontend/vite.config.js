import { defineConfig } from 'vite' // 👈 이 줄이 없어서 에러가 난 것입니다!
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 프론트엔드에서 /api로 시작하는 요청을 보내면 
      // 백엔드 서버(8000번 포트)로 배달해줍니다.
      '/api': {
        target: 'http://localhost:8000', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})