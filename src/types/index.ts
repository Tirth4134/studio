export interface InventoryItem {
  id: string;
  category: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
}

export interface InvoiceLineItem {
  id: string; // Corresponds to InventoryItem id
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface AppData {
  items: InventoryItem[];
  invoiceCounter: number;
}
