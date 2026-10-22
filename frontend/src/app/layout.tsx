import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Aero - Premium Electronics E-Commerce',
  description: 'Shop the latest in premium electronics, laptops, phones, smart devices, and mechanical keyboards. Built with modern web technologies.',
  keywords: 'electronics, e-commerce, phones, laptops, smart watch, keyboards, accessories',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppProviders>
          <Suspense fallback={<div className="h-16 border-b border-border bg-background" />}>
            <Navbar />
          </Suspense>
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
