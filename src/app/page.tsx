
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
    setIsClient(true); // Signal that component has mounted on client
  }, []);


  useEffect(() => {
    // Initialize inventory with default items only on the client,
    // and only if the inventory (from localStorage or defaultValue) is currently empty.
    if (isClient && inventory.length === 0) {
      setInventory(initialInventory);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, inventory.length, setInventory]); // Depend on inventory.length to re-check if it becomes empty

  useEffect(() => {
    const today = new Date();
    setInvoiceDate(today.toLocaleDateString()); // This can cause hydration mismatch if server and client locales differ for date.
                                               // Consider formatting date consistently or doing it client-side only.
    setCurrentInvoiceNumber(generateInvoiceNumber(invoiceCounter));
  }, [invoiceCounter]);

  // To prevent hydration mismatch for invoiceDate due to locale differences:
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
    // Increment invoice counter after successful print intent. Actual success isn't tracked.
    setInvoiceCounter(prev => prev + 1); 
  }, [invoiceItems.length, setInvoiceCounter, toast]);


  const handleExportData = () => {
    const appData: AppData = {
      items: inventory,
      invoiceCounter: invoiceCounter,
      buyerAddress: buyerAddress, // Include buyer address in export
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

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result) as AppData;
        // Check for core properties and optionally for buyerAddress
        if (data.items && Array.isArray(data.items) && typeof data.invoiceCounter === 'number') {
          setInventory(data.items);
          setInvoiceCounter(data.invoiceCounter);
          if (data.buyerAddress) { // If buyerAddress exists in imported file, use it
            setBuyerAddress(data.buyerAddress);
          } else { // Otherwise, reset to initial or keep current
            setBuyerAddress(initialBuyerAddress); // Or keep current: remove this line
          }
          setInvoiceItems([]); // Clear current invoice on import
          toast({ title: "Success", description: "Data imported successfully. Current invoice cleared." });
        } else {
          toast({ title: "Error", description: "Invalid file format.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Import error:", error);
        toast({ title: "Error", description: "Error reading or parsing file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
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
        toast({ title: "New Invoice", description: "Current invoice cleared." });
    } else {
        toast({ title: "New Invoice", description: "Invoice is already empty.", variant: "default" });
    }
    setBuyerAddress(initialBuyerAddress); // Reset buyer address for new invoice
    // setInvoiceCounter(prev => prev + 1); // This was moved to print
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

  // Render a placeholder or null until the client has mounted
  // This helps ensure the initial client render matches the server render for components
  // that rely heavily on client-side state like localStorage.
  if (!isClient) {
    // You can return a loader or null. For this app, returning null might be okay
    // as the main structure is simple. Or a basic skeleton.
    // For InventoryTable, the server renders "No items..." if inventory is empty.
    // The updated useLocalStorage ensures client's initial inventory is also empty.
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
