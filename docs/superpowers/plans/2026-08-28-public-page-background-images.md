# Public Page Background Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the legacy home and data background images to the corresponding new Next.js page content areas using a light, readable, responsive treatment.

**Architecture:** Copy the two existing legacy JPEGs into `web/public/images/`, then add page-specific classes to the home and data wrappers. A shared SCSS module will provide the background image, cover positioning, and a subtle light overlay without changing the global body background or shell layout.

**Tech Stack:** Next.js 16, React 19, TypeScript, SCSS modules, Playwright.

## Global Constraints

- Reuse `client/assets/images/cover_img.jpg` for the home page.
- Reuse `client/assets/images/data-img.jpg` for the data page.
- Apply each image only to the corresponding page's main content region.
- Preserve the existing sidebar, header, responsive shell, content, and navigation.
- Use responsive background positioning with `background-size: cover`.
- Add a light translucent veil or equivalent treatment so the imagery remains subtle and does not compete with page content.
- Keep cards, forms, tables, and other content surfaces opaque or nearly opaque to preserve text contrast.
- Do not alter unrelated routes or navigation behavior.
- Do not recreate the legacy page markup or fixed-height layout.

---

### Task 1: Add Public Image Assets

**Files:**
- Create: `web/public/images/cover_img.jpg` (binary copy of `client/assets/images/cover_img.jpg`)
- Create: `web/public/images/data-img.jpg` (binary copy of `client/assets/images/data-img.jpg`)

**Interfaces:**
- Produces public URLs `/images/cover_img.jpg` and `/images/data-img.jpg` for the page styles.

- [ ] **Step 1: Confirm source assets exist and inspect their dimensions**

Run from the repository root:

```bash
file client/assets/images/cover_img.jpg client/assets/images/data-img.jpg
```

Expected: both files are valid JPEG images with nonzero dimensions.

- [ ] **Step 2: Copy the source assets into Next.js public assets**

Create `web/public/images/` if needed and copy the two source files without changing their bytes:

```bash
mkdir -p web/public/images
cp client/assets/images/cover_img.jpg web/public/images/cover_img.jpg
cp client/assets/images/data-img.jpg web/public/images/data-img.jpg
```

- [ ] **Step 3: Verify the copied files match the source files**

Run:

```bash
cmp client/assets/images/cover_img.jpg web/public/images/cover_img.jpg
cmp client/assets/images/data-img.jpg web/public/images/data-img.jpg
```

Expected: both commands exit successfully with no output.

- [ ] **Step 4: Commit the asset-only change**

```bash
git add -- web/public/images/cover_img.jpg web/public/images/data-img.jpg
git commit -m "feat: add public page background images"
```

---

### Task 2: Add Page Background Styling

**Files:**
- Create: `web/components/shell/page-backgrounds.module.scss`

**Interfaces:**
- Produces CSS module classes `homeBackground` and `dataBackground` for page wrappers.
- Each class provides a positioned background image and a light overlay through a pseudo-element while keeping child content above the overlay.

- [ ] **Step 1: Add the shared page-background CSS module**

Implement the module with a shared base class and page-specific image URLs:

```scss
.background {
  position: relative;
  isolation: isolate;
  min-height: 100%;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;

  &::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: rgb(255 255 255 / 82%);
    content: '';
  }
}

.homeBackground {
  composes: background;
  background-image: url('/images/cover_img.jpg');
}

.dataBackground {
  composes: background;
  background-image: url('/images/data-img.jpg');
}
```

The overlay must be behind the wrapper’s children and the wrapper must not introduce a fixed height or horizontal overflow.

- [ ] **Step 2: Run the SCSS-consuming build check**

Run:

```bash
npm run build --workspace web
```

Expected: the build completes successfully. Existing Bootstrap and `@bayareametro/mtc-ui` Sass deprecation warnings may remain; no new compilation errors are acceptable.

- [ ] **Step 3: Commit the styling-only change**

```bash
git add -- web/components/shell/page-backgrounds.module.scss
git commit -m "feat: style understated page backgrounds"
```

---

### Task 3: Apply Backgrounds to Home and Data Pages

**Files:**
- Modify: `web/app/(public)/page.tsx:4-21`
- Modify: `web/app/(public)/data/page.tsx:179-269`

**Interfaces:**
- Home page imports `homeBackground` and wraps its existing card in that class.
- Data page imports `dataBackground` and wraps its existing `VStack` in that class.
- Existing card, form, table, data-fetching, and navigation behavior remain unchanged.

- [ ] **Step 1: Update the home page wrapper**

Import the CSS module:

```tsx
import backgroundStyles from '../../components/shell/page-backgrounds.module.scss';
```

Wrap the existing card without changing its contents:

```tsx
return (
  <div className={backgroundStyles.homeBackground}>
    <Card.Root className="narrow-content">
      {/* existing card content */}
    </Card.Root>
  </div>
);
```

- [ ] **Step 2: Update the data page wrapper**

Import the same module:

```tsx
import backgroundStyles from '../../../components/shell/page-backgrounds.module.scss';
```

Add the class to the existing top-level `VStack` while preserving its `data-page gap-3` classes:

```tsx
<VStack className={`${backgroundStyles.dataBackground} data-page gap-3`}>
  {/* existing data controls, notifications, and table cards */}
</VStack>
```

- [ ] **Step 3: Run focused type/build verification**

Run:

```bash
npm run build --workspace web
```

Expected: successful production build with routes `/`, `/data`, `/map`, `/feedback`, and `/about` generated as before.

- [ ] **Step 4: Commit the page integration change**

```bash
git add -- 'web/app/(public)/page.tsx' 'web/app/(public)/data/page.tsx'
git commit -m "feat: apply backgrounds to home and data pages"
```

---

### Task 4: Verify Responsive Visual and Accessibility Behavior

**Files:**
- Test: `web/test/home.spec.ts`
- Test: `web/test/data.spec.ts`
- Verify: `web/app/(public)/page.tsx`, `web/app/(public)/data/page.tsx`, `web/components/shell/page-backgrounds.module.scss`

**Interfaces:**
- Browser verification confirms the intended background image is present on each route, content remains readable, and layout stays within the viewport.

- [ ] **Step 1: Start the web dev server for browser verification**

Run:

```bash
npm run dev --workspace web
```

Use the running local URL from the command output.

- [ ] **Step 2: Verify home and data at desktop width**

Using browser automation, visit `/` and `/data` at a desktop viewport and verify:

```text
Home: computed background-image contains /images/cover_img.jpg
Data: computed background-image contains /images/data-img.jpg
Home and data: document.documentElement.scrollWidth <= window.innerWidth
Home and data: primary text and cards are visibly readable above the light overlay
```

- [ ] **Step 3: Verify home and data at mobile width**

Repeat at a mobile viewport and verify:

```text
Both routes remain usable without horizontal scrolling
The background remains cover-positioned and does not obscure controls or table content
The responsive header/sidebar behavior remains unchanged
```

- [ ] **Step 4: Verify route isolation and keyboard access**

Visit `/about`, `/feedback`, and `/map` and verify their main content does not receive either page-specific background. On `/`, press `Tab` and confirm the existing skip link remains keyboard-reachable and visible only in its focus-visible state.

- [ ] **Step 5: Run the web test suite**

Run:

```bash
npm test --workspace web
```

Expected: all existing Playwright tests pass. If the suite requires a preconfigured server or environment variable, report that exact prerequisite rather than weakening the tests.

- [ ] **Step 6: Commit any test-only assertions, if required**

If existing tests need explicit assertions for the new behavior, add only those assertions to `web/test/home.spec.ts` and `web/test/data.spec.ts`, rerun the affected tests, then commit:

```bash
git add -- web/test/home.spec.ts web/test/data.spec.ts
git commit -m "test: verify public page backgrounds"
```
