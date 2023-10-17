import { main, suspend } from "effection";
import { serveDir } from "https://deno.land/std@0.190.0/http/file_server.ts";

import { useServer } from "./use-server.ts";
import { buildMain } from "./build.ts";

await main(function*() {
  let { hostname, port } = yield* useServer({
    async handler(request) {
      let { pathname } = new URL(request.url);
      if (pathname === "/main.js") {
        let content = await buildMain();
        return new Response(content, {
          headers: {
            "Content-Type": "text/javascript",
          },
        });
      }
      return serveDir(request, {
        fsRoot: "public"
      })
    }
  });

  console.log(`revolution -> ${hostname}:${port}`);
  yield* suspend();
});
