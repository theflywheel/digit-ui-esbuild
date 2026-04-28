# Infra: deploying the Nairobi overhaul to `/digit-ui-rebuild`

The Nairobi citizen overhaul lands on a **separate route** so the existing `/digit-ui` stays as a safe fallback. Both run on the same naipepea host with identical backend (Kong, MDMS, etc.); only the front-end source tree and esbuild process differ.

```
Browser
   ↓
nginx (443)
   ├─ /digit-ui-rebuild/   → rewrite-strip + sub_filter → esbuild HMR @ :18181  (overhaul branch, /opt/digit-ui-rebuild)
   ├─ /digit-ui            → esbuild HMR @ :18080  (current main, /opt/digit-ui-esbuild)
   ├─ /configurator        → static
   ├─ /grafana/            → :13000
   └─ /  (everything else) → Kong @ :18000
```

**Why the rewrite + sub_filter dance** (this is not in INFRA-DEPLOY templates from upstream DIGIT): `esbuild.dev.js` and `public/index.html` hardcode the `/digit-ui/` prefix in their handlers and asset URLs. Configuring `globalConfigs.contextPath = "digit-ui-rebuild"` only changes how the SPA composes new URLs — it does NOT change what esbuild listens for or what the bundled HTML emits. The fix is two-sided at the nginx layer: rewrite incoming `/digit-ui-rebuild/*` to `/digit-ui/*` for the upstream esbuild, and sub_filter the response so URLs in the HTML/CSS/JS body get rewritten back to `/digit-ui-rebuild/*` for the browser. This avoids touching the upstream esbuild source.

## One-time setup on naipepea

### 1. Clone the overhaul branch into a parallel directory

```bash
ssh egov-nairobi
cd /opt
git clone -b feat/nairobi-overhaul-citizen \
  https://github.com/theflywheel/digit-ui-esbuild.git \
  digit-ui-rebuild
cd digit-ui-rebuild
npm install --legacy-peer-deps
```

> Use `feat/nairobi-overhaul-citizen` until merged; switch to `main` after the PR lands. The `--legacy-peer-deps` flag matches what the existing clone uses. **Branch lives on the `KDwevedi/digit-ui-esbuild` fork until merged** — clone from that origin, not `theflywheel/...`.

### 2. Tweak `globalConfigs.js` for the new context path

The bundle reads `globalConfigs.contextPath` and uses it for asset URLs and React Router base. We need a separate config for `/digit-ui-rebuild`.

```bash
# On naipepea, create a sibling config file
cp /opt/digit/nginx/globalConfigs.js /opt/digit/nginx/globalConfigs.rebuild.js
sed -i 's|var contextPath = "digit-ui";|var contextPath = "digit-ui-rebuild";|' \
  /opt/digit/nginx/globalConfigs.rebuild.js
```

> Verify the `STATE_LEVEL_TENANT_ID` (`ke.nairobi`), `MAP_CENTER`, etc. stay untouched. Only `contextPath` changes.

### 3. Start a parallel esbuild HMR session

```bash
sudo tmux new-session -d -s esbuild-rebuild \
  'cd /opt/digit-ui-rebuild && \
   PORT=18181 \
   GLOBAL_CONFIGS=/opt/digit/nginx/globalConfigs.rebuild.js \
   node esbuild.dev.js \
   2>&1 | tee /var/log/esbuild-rebuild.log'
```

> **Port 18181, not 18081.** Docker holds 18081, 18082, 18084, 18086 on the existing naipepea host. 18181 is free and out of the docker-proxy range so future Docker churn won't collide.

Verify with `sudo tmux ls` and `curl -sS localhost:18181/digit-ui/ | head -c 200` (note: hit esbuild on its native `/digit-ui/` path locally — the `/digit-ui-rebuild/` rewrite happens at nginx, not in esbuild).

### 4. Add the nginx location block

Edit `/etc/nginx/sites-available/naipepea.digit.org` (or the equivalent path on this server). Add a new `location` block ABOVE the existing `/digit-ui` block so the path matches before the more general one:

```nginx
location /digit-ui-rebuild/ {
    rewrite ^/digit-ui-rebuild/(.*)$ /digit-ui/$1 break;
    proxy_pass         http://127.0.0.1:18181;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_set_header   Accept-Encoding   "";
    proxy_read_timeout 86400s;
    proxy_buffering    off;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade           $http_upgrade;
    proxy_set_header   Connection        "upgrade";

    sub_filter '/digit-ui/' '/digit-ui-rebuild/';
    sub_filter_once off;
    sub_filter_types text/css application/javascript application/json;
}
```

Three pieces:
- **`rewrite ... break`** strips the `/digit-ui-rebuild` prefix so the upstream esbuild (which only knows about `/digit-ui/`) sees a path it recognises.
- **`Accept-Encoding ""`** disables upstream gzip — `sub_filter` only operates on plain bodies.
- **`sub_filter`** rewrites every `/digit-ui/` literal back to `/digit-ui-rebuild/` in HTML / CSS / JS / JSON responses so the browser's subsequent requests (asset URLs, fetch calls, router base) all stay on the rebuild route.

Verify config + reload:

```bash
sudo nginx -t && sudo nginx -s reload
```

### 5. Smoke check

```bash
curl -sS https://naipepea.digit.org/digit-ui-rebuild/ | grep -E 'href|src' | head
# expected: every href/src starts with /digit-ui-rebuild/ (NOT /digit-ui/)

curl -sS https://naipepea.digit.org/digit-ui-rebuild/globalConfigs.js | grep contextPath
# expected:   var contextPath = "digit-ui-rebuild";

curl -sS -o /dev/null -w "%{http_code}\n" https://naipepea.digit.org/digit-ui-rebuild/vendor/digit-ui-css.css
# expected: 200
```

In a browser, `https://naipepea.digit.org/digit-ui-rebuild/citizen/pgr/_showcase` should render the Phase 2 atom showcase (visible after Phase 2 + this PR's showcase route lands).

> Note: the showcase is mounted inside the PGR citizen module (which mounts at `/citizen/${moduleCode.toLowerCase()}` per `packages/modules/core/src/pages/citizen/index.js:82`, and the PGR module declares `moduleCode = "PGR"` in `packages/modules/pgr/src/Module.js:28`). The mount path is therefore `/citizen/pgr`, NOT `/citizen/complaints` — the latter is just the route within PGR for the complaints list, distinct from the module mount itself.

## Day-to-day workflow

### Pull updates

```bash
ssh egov-nairobi "cd /opt/digit-ui-rebuild && git pull"
# esbuild watches; auto-rebuilds. Browser refresh shows the change.
```

### Switch branches

```bash
ssh egov-nairobi "cd /opt/digit-ui-rebuild && git checkout <branch> && git pull"
# tmux kill-session -t esbuild-rebuild  &&  re-run the start command from §3
```

### Stop the rebuild route (and fall back to /digit-ui only)

```bash
ssh egov-nairobi "tmux kill-session -t esbuild-rebuild"
# nginx still proxies /digit-ui-rebuild → :18081, but :18081 is now empty;
# requests will 502. Either remove the location block, or leave it (harmless
# while the rebuild track is paused).
```

## Bomet considerations

Bomet (`bometfeedbackhub.digit.org`) does NOT need `/digit-ui-rebuild`. The Nairobi overhaul is scoped to `ke.nairobi`. Bomet keeps running on `/digit-ui` only, with its own MDMS theme.

If we later want to test the overhaul on Bomet (e.g. to confirm we haven't accidentally broken something Bomet uses), we can clone the overhaul branch on Bomet too — but every commit should be pre-verified against Bomet by checking `colorconstants.js`, Tailwind primary, and the still-unchanged DIGIT atoms (Button.js, Tag.js, etc.) for diffs.

## Rollback

If the overhaul causes a regression on `/digit-ui-rebuild`:

1. The original `/digit-ui` is unaffected — citizens who hit the canonical URL are fine.
2. Stop the rebuild esbuild session (`tmux kill-session -t esbuild-rebuild`).
3. Optional: redirect `/digit-ui-rebuild` to `/digit-ui` in nginx until the regression is fixed.

If a Phase N commit on `feat/nairobi-overhaul-citizen` is the suspect:

```bash
ssh egov-nairobi "cd /opt/digit-ui-rebuild && git checkout <previous-good-sha>"
# restart esbuild session
```

## Open questions

- Should `/digit-ui-rebuild` use a separate logging stream (`/var/log/esbuild-rebuild.log`) vs share with `/digit-ui`? Above proposes separate.
- Should the rebuild build artifacts share `/digit-ui/vendor/*` static assets, or keep its own under `/digit-ui-rebuild/vendor/*`? Currently the latter (esbuild serves its own bundle paths).
- When does `/digit-ui-rebuild` graduate to `/digit-ui`? Probably after Phases 4-7 land and a steerco approves.
