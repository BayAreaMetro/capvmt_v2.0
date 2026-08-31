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
  title: string;
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

export const Header = ({ title, items }: HeaderProps) => (
  <StandardHeader.Root className={styles.root}>
    <StandardHeader.Navbar>
      <StandardHeader.Container className={styles.navRow}>
        <StandardHeader.Brand>
          <NextLink href="/" title="Home page" className={styles.headerTitleLink}>
            <StandardHeader.Logo id="standard-header-logo" className={styles.headerLogo} width={40} />
            <StandardHeader.Title as="span" className={styles.headerTitle}>
              {title}
            </StandardHeader.Title>
          </NextLink>
        </StandardHeader.Brand>
        <StandardHeader.ButtonsContainer>
          <StandardHeader.NavbarToggle className={styles.navbarToggle}>
            <FontAwesomeIcon icon={faBars} />
          </StandardHeader.NavbarToggle>
        </StandardHeader.ButtonsContainer>
        <StandardHeader.Navigation role="navigation">
          <StandardHeader.NavigationMenu className="justify-content-end">
            {items.map((item) => (
              <HeaderNavLink key={item.href} {...item} />
            ))}
          </StandardHeader.NavigationMenu>
        </StandardHeader.Navigation>
      </StandardHeader.Container>
    </StandardHeader.Navbar>
  </StandardHeader.Root>
);
