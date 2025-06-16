
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
  buyingPrice: number; // Added buying price
  price: number; // This is the selling price
  stock: number;
  description?: string;
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
  buyerAddress: any;
  // printMode: boolean;
  invoiceCounter: any;

}

// Represents a buyer profile stored by GSTIN
export interface BuyerProfile extends BuyerAddress {
  // GSTIN is the key, so it's implicitly part of the profile when retrieved
}
