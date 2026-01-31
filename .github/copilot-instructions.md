<!-- Copilot instructions for contributors and AI coding agents -->
# Copilot / AI agent guide — ATOZ (Next.js + Keepa queues)

Purpose: give an AI coding agent just-enough, concrete project knowledge to be productive quickly.

- **Quick start (dev & build)**
  - Run dev server: `npm run dev` (uses `next dev`).
  - Build for production: `npm run build` then `npm run start`.
  - Lint: `npm run lint`. Format: `npm run format`.
  - Post-build sitemap: `npm run build` triggers `next-sitemap` via `postbuild`.

- **Where to look first (big picture)**
  - Frontend: `pages/` and `components/` (Next.js, React 19). Primary UI pages: `pages/index.js`, product detail routes (`[slug].jsx`), dashboard pages and admin under `pages/admin`.
  - API & backend: `pages/api/` contains all server routes. Key orchestrators: `pages/api/scanOrAuto.js`, `scan.js`, `scanAuto.js`, `scanManual.js`, `startCategoryScan.js`, and `queueStatus.js`.
  - Queue + workers: queue helpers and workers are in `lib/` and `lib/worker/` (see `lib/keepaQueue.js`, `lib/keepaUtils.js`, `lib/worker/keepaWorker.js`, and `workers/scheduler.js`). API routes enqueue jobs into Bull/BullMQ; workers consume them and persist results.
  - Data stores: MongoDB schemas live in `models/` (e.g., `Products.js`, `Users.js`, `Category.js`); caching and transient data use Redis (see `lib/redis.js`).

- **Important patterns & conventions (project-specific)**
  - Cache-first flow: API routes check Redis cache (`lib/redis.js`) and MongoDB (`lib/mongo.js` / `models/`) before calling external APIs. Follow that order when adding new endpoints.
  - Queue-driven external calls: heavy or rate-limited tasks (Keepa calls, category scans) are queued via `lib/keepaQueue.js`. Do not call Keepa synchronously in API routes for batch/long jobs — enqueue instead.
  - Opportunity scoring: business logic for score calculation is centralized (see `pages/api/calculateOpportunity.js` and README examples). Use that module or mimic its calculation when adding features that surface scores.
  - Data canonicalization: UPC/ASIN caching, variation hash, and dedupe logic live around the shortlisting flow — check `lib/keepaUtils.js` and `models/Products.js` before changing identification logic.

- **Integrations & infra to be aware of**
  - Keepa API (rate-limited) — accessed from `lib/keepaUtils.js` and via the queue in `lib/keepaQueue.js`.
  - Redis: `ioredis` / `@upstash/redis` are used; keys are used for UPC/ASIN cache and queue state.
  - MongoDB: via `mongoose` (`lib/mongo.js` + `models/`).
  - Queues: `bull` / `bullmq` for job queues; workers live under `lib/worker` and `workers/`.
  - Auth: `next-auth` (see `pages/api/NextAuth.js`).
  - Payments / emails: Stripe, PayPal, Nodemailer referenced in `package.json`.

- **Dev & debug tips for agents**
  - To reproduce API behavior locally: run `npm run dev` and call `pages/api/*` routes via `curl` or the browser. For worker behavior, run the worker Node process manually (no npm script provided) — e.g., `node lib/worker/keepaWorker.js` or `node lib/worker.js` in a dev shell and attach inspector: `node --inspect ...`.
  - When touching queue logic, add lightweight unit checks and ensure jobs are enqueued (inspect `queueStatus.js` route during dev).
  - Use the existing ESLint + Prettier configuration; keep format and lint rules consistent.

- **Files to reference when implementing changes**
  - Orchestration & API: `pages/api/scanOrAuto.js`, `scan.js`, `scanAuto.js`, `scanManual.js`, `startCategoryScan.js`.
  - Queue & Keepa helpers: `lib/keepaQueue.js`, `lib/keepaUtils.js`.
  - Worker processes: `lib/worker/keepaWorker.js`, `lib/worker.js`, `workers/scheduler.js`.
  - Persistence & cache: `lib/mongo.js`, `lib/redis.js`, `models/Products.js`, `models/Users.js`.
  - Opportunity logic: `pages/api/calculateOpportunity.js` (and README snippet).

- **What NOT to change without verification**
  - Queue throttling and Keepa retry logic in `lib/keepaQueue.js` — changing this alters rate limits and can exhaust API tokens.
  - Cache key formats in `lib/redis.js` or TTLs, as front-end and scheduler rely on them.

If anything in these notes is unclear or you'd like me to preserve specific text from an internal doc, tell me which parts to expand or merge and I will iterate.
