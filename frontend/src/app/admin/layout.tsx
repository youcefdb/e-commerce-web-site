'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, PackageOpen, Users, ArrowLeft } from 'lucide-react';
import { AdminRoute } from '@/components/route-guard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Dashboard Overview', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Manage Products', icon: PackageOpen },
    { href: '/admin/orders', label: 'Manage Orders', icon: ShoppingCart },
    { href: '/admin/users', label: 'View Users', icon: Users },
  ];

  return (
    <AdminRoute>
      <div className="flex-1 flex flex-col md:flex-row min-h-[80vh]">

        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/20 shrink-0">
          <div className="p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Admin Portal</h2>
            <nav className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link key={link.href} href={link.href}>
                    <span className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer mb-1",
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}>
                      <Icon className="h-4 w-4" /> {link.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 border-t border-border pt-6">
              <Link href="/">
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs font-semibold gap-1.5 pl-3">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Store
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Admin Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>

      </div>
    </AdminRoute>
  );
}
