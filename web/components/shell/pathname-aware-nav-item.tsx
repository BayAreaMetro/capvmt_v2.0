'use client';

import { AliasableComponent, forwardAliasableComponentRef, clsx } from '@bayareametro/mtc-ui';
import { usePathname } from 'next/navigation';

export type PathnameAwareNavItemProps<As extends React.ElementType = 'div'> =
  AliasableComponent<As> & {
    pathname: string;
    activeClassName?: string;
  };

export const PathnameAwareNavItem = forwardAliasableComponentRef<PathnameAwareNavItemProps>(
  (
    { className, as: Component = 'div', pathname: matchPathname, activeClassName = 'active', ...rest },
    ref,
  ) => {
    const pathname = usePathname();

    return (
      <Component
        key={pathname}
        className={clsx(
          { [activeClassName]: new RegExp(`^${matchPathname}(/|$)`).test(pathname) },
          className,
        )}
        ref={ref}
        {...rest}
      />
    );
  },
);
