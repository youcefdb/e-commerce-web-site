'use client';

import React, { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { useAdminOrders } from '@/features/admin/hooks/useAdmin';
import { useUpdateOrderStatus } from '@/features/orders/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getAllowedOrderTransitions } from '@/features/orders/order-status.mjs';
import type { OrderStatus } from '@/types/api.types';

export default function AdminOrdersPage() {
  const { data: orders, isLoading, isError, refetch } = useAdminOrders();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();

  const [searchQuery, setSearchQuery] = useState('');

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateStatus({ id: orderId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge variant="default" className="capitalize font-bold">delivered</Badge>;
      case 'shipped': return <Badge variant="secondary" className="capitalize font-bold">shipped</Badge>;
      case 'processing': return <Badge variant="outline" className="capitalize font-bold">processing</Badge>;
      case 'pending': return <Badge variant="outline" className="capitalize font-bold text-amber-500 border-amber-200 bg-amber-50/50">pending</Badge>;
      case 'paid': return <Badge variant="secondary" className="capitalize font-bold">paid</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="capitalize font-bold">cancelled</Badge>;
      default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  const filteredOrders = orders?.filter(o =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.shippingAddress.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Manage Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View customer purchases, dispatch packages, and update delivery statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm" className="h-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="space-y-4">
        <div className="relative max-w-sm w-full">
          <Input
            placeholder="Search by order ID or name..."
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <p role="alert" className="p-8 text-center text-sm text-destructive">
              Admin orders could not be loaded from the backend. Use refresh to try again.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Order ID</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Placed Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Customer Name</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Purchase Cost</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Order Items</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Status Badge</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Change Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                      No orders matching selection criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const allowedTransitions = getAllowedOrderTransitions(order.status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs font-semibold">{order.id}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          <div className="flex flex-col">
                            <span>{order.shippingAddress.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {order.shippingAddress.city}, {order.shippingAddress.country}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold">${order.total.toFixed(2)}</TableCell>
                        <TableCell className="text-xs">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </TableCell>
                        <TableCell className="text-xs">{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-block text-left w-[130px]">
                            <Select
                              disabled={isUpdating || allowedTransitions.length === 0}
                              value={order.status}
                              onValueChange={(val) => {
                                if (val) handleStatusChange(order.id, val as OrderStatus);
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs font-semibold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={order.status} disabled>
                                  {order.status[0].toUpperCase() + order.status.slice(1)} (current)
                                </SelectItem>
                                {allowedTransitions.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status[0].toUpperCase() + status.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

    </div>
  );
}
