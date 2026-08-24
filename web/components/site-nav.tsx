import Link from 'next/link';

/**
 * Matches the legacy navbar's live links (client/components/navbar/navbar.html)
 * - Home, Data, Feedback, About. Login/Sign up/Settings/Admin/Logout are not
 * included: that entire block is commented out in the legacy markup and has
 * no working entry point, and the decision was to remove that functionality
 * rather than migrate it (see the design doc's "Auth/account/admin scope").
 * Map isn't in the legacy navbar either (it's reached via a link from the
 * data page) but is included here as a real, top-level page.
 */
export function SiteNav() {
  return (
    <nav className="site-nav">
      <Link href="/" className="site-nav__brand">
        Vehicle Miles Traveled Dataportal
      </Link>
      <div className="site-nav__links">
        <Link href="/">Home</Link>
        <Link href="/data">Data</Link>
        <Link href="/map">Map</Link>
        <Link href="/feedback">Feedback</Link>
        <Link href="/about">About</Link>
      </div>
    </nav>
  );
}
