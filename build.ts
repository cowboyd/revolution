import * as esbuild from "https://deno.land/x/esbuild@v0.19.2/wasm.js";

import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts";

export async function buildMain() {
  const result = await esbuild.build({
    plugins: [...denoPlugins({
      configPath: new URL("deno.json", import.meta.url).pathname,
    })],
    entryPoints: [new URL("islands.ts", import.meta.url).toString()],
    jsx: "automatic",
    jsxImportSource: 'hastx',
    write: false,
    bundle: true,
    format: "esm",
  });
  if (result.errors.length) {
    throw new Error("failed to compile islands");
  } else {
    let [output] = result.outputFiles;
    return output.contents;
  }
}
