import { axiosClient, toApiAssetUrl } from '@/lib/api/axios-client';
import { Product, ProductQueryParams, PaginatedResponse, CreateProductRequest, UpdateProductRequest } from '@/types/api.types';

interface BackendProduct {
  id: string;
  category_id?: string | null;
  name: string;
  description: string;
  price: number | string;
  image?: string | null;
  stock: number | string;
  rating: number | string;
  num_reviews?: number | string;
  created_at?: string;
}

interface BackendProductPage {
  data: BackendProduct[];
  page: number;
  offset: number;
  count: number;
  totalCount: number;
}

const normalizeProduct = (product: BackendProduct): Product => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: Number(product.price),
  image: toApiAssetUrl(product.image) || '',
  categoryId: product.category_id || undefined,
  stock: Number(product.stock),
  rating: Number(product.rating),
  numReviews: Number(product.num_reviews || 0),
  createdAt: product.created_at || '',
});

export const productService = {
  async getProducts(params?: ProductQueryParams): Promise<PaginatedResponse<Product>> {
    const response = await axiosClient.get<BackendProductPage>('/api/v1/products', { params });
    const limit = params?.limit ?? 20;
    return {
      data: response.data.data.map(normalizeProduct),
      total: response.data.totalCount,
      page: response.data.page,
      limit,
      totalPages: Math.ceil(response.data.totalCount / limit),
    };
  },

  async getAllProducts(): Promise<Product[]> {
    const pageSize = 100;
    const firstPage = await this.getProducts({ page: 1, limit: pageSize });
    const products = [...firstPage.data];

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const nextPage = await this.getProducts({ page, limit: pageSize });
      products.push(...nextPage.data);
    }

    return products;
  },

  async getProduct(id: string): Promise<Product> {
    const response = await axiosClient.get<{ data: BackendProduct }>(`/api/v1/products/${id}`);
    return normalizeProduct(response.data.data);
  },

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await axiosClient.post<Product>('/api/v1/products', data);
    return response.data;
  },

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    const response = await axiosClient.patch<Product>(`/api/v1/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(`/api/v1/products/${id}`);
    return response.data;
  }
};
