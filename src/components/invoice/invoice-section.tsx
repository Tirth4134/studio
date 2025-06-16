
"use client";

import type { InventoryItem, InvoiceLineItem, BuyerAddress } from '@/types';
import CreateInvoiceForm from './create-invoice-form';
import InvoicePreview from './invoice-preview';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';
// Removed unused Firestore imports from here as page.tsx handles them

interface InvoiceSectionProps {
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[] | ((prevState: InventoryItem[]) => InventoryItem[])) => Promise<void> | void;
  invoiceItems: InvoiceLineItem[];
  setInvoiceItems: Dispatch<SetStateAction<InvoiceLineItem[]>>;
  invoiceNumber: string;
  invoiceDate: string;
  onPrintInvoice: () => void;
  buyerAddress: BuyerAddress;
  setBuyerAddress: (address: BuyerAddress | ((prevState: BuyerAddress) => BuyerAddress)) => Promise<void> | void; // Updated type for functional updates
  onLookupBuyerByGSTIN: (gstin: string) => Promise<void>; // New prop for GSTIN lookup
}

export default function InvoiceSection({
  inventory,
  setInventory,
  invoiceItems,
  setInvoiceItems,
  invoiceNumber,
  invoiceDate,
  onPrintInvoice,
  buyerAddress,
  setBuyerAddress,
  onLookupBuyerByGSTIN, // New prop
}: InvoiceSectionProps) {
  const { toast } = useToast();

  const handleAddItemToInvoice = async (itemToAdd: InvoiceLineItem) => {
    const existingItemIndex = invoiceItems.findIndex(invItem => invItem.id === itemToAdd.id);
    const inventoryItem = inventory.find(inv => inv.id === itemToAdd.id);

    if (existingItemIndex !== -1) {
      setInvoiceItems(prevItems =>
        prevItems.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + itemToAdd.quantity,
                total: item.price * (item.quantity + itemToAdd.quantity),
              }
            : item
        )
      );
    } else {
      setInvoiceItems(prevItems => [...prevItems, { ...itemToAdd, category: inventoryItem?.category }]);
    }

    if (inventoryItem) {
      setInventory(prevInventory =>
        prevInventory.map(invItem =>
          invItem.id === itemToAdd.id
            ? { ...invItem, stock: invItem.stock - itemToAdd.quantity }
            : invItem
        )
      );
    }
    
    toast({
      title: "Success",
      description: `${itemToAdd.name} ${existingItemIndex !== -1 ? 'quantity updated' : 'added'} to invoice.`
    });
  };

  const handleRemoveItemFromInvoice = async (itemIdToRemove: string, quantityToReturn: number) => {
    // const inventoryItem = inventory.find(inv => inv.id === itemIdToRemove); // This was for direct Firestore save, now handled by setInventory prop
    setInventory(prevInventory =>
      prevInventory.map(invItem =>
        invItem.id === itemIdToRemove ? { ...invItem, stock: invItem.stock + quantityToReturn } : invItem
      )
    );
    setInvoiceItems((prevItems) => prevItems.filter((item) => item.id !== itemIdToRemove));
    toast({ title: "Success", description: "Item removed from invoice." });
  };

  const handleClearInvoice = async () => {
    if (invoiceItems.length === 0) {
      toast({ title: "Info", description: "Invoice is already empty.", variant: "default" });
      return;
    }

    const stockToRestore: { [id: string]: number } = {};
    invoiceItems.forEach(item => {
        stockToRestore[item.id] = (stockToRestore[item.id] || 0) + item.quantity;
    });

    const updatedInventory = inventory.map(invItem => {
        if (stockToRestore[invItem.id]) {
            return { ...invItem, stock: invItem.stock + stockToRestore[invItem.id] };
        }
        return invItem;
    });
    
    await setInventory(updatedInventory); // Propagates to page.tsx which handles Firestore

    setInvoiceItems([]);
    toast({ title: "Success", description: "Invoice cleared." });
  };

  return (
    <div className="space-y-6">
      <CreateInvoiceForm
        inventory={inventory}
        onAddItemToInvoice={handleAddItemToInvoice}
        buyerAddress={buyerAddress}
        setBuyerAddress={setBuyerAddress}
        onLookupBuyerByGSTIN={onLookupBuyerByGSTIN} // Pass down the lookup function
      />
      <InvoicePreview
        invoiceItems={invoiceItems}
        invoiceNumber={invoiceNumber}
        invoiceDate={invoiceDate}
        onRemoveItem={handleRemoveItemFromInvoice}
        onClearInvoice={handleClearInvoice}
        onPrintInvoice={onPrintInvoice}
        buyerAddress={buyerAddress}
      />
    </div>
  );
}
