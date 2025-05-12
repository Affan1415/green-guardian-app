import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
// Removed incorrect import: import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

// const geistSans = GeistSans; // Assign GeistSans directly
// const geistMono = GeistMono; // This was causing the error

export const metadata: Metadata = {
  title: 'AgriControl',
  description: 'Smart Agriculture Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} antialiased`}> {/* Use GeistSans.variable directly */}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
