# Public Page Background Images Design

## Goal

Bring the legacy portal's visual background imagery to the new Next.js public
pages without replacing the new site's shell or page structure. The result
should feel light and understated rather than reproducing the legacy layout
literally.

## Scope

- Reuse `client/assets/images/cover_img.jpg` for the home page.
- Reuse `client/assets/images/data-img.jpg` for the data page.
- Make both assets available from the Next.js `web/public/images/` directory.
- Apply each image only to the corresponding page's main content region.
- Preserve the existing sidebar, header, responsive shell, content, and
  navigation.

## Visual Treatment

- Use responsive background positioning with `background-size: cover`.
- Add a light translucent veil or equivalent treatment so the imagery remains
  subtle and does not compete with page content.
- Keep cards, forms, tables, and other content surfaces opaque or nearly opaque
  to preserve text contrast and readability.
- Keep the treatment responsive on desktop and mobile, avoiding horizontal
  overflow or cropped content caused by the background implementation.

## Implementation Shape

- Add page-specific styling classes in the existing page or shared shell
  styling rather than changing the global body background.
- Add the home background class to the home page content wrapper.
- Add the data background class to the data page content wrapper.
- Keep the image URLs rooted at `/images/` so they work in development and in
  the built application.
- Do not alter unrelated routes or navigation behavior.

## Verification

- Run the web production build to confirm the copied assets and SCSS compile.
- Inspect the home and data routes in a browser at desktop and mobile widths.
- Confirm the images appear only on their intended routes.
- Confirm text, forms, tables, keyboard focus states, and navigation remain
  readable and usable.
- Confirm there is no horizontal overflow introduced by the backgrounds.

## Out Of Scope

- Recreating the legacy page markup or fixed-height layout.
- Changing the sidebar, header, navigation, typography, or content copy.
- Applying imagery globally to every public route.
- Reworking unrelated Sass deprecation warnings from Bootstrap or the UI
  package.
