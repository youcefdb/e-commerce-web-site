'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, RotateCcw, PackageX } from 'lucide-react';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import ProductCard from '@/components/shared/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category } from '@/types/api.types';

interface ProductFiltersProps {
  categories?: Category[];
  category: string;
  priceRange: number;
  onCategoryChange: (slug: string) => void;
  onPriceRangeChange: (value: number) => void;
  onClearFilters: () => void;
}

function ProductFilters({
  categories,
  category,
  priceRange,
  onCategoryChange,
  onPriceRangeChange,
  onClearFilters,
}: ProductFiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">Categories</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cat-all"
              checked={category === 'all'}
              onCheckedChange={() => onCategoryChange('all')}
            />
            <Label htmlFor="cat-all" className="text-sm font-medium cursor-pointer">
              All Categories
            </Label>
          </div>
          {categories?.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat.slug}`}
                checked={category === cat.slug}
                onCheckedChange={() => onCategoryChange(cat.slug)}
              />
              <Label htmlFor={`cat-${cat.slug}`} className="text-sm font-medium cursor-pointer capitalize">
                {cat.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">Max Price (${priceRange})</h3>
        <input
          type="range"
          min="50"
          max="1500"
          step="50"
          value={priceRange}
          onChange={(e) => onPriceRangeChange(Number(e.target.value))}
          className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>$50</span>
          <span>$1,500</span>
        </div>
      </div>

      <Button onClick={onClearFilters} variant="outline" className="w-full text-xs font-semibold gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
      </Button>
    </div>
  );
}

function ProductListingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse query params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const requestedSort = searchParams.get('sort');
  const sort = (['price', 'newest', 'rating'] as const).find((value) => value === requestedSort) || 'newest';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
  const requestedPage = Number(searchParams.get('page'));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // States
  const [searchInput, setSearchInput] = useState(search);
  const [priceRange, setPriceRange] = useState<number>(1500); // Max cap filter simulation

  const { data: categories } = useCategories();
  const categoryId = category === 'all'
    ? undefined
    : categories?.find((item) => item.slug === category || item.id === category)?.id;

  // React Query calls
  const { data: productsData, isLoading, isError, error } = useProducts({
    search,
    category: categoryId,
    sort,
    order,
    page,
    limit: 9,
    maxPrice: priceRange,
  });

  // Helper to update query parameters
  const updateQuery = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Always reset to page 1 on filter/search changes
    if (!updates.page && updates.page !== 0) {
      params.set('page', '1');
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === 'all' || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    router.push(`/products?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchInput });
  };

  const handleCategoryChange = (slug: string) => {
    updateQuery({ category: category === slug ? 'all' : slug });
  };

  const handleSortChange = (value: string) => {
    const [field, dir] = value.split('-');
    updateQuery({ sort: field, order: dir });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    router.push('/products');
  };

  const totalPages = productsData?.totalPages || 1;

  const filteredProducts = productsData?.data || [];

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Shop Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Loading catalog...' : isError ? 'Catalog unavailable' : `Showing ${filteredProducts.length} results`}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile filter sheet */}
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" className="md:hidden text-xs gap-1.5">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              }
            />
            <SheetContent side="left" className="w-80">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-left">Filter Products</SheetTitle>
              </SheetHeader>
              <ProductFilters
                categories={categories}
                category={category}
                priceRange={priceRange}
                onCategoryChange={handleCategoryChange}
                onPriceRangeChange={setPriceRange}
                onClearFilters={handleClearFilters}
              />
            </SheetContent>
          </Sheet>

          {/* Search bar inside filter header */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xs w-full flex-grow">
            <Input
              type="search"
              placeholder="Search products..."
              className="h-9 pr-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-0 h-9 w-9 text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </form>

          {/* Sort dropdown */}
          <Select
            defaultValue={`${sort}-${order}`}
            onValueChange={(val) => handleSortChange(val as string)}
          >
            <SelectTrigger className="h-9 w-[180px] text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest-desc">Newest Arrivals</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-64 shrink-0">
          <ProductFilters
            categories={categories}
            category={category}
            priceRange={priceRange}
            onCategoryChange={handleCategoryChange}
            onPriceRangeChange={setPriceRange}
            onClearFilters={handleClearFilters}
          />
        </aside>

        {/* Main Product Grid container */}
        <div className="flex-grow">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[250px] w-full rounded-xl" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-8 text-center text-red-800 dark:text-red-300">
              <p className="font-semibold">Failed to load the product catalog.</p>
              <p className="text-sm mt-1">{error?.message || 'Check that the backend is running and the API URL is configured.'}</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 border rounded-xl bg-muted/20 border-dashed px-4 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <PackageX className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-lg">No products found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                We couldn&apos;t find any items matching your selected criteria. Try adjusting your query filters.
              </p>
              <Button onClick={handleClearFilters} className="mt-4 text-xs font-semibold rounded-full">
                Reset Filters
              </Button>
            </div>
          )}

          {/* Grid render */}
          {!isLoading && !isError && filteredProducts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-12 border-t pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    disabled={page <= 1}
                    onClick={() => updateQuery({ page: page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>

                  <span className="text-xs font-medium text-muted-foreground px-4">
                    Page {page} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    disabled={page >= totalPages}
                    onClick={() => updateQuery({ page: page + 1 })}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default function ProductListingPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 mb-8 gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="flex gap-8">
          <aside className="hidden md:block w-64 shrink-0">
            <Skeleton className="h-64 w-full" />
          </aside>
          <div className="flex-grow">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[250px] w-full rounded-xl" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <ProductListingPageContent />
    </Suspense>
  );
}
