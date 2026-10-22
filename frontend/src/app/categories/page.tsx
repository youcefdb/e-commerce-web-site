'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">

      {/* Title */}
      <div className="border-b pb-6 mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Explore Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse through our premium selection of developer-approved electronics.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-8 text-center text-red-800 dark:text-red-300">
          <p className="font-semibold">Failed to load categories.</p>
        </div>
      )}

      {!isLoading && !isError && categories && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group"
            >
              <Card className="overflow-hidden border border-border h-64 relative rounded-2xl hover:shadow-md transition">
                <img
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-103 opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

                <CardContent className="absolute bottom-6 left-6 right-6 text-white p-0">
                  <h2 className="text-xl font-bold tracking-tight mb-2 group-hover:text-primary transition">{category.name}</h2>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-4">
                    {category.description}
                  </p>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-1.5 inline-flex items-center gap-1.5 transition">
                    Explore Shop <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

          {!isLoading && !isError && categories?.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">No categories are available yet.</p>
          )}

    </div>
  );
}
