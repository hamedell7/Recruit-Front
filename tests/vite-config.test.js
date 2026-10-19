import assert from "node:assert/strict";
import test from "node:test";

import viteConfig from "../vite.config.js";

test("Vite dev server proxies API requests to the configured backend", () => {
  const config = viteConfig({ mode: "test" });
  const apiProxy = config.server.proxy["/api"];

  assert.equal(typeof apiProxy.target, "string");
  assert.equal(new URL(apiProxy.target).protocol, "http:");
  assert.equal(apiProxy.changeOrigin, true);
  assert.equal(config.server.port, 5173);
});
