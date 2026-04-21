# CLAUDE.md — digit-ui-esbuild

Repo-local overrides. These apply **in addition to** (and take precedence over) `~/CLAUDE.md`.

## Ticket tracking override

Global `~/CLAUDE.md` tracks work in local files only (`~/TODO.md`, `~/outputs/TASK-XXX-*.md`, `~/outputs/outputs.csv`). For this repository, also mirror every ticket to GitHub Issues.

**Rule**: When a task is created for work in this repo (new TASK-XXX entry in `~/TODO.md` or `~/outputs/TASK-XXX-*.md`), additionally create a GitHub Issue on `theflywheel/digit-ui-esbuild` and back-link both ways:

1. Create the local TASK-XXX files as usual (per `~/CLAUDE.md` workflow).
2. Create a GitHub Issue with `gh issue create` on this repo (`theflywheel/digit-ui-esbuild`):
   - Title: short, action-oriented (not `TASK-XXX: …` — the task ID belongs in the body).
   - Body: starts with `Internal ticket: **TASK-XXX**`, then the goal, design decisions, acceptance criteria, out-of-scope, and open questions sections from the local ticket. Mirror key content; don't just link.
   - Label: `enhancement` for features, `bug` for fixes.
   - Reference blockers/follow-ups with `#N` (e.g., `Blocked by: #1`).
3. Back-link in both directions:
   - Add `| GitHub Issue | [theflywheel/digit-ui-esbuild#N](https://…/issues/N) |` to the local ticket's Metadata table.
   - Add `- **GitHub**: [theflywheel/digit-ui-esbuild#N](…)` to the `~/TODO.md` entry.

**Why**: internal ticket docs capture full synthesis + source material; GitHub Issues are the interface collaborators outside this machine actually see. Both stay in sync.

**When this rule does NOT apply**: research tasks, infrastructure tasks, or tickets scoped to other repos — those follow the global `~/CLAUDE.md` convention (local files only).

## Deployed Environments

The DIGIT UI is deployed to two production environments. Both are in the Hetzner VPC and managed via Ansible from `/root/code/tilt-demo/ansible/`.

| Environment | Domain | VPC IP | Tenant | Deploy Script |
|-------------|--------|--------|--------|---------------|
| **Bomet** | `bometfeedbackhub.digit.org` | `10.0.0.2` | `ke.bomet` | `ansible/deploy-bomet.sh` |
| **Nairobi** | `naipepea.digit.org` | `10.0.0.5` | `ke.nairobi` | `ansible/deploy-nairobi.sh` |

### URLs

| | Bomet | Nairobi |
|---|---|---|
| **UI** | https://bometfeedbackhub.digit.org/digit-ui/ | https://naipepea.digit.org/digit-ui/ |
| **Configurator** | https://bometfeedbackhub.digit.org/configurator/ | https://naipepea.digit.org/configurator/ |

Each server runs a **fully independent DIGIT stack** with its own MCP (`localhost:13101`), Jupyter (`localhost:18888`), and MDMS database. Changes to this dev server's MDMS do NOT propagate — you must seed data on each server independently.

**SSH**: `ssh egov-bomet` / `ssh egov-nairobi` (aliases in `~/.ssh/config`)

### Deploying UI changes (production build)

After building (`node esbuild.build.js`), the built assets need to be deployed to the target servers. The Ansible playbook copies the digit-ui build into the Docker container on each server. To redeploy:

```bash
cd /root/code/tilt-demo/ansible
./deploy-bomet.sh    # Bomet (10.0.0.2)
./deploy-nairobi.sh  # Nairobi (10.0.0.5)
```

### Hot Reload (HMR) Development Mode

Each server has esbuild HMR running directly at `/opt/digit-ui-esbuild/`. This replaces the static `digit-ui` Docker container — nginx proxies to esbuild on port 18080 instead.

**Architecture**: `Browser → nginx (443) → esbuild.dev.js (18080) → Kong API (18000) / Keycloak (18200)`

**Current state**: HMR is running in tmux session `esbuild` on both servers.

#### Making code changes (live reload)

```bash
# Edit files directly on the server
ssh egov-bomet "vim /opt/digit-ui-esbuild/src/some-file.js"

# Or push changes via git and pull on the server
git push origin main
ssh egov-bomet "cd /opt/digit-ui-esbuild && git pull"
ssh egov-nairobi "cd /opt/digit-ui-esbuild && git pull"
# esbuild watches for file changes — browser auto-refreshes
```

#### Managing HMR sessions

```bash
# Check if esbuild is running
ssh egov-bomet "tmux has-session -t esbuild 2>/dev/null && echo 'running' || echo 'stopped'"

# View live build output
ssh egov-bomet "tmux attach -t esbuild"
# (Detach with Ctrl-B, D)

# View recent log
ssh egov-bomet "tail -20 /var/log/esbuild.log"

# Restart esbuild (e.g. after npm install)
ssh egov-bomet "tmux kill-session -t esbuild; cd /opt/digit-ui-esbuild && tmux new-session -d -s esbuild 'PORT=18080 node esbuild.dev.js 2>&1 | tee /var/log/esbuild.log'"
```

#### Switching back to production mode

```bash
# Stop esbuild, restart Docker container
ssh egov-bomet "tmux kill-session -t esbuild; docker start digit-ui"
```

#### Switching to HMR mode

```bash
# Stop Docker container, start esbuild
ssh egov-bomet "docker stop digit-ui; cd /opt/digit-ui-esbuild && git pull && tmux new-session -d -s esbuild 'PORT=18080 node esbuild.dev.js 2>&1 | tee /var/log/esbuild.log'"
```

#### Deploying to both servers at once

```bash
# Push code, pull on both servers (esbuild auto-rebuilds)
git push origin main
ssh egov-bomet "cd /opt/digit-ui-esbuild && git pull"
ssh egov-nairobi "cd /opt/digit-ui-esbuild && git pull"
```
