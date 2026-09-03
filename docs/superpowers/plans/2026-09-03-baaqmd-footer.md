# BAAQMD Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current MTC/ABAG footer with a responsive BAAQMD-style footer matching the supplied reference image.

**Architecture:** Keep the shared `PageFooter` integration point in the page shell, but replace its content with three responsive sections for contact information, stay-informed links, and Air District initiatives. Reuse the existing local white logo and initiative images, and add page-local styling rather than changing global layout behavior.

**Tech Stack:** Next.js 16, React 19, `@bayareametro/mtc-ui`, Font Awesome, CSS Modules, Playwright.

## Global Constraints

- Preserve the existing `PageFooter` export and its caller in the shared page frame.
- Use local assets from `web/public/images/` when available; do not fetch duplicate assets from the BAAQMD website.
- Keep all external links explicit, keyboard accessible, and visually consistent with the reference.
- Keep the footer responsive: three columns on wide screens and a readable stacked layout on narrow screens.
- Do not modify unrelated routes, navigation, page content, or pre-existing dirty/untracked files.
- Verify the footer in a real browser at desktop and mobile widths.

---

### Task 1: Add Footer Regression Coverage

**Files:**
- Modify: `web/test/home.spec.ts`

**Interfaces:**
- Consumes: The shared footer rendered by the home page through `PageFrame`.
- Produces: Browser assertions covering the BAAQMD footer identity, sections, key links, and local images.

- [ ] **Step 1: Add a failing footer test**

Add a test that visits `/` and asserts the footer contains:

```ts
await expect(page.getByRole('contentinfo')).toContainText('Bay Area Air District');
await expect(page.getByRole('contentinfo')).toContainText('Stay Informed');
await expect(page.getByRole('contentinfo')).toContainText('Air District Initiatives');
await expect(page.getByRole('contentinfo').locator('img[src="/images/HorizLogo-WHT.png"]')).toHaveCount(1);
await expect(page.getByRole('contentinfo').locator('img[src="/images/spare_the_air.png"]')).toHaveCount(1);
```

Also assert the Directions, Subscribe, and phone links are present by accessible name or href.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
npm run test:e2e --workspace web -- home.spec.ts
```

Expected: the new footer assertions fail because the current footer contains MTC/ABAG content instead of the BAAQMD content.

- [ ] **Step 3: Commit the regression test**

```bash
git add web/test/home.spec.ts
git commit -m "test: specify baaqmd footer content"
```

### Task 2: Implement the BAAQMD Footer

**Files:**
- Modify: `web/components/shell/page-footer.tsx`
- Create: `web/components/shell/page-footer.module.scss`

**Interfaces:**
- Consumes: Existing `PageFooter` render contract from `web/components/shell/page-frame.tsx`; local assets `/images/HorizLogo-WHT.png`, `/images/spare_the_air.png`, and `/images/no_burn.png`.
- Produces: A shared `PageFooter` component rendering a semantic `<footer>` with BAAQMD contact, stay-informed, and initiative content.

- [ ] **Step 1: Replace the footer markup with the three reference sections**

Use the existing `StandardFooter.Root`/`Container` primitives if they provide the needed semantic footer and layout behavior; otherwise use a semantic `<footer>` with a page-local container. Render:

- A white `HorizLogo-WHT.png` image linked to `https://www.baaqmd.gov/` with descriptive alt text.
- Contact text for `375 Beale Street, Suite 600`, `San Francisco, CA 94105`, and `415.749.5000 | 1.800.HELP AIR`.
- A Directions link to the BAAQMD directions/location page with a Font Awesome location icon and accessible label.
- A Stay Informed section with X/Twitter, Facebook, YouTube, and Instagram links using the existing Font Awesome package, plus a Subscribe link.
- An Air District Initiatives section with `spare_the_air.png`, the `877-4NO-BURN` text, and `no_burn.png` where it matches the supplied reference.

Keep all image paths rooted at `/images/` so they resolve from every public route.

- [ ] **Step 2: Add responsive page-local styles**

Style the footer with a dark teal background, a subtle texture/gradient treatment, white/light-blue text, reference-like spacing, and three wide-screen columns. At mobile widths, stack sections vertically, preserve readable line lengths, and keep icon/link hit areas accessible. Ensure initiative images scale within their column without distortion or horizontal overflow.

- [ ] **Step 3: Run the focused test and verify it passes**

Run:

```bash
npm run test:e2e --workspace web -- home.spec.ts
```

Expected: all home/footer tests pass.

- [ ] **Step 4: Commit the footer implementation**

```bash
git add web/components/shell/page-footer.tsx web/components/shell/page-footer.module.scss
git commit -m "feat: redesign footer for bay area air district"
```

### Task 3: Verify Responsive Footer Behavior

**Files:**
- Test: `web/test/home.spec.ts`
- Verify: `web/components/shell/page-footer.tsx`, `web/components/shell/page-footer.module.scss`

**Interfaces:**
- Consumes: The completed shared `PageFooter` implementation and browser regression tests.
- Produces: Evidence that the footer renders correctly on desktop and mobile without overflow or broken links.

- [ ] **Step 1: Run the complete web unit and E2E checks**

Run:

```bash
npm test --workspace web
```

If an existing development server occupies port 3000, run the E2E portion without `CI=1` so Playwright can reuse it, and report any environment-sensitive failures separately.

- [ ] **Step 2: Build the web workspace**

Run:

```bash
npm run build --workspace web
```

Expected: build succeeds; existing dependency deprecation warnings may remain.

- [ ] **Step 3: Inspect desktop and mobile rendering in a real browser**

At a desktop width, verify the three footer sections align horizontally and the logo/initiative images match the reference proportions. At a mobile width, verify the sections stack, all content remains visible, and `document.documentElement.scrollWidth <= window.innerWidth`.

- [ ] **Step 4: Check diff hygiene**

Run:

```bash
git diff --check HEAD~2..HEAD
git status --short
```

Confirm only the intended footer files and test changes are committed; preserve unrelated worktree items.
