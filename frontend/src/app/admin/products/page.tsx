'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Layers, RefreshCw } from 'lucide-react';
import { useAllProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/features/products/hooks/useProducts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { Product } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminProductsPage() {
  const { data: products, isLoading, isError, refetch } = useAllProducts();
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useCategories();

  const { mutate: createProduct } = useCreateProduct();
  const { mutate: updateProduct } = useUpdateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();

  // Dialog States
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: '',
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: categories?.[0]?.slug || '',
      image: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category || categories?.find((category) => category.id === product.categoryId)?.slug || '',
      image: product.image,
    });
    setIsOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      stock: Number(formData.stock),
      category: formData.category,
      image: formData.image.trim(),
    };

    if (editingProduct) {
      updateProduct(
        { id: editingProduct.id, data: payload },
        { onSuccess: () => setIsOpen(false) }
      );
    } else {
      createProduct(
        payload,
        { onSuccess: () => setIsOpen(false) }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="space-y-8">

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Manage Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, update, and manage your electronic product catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm" className="h-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleOpenCreate}
            disabled={categoriesLoading || categoriesError || !categories?.length}
            size="sm"
            className="rounded-full font-bold h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Product
          </Button>
        </div>
      </div>

      {categoriesError && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          Categories could not be loaded. Product changes that require a category cannot be submitted until the backend is available.
        </p>
      )}

      {/* Main product management list */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          ) : isError ? (
            <p role="alert" className="p-8 text-center text-sm text-destructive">
              Products could not be loaded from the backend. Use refresh to try again.
            </p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Product Info</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Category</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Price</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Stock Status</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products || products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-sm text-muted-foreground">
                    No products found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover border bg-muted"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate max-w-xs">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">{product.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-xs font-medium">
                      <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        <Layers className="h-3 w-3" /> {(product.category || categories?.find((category) => category.id === product.categoryId)?.slug || 'Uncategorized').replaceAll('-', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-bold">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-xs">
                      {product.stock <= 0 ? (
                        <span className="text-red-500 font-semibold">Out of Stock</span>
                      ) : product.stock <= 5 ? (
                        <span className="text-amber-500 font-semibold">Low Stock ({product.stock})</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">In Stock ({product.stock})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          onClick={() => handleOpenEdit(product)}
                          disabled={categoriesLoading || categoriesError || !categories?.length}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(product.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* CREATE & EDIT DIALOG MODAL FORM */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="prod-name" className="text-xs font-semibold">Product Name</Label>
              <Input
                id="prod-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Aero Book Pro"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="prod-desc" className="text-xs font-semibold">Description</Label>
              <Input
                id="prod-desc"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="High-performance laptops built for..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prod-price" className="text-xs font-semibold">Price ($)</Label>
                <Input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="999.99"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prod-stock" className="text-xs font-semibold">Stock Quantity</Label>
                <Input
                  id="prod-stock"
                  type="number"
                  min="0"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData(prev => ({ ...prev, category: val as string }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug} className="capitalize">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="prod-image" className="text-xs font-semibold">Image URL (Optional)</Label>
              <Input
                id="prod-image"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="Optional image URL"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
