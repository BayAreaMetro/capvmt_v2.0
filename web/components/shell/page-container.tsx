'use client';

import { usePathname } from 'next/navigation';
import { faHouse, faTable, faComment, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { PageFrame } from './page-frame';

const APP_TITLE = 'Vehicle Miles Traveled Dataportal';

/**
 * Matches the legacy navbar's live links (client/components/navbar/navbar.html)
 * - Home, Data, Map, Feedback, About. Login/Sign up/Settings/Admin/Logout are
 * not included: that entire block is commented out in the legacy markup and
 * has no working entry point, and the decision was to remove that
 * functionality rather than migrate it (see the design doc's "Auth/account/
 * admin scope"). Map is hidden from navigation but the route itself stays
 * live, so its title is kept here for the breadcrumb/header.
 */
const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: faHouse },
  { label: 'Data', href: '/data', icon: faTable },
  { label: 'Feedback', href: '/feedback', icon: faComment },
  { label: 'About', href: '/about', icon: faCircleInfo },
];

const ROUTE_TITLES = [...NAV_ITEMS, { label: 'Map', href: '/map' }];

export function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = ROUTE_TITLES.find((item) => item.href === pathname)?.label ?? APP_TITLE;

  return (
    <PageFrame
      sidebarProps={{ title: APP_TITLE, items: NAV_ITEMS }}
      headerProps={{
        title: APP_TITLE,
        utilityHeaderProps: { pageTitle, quickLinks: [] },
      }}
    >
      {children}
    </PageFrame>
  );
}
