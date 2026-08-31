import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Link, AbagLogo, MtcLogo, ExternalLink, Sidebar } from '@bayareametro/mtc-ui';
import styles from './platform-sidebar.module.css';
import { ComponentProps } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import NextLink from 'next/link';
import { PathnameAwareNavItem } from './pathname-aware-nav-item';

interface NavLinkItem {
  label: string;
  icon?: IconProp;
  href: string;
  labelProps?: Omit<ComponentProps<typeof Link>, 'children'>;
}

const NavItemLink = ({ label, icon, href, labelProps }: NavLinkItem) => (
  <Sidebar.NavItem as={PathnameAwareNavItem} {...{ pathname: href }}>
    <Sidebar.NavItemLink {...labelProps} as={NextLink} LeftAdornment={icon} href={href}>
      {label}
    </Sidebar.NavItemLink>
  </Sidebar.NavItem>
);

export interface PlatformSidebarProps {
  title: string;
  items: NavLinkItem[];
}

export const PlatformSidebar = ({ title, items }: PlatformSidebarProps) => (
  <Sidebar.Root className={styles.root}>
    <Sidebar.Header>
      <Sidebar.HeaderLogo id="sidebar-header-logo" />
      <Sidebar.HeaderTitle>{title}</Sidebar.HeaderTitle>
    </Sidebar.Header>
    <Sidebar.GroupsContainer>
      <Sidebar.NavGroup>
        <Sidebar.NavGroupList>
          {items.map((item) => (
            <NavItemLink key={item.href} {...item} />
          ))}
        </Sidebar.NavGroupList>
      </Sidebar.NavGroup>
    </Sidebar.GroupsContainer>
    <Sidebar.FooterRoot>
      <Sidebar.FooterContainer>
        <Row>
          <Col xs={12}>
            <p>Powered by:</p>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <ExternalLink
              href="https://mtc.ca.gov"
              title="Metropolitan Transportation Commission"
              RightAdornment={null}
            >
              <Sidebar.FooterLogo as={MtcLogo} color="#FFF" />
            </ExternalLink>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <ExternalLink
              href="https://abag.ca.gov/"
              title="Association of Bay Area Governments"
              RightAdornment={null}
            >
              <Sidebar.FooterLogo as={AbagLogo} color="#FFF" />
            </ExternalLink>
          </Col>
        </Row>
      </Sidebar.FooterContainer>
    </Sidebar.FooterRoot>
  </Sidebar.Root>
);
