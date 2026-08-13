export interface StockValidationResult {
  available: boolean;
  availableQuantity: number;
}

export interface InventoryUpdateInput {
  productId: string;
  quantity: number;
}