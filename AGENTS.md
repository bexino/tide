# AGENTS.md

Static scheduling app (智慧排班): a 5-step wizard that generates duty rosters where every person works an exactly equal number of shifts. Plain HTML + vanilla JS — no package.json, no build, no linter, no test runner.

## Running & verifying

- Just open `index.html` in a browser (no server or build needed). Tailwind loads from CDN at runtime (`@tailwindcss/browser@4`), so styling requires network access and is never compiled/purged locally.
- `js/scheduler.js` has a `module.exports` guard at the bottom, so its pure logic can be sanity-checked in Node without any test framework, e.g.:
  `node -e "console.log(require('./js/scheduler.js').calculateCycle(22,4))"`

## Structure & conventions

- `js/scheduler.js` = pure logic, no DOM. `js/app.js` = all DOM/state/UI and must load after it; script order in `index.html` matters.
- Functions called from inline `onclick=` attributes (`goToStep`, `handleCalendarCellClick`, `removeHolidayTag`, `removeManualWorkdayTag`, `setTableSearch` — in index.html and in JS-generated markup) must stay global. Do not wrap app.js in modules/IIFEs.
- New UI elements: add the ID in `index.html` and register it in the `elements` map at the top of `app.js` — elements are looked up once at script load (scripts sit at end of `<body>`; moving them breaks this).
- All UI text and code comments are Simplified Chinese (`lang="zh-CN"`); keep that convention.
- Dates are keyed as local-time `YYYY-MM-DD` strings via `formatDate`/`parseDate` (used as Set/Map keys for holidays and makeup workdays). Don't introduce `toISOString()` — the UTC shift corrupts those keys.

## Gotchas

- `generateStandaloneHtml` in `app.js` exports a fully self-contained HTML file with its own inlined CSS/JS that duplicates the table/cards view, search, and CSV-export logic (no Tailwind). Behavior changes to search/filter/CSV must be mirrored there too.
- The sample roster is 22 hardcoded names in `SAMPLE_NAMES_TEXT`. Comments/toasts referencing "docs/1.md" or "49 人" are stale — no such file exists.
- Core invariant: `calculateCycle(N, K)` builds the minimal no-remainder cycle (`totalDays = N/gcd(N,K)`, `shiftsPerPerson = K/gcd(N,K)`), and each person appears exactly `shiftsPerPerson` times. Step-2 Markdown editing (`parseAndValidateAssignmentsMarkdown`) rejects any edit that changes day count, per-day headcount, roster membership, or that equality.
