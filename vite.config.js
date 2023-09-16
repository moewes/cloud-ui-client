import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: "target/classes/META-INF/resources/webjars/cloudui-client/0.4.2",
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.js'),
      name: 'cloudui-client-lib',
      // the proper extensions will be added
      fileName: 'cloudui-client-lib',
    },
  },
})