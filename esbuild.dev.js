const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const http = require("http");

const PORT = parseInt(process.env.PORT || "18080", 10);
const PUBLIC_PATH = "/digit-ui/";
const HOST = "0.0.0.0";

// Vercel-style timestamped logger: [HH:MM:SS.mmm] prefix on every line
const ts = () => {
  const d = new Date();
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}]`;
};
const log = (...args) => console.log(ts(), ...args);
const logErr = (...args) => console.error(ts(), ...args);

// Plugin: map CDN-loaded globals so require("xlsx") -> window.XLSX etc.
const cdnGlobalsPlugin = {
  name: "cdn-globals",
  setup(build) {
    // Match xlsx, xlsx/dist/xlsx.full.min, etc.
    build.onResolve({ filter: /^xlsx(\/.*)?$/ }, () => ({
      path: "xlsx",
      namespace: "cdn-global",
    }));
    build.onLoad({ filter: /.*/, namespace: "cdn-global" }, () => ({
      contents: `module.exports = window.XLSX;`,
      loader: "js",
    }));
  },
};

// Plugin: handle CRA-style SVG imports (import { ReactComponent } from './file.svg')
const svgPlugin = {
  name: "svg-component",
  setup(build) {
    build.onLoad({ filter: /\.svg$/ }, async (args) => {
      const svg = fs.readFileSync(args.path, "utf-8");
      const escaped = svg.replace(/`/g, "\\`").replace(/\$/g, "\\$");
      return {
        contents: `
          import React from 'react';
          var svgContent = \`${escaped}\`;
          export var ReactComponent = function(props) {
            return React.createElement('span', Object.assign({}, props, {
              dangerouslySetInnerHTML: { __html: svgContent }
            }));
          };
          export default "data:image/svg+xml," + encodeURIComponent(svgContent);
        `,
        loader: "jsx",
      };
    });
  },
};

// Warnings from upstream digit-ui-components we can't fix here — silence them.
const SUPPRESSED_WARNING_IDS = new Set(["duplicate-object-key", "direct-eval"]);

// Live-reload: inject a tiny EventSource client that listens for rebuild events.
// Also prints Vercel-style timestamped build logs with rebuild duration.
const liveReloadPlugin = {
  name: "live-reload",
  setup(build) {
    let startedAt = 0;
    let firstBuild = true;
    build.onStart(() => {
      startedAt = Date.now();
      if (!firstBuild) log("○ Rebuilding…");
    });
    build.onEnd(async (result) => {
      const ms = Date.now() - startedAt;
      const errors = result.errors;
      const warnings = result.warnings.filter((w) => !SUPPRESSED_WARNING_IDS.has(w.id));

      if (warnings.length) {
        const formatted = await esbuild.formatMessages(warnings, {
          kind: "warning",
          color: true,
          terminalWidth: process.stdout.columns || 100,
        });
        for (const line of formatted) process.stderr.write(line);
      }
      if (errors.length) {
        const formatted = await esbuild.formatMessages(errors, {
          kind: "error",
          color: true,
          terminalWidth: process.stdout.columns || 100,
        });
        for (const line of formatted) process.stderr.write(line);
      }

      if (errors.length === 0) {
        log(
          `✓ ${firstBuild ? "Compiled" : "Rebuilt"} in ${ms}ms` +
            (warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? "s" : ""})` : "")
        );
        clients.forEach((res) => res.write("data: reload\n\n"));
      } else {
        logErr(`✗ Build failed in ${ms}ms — ${errors.length} error${errors.length > 1 ? "s" : ""}`);
      }
      firstBuild = false;
    });
  },
};

const clients = new Set();

async function start() {
  // Build context with watch mode
  const ctx = await esbuild.context({
    entryPoints: [path.resolve(__dirname, "src/index.js")],
    bundle: true,
    outdir: path.resolve(__dirname, "build"),
    publicPath: PUBLIC_PATH,
    splitting: false,
    format: "iife",
    target: ["es2018"],
    minify: false,
    sourcemap: true,
    metafile: true,
    treeShaking: true,
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    loader: {
      ".js": "jsx",
      ".css": "css",
      ".png": "file",
      ".jpg": "file",
      ".jpeg": "file",
      ".gif": "file",
      ".svg": "file",
    },
    alias: {
      // Resolve ALL @egovernments packages from local packages/ source
      "@egovernments/digit-ui-module-core": path.resolve(
        __dirname,
        "packages/modules/core/src/Module.js"
      ),
      // CCRS PGR from products/ overrides upstream packages/modules/pgr
      "@egovernments/digit-ui-module-pgr": path.resolve(
        __dirname,
        "products/pgr/src/Module.js"
      ),
      "@egovernments/digit-ui-module-hrms": path.resolve(
        __dirname,
        "packages/modules/hrms/src/Module.js"
      ),
      "@egovernments/digit-ui-module-utilities": path.resolve(
        __dirname,
        "packages/modules/utilities/src/Module.js"
      ),
      "@egovernments/digit-ui-module-workbench": path.resolve(
        __dirname,
        "packages/modules/workbench/src/Module.js"
      ),
      "@egovernments/digit-ui-module-common": path.resolve(
        __dirname,
        "packages/modules/common/src/Module.js"
      ),
      "@egovernments/digit-ui-libraries": path.resolve(
        __dirname,
        "packages/libraries/src/index.js"
      ),
      "@egovernments/digit-ui-react-components": path.resolve(
        __dirname,
        "packages/react-components/src/index.js"
      ),
      "@egovernments/digit-ui-components": path.resolve(
        __dirname,
        "packages/digit-ui-components/src/index.js"
      ),
      "@egovernments/digit-ui-svg-components": path.resolve(
        __dirname,
        "packages/svg-components/src/index.js"
      ),
      // Force single instance of shared packages
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-router-dom": path.resolve(__dirname, "node_modules/react-router-dom"),
      "react-redux": path.resolve(__dirname, "node_modules/react-redux"),
      "react-query": path.resolve(__dirname, "node_modules/react-query"),
    },
    nodePaths: [path.resolve(__dirname, "node_modules")],
    define: {
      "process.env.NODE_ENV": '"development"',
      "process.env.REACT_APP_STATE_LEVEL_TENANT_ID": '""',
      global: "window",
    },
    plugins: [cdnGlobalsPlugin, svgPlugin, liveReloadPlugin],
    logLevel: "silent",
  });

  // Initial build
  const result = await ctx.rebuild();

  // Generate index.html from public/index.html with injected bundles
  generateHTML(result);

  // Watch for file changes
  await ctx.watch();
  log("◐ Watching for changes…");

  // Serve static files + live-reload SSE endpoint + API proxy
  const buildDir = path.resolve(__dirname, "build");
  const publicDir = path.resolve(__dirname, "public");

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // SSE endpoint for live reload
    if (pathname === "/digit-ui/__esbuild_live_reload") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    // Serve globalConfigs.js from public/
    if (pathname === "/digit-ui/globalConfigs.js") {
      const gcPath = path.resolve(__dirname, "public/globalConfigs.js");
      if (fs.existsSync(gcPath)) {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(fs.readFileSync(gcPath));
      } else {
        res.writeHead(404);
        res.end("globalConfigs.js not found");
      }
      return;
    }

    // Proxy API calls to Kong (port 18000) or token-exchange (port 18200)
    const apiPrefixes = [
      "/mdms-v2/", "/localization/", "/egov-location/", "/egov-workflow-v2/",
      "/pgr-services/", "/filestore/", "/egov-hrms/", "/user/",
      "/user-otp/", "/boundary-service/", "/egov-idgen/", "/access/", "/common-persist/",
      "/egov-bndry-mgmnt/", "/inbox/",
    ];
    const kcPrefixes = ["/realms/", "/token-exchange/", "/register", "/check-email"];

    const isApi = apiPrefixes.some((p) => pathname.startsWith(p));
    const isKc = kcPrefixes.some((p) => pathname.startsWith(p));

    if (isApi || isKc) {
      const target = isKc ? 18200 : 18000;
      const proxyReq = http.request(
        {
          hostname: "127.0.0.1",
          port: target,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: req.headers.host },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );
      proxyReq.on("error", (err) => {
        logErr(`Proxy error: ${err.message}`);
        res.writeHead(502);
        res.end("Bad Gateway");
      });
      req.pipe(proxyReq);
      return;
    }

    // Static file serving from build dir (strip /digit-ui/ prefix)
    let filePath;
    if (pathname.startsWith("/digit-ui/")) {
      const subPath = pathname.slice("/digit-ui/".length);
      filePath = path.join(buildDir, subPath);
    } else if (pathname === "/digit-ui" || pathname === "/") {
      filePath = path.join(buildDir, "index.html");
    } else {
      filePath = path.join(buildDir, pathname);
    }

    // Try to serve the file
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
      };
      res.writeHead(200, {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(fs.readFileSync(filePath));
      return;
    }

    // SPA fallback: serve index.html for any unmatched /digit-ui/* route
    if (pathname.startsWith("/digit-ui")) {
      const indexPath = path.join(buildDir, "index.html");
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-cache" });
        res.end(fs.readFileSync(indexPath));
        return;
      }
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  server.listen(PORT, HOST, () => {
    log(`▲ Ready — http://${HOST}:${PORT}/digit-ui/`);
    log(`  Live reload enabled — editing any source file triggers rebuild + refresh`);
  });
}

function generateHTML(result) {
  const html = fs.readFileSync(
    path.resolve(__dirname, "public/index.html"),
    "utf-8"
  );

  const outputs = Object.keys(result.metafile.outputs);
  const entryJS = outputs
    .filter((f) => f.endsWith(".js") && result.metafile.outputs[f].entryPoint)
    .map((f) => path.basename(f));
  const cssFiles = outputs
    .filter((f) => f.endsWith(".css"))
    .map((f) => path.basename(f));

  const scriptTags = entryJS
    .map((f) => `  <script src="${PUBLIC_PATH}${f}"></script>`)
    .join("\n");
  const linkTags = cssFiles
    .map((f) => `  <link rel="stylesheet" href="${PUBLIC_PATH}${f}">`)
    .join("\n");

  // Inject live-reload client script (only connects on localhost/internal networks)
  const liveReloadScript = `
  <script>
    (function() {
      var h = location.hostname;
      if (h !== 'localhost' && h !== '127.0.0.1' && !h.startsWith('192.168.') && !h.startsWith('10.')) return;
      var source = new EventSource('/digit-ui/__esbuild_live_reload');
      source.onmessage = function() { window.location.reload(); };
      source.onerror = function() { source.close(); };
    })();
  </script>`;

  const injected = html
    .replace("</head>", `${linkTags}\n</head>`)
    .replace("</body>", `${scriptTags}\n${liveReloadScript}\n</body>`);

  fs.mkdirSync(path.resolve(__dirname, "build"), { recursive: true });
  fs.writeFileSync(path.resolve(__dirname, "build/index.html"), injected);
}

start().catch((err) => {
  logErr("✗ Fatal:", err);
  process.exit(1);
});
