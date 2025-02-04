import { defineConfig } from "vite"
import dlightServer from "vite-plugin-dlight-server"
import dlightClient from "vite-plugin-dlight-client"


function mySSRPlugin() {
  return {
    name: 'my-ssr',
    enforce: "pre",
    transform(code, id, options) {
      if (options?.ssr) {
        return dlightServer({ files: "**/*.view.ts" }).transform(code, id)
      } else {
        return dlightClient({ files: "**/*.view.ts" }).transform(code, id)
      }
    },
  }
}

export default defineConfig({
  server: {
    port: 26660
  },
  plugins: [
    mySSRPlugin()
  ]
})
