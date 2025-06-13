
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, InvoiceLineItem, AppData, BuyerAddress } from '@/types';
import useLocalStorage from '@/hooks/use-local-storage';
import AppHeader from '@/components/layout/app-header';
import InventorySection from '@/components/inventory/inventory-section';
import InvoiceSection from '@/components/invoice/invoice-section';
import ShortcutsDialog from '@/components/shortcuts-dialog';
import { generateInvoiceNumber, generateUniqueId } from '@/lib/invoice-utils';
import { useToast } from '@/hooks/use-toast';

const initialInventory: InventoryItem[] = [
  { id: generateUniqueId(), category: "Mobile", name: "iPhone 15 Pro", price: 999.99, stock: 10, description: "The latest iPhone with Pro features." },
  { id: generateUniqueId(), category: "Mobile", name: "Samsung Galaxy S24 Ultra", price: 1199.99, stock: 15, description: "Flagship Android phone from Samsung." },
  { id: generateUniqueId(), category: "Laptop", name: "MacBook Air M3", price: 1099.00, stock: 8, description: "Thin and light laptop with Apple's M3 chip." },
  { id: generateUniqueId(), category: "Accessories", name: "Wireless Charger", price: 49.99, stock: 25, description: "Qi-certified wireless charging pad." },
];

const initialBuyerAddress: BuyerAddress = {
  name: 'NEELKANTH ELECTRICAL (Placeholder)',
  addressLine1: 'SHOP NO 15 N KARCADE, NR NK-3 IND PARK',
  addressLine2: 'BAKROL (Placeholder)',
  gstin: '24AAXFN4403B1ZH (Placeholder)',
  stateNameAndCode: 'Gujarat, Code: 24 (Placeholder)',
  contact: '9313647568 (Placeholder)',
};


export default function HomePage() {
  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>('inventoryItems', []);
  const [invoiceItems, setInvoiceItems] = useLocalStorage<InvoiceLineItem[]>('currentInvoiceItems', []);
  const [invoiceCounter, setInvoiceCounter] = useLocalStorage<number>('invoiceCounter', 1);
  const [buyerAddress, setBuyerAddress] = useLocalStorage<BuyerAddress>('currentBuyerAddress', initialBuyerAddress);
  
  const [activeSection, setActiveSection] = useState('inventory'); // 'inventory' or 'invoice'
  const [invoiceDate, setInvoiceDate] = useState('');
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); 
  }, []);


  useEffect(() => {
    if (isClient && inventory.length === 0) {
      setInventory(initialInventory);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, inventory.length, setInventory]); 

  useEffect(() => {
    setCurrentInvoiceNumber(generateInvoiceNumber(invoiceCounter));
  }, [invoiceCounter]);

  useEffect(() => {
    if (isClient) {
      const today = new Date();
      setInvoiceDate(today.toLocaleDateString());
    }
  }, [isClient]);


  const handlePrintInvoice = useCallback(() => {
    if (invoiceItems.length === 0) {
      toast({ title: "Cannot Print", description: "Invoice is empty. Add items to print.", variant: "destructive" });
      return;
    }
    window.print();
    setInvoiceCounter(prev => prev + 1); 
  }, [invoiceItems.length, setInvoiceCounter, toast]);


  const handleExportData = () => {
    const appData: AppData = {
      items: inventory,
      invoiceCounter: invoiceCounter,
      buyerAddress: buyerAddress, 
    };
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoiceflow_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Data exported successfully." });
  };

  const mapRawItemToInventoryItem = (rawItem: any): InventoryItem => {
    return {
      id: String(rawItem.id || generateUniqueId()), // Ensure ID is a string and generate if missing
      category: rawItem.category || 'Uncategorized',
      name: rawItem.name || rawItem.item_name || 'Unnamed Item',
      price: parseFloat(String(rawItem.price)) || 0,
      stock: parseInt(String(rawItem.stock), 10) || 0,
      description: rawItem.description || '',
    };
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsedData = JSON.parse(result);
        let itemsToImport: InventoryItem[] = [];
        let newInvoiceCounter: number | null = null;
        let newBuyerAddress: BuyerAddress | null = null;

        if (Array.isArray(parsedData)) {
          // Case 1: Importing an array of items
          itemsToImport = parsedData.map(mapRawItemToInventoryItem);
        } else if (typeof parsedData === 'object' && parsedData !== null && parsedData.items && Array.isArray(parsedData.items)) {
          // Case 2: Importing an AppData object
          itemsToImport = parsedData.items.map(mapRawItemToInventoryItem);
          if (typeof parsedData.invoiceCounter === 'number') {
            newInvoiceCounter = parsedData.invoiceCounter;
          }
          if (parsedData.buyerAddress && typeof parsedData.buyerAddress === 'object') {
            newBuyerAddress = parsedData.buyerAddress as BuyerAddress;
          }
        } else {
          toast({ title: "Error", description: "Invalid file format. Expected an array of items or an AppData object.", variant: "destructive" });
          return;
        }

        if (itemsToImport.length > 0) {
          setInventory(prevInventory => [...prevInventory, ...itemsToImport]);
        }
        
        if (newInvoiceCounter !== null) {
          setInvoiceCounter(newInvoiceCounter);
        }
        
        if (newBuyerAddress !== null) {
          setBuyerAddress(newBuyerAddress);
        } else if (parsedData.buyerAddress === undefined && !Array.isArray(parsedData)){
          // If AppData object was imported but buyerAddress was explicitly missing, reset it
          setBuyerAddress(initialBuyerAddress);
        }

        setInvoiceItems([]); 
        toast({ title: "Success", description: "Data imported successfully. New items appended. Current invoice cleared." });

      } catch (error) {
        console.error("Import error:", error);
        toast({ title: "Error", description: "Error reading or parsing file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };


  const handleShowShortcuts = () => {
    setIsShortcutsDialogOpen(true);
  };

  const clearCurrentInvoice = useCallback(() => {
    if (invoiceItems.length > 0) {
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
        toast({ title: "New Invoice", description: "Current invoice cleared and stock restored." });
    } else {
        toast({ title: "New Invoice", description: "Invoice is already empty.", variant: "default" });
    }
    setBuyerAddress(initialBuyerAddress); 
  }, [invoiceItems, setInventory, setInvoiceItems, setBuyerAddress, toast]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (ctrlOrCmd && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        handlePrintInvoice();
      } else if (ctrlOrCmd && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        clearCurrentInvoice();
      } else if (ctrlOrCmd && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        setActiveSection('inventory');
      } else if (ctrlOrCmd && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setActiveSection('invoice');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrintInvoice, clearCurrentInvoice]);

  if (!isClient) {
    return null; 
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onPrint={handlePrintInvoice}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onShowShortcuts={handleShowShortcuts}
        onNewInvoice={clearCurrentInvoice} 
      />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {activeSection === 'inventory' && (
          <InventorySection inventory={inventory} setInventory={setInventory} />
        )}
        {activeSection === 'invoice' && (
          <InvoiceSection
            inventory={inventory}
            setInventory={setInventory}
            invoiceItems={invoiceItems}
            setInvoiceItems={setInvoiceItems}
            invoiceNumber={currentInvoiceNumber}
            invoiceDate={invoiceDate}
            onPrintInvoice={handlePrintInvoice}
            onClearInvoice={clearCurrentInvoice}
            buyerAddress={buyerAddress}
            setBuyerAddress={setBuyerAddress}
          />
        )}
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm no-print">
        © {new Date().getFullYear()} InvoiceFlow - Electronic Shop. Powered by Firebase Studio.
      </footer>
      <ShortcutsDialog isOpen={isShortcutsDialogOpen} onOpenChange={setIsShortcutsDialogOpen} />
    </div>
  );
}
