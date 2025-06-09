"use client";

import type { InventoryItem, InvoiceLineItem } from '@/types';
import CreateInvoiceForm from './create-invoice-form';
import InvoicePreview from './invoice-preview';
import { useToast } from '@/hooks/use-toast';

interface InvoiceSectionProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  invoiceItems: InvoiceLineItem[];
  setInvoiceItems: React.Dispatch<React.SetStateAction<InvoiceLineItem[]>>;
  invoiceNumber: string;
  invoiceDate: string;
  onPrintInvoice: () => void;
}

export default function InvoiceSection({
  inventory,
  setInventory,
  invoiceItems,
  setInvoiceItems,
  invoiceNumber,
  invoiceDate,
  onPrintInvoice,
}: InvoiceSectionProps) {
  const { toast } = useToast();

  const handleAddItemToInvoice = (newItem: InvoiceLineItem) => {
    // Update inventory stock
    setInventory((prevInventory) =>
      prevInventory.map((invItem) =>
        invItem.id === newItem.id ? { ...invItem, stock: invItem.stock - newItem.quantity } : invItem
      )
    );
    // Add item to invoice
    setInvoiceItems((prevItems) => [...prevItems, newItem]);
    toast({ title: "Success", description: `${newItem.name} added to invoice.` });
  };

  const handleRemoveItemFromInvoice = (itemIdToRemove: string, quantityToReturn: number) => {
     // Update inventory stock
    setInventory((prevInventory) =>
      prevInventory.map((invItem) =>
        invItem.id === itemIdToRemove ? { ...invItem, stock: invItem.stock + quantityToReturn } : invItem
      )
    );
    // Remove item from invoice
    setInvoiceItems((prevItems) => prevItems.filter((item, index) => {
      // This logic assumes we remove the first encountered item with this ID. 
      // If multiple lines of same item, this might need adjustment or rely on unique line item ID.
      // For simplicity, this version assumes item ID is sufficient for removal of one line.
      if (item.id === itemIdToRemove) {
        // Create a copy and ensure we only remove one instance if there are duplicates by ID (unlikely with current structure)
        const itemIndex = prevItems.findIndex(i => i.id === itemIdToRemove);
        if (index === itemIndex) return false;
      }
      return true;
    }));
     // A more robust way if order matters or true unique line IDs are not used:
    // setInvoiceItems(prevItems => {
    //   const itemIndex = prevItems.findIndex(item => item.id === itemIdToRemove);
    //   if (itemIndex > -1) {
    //     const newItems = [...prevItems];
    //     newItems.splice(itemIndex, 1);
    //     return newItems;
    //   }
    //   return prevItems;
    // });

    toast({ title: "Success", description: "Item removed from invoice." });
  };

  const handleClearInvoice = () => {
    if (invoiceItems.length === 0) {
      toast({ title: "Info", description: "Invoice is already empty.", variant: "default" });
      return;
    }
    // Return stock for all items in the invoice
    setInventory(prevInventory => {
      const newInventory = [...prevInventory];
      invoiceItems.forEach(invoiceItem => {
        const invItemIndex = newInventory.findIndex(i => i.id === invoiceItem.id);
        if (invItemIndex !== -1) {
          newInventory[invItemIndex] = {
            ...newInventory[invItemIndex],
            stock: newInventory[invItemIndex].stock + invoiceItem.quantity
          };
        }
      });
      return newInventory;
    });

    setInvoiceItems([]);
    toast({ title: "Success", description: "Invoice cleared." });
  };

  return (
    <div className="space-y-6">
      <CreateInvoiceForm inventory={inventory} onAddItemToInvoice={handleAddItemToInvoice} />
      <InvoicePreview
        invoiceItems={invoiceItems}
        invoiceNumber={invoiceNumber}
        invoiceDate={invoiceDate}
        onRemoveItem={handleRemoveItemFromInvoice}
        onClearInvoice={handleClearInvoice}
        onPrintInvoice={onPrintInvoice}
      />
    </div>
  );
}
