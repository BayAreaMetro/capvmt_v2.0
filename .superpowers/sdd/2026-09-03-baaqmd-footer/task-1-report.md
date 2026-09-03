<summary>
Added failing Playwright footer regression coverage for the home page to specify the expected BAAQMD footer identity, sections, local images, and key contact/subscription links.
</summary>

<changes>
- web/test/home.spec.ts: Added `home footer renders Bay Area Air District content` test that visits `/`, scopes assertions to `contentinfo`, checks BAAQMD footer text, verifies `/images/HorizLogo-WHT.png` and `/images/spare_the_air.png`, and asserts Directions, Subscribe, and telephone links are present.
</changes>

<verification>
- Performed: `npm run test:e2e --workspace web -- home.spec.ts`
- Output:
```text
> web@0.1.0 test:e2e
> playwright test home.spec.ts


Running 6 tests using 6 workers

  ✓  5 [chromium] › test/home.spec.ts:38:5 › feedback route is not available (719ms)
  ✓  1 [chromium] › test/home.spec.ts:44:5 › about page does not embed the overview video (767ms)
  ✓  4 [chromium] › test/home.spec.ts:11:5 › home navigation does not expose the map menu item (784ms)
  ✓  2 [chromium] › test/home.spec.ts:17:5 › home navigation does not expose the feedback menu item (808ms)
  ✘  6 [chromium] › test/home.spec.ts:23:5 › home footer renders Bay Area Air District content (818ms)
  ✓  3 [chromium] › test/home.spec.ts:3:5 › home page renders and links to the data explorer (1.0s)


  1) [chromium] › test/home.spec.ts:23:5 › home footer renders Bay Area Air District content ───────

    Error: expect(locator).toContainText(expected) failed

    Locator: getByRole('contentinfo')
    Expected substring: "Bay Area Air District"
    Error: strict mode violation: getByRole('contentinfo') resolved to 2 elements:
        1) <footer class="standard-footer-module-BJ6XBNE6-module__IRr9fq__root">…</footer> aka getByRole('contentinfo').filter({ hasText: 'Metropolitan Transportation' })
        2) <footer class="legal-footer-module-XAK7JTOB-module__2q3PvW__root">…</footer> aka getByText('Version 0.1.0Back To Top')

    Call log:
      - Expect "toContainText" with timeout 5000ms
      - waiting for getByRole('contentinfo')


      26 |   const footer = page.getByRole('contentinfo');
      27 |
    > 28 |   await expect(footer).toContainText('Bay Area Air District');
         |                        ^
      29 |   await expect(footer).toContainText('Stay Informed');
      30 |   await expect(footer).toContainText('Air District Initiatives');
      31 |   await expect(footer.locator('img[src="/images/HorizLogo-WHT.png"]')).toHaveCount(1);
        at /Users/trodriguez/Projects/mtc/capvmt_v2.0/web/test/home.spec.ts:28:24

    Error Context: test-results/home-home-footer-renders-Bay-Area-Air-District-content-chromium/error-context.md

  1 failed
    [chromium] › test/home.spec.ts:23:5 › home footer renders Bay Area Air District content ────────
  5 passed (1.7s)
npm error Lifecycle script `test:e2e` failed with error:
npm error code 1
npm error path /Users/trodriguez/Projects/mtc/capvmt_v2.0/web
npm error workspace web@0.1.0
npm error location /Users/trodriguez/Projects/mtc/capvmt_v2.0/web
npm error command failed
npm error command sh -c playwright test home.spec.ts
```
- Result: failed as expected. The current old footer exposes MTC/ABAG footer content rather than the expected BAAQMD content, and the page currently has multiple `contentinfo` regions.
</verification>

<git>
- Pre-commit status showed preserved pre-existing dirty/untracked files: `.DS_Store`, `.codegraph/`, and local image assets under `web/public/images/`.
- Intended commit command from brief: `git add web/test/home.spec.ts && git commit -m "test: specify baaqmd footer content"`.
</git>

<fix-report>
- Change: Scoped the home footer Playwright locator to the standard/shared `contentinfo` landmark by filtering for `Metropolitan Transportation Commission`, preserving the nested legal footer while avoiding strict-mode ambiguity.
- Performed: `npm run test:e2e --workspace web -- home.spec.ts`
- Output:
```text
> web@0.1.0 test:e2e
> playwright test home.spec.ts


Running 6 tests using 6 workers

  ✓  4 [chromium] › test/home.spec.ts:40:5 › feedback route is not available (522ms)
  ✓  3 [chromium] › test/home.spec.ts:11:5 › home navigation does not expose the map menu item (611ms)
  ✓  2 [chromium] › test/home.spec.ts:46:5 › about page does not embed the overview video (613ms)
  ✓  5 [chromium] › test/home.spec.ts:17:5 › home navigation does not expose the feedback menu item (624ms)
  ✓  1 [chromium] › test/home.spec.ts:3:5 › home page renders and links to the data explorer (853ms)
  ✘  6 [chromium] › test/home.spec.ts:23:5 › home footer renders Bay Area Air District content (5.6s)


  1) [chromium] › test/home.spec.ts:23:5 › home footer renders Bay Area Air District content ───────

    Error: expect(locator).toContainText(expected) failed

    Locator: getByRole('contentinfo').filter({ has: getByText('Metropolitan Transportation Commission') })
    Expected substring: "Bay Area Air District"
    Received string:    "Metropolitan Transportation CommissionMetropolitan Transportation Commission logo(link is external)Metropolitan Transportation CommissionMTC is responsible for planning, financing and coordinating transportation for the nine-county San Francisco Bay Area.mtc.ca.gov(link is external)(link is external)(link is external)(link is external)(link is external)(link is external)Association of Bay Area GovernmentsAssociation of Bay Area Governments logo(link is external)Association of Bay Area GovernmentsABAG supports regional planning and cooperation among the cities and counties of the San Francisco Bay Area.abag.ca.gov(link is external)Contact UsBay Area Metro Center375 Beale StreetSan Francisco, CA 94105Main Phone Number: (415) 778-6700Public Information Line: (415) 778-6757info@bayareametro.gov(link is external)© 2026 Metropolitan Transportation CommissionVersion 0.1.0Back To Top"
    Timeout: 5000ms

    Call log:
      - Expect "toContainText" with timeout 5000ms
      - waiting for getByRole('contentinfo').filter({ has: getByText('Metropolitan Transportation Commission') })
        14 × locator resolved to <footer class="standard-footer-module-BJ6XBNE6-module__IRr9fq__root">…</footer>
           - unexpected value "Metropolitan Transportation CommissionMetropolitan Transportation Commission logo(link is external)Metropolitan Transportation CommissionMTC is responsible for planning, financing and coordinating transportation for the nine-county San Francisco Bay Area.mtc.ca.gov(link is external)(link is external)(link is external)(link is external)(link is external)(link is external)Association of Bay Area GovernmentsAssociation of Bay Area Governments logo(link is external)Association of Bay Area GovernmentsABAG supports regional planning and cooperation among the cities and counties of the San Francisco Bay Area.abag.ca.gov(link is external)Contact UsBay Area Metro Center375 Beale StreetSan Francisco, CA 94105Main Phone Number: (415) 778-6700Public Information Line: (415) 778-6757info@bayareametro.gov(link is external)© 2026 Metropolitan Transportation CommissionVersion 0.1.0Back To Top"


      28 |     .filter({ has: page.getByText('Metropolitan Transportation Commission') });
      29 |
    > 30 |   await expect(footer).toContainText('Bay Area Air District');
         |                        ^
      31 |   await expect(footer).toContainText('Stay Informed');
      32 |   await expect(footer).toContainText('Air District Initiatives');
      33 |   await expect(footer.locator('img[src="/images/HorizLogo-WHT.png"]')).toHaveCount(1);
        at /Users/trodriguez/Projects/mtc/capvmt_v2.0/web/test/home.spec.ts:30:24

    Error Context: test-results/home-home-footer-renders-Bay-Area-Air-District-content-chromium/error-context.md

  1 failed
    [chromium] › test/home.spec.ts:23:5 › home footer renders Bay Area Air District content ────────
  5 passed (6.1s)
npm error Lifecycle script `test:e2e` failed with error:
npm error code 1
npm error path /Users/trodriguez/Projects/mtc/capvmt_v2.0/web
npm error workspace web@0.1.0
npm error location /Users/trodriguez/Projects/mtc/capvmt_v2.0/web
npm error command failed
npm error command sh -c playwright test home.spec.ts
```
- Result: failed as expected because the standard/shared footer still contains old MTC/ABAG content and lacks BAAQMD content; locator strictness is resolved.
</fix-report>

<fix-report>
- Change: Replaced the standard footer locator's legacy MTC text filter with a structural nested-footer filter, preserving the nested legal footer while avoiding strict-mode ambiguity and avoiding dependence on current MTC/ABAG copy.
- Performed: `npm run test:e2e --workspace web -- home.spec.ts`
- Output:
```text
> web@0.1.0 test:e2e
> playwright test home.spec.ts


Running 6 tests using 6 workers

  ✓  2 [chromium] › test/home.spec.ts:38:5 › feedback route is not available (499ms)
  ✓  5 [chromium] › test/home.spec.ts:17:5 › home navigation does not expose the feedback menu item (612ms)
  ✓  4 [chromium] › test/home.spec.ts:44:5 › about page does not embed the overview video (615ms)
  ✓  3 [chromium] › test/home.spec.ts:11:5 › home navigation does not expose the map menu item (622ms)
  ✓  1 [chromium] › test/home.spec.ts:3:5 › home page renders and links to the data explorer (842ms)
  ✘  6 [chromium] › test/home.spec.ts:23:5 › home footer renders Bay Area Air District content (5.6s)


  1) [chromium] › test/home.spec.ts:23:5 › home footer renders Bay Area Air District content ───────

    Error: expect(locator).toContainText(expected) failed

    Locator: getByRole('contentinfo').filter({ has: locator('footer') })
    Expected substring: "Bay Area Air District"
    Received string:    "Metropolitan Transportation CommissionMetropolitan Transportation Commission logo(link is external)Metropolitan Transportation CommissionMTC is responsible for planning, financing and coordinating transportation for the nine-county San Francisco Bay Area.mtc.ca.gov(link is external)(link is external)(link is external)(link is external)(link is external)(link is external)Association of Bay Area GovernmentsAssociation of Bay Area Governments logo(link is external)Association of Bay Area GovernmentsABAG supports regional planning and cooperation among the cities and counties of the San Francisco Bay Area.abag.ca.gov(link is external)Contact UsBay Area Metro Center375 Beale StreetSan Francisco, CA 94105Main Phone Number: (415) 778-6700Public Information Line: (415) 778-6757info@bayareametro.gov(link is external)© 2026 Metropolitan Transportation CommissionVersion 0.1.0Back To Top"
    Timeout: 5000ms

    Call log:
      - Expect "toContainText" with timeout 5000ms
      - waiting for getByRole('contentinfo').filter({ has: locator('footer') })
        14 × locator resolved to <footer class="standard-footer-module-BJ6XBNE6-module__IRr9fq__root">…</footer>
           - unexpected value "Metropolitan Transportation CommissionMetropolitan Transportation Commission logo(link is external)Metropolitan Transportation CommissionMTC is responsible for planning, financing and coordinating transportation for the nine-county San Francisco Bay Area.mtc.ca.gov(link is external)(link is external)(link is external)(link is external)(link is external)(link is external)Association of Bay Area GovernmentsAssociation of Bay Area Governments logo(link is external)Association of Bay Area GovernmentsABAG supports regional planning and cooperation among the cities and counties of the San Francisco Bay Area.abag.ca.gov(link is external)Contact UsBay Area Metro Center375 Beale StreetSan Francisco, CA 94105Main Phone Number: (415) 778-6700Public Information Line: (415) 778-6757info@bayareametro.gov(link is external)© 2026 Metropolitan Transportation CommissionVersion 0.1.0Back To Top"


      26 |   const footer = page.getByRole('contentinfo').filter({ has: page.locator('footer') });
      27 |
    > 28 |   await expect(footer).toContainText('Bay Area Air District');
         |                        ^
      29 |   await expect(footer).toContainText('Stay Informed');
      30 |   await expect(footer).toContainText('Air District Initiatives');
      31 |   await expect(footer.locator('img[src="/images/HorizLogo-WHT.png"]')).toHaveCount(1);
        at /Users/trodriguez/Projects/mtc/capvmt_v2.0/web/test/home.spec.ts:28:24

    Error Context: test-results/home-home-footer-renders-Bay-Area-Air-District-content-chromium/error-context.md

  1 failed
    [chromium] › test/home.spec.ts:23:5 › home footer renders Bay Area Air District content ────────
  5 passed (6.0s)
npm error Lifecycle script `test:e2e` failed with error:
npm error code 1
npm error path /Users/trodriguez/Projects/mtc/capvmt_v2.0/web
npm error workspace web@0.1.0
npm error location /Users/trodriguez/Projects/mtc/capvmt_v2.0/web
npm error command failed
npm error command sh -c playwright test home.spec.ts
```
- Result: failed as expected only because the current standard footer still lacks BAAQMD content; locator strictness remains resolved without depending on legacy MTC/ABAG text.
</fix-report>
