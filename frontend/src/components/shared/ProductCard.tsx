'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { Product } from '@/types/api.types';
import { useWishlist } from '@/features/wishlist/hooks/useWishlist';
import { useAddToCart } from '@/features/cart/hooks/useCart';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { toggleWishlist, isInWishlist, isToggling } = useWishlist();
  const { mutate: addToCart, isPending } = useAddToCart();
  const { data: categories } = useCategories();

  const isFavorite = isInWishlist(product.id);
  const outOfStock = product.stock <= 0;
  const categoryLabel = product.category || categories?.find((category) => category.id === product.categoryId)?.slug;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    addToCart({ productId: product.id, quantity: 1 });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <Card className="group overflow-hidden flex flex-col h-full bg-card hover:shadow-lg transition-all duration-300 border-border">
      {/* Product Image Panel */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Link href={`/products/${product.id}`} className="block h-full w-full">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Category Badge */}
        {categoryLabel && (
          <Badge variant="secondary" className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-xs font-semibold capitalize border border-border">
            {categoryLabel.replaceAll('-', ' ')}
          </Badge>
        )}

        {/* Wishlist Button */}
        <Button
          onClick={handleWishlistToggle}
          disabled={isToggling}
          variant="outline"
          size="icon"
          className={cn(
            "absolute top-3 right-3 h-8 w-8 rounded-full border border-border bg-background/90 backdrop-blur-sm transition-all duration-200 opacity-90 sm:opacity-0 group-hover:opacity-100",
            isFavorite ? "text-red-500 fill-red-500 border-red-200 bg-red-50/90" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className="h-4 w-4" />
        </Button>

        {/* Stock Alert */}
        {outOfStock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
            <Badge variant="destructive" className="px-3 py-1 font-bold text-sm uppercase">Out of Stock</Badge>
          </div>
        )}
      </div>

      {/* Product Information */}
      <CardContent className="flex-1 p-4 flex flex-col">
        <Link href={`/products/${product.id}`} className="block group-hover:underline">
          <h3 className="font-semibold text-base text-foreground line-clamp-1 group-hover:text-primary transition">
            {product.name}
          </h3>
        </Link>

        {/* Rating Row */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex items-center text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < Math.floor(product.rating) ? "fill-amber-500" : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground mt-0.5">
            {product.rating > 0 ? `${product.rating} (${product.numReviews})` : 'No reviews'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1">
          {product.description}
        </p>
      </CardContent>

      {/* Product Footer (Price + Buy button) */}
      <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
        <span className="text-base font-bold text-foreground">
          ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>

        <Button
          onClick={handleAddToCart}
          disabled={outOfStock || isPending}
          size="sm"
          className="rounded-full h-8 font-semibold flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Quick Add
        </Button>
      </CardFooter>
    </Card>
  );
}
