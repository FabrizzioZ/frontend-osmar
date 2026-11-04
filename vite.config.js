import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build' && !env.VITE_API_URL) {
    throw new Error('VITE_API_URL es obligatoria para compilar el frontend. Configúrala en Vercel.')
  }

  return {
    plugins: [react()],
  }
})
