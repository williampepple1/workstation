import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '3D Executive Workstation HQ | Walk-In Office, Activity Board & Smart TV To-Do',
  description:
    'Walk into your 3D Executive Office Building, manage your daily activities on the interactive wall board, and track your live To-Do list on your 85-inch Office Smart TV.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
