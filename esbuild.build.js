const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const PUBLIC_PATH = "/digit-ui/";

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

async function build() {
  const result = await esbuild.build({
    entryPoints: [path.resolve(__dirname, "src/index.js")],
    bundle: true,
    outdir: path.resolve(__dirname, "build"),
    publicPath: PUBLIC_PATH,
    splitting: true,
    format: "esm",
    chunkNames: "chunks/[name]-[hash]",
    target: ["es2018"],
    minify: true,
    sourcemap: false,
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
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-router-dom": path.resolve(__dirname, "node_modules/react-router-dom"),
      "react-redux": path.resolve(__dirname, "node_modules/react-redux"),
      "react-query": path.resolve(__dirname, "node_modules/react-query"),
    },
    nodePaths: [path.resolve(__dirname, "node_modules")],
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.REACT_APP_STATE_LEVEL_TENANT_ID": '""',
      global: "window",
    },
    plugins: [cdnGlobalsPlugin, svgPlugin],
    logLevel: "info",
  });

  // Generate index.html
  generateHTML(result);

  // Write metafile for bundle analyzers (esbuild-visualizer, source-map-explorer, etc.)
  fs.writeFileSync(
    path.resolve(__dirname, "build/meta.json"),
    JSON.stringify(result.metafile, null, 2)
  );

  // Copy public assets to build
  const publicDir = path.resolve(__dirname, "public");
  const buildDir = path.resolve(__dirname, "build");
  for (const file of fs.readdirSync(publicDir)) {
    if (file === "index.html") continue; // already generated
    const src = path.join(publicDir, file);
    const dest = path.join(buildDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
    }
  }

  console.log("\nBuild complete! Output in build/");
}

function generateHTML(result) {
  const html = fs.readFileSync(
    path.resolve(__dirname, "public/index.html"),
    "utf-8"
  );

  // Outputs are keyed relative to the project root (e.g. "build/index.js",
  // "build/chunks/Module-XXX.css"). Strip the "build/" prefix to get paths
  // relative to outdir, which is what publicPath is mounted at.
  const outdirPrefix = "build/";
  const toPublic = (f) =>
    f.startsWith(outdirPrefix) ? f.slice(outdirPrefix.length) : f;

  // With code splitting, esbuild marks each dynamically-imported module as an
  // "entryPoint" in the metafile. We only want a <script> tag for our real
  // top-level entry (src/index.js) — every other chunk loads via ESM imports
  // from the main module. Inject all CSS as <link> tags (CSS has no dynamic
  // loader in a static HTML shell).
  const mainEntrySource = path.relative(
    process.cwd(),
    path.resolve(__dirname, "src/index.js")
  );
  const entryJS = Object.entries(result.metafile.outputs)
    .filter(
      ([f, o]) => f.endsWith(".js") && o.entryPoint === mainEntrySource
    )
    .map(([f]) => toPublic(f));
  // Dedupe CSS by content hash. With code splitting esbuild emits a CSS file
  // per JS chunk that imports CSS, and multiple chunks often end up with
  // byte-identical outputs (e.g. the shared react-datepicker / leaflet /
  // DIGIT UI styles appear from several import paths). Linking all of them
  // would ship the same bytes multiple times on first load.
  const crypto = require("crypto");
  const seenCssHashes = new Set();
  const cssFiles = [];
  // Sort entry-level CSS (e.g. build/index.css) before chunk CSS so dedup
  // keeps the cleaner filename when two files are byte-identical.
  const cssOutputs = Object.keys(result.metafile.outputs)
    .filter((f) => f.endsWith(".css"))
    .sort((a, b) => {
      const aIsChunk = a.includes("/chunks/");
      const bIsChunk = b.includes("/chunks/");
      if (aIsChunk !== bIsChunk) return aIsChunk ? 1 : -1;
      return a.localeCompare(b);
    });
  for (const f of cssOutputs) {
    const content = fs.readFileSync(path.resolve(__dirname, f));
    const h = crypto.createHash("md5").update(content).digest("hex");
    if (seenCssHashes.has(h)) continue;
    seenCssHashes.add(h);
    cssFiles.push(toPublic(f));
  }

  const scriptTags = entryJS
    .map((f) => `  <script type="module" src="${PUBLIC_PATH}${f}"></script>`)
    .join("\n");
  const linkTags = cssFiles
    .map((f) => `  <link rel="stylesheet" href="${PUBLIC_PATH}${f}">`)
    .join("\n");

  const injected = html
    .replace("</head>", `${linkTags}\n</head>`)
    .replace("</body>", `${scriptTags}\n</body>`);

  fs.mkdirSync(path.resolve(__dirname, "build"), { recursive: true });
  fs.writeFileSync(path.resolve(__dirname, "build/index.html"), injected);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
