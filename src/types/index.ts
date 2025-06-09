
export interface BuyerAddress {
  name: string;
  addressLine1: string;
  addressLine2: string; // e.g., BAKROL or further address details
  gstin: string;
  stateNameAndCode: string; // e.g., Gujarat, Code: 24
  contact: string;
}

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
  category?: string; // Added to store category for HSN/SAC display
}

export interface AppData {
  items: InventoryItem[];
  invoiceCounter: number;
  buyerAddress?: BuyerAddress; // To persist if needed in future
}
