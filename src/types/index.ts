
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
  hsnSac?: string;
  gstRate?: number; // Store as percentage, e.g., 18 for 18%
}

export interface InvoiceLineItem {
  id: string; // Corresponds to InventoryItem id
  name: string;
  price: number; // Selling price per unit
  quantity: number;
  total: number; // This is (price * quantity), the taxable value for this line item
  hsnSac?: string;
  gstRate?: number; // Store as percentage, e.g., 18 for 18%
}

export interface AppData {
  items: InventoryItem[];
  invoiceCounter: number;
  buyerAddress?: BuyerAddress; // To persist if needed in future
}

export interface AppSettings{
  buyerAddress: BuyerAddress;
  invoiceCounter: number;
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

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  buyerGstin: string; 
  buyerName: string;
  buyerAddress: BuyerAddress; 
  items: InvoiceLineItem[];
  subTotal: number; // Sum of (item.price * item.quantity) for all items
  taxAmount: number; // Sum of GST calculated for each item
  grandTotal: number; // subTotal + taxAmount
  amountPaid: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Cancelled';
  latestPaymentDate?: string | null; // YYYY-MM-DD format for the last payment update, can be null
}

// Simplified line item for direct sales before full invoice generation
export interface DirectSaleLineItem {
  id: string; // InventoryItem ID
  name: string;
  price: number; // Selling price per unit (from inventory)
  quantity: number;
  total: number; // price * quantity
  hsnSac?: string;
  gstRate?: number;
  stock: number; // available stock, for display/validation
}
