# /data grouped table header fix report

## Reproduction / inspection

- Inspected the current `/data` table implementation in `web/app/(public)/data/page.tsx`; the grouped TanStack `columns` definition already represented the intended hierarchy.
- Inspected `node_modules/@bayareametro/mtc-ui/dist/Table-CB0e2YeV.d.ts` and the installed built output for the available `DataTable.Table` extension points.
- Reproduced the buggy header shape with the existing Playwright `/data` test harness after adding a focused assertion: the default mtc-ui header rendering only emitted the top grouped header on row 1, metric group headers on row 2, and standalone leaf headers on row 3 instead of row-spanning the standalone columns.

## Root cause

The installed `@bayareametro/mtc-ui` `DataTable.Table` default header renderer iterates every TanStack header group row and renders each header directly. It applies TanStack `colSpan`, but does not produce the desired row-spanned standalone headers for this three-level grouped table and does not hide placeholder/duplicate standalone entries in the intended places. The shared package cannot be modified for this task, so the fix is page-local.

## Changed files

- `web/app/(public)/data/page.tsx`
  - Preserved the existing grouped `columns` array, accessors, formatters, data fetching, and page layout.
  - Added a page-local `renderGroupedHeader` that preserves semantic `<th>` output and applies TanStack `colSpan`/computed `rowSpan` while returning no visible cell for duplicate placeholder cases.
  - Added a page-local `renderGroupedTableHead` using the DataTable API extension point so the standalone `Population Segment`, `Persons`, and `Vehicle miles traveled per capita` headers render once in row 1 with `rowSpan=3`; metric groups render in row 2; VMT/% leaves render in row 3.
- `web/test/data.spec.ts`
  - Added a focused Playwright regression test asserting exactly three header rows, the intended labels by row, and key `rowspan`/`colspan` attributes.

## Tests / commands and outputs

- `CI=1 npm test --workspace web -- data.spec.ts`
  - Result: passed.
  - Output summary: `3 passed (2.3s)` after the regression assertion verified the browser-rendered `/data` header structure.
- `npm run build --workspace web`
  - Result: passed.
  - Output summary: Next build completed and prerendered `/data`; existing Sass deprecation warnings from Bootstrap/mtc-ui styles were emitted.

## Browser verification

The repository already has Playwright configured for browser verification against `http://localhost:3000`. Running `CI=1 npm test --workspace web -- data.spec.ts` started the Next dev server, loaded `/data`, mocked the `/api/data/*` responses, and verified:

- exactly three `<thead> tr` rows;
- first row labels: `Population Segment`, `Persons`, `Non-commercial Passenger Vehicle Miles Traveled`, `Vehicle miles traveled per capita`;
- second row labels: `Entirely within`, `Partially in`, `Entirely outside`, `Total`;
- third row labels: `VMT`, `%`, `VMT`, `%`, `VMT`, `%`, `VMT`, `%`;
- top standalone headers have `rowspan="3"`, and grouped VMT headers use the expected `colspan` values.

## Residual concerns

- The custom `renderGroupedTableHead` is intentionally page-local and tailored to the current `/data` grouped column structure; if the column hierarchy changes, this renderer/test should be updated together.
- Build/test output still includes pre-existing Sass deprecation warnings from Bootstrap/mtc-ui imports; not related to this fix.
- The worktree contains unrelated dirty files that were preserved and not staged.

## Fix report - 2026-08-28

Chosen DataTable hook: kept renderTableHead but reconstructed it with mtc-ui default-equivalent header props (aria-sort, th/thead classes, pinned class) and reused renderGroupedHeader for grouped cells, so three-row structure remains while preserving styling/accessibility behavior feasible through installed extension points.

Commands run:
1. CI=1 npm test --workspace web -- data.spec.ts
Result: passed (3/3 Chromium tests). Output included Sass deprecation warnings from bootstrap/mtc-ui.

2. npm run build --workspace web
Result: passed. Output included Sass deprecation warnings from bootstrap/mtc-ui and successful static route optimization for /, /about, /data, /feedback, /map.

Combined final command output saved by tool at: /Users/trodriguez/.local/share/opencode/tool-output/tool_04a342da200128hfPlbYKvbMqm
