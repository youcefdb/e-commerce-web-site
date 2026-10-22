'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Laptop, ShieldCheck, Truck, RotateCcw, Cpu } from 'lucide-react';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import ProductCard from '@/components/shared/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  // Fetch featured products (first 4 items, sorted by newest)
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts({
    limit: 4,
    sort: 'newest',
    order: 'desc'
  });

  // Fetch categories list
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useCategories();

  return (
    <div className="flex flex-col min-h-screen">

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-radial from-slate-900 via-slate-950 to-black py-20 md:py-32 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 animate-pulse">
            <Cpu className="h-3.5 w-3.5" /> Next Gen Tech Has Arrived
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-6">
            Hardware Crafted for the Modern Workflow
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Discover a curated collection of high-performance laptops, ergonomic peripherals, and premium sound systems engineered to elevate your daily productivity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="w-full sm:w-auto rounded-full font-bold px-8 shadow-lg shadow-primary/25 hover:shadow-primary/35 transition">
                Shop Catalog <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/categories">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full font-semibold px-8 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900 transition">
                View Categories
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. CORE BENEFITS BAR */}
      <section className="border-y border-border bg-muted/40 py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="p-3 bg-primary/5 rounded-full text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Free Express Shipping</h4>
                <p className="text-xs text-muted-foreground">On all orders over $150.00</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="p-3 bg-primary/5 rounded-full text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Two-Year Warranty</h4>
                <p className="text-xs text-muted-foreground">Full hardware replacement protection</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="p-3 bg-primary/5 rounded-full text-primary">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">30-Day Easy Returns</h4>
                <p className="text-xs text-muted-foreground">No questions asked refund policy</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="p-3 bg-primary/5 rounded-full text-primary">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Developer Approved</h4>
                <p className="text-xs text-muted-foreground">Tested and certified specifications</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SECTION */}
      <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">New Arrivals</h2>
            <p className="text-sm text-muted-foreground mt-1">Explore our latest high-performance gadgets.</p>
          </div>
          <Link href="/products" className="group mt-2 sm:mt-0 text-sm font-semibold text-primary flex items-center hover:underline">
            View All Products <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Loading Skeletons */}
        {productsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {productsError && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-6 text-center text-red-800 dark:text-red-300">
            <p className="font-semibold">Unable to fetch products.</p>
            <p className="text-sm mt-1">Check that the backend is running and the API URL is configured.</p>
          </div>
        )}

        {/* Grid Display */}
        {!productsLoading && !productsError && productsData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {productsData.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. CATEGORIES OVERVIEW */}
      <section className="py-16 md:py-24 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Shop by Category</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Find exactly what you need by browsing our segmented categories.
            </p>
          </div>

          {categoriesLoading && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl w-full" />
              ))}
            </div>
          )}

          {categoriesError && (
            <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
              Categories could not be loaded from the backend.
            </p>
          )}

          {!categoriesLoading && !categoriesError && categories && categories.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group relative h-48 overflow-hidden rounded-xl bg-slate-900 shadow-sm border border-border"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-sm sm:text-base font-bold tracking-tight line-clamp-1">{category.name}</h3>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-300 flex items-center gap-1 mt-1 group-hover:text-primary transition">
                      Explore <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!categoriesLoading && !categoriesError && categories?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No categories are available yet.</p>
          )}
        </div>
      </section>

    </div>
  );
}
