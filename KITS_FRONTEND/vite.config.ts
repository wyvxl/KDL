import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ruta donde se publica la app. En local es '/'; en GitHub Pages el sitio vive en
  // https://<usuario>.github.io/<repo>/, así que el workflow compila con VITE_BASE=/KDL/.
  base: process.env.VITE_BASE ?? '/',
})
