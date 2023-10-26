import { defineConfig, LegacyOptions } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import dlight from "vite-plugin-dlight"

export default defineConfig({
    server: {
      port: 4320
    },
    base: '',
    plugins: [
      legacy({
        targets: ['defaults', 'not IE 11']
      }),
      dlight({ files: "**/*.view.ts" }),
    ]
});