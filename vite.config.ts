import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allows external connections -> i.e. ngrok
    port: 5173, // default
    strictPort: true, // fail if port is already used
    //ngrok start booktokka
    allowedHosts: [
      'naturally-teaching-sculpin.ngrok-free.app', 'localhost'
    ],
  },
})