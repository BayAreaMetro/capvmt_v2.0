import { LegalFooter } from '@bayareametro/mtc-ui';
import styles from './page-frame.module.scss';
import { Header, HeaderProps } from './header';
import { PageFooter } from './page-footer';

export interface PageFrameProps {
  children: React.ReactNode;
  headerProps: HeaderProps;
}

export const PageFrame = ({ children, headerProps }: PageFrameProps) => (
  <div className={styles.body}>
    <a href="#main-content" className={styles.skipLink}>
      Skip to content
    </a>
    <LegalFooter.BackToTopLocation />
    <div className={styles.bodyContent}>
      <div className={styles.ribbon} />
      <Header {...headerProps} />
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <PageFooter />
    </div>
  </div>
);
