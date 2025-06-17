
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
  directSaleCounter?: number; // Added for export/import
  buyerAddress?: BuyerAddress; // To persist if needed in future
}

export interface AppSettings{
  buyerAddress: BuyerAddress;
  invoiceCounter: number;
  directSaleCounter: number; // Added for separate direct sale numbering
}

// Represents a buyer profile stored by GSTIN
export interface BuyerProfile extends BuyerAddress {
  // GSTIN is the key, so it's implicitly part of the profile when retrieved
  // email is optional, but ensure it's handled
}

export interface SalesRecord {
  id: string; // Unique ID for the sales record document itself
  invoiceNumber: string; // Can be INV-XXXX or DS-XXXX
  saleDate: string; // YYYY-MM-DD format (original invoice/sale date)
  itemId: string;
  itemName: string;
  category: string;
  quantitySold: number;
  sellingPricePerUnit: number;
  buyingPricePerUnit: number;
  totalProfit: number;
}

export interface Invoice {
  invoiceNumber: string; // INV-XXXX
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

// For items within a DirectSaleLogEntry
export interface DirectSaleItemDetail {
  itemId: string;
  itemName: string;
  category: string;
  quantitySold: number;
  sellingPricePerUnit: number;
  buyingPricePerUnit: number; // Important for profit calculation at time of sale
  totalItemProfit: number;
  totalItemPrice: number; // sellingPricePerUnit * quantitySold
}

// For logging finalized direct sales separately
export interface DirectSaleLogEntry {
  id: string; // Unique ID for the log entry, can be same as directSaleNumber
  directSaleNumber: string; // DS-XXXX
  saleDate: string; // YYYY-MM-DD
  items: DirectSaleItemDetail[];
  grandTotalSaleAmount: number;
  totalSaleProfit: number;
}


// Simplified line item for the direct sale UI form before finalization
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
