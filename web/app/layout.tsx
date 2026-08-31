import type { Metadata } from 'next';
import '@bayareametro/mtc-ui/bootstrap.css';
import './globals.css';
import './fonts';
import './fontawesome';

export const metadata: Metadata = {
  title: 'Vehicle Miles Traveled Dataportal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
