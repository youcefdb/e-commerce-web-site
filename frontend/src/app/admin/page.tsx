'use client';

import React from 'react';
import { DollarSign, ShoppingCart, Users, PackageOpen, TrendingUp } from 'lucide-react';
import { useAdminStats, useAdminOrders } from '@/features/admin/hooks/useAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useAdminStats();
  const { data: orders, isLoading: ordersLoading, isError: ordersError } = useAdminOrders();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge variant="default" className="capitalize font-bold">delivered</Badge>;
      case 'shipped': return <Badge variant="secondary" className="capitalize font-bold">shipped</Badge>;
      case 'processing': return <Badge variant="outline" className="capitalize font-bold">processing</Badge>;
      case 'pending': return <Badge variant="outline" className="capitalize font-bold">pending</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="capitalize font-bold">cancelled</Badge>;
      default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  if (statsLoading || ordersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl w-full" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl w-full" />
      </div>
    );
  }

  const metricCards = [
    { title: 'Total Sales', value: stats ? `$${stats.totalSales.toLocaleString()}` : '—', icon: DollarSign, description: 'Completed sales value' },
    { title: 'Total Orders', value: stats?.totalOrders ?? '—', icon: ShoppingCart, description: 'Orders placed all-time' },
    { title: 'Products Active', value: stats?.totalProducts ?? '—', icon: PackageOpen, description: 'Catalog items count' },
    { title: 'Customers Registered', value: stats?.totalUsers ?? '—', icon: Users, description: 'User accounts database' },
  ];

  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <div className="space-y-8">

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Overview Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Store operations and sales summaries.</p>
      </div>

      {statsError && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          Dashboard statistics could not be loaded from the backend.
        </p>
      )}

      {/* Grid of counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{card.title}</span>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-2xl font-black text-foreground">{card.value}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sales trend from the admin statistics API */}
      <Card className="border-border">
        <CardContent className="p-6">
          <h3 className="font-bold text-base flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-muted-foreground" /> Sales Volume Trend (Last 7 Days)
          </h3>
          {stats ? <div className="h-48 flex items-end gap-3 sm:gap-6 border-b border-l pb-2 pl-4">
            {stats?.salesOverTime.map((day, idx) => {
              // Find max height ratio
              const maxVal = Math.max(...(stats?.salesOverTime.map(d => d.sales) || [100]));
              const heightPercent = maxVal > 0 ? (day.sales / maxVal) * 85 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on hover */}
                  <span className="absolute -top-6 text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition">
                    ${day.sales.toFixed(0)}
                  </span>
                  {/* Bar */}
                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className="w-full bg-primary rounded-t group-hover:bg-primary/95 transition duration-300 min-h-[4px]"
                  />
                  {/* Label */}
                  <span className="text-[10px] font-semibold text-muted-foreground mt-2 truncate w-full text-center">
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div> : <p role={statsError ? 'alert' : 'status'} className="text-sm text-muted-foreground">{statsError ? 'Sales trend is unavailable.' : 'No sales trend data is available.'}</p>}
        </CardContent>
      </Card>

      {/* Recent Orders Log Table */}
      <Card className="border-border">
        <CardContent className="p-6">
          <h3 className="font-bold text-base mb-4">Recent Transactions</h3>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Order ID</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Customer</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersError ? (
                  <TableRow>
                    <TableCell colSpan={5} role="alert" className="text-center py-6 text-sm text-destructive">
                      Recent orders could not be loaded from the backend.
                    </TableCell>
                  </TableRow>
                ) : null}
                {!ordersError && recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                      No orders placed yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{order.shippingAddress.name}</TableCell>
                      <TableCell className="text-xs font-bold">${order.total.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{getStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
