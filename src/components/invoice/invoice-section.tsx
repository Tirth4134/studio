
"use client";

import type { InventoryItem, InvoiceLineItem, BuyerAddress, BuyerProfile } from '@/types';
import CreateInvoiceForm from './create-invoice-form';
import InvoicePreview from './invoice-preview';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';

interface InvoiceSectionProps {
  inventory: InventoryItem[];
  setInventory: (inventoryOrUpdater: InventoryItem[] | ((prevState: InventoryItem[]) => InventoryItem[])) => Promise<void> | void;
  invoiceItems: InvoiceLineItem[];
  setInvoiceItems: Dispatch<SetStateAction<InvoiceLineItem[]>>;
  invoiceNumber: string;
  invoiceDate: string;
  onPrintInvoice: () => void;
  buyerAddress: BuyerAddress;
  setBuyerAddress: (addressOrUpdater: BuyerAddress | ((prevState: BuyerAddress) => BuyerAddress)) => Promise<void> | void;
  onLookupBuyerByGSTIN: (gstin: string) => Promise<void>;
  onLookupBuyerByName: (nameQuery: string) => Promise<void>;
  searchedBuyerProfiles: BuyerProfile[];
  clearSearchedBuyerProfiles: () => void;
  isPrinting: boolean;
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
  onLookupBuyerByGSTIN,
  onLookupBuyerByName,
  searchedBuyerProfiles,
  clearSearchedBuyerProfiles,
  isPrinting,
}: InvoiceSectionProps) {
  const { toast } = useToast();

  const handleAddItemToInvoice = async (itemToAdd: Omit<InvoiceLineItem, 'total'>) => {
    const existingItemIndex = invoiceItems.findIndex(invItem => invItem.id === itemToAdd.id);
    const inventoryItem = inventory.find(inv => inv.id === itemToAdd.id);

    if (!inventoryItem) {
      toast({ title: "Error", description: "Selected item not found in inventory.", variant: "destructive" });
      return;
    }

    const newItemLine: InvoiceLineItem = {
      ...itemToAdd,
      total: itemToAdd.price * itemToAdd.quantity,
      hsnSac: inventoryItem.hsnSac,
      gstRate: inventoryItem.gstRate,
    };

    if (existingItemIndex !== -1) {
      setInvoiceItems(prevItems =>
        prevItems.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + newItemLine.quantity,
                total: item.price * (item.quantity + newItemLine.quantity),
              }
            : item
        )
      );
    } else {
      setInvoiceItems(prevItems => [...prevItems, newItemLine]);
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

  const handleRemoveItemFromInvoice = async (itemIdToRemove: string, quantityToReturn: number) => {
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

    setInventory(prevInventory => 
      prevInventory.map(invItem => {
        if (stockToRestore[invItem.id]) {
            return { ...invItem, stock: invItem.stock + stockToRestore[invItem.id] };
        }
        return invItem;
      })
    );
    
    setInvoiceItems([]);
    toast({ title: "Success", description: "Invoice cleared and stock restored." });
  };

  return (
    <div className="space-y-6">
      <CreateInvoiceForm
        inventory={inventory}
        onAddItemToInvoice={(item) => handleAddItemToInvoice(item as Omit<InvoiceLineItem, 'total'>)}
        buyerAddress={buyerAddress}
        setBuyerAddress={setBuyerAddress}
        onLookupBuyerByGSTIN={onLookupBuyerByGSTIN}
        onLookupBuyerByName={onLookupBuyerByName}
        searchedBuyerProfiles={searchedBuyerProfiles}
        clearSearchedBuyerProfiles={clearSearchedBuyerProfiles}
      />
      <InvoicePreview
        invoiceItems={invoiceItems}
        invoiceNumber={invoiceNumber}
        invoiceDate={invoiceDate}
        onRemoveItem={handleRemoveItemFromInvoice}
        onClearInvoice={handleClearInvoice}
        onPrintInvoice={onPrintInvoice}
        buyerAddress={buyerAddress}
        isPrinting={isPrinting}
      />
    </div>
  );
}

