'use client';

import { StandardHeader, clsx } from '@bayareametro/mtc-ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import NavItem from 'react-bootstrap/NavItem';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './header.module.scss';

export interface HeaderNavLinkItem {
  label: string;
  href: string;
}

export interface HeaderProps {
  title?: string;
  items: HeaderNavLinkItem[];
}

function HeaderNavLink({ label, href }: HeaderNavLinkItem) {
  const pathname = usePathname();
  const isActive = new RegExp(`^${href}(/|$)`).test(pathname);

  return (
    <NavItem>
      <NextLink href={href} className={clsx('nav-link', { active: isActive })}>
        {label}
      </NextLink>
    </NavItem>
  );
}

export const Header = ({ title = 'Vehicle Miles Traveled Dataportal', items }: HeaderProps) => (
  <StandardHeader.Root className={styles.root}>
    <StandardHeader.Navbar aria-label="Primary navigation">
      <StandardHeader.Container className={styles.navRow}>
        <StandardHeader.Brand>
          <NextLink href="/" title="Home page" className={styles.headerTitleLink}>
            <img
              src="/images/HorizLogo-WHT.png"
              alt="Bay Area Air Quality Management District Logo"
              className={styles.headerLogo}
            />
            {title && <span className={styles.headerTitle}>{title}</span>}
          </NextLink>
        </StandardHeader.Brand>
        <StandardHeader.ButtonsContainer>
          <StandardHeader.NavbarToggle className={styles.navbarToggle}>
            <FontAwesomeIcon icon={faBars} />
          </StandardHeader.NavbarToggle>
        </StandardHeader.ButtonsContainer>
        <StandardHeader.Navigation aria-label="Primary navigation menu">
          <StandardHeader.NavigationMenu className="ms-auto">
            {items.map((item) => (
              <HeaderNavLink key={item.href} {...item} />
            ))}
          </StandardHeader.NavigationMenu>
        </StandardHeader.Navigation>
      </StandardHeader.Container>
    </StandardHeader.Navbar>
  </StandardHeader.Root>
);
