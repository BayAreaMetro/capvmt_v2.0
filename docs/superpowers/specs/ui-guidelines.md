# MTC-UI Application Skeleton — Design Specification

## Purpose

Create a reusable application shell for MTC web applications. The shell should establish the shared navigation, branding, responsive behavior, accessibility, and page framing used by applications such as TOC and Complete Streets, while allowing each application to supply its own name, menu items, routes, content, and footer links.

The result is a real, navigable skeleton—not a static mockup—with placeholder content that demonstrates the shell at desktop, tablet, and mobile widths.

## Design direction

- Use the existing MTC-UI library for all available controls, layout primitives, typography, theme tokens, icons, buttons, links, and feedback states.
- Do not recreate MTC-UI components with bespoke CSS when an equivalent library component exists.
- Preserve the established MTC visual language: calm, civic, information-dense, and highly legible.
- Use the bundled theme as the source of truth. Important observed tokens include:
  - primary dark teal: `#00303f`
  - accent/danger orange: `#c2570a`
  - success green: `#5ea037`
  - page background: `#f2f4f5`
  - body font: Nunito Sans, with the library's fallback stack
  - base root size: `17px`
  - rounded corners: modest, using the theme radius tokens
- Prefer generous whitespace, clear section hierarchy, restrained shadows, and strong active/focus states over decorative effects.

The supplied reference screens establish these additional patterns:

- An 8px application accent rule runs across the very top of the viewport, matching `--ribbon-height: 8px` in the User Management stylesheet. Its gradient colors can be configured per application; the references use orange-to-gold, purple, and orange variants.
- The desktop sidebar is white and separated from the content with a subtle vertical border/shadow. The User Management implementation uses `240px` at the `md` breakpoint; the screenshots appear wider because of viewport/image scaling, so use the stylesheet value as the implementation source of truth.
- The header begins to the right of the sidebar, is approximately 70px tall, and uses a left-to-right blue-to-dark-teal gradient. The current page title is aligned left; help, messages, divider, and user/profile controls are aligned right.
- The sidebar presents the MTC mark, application name, optional version, a generous navigation list with simple line/filled icons, and a dark teal “Powered by” block anchored to the bottom.
- Reference pages use a very light gray content canvas with white cards/panels, thin gray borders, and soft shadows. Content commonly starts with a large page title or tinted title panel.
- Data-heavy views use dark teal table headers, alternating or lightly shaded rows, compact status badges, outlined filter controls, and orange/purple accent actions.

## Reference implementation to reuse

The User Management application at `/Users/trodriguez/Projects/mtc/dsa-user-management/apps/web/` is the implementation reference for the shell. Follow its structure and stylesheet conventions rather than approximating the appearance from screenshots:

The MTC-UI source of truth is the Storybook-backed workspace package at `/Users/trodriguez/Projects/mtc/dataviz-web-template/packages/ui/`, published as `@bayareametro/mtc-ui`. The Storybook templates and stories under `/Users/trodriguez/Projects/mtc/dataviz-web-template/packages/storybook/` are usage examples and composition references. The template application should depend on and import from `@bayareametro/mtc-ui`; it should not reimplement components that are already exported by `packages/ui`.

Use the package source, not the compiled `dist` output, when determining component capabilities during development. The public exports are listed in `packages/ui/src/index.ts` and include the following groups:

- Shell/navigation: `StandardHeader`, `UtilityHeader`, `Sidebar`, `VerticalMenu`, `Breadcrumbs`, `Tabs`, `Pagination`, `Link`, `ExternalLink`, and `Breakpoint`.
- Layout/content: `HStack`, `VStack`, `Card`, `CardGroup`, `InfoTile`, `InfoTileGroup`, `Typography`, `NotificationBox`, and `DataTable`.
- Forms/actions: `Button`, `IconButton`, `Input`, `Select`, `Checkbox`, `RadioButton`, `Switch`, `FormFooter`, and chips.
- Identity/footer: `MtcLogo`, `MtcMark`, `MtcIcon`, `AbagLogo`, `AbagMark`, `AbagIcon`, `BayAreaMetroMark`, `StandardFooter`, and `LegalFooter`.
- Behavior/utilities: `useSidebarCollapse`, `useDataTableHeader`, `useJumpMenu`, `useNavbarContext`, `clsx`, and adornment helpers.

For data-visualization applications, treat `@bayareametro/mtc-charts` and `@bayareametro/mtc-maps` from the same workspace as optional companion packages. Use them when the skeleton needs a representative chart or map surface; otherwise keep the shell independent of those packages.

- `src/components/page-frame/page-frame.module.scss` — page grid, ribbon, responsive sidebar width, sticky behavior, and content rows.
- `src/components/page-frame/header.module.scss` — sticky header, responsive header spacing, navigation height, and breakpoint behavior.
- `src/components/platform-sidebar/styles.module.css` — sidebar colors, group spacing, headings, item typography, active state, nested navigation, and footer labels.
- `src/components/page-frame/index.tsx` — `PageFrame` composition and desktop/mobile breakpoint split.
- `src/components/page-frame/header.tsx` — MTC-UI `StandardHeader` composition and mobile `NavbarOffcanvas` behavior.
- `src/components/platform-sidebar/index.tsx` — MTC-UI `Sidebar`, `VerticalMenu`, `MtcLogo`, `AbagLogo`, active-route navigation, nested groups, and “Powered by” footer.
- `src/components/utility-header/index.tsx` — MTC-UI `UtilityHeader`, breadcrumbs, quick links, separator, and user menu.
- `src/components/section-card/index.tsx` — white card surface, 8px radius, generous desktop padding, and responsive spacing.
- `src/components/dropdown/dropdown.module.css` and `src/components/select/index.module.css` — outlined controls, dropdown spacing, and form-field sizing.
- `src/components/table/index.module.css` — table-specific cell/input sizing and editable-cell spacing.

Relevant Storybook composition references include:

- `packages/storybook/templates/platform-sidebar/` — collapsible sidebar with MTC/ABAG marks, nested navigation, active links, and sidebar footer.
- `packages/storybook/templates/standard-header/` — responsive `StandardHeader` with user actions, inline actions, dropdown actions, and mobile navbar toggle.
- `packages/storybook/templates/utility-header/` — page title, breadcrumbs, quick links, separator, and user menu.
- `packages/storybook/templates/standard-card/` and `chart-card/` — reusable content and chart card compositions.
- `packages/storybook/templates/map-template/` — map canvas, filter controls, map controls, markers, popups, and drawer composition.
- `packages/storybook/stories/content/InfoTileGroup.stories.tsx`, `table.stories.tsx`, `tabs.stories.tsx`, and `full-bleed-card.stories.tsx` — representative page-content patterns.

Use these files as patterns or shared source where the projects are in the same workspace. Do not copy generated `.next` assets. If the target project cannot import source files from User Management, reproduce the same behavior with local shell components and the installed `@bayareametro/mtc-ui` package.

## Reference audit: screenshots versus implementation

The prompt is aligned with the references when interpreted this way:

| Reference | Prompt coverage | Required implementation choice |
|---|---|---|
| TOC application | White branded sidebar; dashboard title in the utility header; dark teal table headers; grouped policy sections; orange-to-gold top ribbon; user/help/messages controls | Use `PlatformSidebar` + `UtilityHeader`; configure sectioned navigation and full-width `DataTable`/card sections; use the orange/gold ribbon variant. |
| Complete Streets application | White sidebar; purple top ribbon and active accent; versioned app title; filter card; four KPI tiles; chart cards; data-visualization canvas | Use `Sidebar`, `InfoTileGroup`, `Card`/`ChartCard` composition, `Input`/`Select`, and optional `@bayareametro/mtc-charts`; use the purple accent variant. |
| User Management application | Actual reusable shell implementation: `PageFrame`, 8px ribbon, `240px` sidebar at `md`, `StandardHeader`/mobile navigation, `UtilityHeader` at large sizes, `PlatformSidebar`, sticky layout, MTC/ABAG sidebar footer | Follow the User Management source structure first. Keep the sidebar expanded by default for screenshot fidelity; treat collapse as an optional Storybook-supported enhancement, not a required visual state. |

The screenshots establish the visual target; the User Management source establishes exact layout behavior and breakpoint values. Where they appear to differ, prefer the source implementation and keep visual values configurable.

### Source-of-truth design tokens

The User Management app imports `@bayareametro/mtc-ui/config.bootstrap.scss` and uses the following MTC palette from `colors.bootstrap.scss`:

| Token | Value | Use |
|---|---:|---|
| `--dv-midnight-blue` | `#00303F` | primary text, dark shell/footer, table headers |
| `--dv-midnight-blue-50` | `#F2F4F5` | page background |
| `--dv-midnight-blue-500` | `#80979F` | borders |
| `--dv-medium-blue` | `#336699` | header/primary control accent, icon tile backgrounds |
| `--dv-gold` | `#FBAC18` | ribbon end color and secondary accent |
| `--dv-orange` | `#C2570A` | active navigation, warnings, primary warm accent |
| `--dv-purple` | `#733E7A` | optional application accent |
| `--dv-forest-green` | `#04392D` | dark green data/status accent |
| `--dv-grass-green` | `#5EA037` | success states |

The reference implementation sets `--ribbon-height: 8px`, defines a `240px` sidebar width from the `md` breakpoint upward, renders the persistent sidebar at `lg`/`xl`/`xxl`, and moves to a zero-width sidebar plus off-canvas navigation below `lg`. Preserve these values when matching the User Management implementation; allow an application to override them only through documented shell configuration.

## Shell anatomy

```text
┌─────────────────────────────────────────────────────────────┐
│ Header: MTC mark | application title | utility actions       │
├───────────────┬─────────────────────────────────────────────┤
│ Sidebar       │ Main content                                │
│ brand/context │ breadcrumb                                  │
│ primary nav   │ page title + description                     │
│ secondary nav │ content slot                                │
│ settings/help │                                             │
├───────────────┴─────────────────────────────────────────────┤
│ Footer: MTC / agency links | accessibility | version         │
└─────────────────────────────────────────────────────────────┘
```

### Header

- Full-width across the area to the right of the sidebar, visually distinct from the content area, using the reference blue-to-dark-teal gradient. Add the configurable top accent rule above it.
- At `md` through `lg`, use the MTC-UI `StandardHeader` pattern from User Management: branded title area, responsive controls, and the sidebar rendered inside the mobile/off-canvas navigation.
- At `lg` and above, use the MTC-UI `UtilityHeader` pattern: current page title and optional breadcrumbs on the left; Help, Messages/quick links, divider, and user/profile menu on the right. Keep actions configuration-driven.
- On small screens, preserve the application title and move navigation/utility actions into the responsive header controls.
- Include a skip-to-content link that becomes visible on keyboard focus.

### Sidebar

- Fixed-width desktop navigation, `240px` at the `md` breakpoint as defined by the User Management stylesheet, with a full-height layout below the top accent rule.
- Use a white brand/context region at the top with the MTC mark, application name, and optional version number. Allow multi-line application names.
- Provide a scrollable navigation region below it and reserve a bottom-anchored dark teal “Powered by” block for MTC/ABAG attribution and contact information.
- Navigation supports:
  - section labels;
  - links with icons;
  - active route styling;
  - optional nested items;
  - expandable/collapsible groups;
  - an optional bottom utility area for Help, About, Settings, or feedback.
- Active state must be obvious without relying on color alone: use an accent indicator, weight, background, or icon treatment.
- Reference active states may use a solid orange/purple row fill with white text, while inactive items remain dark teal text on white. Make this accent configurable.
- Keep the sidebar expanded by default to match TOC and User Management. A collapsed state may be enabled using the Storybook `useSidebarCollapse`/`Sidebar.CollapseToggle` pattern, but it is optional and must retain tooltips or accessible labels for icon-only controls.
- On mobile, the sidebar becomes an off-canvas drawer with a scrim. Opening it traps focus; Escape closes it; selecting a route closes it.

### Main content

- Use a flex/grid shell that keeps the footer at the bottom of short pages and allows the content region to scroll naturally on long pages.
- Provide a semantic `<main>` with a stable `id` targeted by the skip link.
- Within main content, include an optional breadcrumb row, page heading, supporting description, and a content slot.
- Set a readable max-width for ordinary content while allowing map/data applications to opt into a wide/full-bleed content mode.
- Support common reference layouts: a title/description panel with a colored left border, filter toolbar card, KPI/stat card row, chart cards, and full-width data tables.
- Demonstrate the skeleton with a dashboard-style landing page containing:
  - a welcome/overview heading;
  - 3–4 summary cards;
  - a recent activity or getting-started panel;
  - one primary call-to-action and one secondary action.

### Footer

- The primary persistent attribution footer is anchored at the bottom of the sidebar on desktop, using MTC-UI `Sidebar.FooterRoot`/`Sidebar.FooterContainer`, `MtcLogo`, and `AbagLogo` as in User Management and the Storybook `platform-sidebar` template.
- If the application needs a content-area footer, use MTC-UI `StandardFooter` or `LegalFooter` rather than a bespoke footer. Include privacy/accessibility/contact placeholders and an application version/environment placeholder.
- Keep footer links concise and wrap cleanly on mobile.
- Do not make the footer visually compete with primary navigation or page content.

## Responsive behavior

- Desktop (`lg` and above): header + persistent `240px` sidebar + content; sidebar may optionally collapse.
- Tablet (`md` through below `lg`): StandardHeader with the sidebar in the off-canvas navigation; do not reserve persistent sidebar width.
- Mobile: header becomes compact, sidebar becomes a drawer, content uses a single column, cards stack, and horizontal overflow is avoided.
- Never hide essential navigation or actions without providing an accessible alternative.
- Verify at minimum 1440px, 1024px, 768px, and 390px widths.

## Interaction and accessibility requirements

- Use semantic landmarks: header, nav, main, footer.
- Use real links for navigation and buttons for actions.
- Keyboard navigation must cover the header, sidebar, nested groups, drawer, and footer in a logical order.
- Provide visible `:focus-visible` styling using the MTC-UI theme.
- Add accessible names to icon-only buttons and announce drawer/sidebar state with `aria-expanded` and `aria-controls`.
- Mark the current route with `aria-current="page"`; mark expanded groups with `aria-expanded`.
- Maintain WCAG AA contrast for text, controls, borders, and active states.
- Respect `prefers-reduced-motion` and avoid motion as the only state cue.
- Include loading, empty, error, and not-found placeholders so downstream applications have standard slots to replace.

## Component/API shape

Implement the shell as reusable components with configuration rather than hard-coded TOC or Complete Streets labels:

- `AppShell`
- `AppHeader`
- `SidebarNav`
- `SidebarNavItem`
- `Breadcrumbs`
- `PageHeader`
- `AppFooter`
- `MobileNavDrawer`

When implementing in a Next.js app, the preferred composition is `PageFrame`-style: render the desktop `PlatformSidebar` at large breakpoints, render the same sidebar inside the header’s mobile off-canvas navigation at smaller breakpoints, and keep the header/utility header sticky. Prefer the existing MTC-UI primitives `StandardHeader`, `UtilityHeader`, `Sidebar`, `VerticalMenu`, `Breadcrumbs`, `Card`, `InfoTile`, `Table`, `MtcLogo`, and `AbagLogo`.

The shell should be a thin application composition layer around these exports. It may add route-aware wrappers such as `PlatformSidebar`, `PageFrame`, `AppShell`, or `PageHeader`, but those wrappers should pass through MTC-UI props and preserve the underlying component semantics. Only add local CSS for application layout gaps or route-specific composition; component appearance belongs in `packages/ui`.

Suggested configuration:

```ts
type AppNavItem = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: AppNavItem[];
  section?: string;
  external?: boolean;
};

type AppShellConfig = {
  appName: string;
  appDescription?: string;
  logo?: React.ReactNode;
  version?: string;
  accentColor?: string;
  activeNavColor?: string;
  navigation: AppNavItem[];
  utilityLinks?: AppNavItem[];
  footerLinks?: AppNavItem[];
  poweredBy?: React.ReactNode;
};
```

The implementation should integrate with the project’s existing routing and MTC-UI import conventions. If a requested MTC-UI primitive is not available, use the closest existing primitive and isolate any small compatibility styling in a dedicated shell stylesheet.

## Visual QA checklist

- Confirm the active navigation item is correct on every demo route.
- Confirm sidebar collapse, drawer open/close, Escape, scrim click, and focus return.
- Confirm footer placement on both short and long pages.
- Confirm no layout shift when the sidebar changes width.
- Confirm text remains readable at 200% browser zoom.
- Confirm mobile cards and footer links do not overflow horizontally.
- Confirm the shell looks like one cohesive MTC product, not a collection of unrelated component demos.
- Confirm the top accent rule, gradient header, white sidebar, and dark teal attribution block match the supplied reference screenshots.

## Generation prompt

> Build a reusable MTC application shell in this repository using the existing MTC-UI library and the project’s current framework, routing, and import conventions.

> Treat `/Users/trodriguez/Projects/mtc/dsa-user-management/apps/web/` as the primary implementation reference. Reuse or closely follow its `src/components/page-frame/page-frame.module.scss`, `src/components/page-frame/header.module.scss`, `src/components/platform-sidebar/styles.module.css`, `src/components/page-frame/index.tsx`, `src/components/page-frame/header.tsx`, `src/components/platform-sidebar/index.tsx`, and `src/components/utility-header/index.tsx`. Use the installed `@bayareametro/mtc-ui` primitives (`StandardHeader`, `UtilityHeader`, `Sidebar`, `VerticalMenu`, `Breadcrumbs`, `Card`, `InfoTile`, `Table`, `MtcLogo`, and `AbagLogo`) wherever applicable. Do not copy generated `.next` files.

> The MTC-UI source of truth is `/Users/trodriguez/Projects/mtc/dataviz-web-template/packages/ui/`, published as `@bayareametro/mtc-ui`. Use its public exports from `packages/ui/src/index.ts` and consult the Storybook usage/composition examples in `/Users/trodriguez/Projects/mtc/dataviz-web-template/packages/storybook/templates/` and `stories/`. Prefer `StandardHeader`, `UtilityHeader`, `Sidebar`, `VerticalMenu`, `Breadcrumbs`, `Card`, `InfoTile`, `InfoTileGroup`, `DataTable`, `Tabs`, `Button`, `Input`, `Select`, `NotificationBox`, `MtcLogo`, `AbagLogo`, `StandardFooter`, and `LegalFooter`. Use `@bayareametro/mtc-charts` or `@bayareametro/mtc-maps` only for optional chart/map demonstrations.
>
> Create a working application skeleton with an `AppShell` containing: an 8px configurable top accent/ribbon, a white branded sidebar, the User Management-style responsive header composition, a semantic main content area, and a dark teal MTC/ABAG attribution footer block anchored to the sidebar. The structure should match the supplied TOC, Complete Streets, and MTC administration screenshots: civic, calm, information-dense, highly legible, and suitable for map/data workflows. Do not invent a new design system and do not replace MTC-UI components with custom lookalikes.
>
> Use the MTC-UI theme tokens and bundled styles. Preserve the visual language of dark teal `#00303f`, orange `#c2570a` for accent/interaction states, success green `#5ea037`, light gray `#f2f4f5` page background, Nunito Sans typography, modest corner radii, and restrained shadows. Prefer library components, theme variables, and semantic HTML.

> Import the MTC-UI Bootstrap configuration where SCSS is needed and use its CSS variables rather than hard-coding colors. In particular, preserve `--ribbon-height: 8px`, the `md` breakpoint sidebar width of `240px`, `--dv-midnight-blue-50` page background, `--dv-midnight-blue` primary text, `--dv-medium-blue` header/control accent, `--dv-orange` active navigation, and the orange-to-gold ribbon gradient. Follow the User Management sidebar rules: 14px uppercase group headings, 18px top-level items with 14px/20px padding, 15px nested items, 24px group gaps, and solid orange active rows with white text.

> Match these reference proportions and patterns: desktop sidebar `240px` wide at the `md` breakpoint; an 8px top ribbon; a utility header approximately 70px tall at large sizes; white sidebar with MTC mark, multiline application title, optional version, icon-based navigation, and a bottom-anchored dark teal “Powered by” block; utility header with current page title/breadcrumbs on the left and Help, Messages/quick links, divider, and user/profile menu on the right; light gray content canvas; white cards with subtle borders/shadows; dark teal table headers; outlined filters and status badges; configurable orange-to-gold, purple, or orange accent/ribbon and active-navigation treatment.
>
> Make navigation configuration-driven. Define typed nav items with labels, routes, icons, optional nested groups, external-link behavior, and active-route state. Include representative placeholder routes such as Overview, Explore, Data, Reports, Help, and About, but keep all labels easy to replace for a specific MTC application.
>
> Desktop behavior: use the User Management stylesheet’s `240px` persistent sidebar at `lg` and above; at `md` and below, use the `StandardHeader` mobile/off-canvas navigation and do not reserve persistent sidebar width. Include a skip-to-content link, visible keyboard focus states, `aria-current`, `aria-expanded`, and correct landmark semantics.
>
> The demo landing page should include a breadcrumb, page title and description, an `InfoTileGroup` with 3–4 summary tiles, a `StandardCard`-style getting-started/recent-activity panel, and MTC-UI `Button` primary/secondary actions so the shell can be evaluated with realistic content. Include standard loading, empty, error, and not-found placeholder slots.

> Also include one representative data-management section below the landing content: MTC-UI `Input`/`Select` filter controls, KPI cards, and the exported `DataTable` composition with a dark teal header, lightly shaded rows, status badges/chips, sortable-column affordances, pagination, and row overflow actions. This is a visual demonstration of the MTC application style, not a domain-specific feature.
>
> Keep the footer at the bottom on short pages and let it follow long content naturally. Include MTC/agency attribution, privacy/accessibility/contact placeholder links, and a version/environment label. Verify the layout at 1440px, 1024px, 768px, and 390px. Avoid horizontal overflow, excessive decoration, and hard-coded application-specific assumptions.
>
> Deliver the implementation, component types, demo route(s), and only the minimum shell-specific CSS needed to fill gaps in MTC-UI. Run the project’s available typecheck, lint, test, and build commands. Report the files changed and any MTC-UI component/API assumptions that could not be verified from the local package.
