'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart, useUpdateCartItem, useRemoveFromCart } from '@/features/cart/hooks/useCart';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartPage() {
  const { data: cart, isLoading, isError, refetch } = useCart();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const { mutate: updateQuantity } = useUpdateCartItem();
  const { mutate: removeItem } = useRemoveFromCart();

  const handleQuantityChange = (itemId: string, currentQty: number, change: number, stock: number) => {
    const maxAllowed = Math.min(stock, 10);
    const newQty = change < 0 && currentQty > maxAllowed
      ? maxAllowed
      : currentQty + change;
    if (newQty > 0 && newQty <= maxAllowed) {
      updateQuantity({ id: itemId, quantity: newQty });
    }
  };

  if (isAuthLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <h1 className="text-2xl font-bold">Sign in to view your cart</h1>
        <p className="text-sm text-muted-foreground mt-2">Your cart is saved to your account.</p>
        <Link href="/login" className="mt-6 inline-flex">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">

      <div className="border-b pb-6 mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Shopping Cart</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your items and proceed to checkout.
        </p>
      </div>

      {isError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-8 text-center text-red-800 dark:text-red-300">
          <p className="font-semibold">Unable to sync your cart state.</p>
          <Button onClick={() => void refetch()} variant="outline" className="mt-4">Try again</Button>
        </div>
      )}

      {isError ? null : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-2xl bg-muted/10 border-dashed px-4 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Looks like you haven&apos;t added anything to your cart yet. Explore our products to get started.
          </p>
          <Link href="/products" className="mt-6">
            <Button size="sm" className="rounded-full font-bold px-6 flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden border-border bg-card">
                <CardContent className="p-4 sm:p-6 flex gap-4 sm:gap-6 items-center">

                  {/* Thumbnail */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover object-center bg-muted border border-border"
                  />

                  {/* Info */}
                  <div className="flex-grow min-w-0">
                    <Link href={`/products/${item.productId}`} className="font-bold text-sm sm:text-base text-foreground hover:underline line-clamp-1">
                      {item.name}
                    </Link>
                    <span className="text-xs text-muted-foreground block capitalize mt-0.5">
                      Price: ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>

                    {/* Quantity Selector on Mobile */}
                    <div className="flex sm:hidden items-center border border-border rounded-full h-8 w-fit bg-muted/20 mt-3">
                      <Button
                        onClick={() => handleQuantityChange(item.id, item.quantity, -1, item.stock)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <Button
                        onClick={() => handleQuantityChange(item.id, item.quantity, 1, item.stock)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground"
                        disabled={item.quantity >= Math.min(item.stock, 10)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Quantity Selector on Desktop */}
                  <div className="hidden sm:flex items-center border border-border rounded-full h-9 bg-muted/20">
                    <Button
                      onClick={() => handleQuantityChange(item.id, item.quantity, -1, item.stock)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                    <Button
                      onClick={() => handleQuantityChange(item.id, item.quantity, 1, item.stock)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground"
                      disabled={item.quantity >= Math.min(item.stock, 10)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Cost & Delete */}
                  <div className="flex flex-col items-end justify-between self-stretch">
                    <span className="font-bold text-sm sm:text-base">
                      ${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <Button
                      onClick={() => removeItem(item.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cart Summaries card */}
          <div>
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg mb-2">Order Summary</h3>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">${cart?.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-semibold text-foreground">
                    {cart?.shipping === 0 ? 'FREE' : `$${cart?.shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t border-border pt-4 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>${cart?.total.toFixed(2)}</span>
                </div>

                <Link href="/checkout" className="block w-full pt-2">
                  <Button className="w-full rounded-full h-11 font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10">
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <p className="text-[10px] text-center text-muted-foreground mt-4 leading-normal">
                  Shipping thresholds: Free shipping is applied to orders over $150.00.
                </p>

              </CardContent>
            </Card>
          </div>

        </div>
      )}

    </div>
  );
}
