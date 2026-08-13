import type {
  Product,
  ProductImage,
  ProductStatus,
} from "../../generated/prisma/client";

export interface ProductResponse extends Product {
  images: ProductImage[];
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: ProductStatus;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}