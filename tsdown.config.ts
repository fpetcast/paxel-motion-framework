import { defineConfig, UserConfig } from 'tsdown'

const SHARED_CONFIG: UserConfig = {
  entry: './src/index.ts',
  dts: true,
  outDir: './dist',
  clean: true,
  format: "esm",
  platform: "browser",
  minify: false,
}

export default defineConfig([
  SHARED_CONFIG,
  {
    ...SHARED_CONFIG,
    dts: false,
    minify: true,
    outExtensions: (context) => {
      return {
        js: ".mjs"
      }
    },
  },
]);