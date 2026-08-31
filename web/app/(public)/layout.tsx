import { PageContainer } from '../../components/shell/page-container';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PageContainer>{children}</PageContainer>;
}
