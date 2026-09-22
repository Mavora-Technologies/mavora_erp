import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mavora ERP',
  description: 'Turning innovative ideas into powerful digital solutions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-mavora-light text-mavora-charcoal font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}