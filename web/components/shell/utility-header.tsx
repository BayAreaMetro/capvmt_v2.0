import { UtilityHeader as UtilityHeaderPrimitives, Breadcrumbs } from '@bayareametro/mtc-ui';

export interface UtilityHeaderProps {
  pageTitle: string;
  breadcrumbs?: (Omit<Breadcrumbs.BreadcrumbProps, 'children'> & { text: string })[];
  quickLinks: (Omit<UtilityHeaderPrimitives.UtilityHeaderQuickLinksItemProps, 'children'> & {
    text: string;
  })[];
}

export const UtilityHeader = ({ pageTitle, breadcrumbs, quickLinks }: UtilityHeaderProps) => (
  <UtilityHeaderPrimitives.Root>
    <UtilityHeaderPrimitives.LeftContent>
      <Breadcrumbs.Root theme="light">
        {pageTitle ? (
          <Breadcrumbs.Breadcrumb active={'true' as unknown as true} aria-current="page" emphasized>
            <UtilityHeaderPrimitives.Title>{pageTitle}</UtilityHeaderPrimitives.Title>
          </Breadcrumbs.Breadcrumb>
        ) : null}
        {pageTitle && breadcrumbs?.length ? <Breadcrumbs.Separator /> : null}
        {breadcrumbs?.map(({ href, text }) => (
          <Breadcrumbs.Breadcrumb key={href} href={href}>
            {text}
          </Breadcrumbs.Breadcrumb>
        ))}
      </Breadcrumbs.Root>
    </UtilityHeaderPrimitives.LeftContent>
    <UtilityHeaderPrimitives.RightContent>
      <UtilityHeaderPrimitives.QuickLinksList>
        {quickLinks.map((item) => (
          <UtilityHeaderPrimitives.QuickLinksItem key={item.text} {...item} />
        ))}
      </UtilityHeaderPrimitives.QuickLinksList>
    </UtilityHeaderPrimitives.RightContent>
  </UtilityHeaderPrimitives.Root>
);
