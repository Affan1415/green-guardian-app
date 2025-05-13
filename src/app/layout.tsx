
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
// Removed incorrect import: import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

// const geistSans = GeistSans; // Assign GeistSans directly
// const geistMono = GeistMono; // This was causing the error

export const metadata: Metadata = {
  title: 'Green Guardian',
  description: 'Smart Agriculture Management System',
  icons: {
    icon: '/logo.png', // Assumes logo.png is in the public folder
    // For different sizes or types, you can expand this:
    // icon: [
    //   { url: '/logo.png', type: 'image/png' },
    //   { url: '/logo.svg', type: 'image/svg+xml' },
    // ],
    // apple: '/apple-logo.png',
  },
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

