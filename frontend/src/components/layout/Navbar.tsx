'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag, Heart, User as UserIcon, Search, Menu,
  LogOut, LayoutDashboard, ShoppingCart
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishlist } from '@/features/wishlist/hooks/useWishlist';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { getApiErrorMessage } from '@/lib/api/errors';
import { toast } from 'sonner';

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items: wishlistItems } = useWishlist();
  const { data: cart } = useCart();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Signed out locally, but the backend session could not be ended.'));
    } finally {
      router.push('/');
    }
  };

  const cartCount = cart?.itemsCount || 0;
  const wishlistCount = wishlistItems.length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">

        {/* LOGO */}
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary flex items-center gap-1.5">
            <span className="bg-primary text-primary-foreground p-1 rounded font-black text-sm">e</span>
            <span>AERO</span>
          </Link>
        </div>

        {/* NAVIGATION LINKS - DESKTOP */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="text-muted-foreground transition hover:text-foreground">Home</Link>
          <Link href="/products" className="text-muted-foreground transition hover:text-foreground">Shop</Link>
          <Link href="/categories" className="text-muted-foreground transition hover:text-foreground">Categories</Link>
        </nav>

        {/* SEARCH BAR - DESKTOP */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-full max-w-xs xl:max-w-sm mx-4">
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full pl-9 pr-4 h-9 rounded-full bg-muted/50 border-transparent focus-visible:bg-background transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </form>

        {/* ACTION BUTTONS - DESKTOP */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Wishlist */}
          <Link href="/profile?tab=wishlist">
            <Button variant="ghost" size="icon" className="relative" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {wishlistCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Cart */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative" aria-label="Shopping Cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Auth Dropdown */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-10 rounded-full border border-border hover:bg-muted transition duration-200" />
              }>
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">
                    {user?.name?.slice(0, 2)}
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-semibold max-w-[100px] truncate pr-1">{user?.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')} className="flex w-full items-center gap-2 cursor-pointer">
                  <UserIcon className="h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/orders')} className="flex w-full items-center gap-2 cursor-pointer">
                  <ShoppingCart className="h-4 w-4" /> Orders
                </DropdownMenuItem>
                {user?.role?.toUpperCase() === 'ADMIN' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/admin')} className="bg-primary/5 flex w-full items-center gap-2 cursor-pointer font-medium text-primary">
                      <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive flex w-full items-center gap-2 cursor-pointer">
                  <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-full">Register</Button>
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE SIDEBAR CONTROLLER */}
        <div className="flex md:hidden items-center space-x-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Search trigger on mobile */}
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Search" />}>
              <Search className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="top" className="h-20 flex items-center justify-center">
              <form onSubmit={handleSearchSubmit} className="flex w-full items-center relative">
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full pl-9 pr-4 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </form>
            </SheetContent>
          </Sheet>

          {/* Cart Mobile */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative" aria-label="Shopping Cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Menu Mobile */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Menu" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col h-full space-y-6 pt-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold tracking-tight text-primary flex items-center gap-1.5">
                    <span className="bg-primary text-primary-foreground p-1 rounded font-black text-sm">e</span>
                    <span>AERO</span>
                  </Link>
                </div>

                <nav className="flex flex-col space-y-4 text-base font-medium">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition">Home</Link>
                  <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition">Shop</Link>
                  <Link href="/categories" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition">Categories</Link>
                  <Link href="/profile?tab=wishlist" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition flex justify-between">
                    <span>Wishlist</span>
                    {wishlistCount > 0 && <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-bold">{wishlistCount}</span>}
                  </Link>
                </nav>

                <div className="mt-auto border-t pt-6 space-y-4">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center space-x-3 mb-4">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm uppercase">
                            {user?.name?.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-2 mb-2">
                          <UserIcon className="h-4 w-4" /> Profile
                        </Button>
                      </Link>
                      <Link href="/orders" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-2 mb-2">
                          <ShoppingCart className="h-4 w-4" /> My Orders
                        </Button>
                      </Link>
                      {user?.role?.toUpperCase() === 'ADMIN' && (
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="default" className="w-full justify-start gap-2 mb-2 bg-primary">
                            <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                          </Button>
                        </Link>
                      )}
                      <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                        <LogOut className="h-4 w-4" /> Logout
                      </Button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Login</Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full">Register</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}
