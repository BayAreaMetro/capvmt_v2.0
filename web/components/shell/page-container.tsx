import { PageFrame } from './page-frame';

const APP_TITLE = 'Vehicle Miles Traveled Dataportal';

/**
 * Matches the legacy navbar's live links (client/components/navbar/navbar.html)
 * - Home, Data, About. Login/Sign up/Settings/Admin/Logout are
 * not included: that entire block is commented out in the legacy markup and
 * has no working entry point, and the decision was to remove that
 * functionality rather than migrate it (see the design doc's "Auth/account/
 * admin scope"). Map and feedback have also been retired.
 */
const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Data', href: '/data' },
  { label: 'About', href: '/about' },
];

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <PageFrame headerProps={{ title: APP_TITLE, items: NAV_ITEMS }}>{children}</PageFrame>;
}
