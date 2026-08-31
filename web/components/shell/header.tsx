import { StandardHeader, Breakpoint } from '@bayareametro/mtc-ui';
import styles from './header.module.scss';
import React from 'react';
import NavbarOffcanvas from 'react-bootstrap/NavbarOffcanvas';
import NextLink from 'next/link';
import { UtilityHeader, UtilityHeaderProps } from './utility-header';

export interface HeaderProps {
  title: string;
  children: React.ReactNode;
  utilityHeaderProps: Omit<UtilityHeaderProps, 'children'>;
}

export const Header = ({ title, utilityHeaderProps, children }: HeaderProps) => (
  <React.Fragment>
    <Breakpoint xs sm md>
      <StandardHeader.Root className={styles.standardHeaderRoot}>
        <StandardHeader.Navbar>
          <StandardHeader.TopContent className={styles.topContent}>
            <StandardHeader.Brand>
              <NextLink href="/" title="Home page" className={styles.headerTitleLink}>
                <StandardHeader.Logo id="standard-header-logo--md" className={styles.headerLogo} width={40} />
                <StandardHeader.Title className={styles.headerTitle} as={'span'}>
                  {title}
                </StandardHeader.Title>
              </NextLink>
            </StandardHeader.Brand>
            <StandardHeader.ButtonsContainer>
              <StandardHeader.NavbarToggle />
            </StandardHeader.ButtonsContainer>
          </StandardHeader.TopContent>
          <StandardHeader.Navigation role="navigation">
            <NavbarOffcanvas>{children}</NavbarOffcanvas>
          </StandardHeader.Navigation>
        </StandardHeader.Navbar>
      </StandardHeader.Root>
    </Breakpoint>
    <Breakpoint lg xl xxl>
      <div className={styles.utilityHeaderRoot}>
        <UtilityHeader {...utilityHeaderProps} />
      </div>
    </Breakpoint>
  </React.Fragment>
);
