"use client";

import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, InvoiceLineItem, AppData } from '@/types';
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

export default function HomePage() {
  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>('inventoryItems', []);
  const [invoiceItems, setInvoiceItems] = useLocalStorage<InvoiceLineItem[]>('currentInvoiceItems', []);
  const [invoiceCounter, setInvoiceCounter] = useLocalStorage<number>('invoiceCounter', 1);
  
  const [activeSection, setActiveSection] = useState('inventory'); // 'inventory' or 'invoice'
  const [invoiceDate, setInvoiceDate] = useState('');
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (inventory.length === 0) {
      setInventory(initialInventory);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount to initialize if empty

  useEffect(() => {
    const today = new Date();
    setInvoiceDate(today.toLocaleDateString());
    setCurrentInvoiceNumber(generateInvoiceNumber(invoiceCounter));
  }, [invoiceCounter]);

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
        if (data.items && Array.isArray(data.items) && typeof data.invoiceCounter === 'number') {
          setInventory(data.items);
          setInvoiceCounter(data.invoiceCounter);
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
    // This function is primarily for the Ctrl+N shortcut
    // It needs to return stock if there are items
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
    // Optionally, generate new invoice number immediately
    setInvoiceCounter(prev => prev + 1); 
  }, [invoiceItems, setInventory, setInvoiceItems, setInvoiceCounter, toast]);


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
