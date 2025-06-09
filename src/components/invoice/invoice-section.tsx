
"use client";

import type { InventoryItem, InvoiceLineItem, BuyerAddress } from '@/types';
import CreateInvoiceForm from './create-invoice-form';
import InvoicePreview from './invoice-preview';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';

interface InvoiceSectionProps {
  inventory: InventoryItem[];
  setInventory: Dispatch<SetStateAction<InventoryItem[]>>;
  invoiceItems: InvoiceLineItem[];
  setInvoiceItems: Dispatch<SetStateAction<InvoiceLineItem[]>>;
  invoiceNumber: string;
  invoiceDate: string;
  onPrintInvoice: () => void;
  buyerAddress: BuyerAddress;
  setBuyerAddress: Dispatch<SetStateAction<BuyerAddress>>;
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
}: InvoiceSectionProps) {
  const { toast } = useToast();

  const handleAddItemToInvoice = (itemToAdd: InvoiceLineItem) => {
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
      // Add category to the invoice line item when it's first added
      setInvoiceItems(prevItems => [...prevItems, { ...itemToAdd, category: inventoryItem?.category }]);
    }

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
    setInventory((prevInventory) =>
      prevInventory.map((invItem) =>
        invItem.id === itemIdToRemove ? { ...invItem, stock: invItem.stock + quantityToReturn } : invItem
      )
    );
    setInvoiceItems((prevItems) => prevItems.filter((item) => item.id !== itemIdToRemove));

    toast({ title: "Success", description: "Item removed from invoice." });
  };

  const handleClearInvoice = () => {
    if (invoiceItems.length === 0) {
      toast({ title: "Info", description: "Invoice is already empty.", variant: "default" });
      return;
    }
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
      <CreateInvoiceForm
        inventory={inventory}
        onAddItemToInvoice={handleAddItemToInvoice}
        buyerAddress={buyerAddress}
        setBuyerAddress={setBuyerAddress}
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

