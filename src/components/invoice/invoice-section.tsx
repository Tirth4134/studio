
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

  const handleAddItemToInvoice = (itemToAdd: InvoiceLineItem) => {
    const existingItemIndex = invoiceItems.findIndex(invItem => invItem.id === itemToAdd.id);

    if (existingItemIndex !== -1) {
      // Item already exists, update quantity and total
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
      // New item, add to invoice
      setInvoiceItems(prevItems => [...prevItems, itemToAdd]);
    }

    // Update inventory stock for the quantity just added/updated
    setInventory(prevInventory =>
      prevInventory.map(invItem =>
        invItem.id === itemToAdd.id
          ? { ...invItem, stock: invItem.stock - itemToAdd.quantity }
          : invItem
      )
    );

    toast({
      title: "Success",
      description: `${itemToAdd.name} ${existingItemIndex !== -1 ? 'quantity updated' : 'added'} to invoice.`
    });
  };

  const handleRemoveItemFromInvoice = (itemIdToRemove: string, quantityToReturn: number) => {
     // Update inventory stock
    setInventory((prevInventory) =>
      prevInventory.map((invItem) =>
        invItem.id === itemIdToRemove ? { ...invItem, stock: invItem.stock + quantityToReturn } : invItem
      )
    );
    // Remove item from invoice
    // Since items are consolidated by ID by handleAddItemToInvoice, a simple filter is sufficient.
    setInvoiceItems((prevItems) => prevItems.filter((item) => item.id !== itemIdToRemove));

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
