import styles from './page-frame.module.scss';
import { Breakpoint } from '@bayareametro/mtc-ui';
import { PlatformSidebar, PlatformSidebarProps } from './platform-sidebar';
import { Suspense } from 'react';
import { Header, HeaderProps } from './header';

export interface PageFrameProps {
  children: React.ReactNode;
  sidebarProps: PlatformSidebarProps;
  headerProps: Omit<HeaderProps, 'children'>;
}

export const PageFrame = ({ children, sidebarProps, headerProps }: PageFrameProps) => (
  <div className={styles.body}>
    <a href="#main-content" className={styles.skipLink}>
      Skip to content
    </a>
    <div className={styles.bodyContent}>
      <div className={styles.ribbon} />
      <Breakpoint lg xl xxl>
        <div className={styles.sidebar}>
          <Suspense>
            <PlatformSidebar {...sidebarProps} />
          </Suspense>
        </div>
      </Breakpoint>
      <Header {...headerProps}>
        <Suspense>
          <PlatformSidebar {...sidebarProps} />
        </Suspense>
      </Header>
      <main id="main-content" className={styles.main}>
        {children}
      </main>
    </div>
  </div>
);
