
"use client";

import type { InventoryItem, InvoiceLineItem, BuyerAddress } from '@/types';
import CreateInvoiceForm from './create-invoice-form';
import InvoicePreview from './invoice-preview';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';
import { saveMultipleInventoryItemsToFirestore, getInventoryFromFirestore } from '@/lib/firebase';


interface InvoiceSectionProps {
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[] | ((prevState: InventoryItem[]) => InventoryItem[])) => Promise<void> | void;
  invoiceItems: InvoiceLineItem[];
  setInvoiceItems: Dispatch<SetStateAction<InvoiceLineItem[]>>;
  invoiceNumber: string;
  invoiceDate: string;
  onPrintInvoice: () => void;
  buyerAddress: BuyerAddress;
  setBuyerAddress: (address: BuyerAddress) => Promise<void> | void;
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

    // Update stock in Firestore and then update local state
    if (inventoryItem) {
      const updatedInventoryItem = { ...inventoryItem, stock: inventoryItem.stock - itemToAdd.quantity };
      // This will update a single item. The parent `setInventory` from page.tsx is for batch updates.
      // Ideally, `saveInventoryItemToFirestore` would be used here, but `setInventory` expects the full list.
      // For now, we update the local inventory list and rely on the parent's `updateInventory` (which is `setInventory` prop)
      // to persist the whole list if it's called with a function.
      // A more granular update would be:
      // await saveInventoryItemToFirestore(updatedInventoryItem);
      // setInventory(prevInv => prevInv.map(i => i.id === updatedInventoryItem.id ? updatedInventoryItem : i));

      // Using the passed setInventory which handles Firestore updates for the whole list
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
    const inventoryItem = inventory.find(inv => inv.id === itemIdToRemove);
    if (inventoryItem) {
      const updatedInventoryItem = { ...inventoryItem, stock: inventoryItem.stock + quantityToReturn };
      // await saveInventoryItemToFirestore(updatedInventoryItem);
      // setInventory(prevInv => prevInv.map(i => i.id === updatedInventoryItem.id ? updatedInventoryItem : i));
       setInventory(prevInventory =>
        prevInventory.map(invItem =>
          invItem.id === itemIdToRemove ? { ...invItem, stock: invItem.stock + quantityToReturn } : invItem
        )
      );
    }
    setInvoiceItems((prevItems) => prevItems.filter((item) => item.id !== itemIdToRemove));
    toast({ title: "Success", description: "Item removed from invoice." });
  };

  const handleClearInvoice = async () => {
    if (invoiceItems.length === 0) {
      toast({ title: "Info", description: "Invoice is already empty.", variant: "default" });
      return;
    }

    // Create a map of items to update in inventory
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
    
    // This assumes setInventory will handle Firestore persistence for the entire list.
    await setInventory(updatedInventory);


    setInvoiceItems([]);
    toast({ title: "Success", description: "Invoice cleared." });
  };

  return (
    <div className="space-y-6">
      <CreateInvoiceForm
        inventory={inventory}
        onAddItemToInvoice={handleAddItemToInvoice}
        buyerAddress={buyerAddress}
        setBuyerAddress={setBuyerAddress} // This should be the Firestore-aware updateBuyerAddress from page.tsx
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
