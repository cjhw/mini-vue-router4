import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import * as Path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx({})],
  resolve: {
    alias: {
      '@': Path.join(__dirname, 'src'),
    },
  },
})
