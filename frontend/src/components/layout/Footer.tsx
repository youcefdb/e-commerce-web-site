import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">All Products</Link></li>
              <li><Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground">Categories</Link></li>
              <li><Link href="/products?category=phones-tablets" className="text-sm text-muted-foreground hover:text-foreground">Phones & Tablets</Link></li>
              <li><Link href="/products?category=laptops-desktops" className="text-sm text-muted-foreground hover:text-foreground">Laptops</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">FAQ</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Shipping & Returns</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Warranty</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">About Aero</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Careers</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Press</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-primary flex items-center gap-1.5 mb-4">
              <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-black text-xs">e</span>
              <span>AERO</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Premium electronics designed for developers, creators, and professionals.
            </p>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Aero E-Commerce Inc. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Terms of Service</span>
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Cookie Settings</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
