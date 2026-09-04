import type { Metadata } from 'next';
import '@bayareametro/mtc-ui/bootstrap.css';
import './globals.css';
import './fonts';
import './fontawesome';

export const metadata: Metadata = {
  title: 'Vehicle Miles Traveled Dataportal',
  description:
    'Explore Bay Area vehicle miles traveled data and climate action planning resources.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
