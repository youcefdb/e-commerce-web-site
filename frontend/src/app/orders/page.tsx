'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, CheckCircle, Package } from 'lucide-react';
import { useCancelOrder, useOrder, useOrders } from '@/features/orders/hooks/useOrders';
import { canCustomerCancelOrder } from '@/features/orders/order-status.mjs';
import { ProtectedRoute } from '@/components/route-guard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const { data: ordersPage, isLoading, isError } = useOrders(page);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();
  const orders = ordersPage?.data;
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { data: orderItems, isLoading: orderItemsLoading, isError: orderItemsError } = useOrder(expandedOrderId || '');

  // Checkout redirects check
  const isSuccess = searchParams.get('success') === 'true';
  const orderId = searchParams.get('orderId');

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'default'; // dark/primary
      case 'shipped': return 'secondary'; // gray
      case 'processing': return 'outline'; // clear
      case 'pending': return 'outline'; // warning-like
      case 'cancelled': return 'destructive'; // red
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold mb-8">Order History</h1>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 sm:px-6">

        {/* Checkout Success Banner */}
        {isSuccess && orderId && (
          <div className="mb-8 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex gap-4 items-start">
            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">Thank you for your order!</h2>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                Your order <span className="font-mono font-semibold">{orderId}</span> has been placed successfully and is awaiting fulfillment. We will email you once it ships.
              </p>
            </div>
          </div>
        )}

        <div className="border-b pb-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Order History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and review your purchases.
          </p>
        </div>

        {isError && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-8 text-center text-red-800 dark:text-red-300">
            <p className="font-semibold">Failed to fetch order history.</p>
          </div>
        )}

        {!isError && (!orders || orders.length === 0) ? (
          <div className="text-center py-20 border rounded-2xl border-dashed bg-muted/15">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-base">No orders found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              You haven&apos;t placed any orders yet.
            </p>
            <Button onClick={() => window.location.href = '/products'} size="sm" className="rounded-full">
              Shop Now
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders && orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const date = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              });

              return (
                <Card key={order.id} className="border-border overflow-hidden">

                  {/* Order Overview Header Card */}
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none" onClick={() => toggleExpand(order.id)}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-grow">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Order ID</span>
                        <span className="font-mono text-sm font-semibold text-foreground line-clamp-1">{order.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Date Placed</span>
                        <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {date}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Order Total</span>
                        <span className="text-sm font-bold text-foreground">${order.total.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Status</span>
                        <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize mt-0.5 font-bold">
                          {order.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 md:pt-0 self-end md:self-auto">
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1">
                        {isExpanded ? (
                          <>Hide Items <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>Show Items <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  </CardContent>

                  {/* Expanded Items Drawer Panel */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 px-6 py-6 space-y-6">
                      {orderItemsLoading ? (
                        <p className="text-sm text-muted-foreground">Loading order items…</p>
                      ) : orderItemsError ? (
                        <p className="text-sm text-destructive">Unable to load the order items.</p>
                      ) : orderItems?.length ? (
                        <div className="divide-y border-b pb-4">
                          {orderItems.map((item, index) => (
                            <div key={`${order.id}-${index}`} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                              <div className="min-w-0 flex-grow">
                                <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                                <span className="text-xs text-muted-foreground">
                                  Qty: {item.quantity} × ${item.price.toFixed(2)}
                                </span>
                              </div>
                              <span className="font-bold text-sm">${item.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No order item details are available.</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {canCustomerCancelOrder(order.status) ? (
                          <p className="text-sm text-muted-foreground">
                            You can cancel this order while it is pending.
                          </p>
                        ) : order.status === 'cancelled' ? (
                          <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            This order can no longer be cancelled because fulfillment has advanced.
                          </p>
                        )}
                        {canCustomerCancelOrder(order.status) && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isCancelling}
                            onClick={() => cancelOrder(order.id)}
                          >
                            {isCancelling ? 'Cancelling…' : 'Cancel order'}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                </Card>
              );
            })}
            {ordersPage && ordersPage.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {ordersPage.page} of {ordersPage.totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= ordersPage.totalPages}
                  onClick={() => setPage((current) => Math.min(ordersPage.totalPages, current + 1))}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold mb-8">Order History</h1>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}
