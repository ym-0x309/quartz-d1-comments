import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  platform: "browser",
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  outDir: "dist",
  external: ["preact"],
});
