'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center min-h-[70vh]">
      <div className="max-w-md w-full space-y-6">

        {/* Visual Graphic */}
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-bounce">
          <Compass className="h-8 w-8" />
        </div>

        {/* Text */}
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">404 - Page Not Found</h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        {/* Home Redirect Buttons */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/">
            <Button className="rounded-full font-bold h-10 px-6 flex items-center gap-1.5 shadow-lg shadow-primary/10">
              <ArrowLeft className="h-4 w-4" /> Back to Store
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" className="rounded-full font-semibold h-10 px-6">
              Search Products
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
