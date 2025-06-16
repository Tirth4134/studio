
export interface BuyerAddress {
  name: string;
  addressLine1: string;
  addressLine2: string; // e.g., BAKROL or further address details
  gstin: string;
  stateNameAndCode: string; // e.g., Gujarat, Code: 24
  contact: string;
  email?: string; // Optional email address
}

export interface InventoryItem {
  id: string;
  category: string;
  name: string;
  buyingPrice: number;
  price: number; // This is the selling price
  stock: number;
  description?: string;
  purchaseDate?: string; // Added purchase date, YYYY-MM-DD
}

export interface InvoiceLineItem {
  id: string; // Corresponds to InventoryItem id
  name: string;
  price: number; // Selling price per unit
  quantity: number;
  total: number;
  category?: string; // Added to store category for HSN/SAC display
}

export interface AppData {
  items: InventoryItem[];
  invoiceCounter: number;
  buyerAddress?: BuyerAddress; // To persist if needed in future
}

export interface AppSettings{
  buyerAddress: BuyerAddress; // Ensure this is BuyerAddress, not 'any'
  invoiceCounter: number; // Ensure this is number, not 'any'
}

// Represents a buyer profile stored by GSTIN
export interface BuyerProfile extends BuyerAddress {
  // GSTIN is the key, so it's implicitly part of the profile when retrieved
  // email is optional, but ensure it's handled
}

export interface SalesRecord {
  id: string; // Unique ID for the sales record document itself
  invoiceNumber: string;
  saleDate: string; // YYYY-MM-DD format
  itemId: string;
  itemName: string;
  category: string;
  quantitySold: number;
  sellingPricePerUnit: number;
  buyingPricePerUnit: number;
  totalProfit: number;
}
