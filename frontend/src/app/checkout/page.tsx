'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, CreditCard, ChevronRight, Truck, Wallet } from 'lucide-react';
import { useCart } from '@/features/cart/hooks/useCart';
import { useCreateOrder } from '@/features/orders/hooks/useOrders';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { normalizePostalCode } from '@/features/orders/utils/postal-code.mjs';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading, isError: cartError, refetch: refetchCart } = useCart();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const { mutate: createOrder, isPending: isPlacingOrder } = useCreateOrder();
  const submitLock = useRef(false);

  // Form states
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'United States',
  });
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0 || submitLock.current || isPlacingOrder) return;
    if (cart.items.length > 50) {
      toast.error('Checkout supports up to 50 different products per order.');
      return;
    }
    if (cart.items.some((item) => item.quantity > 10)) {
      toast.error('Each product is limited to 10 units per order. Update your cart to continue.');
      return;
    }
    const postalCode = normalizePostalCode(shippingAddress.postalCode);
    if (postalCode === null) {
      toast.error('Enter a valid postal code (up to 32 characters).');
      return;
    }
    submitLock.current = true;

    // Map cart items into DTO items list
    const items = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    createOrder({
      products: { items },
      shipping_address: {
        fullName: shippingAddress.name,
        address: shippingAddress.address,
        city: shippingAddress.city,
        postal_code: postalCode,
        country: shippingAddress.country,
      },
      paymentMethod,
    }, {
      onError: () => {
        submitLock.current = false;
      },
    });
  };

  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center" role="status">
        <p>Checking your account…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <h1 className="text-2xl font-bold">Sign in to checkout</h1>
        <p className="text-sm text-muted-foreground mt-2">Your cart is saved to your account.</p>
        <Link href="/login" className="mt-6 inline-flex">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center" role="status">
        <p>Loading checkout details...</p>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <h1 className="text-xl font-bold">Unable to load your cart</h1>
        <p className="text-sm text-muted-foreground mt-2">Checkout needs a current cart from the backend.</p>
        <Button onClick={() => void refetchCart()} className="mt-6">Try again</Button>
      </div>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mt-2">Add items to your cart before proceeding to checkout.</p>
        <Button onClick={() => router.push('/products')} className="mt-6">Shop Products</Button>
      </div>
    );
  }

  return (
      <div className="container mx-auto px-4 py-8 sm:px-6">

        {/* Title */}
        <div className="border-b pb-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Checkout</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete your purchase by entering your delivery details.
          </p>
        </div>

        <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Shipping Form & Payment */}
          <div className="lg:col-span-2 space-y-6">

            {/* Delivery address card */}
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
                  <Truck className="h-5 w-5 text-muted-foreground" /> Shipping Details
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="chk-name" className="text-xs font-semibold">Full Name</Label>
                  <Input
                    id="chk-name"
                    name="name"
                    placeholder="John Doe"
                    required
                    value={shippingAddress.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chk-address" className="text-xs font-semibold">Address</Label>
                  <Input
                    id="chk-address"
                    name="address"
                    placeholder="123 Tech Street"
                    required
                    value={shippingAddress.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="chk-city" className="text-xs font-semibold">City</Label>
                    <Input
                      id="chk-city"
                      name="city"
                      placeholder="San Francisco"
                      required
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="chk-postal" className="text-xs font-semibold">Postal Code</Label>
                    <Input
                      id="chk-postal"
                      name="postalCode"
                      placeholder="94107"
                      required
                      maxLength={32}
                      value={shippingAddress.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chk-country" className="text-xs font-semibold">Country</Label>
                  <Input
                    id="chk-country"
                    name="country"
                    placeholder="United States"
                    required
                    value={shippingAddress.country}
                    onChange={handleInputChange}
                  />
                </div>

              </CardContent>
            </Card>

            {/* Payment Method card */}
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" /> Payment Method
                </h3>

                <div className="grid grid-cols-2 gap-4">

                  {/* Credit Card radio button option */}
                  <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${
                    paymentMethod === 'Credit Card' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Credit Card"
                      checked={paymentMethod === 'Credit Card'}
                      onChange={() => setPaymentMethod('Credit Card')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm font-semibold">Credit Card</span>
                    </div>
                  </label>

                  {/* PayPal radio button option */}
                  <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${
                    paymentMethod === 'PayPal' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="PayPal"
                      checked={paymentMethod === 'PayPal'}
                      onChange={() => setPaymentMethod('PayPal')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm font-semibold">PayPal</span>
                    </div>
                  </label>

                </div>
              </CardContent>
            </Card>

          </div>

          {/* Cart review Summary */}
          <div>
            <Card className="border-border sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-5 w-5 text-muted-foreground" /> Order Summary
                </h3>

                {/* Items preview list */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 divide-y border-b pb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm pt-2 first:pt-0">
                      <div className="min-w-0 flex-grow pr-2">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold shrink-0">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial breakdown */}
                <div className="space-y-2 text-sm text-muted-foreground border-b pb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">${cart?.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-semibold text-foreground">
                      {cart?.shipping === 0 ? 'FREE' : `$${cart?.shipping.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-base">
                  <span>Grand Total</span>
                  <span>${cart?.total.toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  disabled={isPlacingOrder}
                  className="w-full rounded-full h-11 font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 mt-4"
                >
                  {isPlacingOrder ? 'Processing...' : 'Place Order'} <ChevronRight className="h-4 w-4" />
                </Button>

              </CardContent>
            </Card>
          </div>

        </form>

      </div>
  );
}
