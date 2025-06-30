import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          // 代理将在发送请求头之前被调用
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 确保Origin设置正确
            proxyReq.setHeader('Origin', 'http://127.0.0.1:5000');
          });
        }
      }
    }
  }
})
