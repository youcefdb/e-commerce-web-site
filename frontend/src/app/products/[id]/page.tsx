'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Heart, ShoppingBag, Plus, Minus, ArrowLeft, ChevronLeft, ChevronRight, Send, Pencil, X, Check, Trash2 } from 'lucide-react';
import { useProduct } from '@/features/products/hooks/useProducts';
import { useReviews, useCreateReview, useUpdateReview, useDeleteReview } from '@/features/reviews/hooks/useReviews';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useWishlist } from '@/features/wishlist/hooks/useWishlist';
import { useAddToCart } from '@/features/cart/hooks/useCart';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // States
  const [quantity, setQuantity] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  // Stores & Hooks
  const { user, isAuthenticated } = useAuthStore();
  const { toggleWishlist, isInWishlist, isToggling: isTogglingWishlist } = useWishlist();
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  const { data: categories } = useCategories();

  // Queries
  const { data: product, isLoading, isError, error } = useProduct(id);
  const { data: reviewsPage, isLoading: reviewsLoading, isError: reviewsError } = useReviews(id, reviewPage);
  const reviews = reviewsPage?.data;
  const { mutate: submitReview, isPending: isSubmittingReview } = useCreateReview(id);
  const { mutate: updateReview, isPending: isUpdatingReview } = useUpdateReview(id);
  const { mutate: deleteReview, isPending: isDeletingReview } = useDeleteReview(id);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <h2 className="text-xl font-bold text-destructive">Failed to load product details</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {error?.message || 'Check that the backend is running and the API URL is configured.'}
        </p>
        <Button onClick={() => router.push('/products')} className="mt-6">
          Back to Shop
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <h2 className="text-xl font-bold">Product not found</h2>
        <p className="text-sm text-muted-foreground mt-2">
          The requested product may have been removed or does not exist.
        </p>
        <Button onClick={() => router.push('/products')} className="mt-6">
          Back to Shop
        </Button>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);
  const outOfStock = product.stock <= 0;
  const categoryLabel = product.category || categories?.find((category) => category.id === product.categoryId)?.slug;

  const handleIncrement = () => {
    if (quantity < Math.min(product.stock, 10)) setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    addToCart({ productId: product.id, quantity });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const comment = userComment.trim();
    if (comment.length < 2 || comment.length > 500) {
      toast.error('Review comments must be between 2 and 500 characters.');
      return;
    }

    submitReview(
      { rating: userRating, comment },
      {
        onSuccess: () => {
          setUserComment('');
          setUserRating(5);
        }
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">

      {/* Back Button */}
      <Button
        onClick={() => router.back()}
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground text-xs"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to listings
      </Button>

      {/* Main product display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

        {/* Product Image */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted border border-border">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover object-center"
          />
          {outOfStock && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
              <Badge variant="destructive" className="px-4 py-1.5 font-bold uppercase text-sm">Out of Stock</Badge>
            </div>
          )}
        </div>

        {/* Product Details Panel */}
        <div className="flex flex-col">
          <div className="mb-4">
            {categoryLabel && (
              <Badge variant="secondary" className="capitalize text-xs font-semibold mb-2">
                {categoryLabel.replaceAll('-', ' ')}
              </Badge>
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.floor(product.rating) ? "fill-amber-500" : "text-muted-foreground/35"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-muted-foreground mt-0.5">
              {product.rating > 0 ? `${product.rating} (${product.numReviews} customer reviews)` : 'No reviews yet'}
            </span>
          </div>

          {/* Price */}
          <div className="mb-6 border-b pb-6">
            <span className="text-3xl font-extrabold text-foreground">
              ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "h-2 w-2 rounded-full",
                outOfStock ? "bg-red-500" : product.stock <= 5 ? "bg-amber-500" : "bg-emerald-500"
              )} />
              <span className="text-xs font-medium text-muted-foreground">
                {outOfStock
                  ? 'Out of Stock'
                  : product.stock <= 5
                    ? `Only ${product.stock} left in stock - order soon`
                    : `In Stock (${product.stock} available)`}
              </span>
            </div>
          </div>

          {/* Short description */}
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Add to Cart Actions */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-4">

              {/* Quantity Selector */}
              {!outOfStock && (
                <div className="flex items-center border border-border rounded-full h-11 bg-muted/20">
                  <Button
                    onClick={handleDecrement}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-muted-foreground"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center text-sm font-bold text-foreground">
                    {quantity}
                  </span>
                  <Button
                    onClick={handleIncrement}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-muted-foreground"
                    disabled={quantity >= Math.min(product.stock, 10)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full">
                <Button
                  onClick={handleAddToCart}
                  disabled={outOfStock || isAddingToCart}
                  className="flex-1 rounded-full h-11 font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" /> Add to Shopping Cart
                </Button>
                <Button
                  onClick={() => toggleWishlist(product)}
                  disabled={isTogglingWishlist}
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full h-11 w-11 border border-border",
                    isFavorite ? "text-red-500 fill-red-500 border-red-200 bg-red-50" : ""
                  )}
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Tabs description / reviews */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="border-b w-full justify-start rounded-none bg-transparent h-12 p-0 space-x-6">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 pt-2 font-semibold text-sm h-full"
          >
            Product Overview
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-3 pt-2 font-semibold text-sm h-full"
          >
            Reviews ({reviews?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-6">
          <Card className="border-transparent shadow-none bg-transparent">
            <CardContent className="p-0">
              <h3 className="font-bold text-base mb-3">Specifications & Dimensions</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                This item is designed to work in standard computing configurations. Crafted using eco-friendly materials and high-precision machinery. Included in the package is the main hardware unit, power cord/charging brick (if applicable), dynamic quickstart manual, and full 2-year warranty card info.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Reviews display list */}
            <div className="lg:col-span-2 space-y-6">
              {reviewsLoading && (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              )}

              {!reviewsLoading && !reviewsError && (!reviews || reviews.length === 0) && (
                <div className="text-center py-8 border border-dashed rounded-xl bg-muted/10">
                  <p className="text-sm text-muted-foreground">Be the first to review this product!</p>
                </div>
              )}

              {!reviewsLoading && reviews && reviews.map((review, reviewIndex) => (
                <div key={review.id ?? `${review.userId}-${reviewIndex}`} className="border-b pb-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">
                        {review.userName.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{review.userName}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          {review.createdAt && new Date(review.createdAt).toLocaleDateString()}
                          {review.updatedAt && ' (edited)'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {editingReviewId !== review.id ? (
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={cn(
                                "h-3 w-3",
                                idx < review.rating ? "fill-amber-500" : "text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                      ) : null}

                      {/* Edit & Delete Buttons for own reviews */}
                      {isAuthenticated && review.id && user?.id === review.userId && editingReviewId !== review.id && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => {
                              if (!review.id) return;
                              setEditingReviewId(review.id);
                              setEditRating(review.rating);
                              setEditComment(review.comment);
                            }}
                            aria-label="Edit review"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => {
                              if (review.id && window.confirm("Are you sure you want to delete this review?")) {
                                deleteReview(review.id);
                              }
                            }}
                            disabled={isDeletingReview}
                            aria-label="Delete review"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingReviewId === review.id ? (
                    <div className="pl-10 pt-2 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground">Rating</Label>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const starValue = idx + 1;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setEditRating(starValue)}
                                className="text-amber-500 focus:outline-none"
                              >
                                <Star
                                  className={cn(
                                    "h-4 w-4",
                                    starValue <= editRating ? "fill-amber-500" : "text-muted-foreground/30"
                                  )}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`edit-comment-${review.id}`} className="text-xs font-semibold text-muted-foreground">Comment</Label>
                        <Input
                          id={`edit-comment-${review.id}`}
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="h-9 text-sm"
                          maxLength={500}
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingReviewId(null)}
                          className="h-8 text-xs flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const comment = editComment.trim();
                            if (!review.id || comment.length < 2 || comment.length > 500) {
                              toast.error('Review comments must be between 2 and 500 characters.');
                              return;
                            }
                            updateReview(
                              { reviewId: review.id, data: { rating: editRating, comment } },
                              {
                                onSuccess: () => setEditingReviewId(null)
                              }
                            );
                          }}
                          disabled={isUpdatingReview}
                          className="h-8 text-xs flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-10 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}

              {reviewsError && (
                <p className="text-sm text-destructive">Unable to load product reviews.</p>
              )}

              {reviewsPage && reviewsPage.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reviewPage <= 1}
                    onClick={() => setReviewPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {reviewsPage.page} of {reviewsPage.totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reviewPage >= reviewsPage.totalPages}
                    onClick={() => setReviewPage((current) => Math.min(reviewsPage.totalPages, current + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Post review panel form */}
            <div>
              <Card className="border border-border">
                <CardContent className="p-6">
                  <h3 className="font-bold text-base mb-4">Write a Review</h3>

                  {isAuthenticated ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">

                      {/* Rating selection */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Overall Rating</Label>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const starValue = idx + 1;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setUserRating(starValue)}
                                className="text-amber-500 focus:outline-none"
                              >
                                <Star
                                  className={cn(
                                    "h-5 w-5",
                                    starValue <= userRating ? "fill-amber-500" : "text-muted-foreground/30"
                                  )}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Comment text area */}
                      <div className="space-y-1.5">
                        <Label htmlFor="review-comment" className="text-xs font-semibold">Your Comment</Label>
                        <Input
                          id="review-comment"
                          type="text"
                          placeholder="What did you think about the product?"
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          maxLength={500}
                          required
                          className="h-10"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmittingReview}
                        size="sm"
                        className="w-full text-xs font-semibold h-9 mt-2 flex items-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" /> Submit Review
                      </Button>

                    </form>
                  ) : (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-xs text-muted-foreground">
                        You must be signed in to submit reviews.
                      </p>
                      <Button onClick={() => router.push('/login')} variant="outline" size="sm" className="w-full text-xs">
                        Sign In Now
                      </Button>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
