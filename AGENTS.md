# AGENTS.md

## Project

КАИСТ (kaist.pro) — offline-first React 19 + Vite 8 PWA showing KNITU-KAI university schedules. No backend code in this repo; the app only reads a remote HTTP API and deploys static files to Yandex Object Storage.

## Commands

```bash
npm install
npm run dev          # Vite dev server
npm run lint         # oxlint (not ESLint)
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run build        # tsc -b && vite build
```

- Single test file: `npx vitest run src/utils/__tests__/date.test.ts`
- Single test by name: `npx vitest run -t "test name"`
- Before finishing, run `npm run lint`, `npm run typecheck`, `npm run test`.
- CI (`.github/workflows/yc-deploy.yml`) runs only `npm ci && npm run build` on `main`, then uploads `dist` to S3. Tests/lint do not run in CI.

## Architecture

- Boot flow is in `src/main.tsx`: `initLogger()` → URL reset handling → SW update gate → render. Routing is `HashRouter` with `/`, `/students`, `/teachers`, `/exams` in `src/App.tsx`.
- All data is read-only HTTP: `src/api/data.ts` fetches `/data/schedule`, `/data/exams`, `/data/students` (gzip), `src/api/hash.ts` fetches `/api/hash` for cache invalidation. `API_BASE` is hardcoded in `src/config.ts` to production, so `npm run dev` reads live data.
- Offline flow (`src/hooks/useBootstrap.ts`): load IndexedDB cache first, then hashes, then refetch only changed sections. An empty `groups` response is treated as an error and must not overwrite cache — preserve this when changing bootstrap/cache logic.
- Zustand persistence is split: only `groups`, `selectedGroup`, `theme` go to localStorage (persist `version: 9`); schedule/exams/students caches go to IndexedDB via localforage in `src/hooks/useStore.ts`. Any persisted-shape change needs a version bump + `migrate` branch + update `resetAll`/`src/utils/resetApp.ts`.
- Every network call must accept `AbortSignal`; use `isCancelError` to ignore aborts/timeouts. Request timeout is 15s (`REQUEST_TIMEOUT_MS`), bootstrap 30s.
- PWA update flow (`src/utils/swUpdate.ts`) is intentionally hybrid for iOS: SW first, then build-version check + force reload, with a loop guard. Do not simplify it without device testing.
- `APP_VERSION` comes from `__BUILD_TIME__` generated in `vite.config.ts` at build time. Never edit it manually; SW is disabled in dev.
- `base: './'` + `HashRouter` are required for static S3 hosting. Do not switch to `BrowserRouter`.
- Ads are AdFox: placements in `src/config.ts`, widget in `src/components/AdBanner.tsx`; loader in `index.html` is production-only unless `?with-ads` (legacy `?ads=1` also works). Invariants are documented in `docs/ads-technical.md`; read it before touching ads.

## Conventions

- UI text, docs, and comments are Russian; identifiers are English. Commit messages are conventional English (`feat(...)`, `fix(...)`, `test(...)`, `docs(...)`).
- Tests live beside code in `src/**/__tests__/*.test.{ts,tsx}`. Vitest uses jsdom + Testing Library; `vitest.setup.ts` mocks `matchMedia`/`ResizeObserver`, and `virtual:pwa-register` is aliased to `src/__mocks__/pwaRegister.ts`.
- Vitest defines the `@ -> src` alias, but TS/Vite do not; use relative imports in app code.
- Styling is plain CSS in `src/styles/*.css`, imported per component; there are no CSS modules.
- `tsconfig` is strict with `noUnusedLocals`/`noUnusedParameters`; `npm run build` runs `tsc -b`, so unused symbols fail the build.
- `dump.md` is an untracked, generated full-repo dump; ignore it as a source file.
