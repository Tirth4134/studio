
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

  const mapRawItemToInventoryItemEnsuringUniqueId = (
    rawItem: any,
    allExistingItemIds: Set<string>, 
    tempImportedItemIdsForThisBatch: Set<string> 
  ): InventoryItem | null => {
    const normalizePrice = (price: any): number => {
      if (typeof price === 'number') return price;
      if (typeof price === 'string') {
        const numStr = price.replace(/[^0-9.]/g, ''); // Allow only digits and decimal point
        const val = parseFloat(numStr);
        return isNaN(val) ? NaN : val; 
      }
      return NaN; // Return NaN if price is not a number or string
    };
  
    const normalizeStock = (stock: any): number => {
      if (typeof stock === 'number') return Math.floor(stock); // Ensure integer for stock
      if (typeof stock === 'string') {
        const val = parseInt(stock, 10);
        return isNaN(val) ? NaN : val;
      }
      return NaN; // Return NaN if stock is not a number or string
    };

    const name = rawItem.name || rawItem.item_name || rawItem.itemName || rawItem['Item Name'];
    const category = rawItem.category || rawItem.Category;
    const price = normalizePrice(rawItem.price || rawItem.Price);
    const stock = normalizeStock(rawItem.stock || rawItem.Stock);
    const description = rawItem.description || rawItem.Description || '';
  
    if (!name || typeof name !== 'string' || name.trim() === '') return null;
    // Ensure price and stock are valid numbers and non-negative
    if (isNaN(price) || price < 0) return null;
    if (isNaN(stock) || stock < 0) return null; 
    if (!category || typeof category !== 'string' || category.trim() === '') return null;

    let finalId = rawItem.id || generateUniqueId();
    // Ensure unique ID across all existing items and those already processed in this batch
    while (allExistingItemIds.has(finalId) || tempImportedItemIdsForThisBatch.has(finalId)) {
      finalId = generateUniqueId();
    }
    tempImportedItemIdsForThisBatch.add(finalId); // Record this ID as used for this batch
  
    return {
      id: finalId,
      name: name.trim(),
      category: category.trim(),
      price,
      stock,
      description: typeof description === 'string' ? description.trim() : '',
    };
  };


  const handleImportData = (files: FileList | null) => { // Changed signature to accept FileList | null
    toast({ title: "DEBUG", description: "handleImportData called in page.tsx", variant: "default", duration: 5000 }); 

    const file = files?.[0]; // Get file from FileList
    if (!file) {
      toast({ title: "Import Cancelled", description: "No file selected or file list empty.", variant: "default" });
      // No event.target to reset here as it's handled in AppHeader
      return;
    }

    const MAX_FILE_SIZE_MB = 5;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
        variant: 'destructive',
      });
      // No event.target to reset here
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      toast({ title: "DEBUG", description: "FileReader onload triggered.", variant: "default", duration: 5000 });
      try {
        const result = e.target?.result as string;
        if (!result) {
          throw new Error("File content is empty or unreadable.");
        }
        toast({ title: "DEBUG", description: "File content read.", variant: "default", duration: 5000 });
        
        const parsedData = JSON.parse(result);
        toast({ title: "DEBUG", description: "JSON parsed.", variant: "default", duration: 5000 });

        let parsedItems: any[] = [];
        let importedInvoiceCounter: number | undefined = undefined;
        let importedBuyerAddress: BuyerAddress | undefined = undefined;

        // Check if parsedData is an object and has an 'items' array (standard format)
        // or if it's directly an array of items (simple format)
        if (Array.isArray(parsedData)) { 
          // Handles case where JSON is just an array of items
          parsedItems = parsedData;
        } else if (typeof parsedData === 'object' && parsedData !== null) { 
          // Handles AppData format
          if (Array.isArray(parsedData.items)) {
            parsedItems = parsedData.items;
          }
          if (typeof parsedData.invoiceCounter === 'number') {
            importedInvoiceCounter = parsedData.invoiceCounter;
          }
          // Validate buyerAddress structure more carefully
          if (typeof parsedData.buyerAddress === 'object' && parsedData.buyerAddress !== null) {
             const ba = parsedData.buyerAddress;
             if (ba.name && ba.addressLine1 && ba.gstin && ba.stateNameAndCode && ba.contact) { // Basic check
                importedBuyerAddress = ba;
             } else {
                toast({ title: "Warning", description: "Buyer address in file is incomplete, skipping.", variant: "default"});
             }
          }
        } else {
          throw new Error("Invalid JSON structure. Expected an array of items or an object with an 'items' array.");
        }

        if (parsedItems.length === 0 && importedInvoiceCounter === undefined && importedBuyerAddress === undefined) {
          toast({ title: "No Valid Data Found", description: "The file does not contain items, invoice counter, or buyer address to import.", variant: "default" });
          return;
        }
        
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        
        const currentInventoryItemIds = new Set(inventory.map(item => item.id));
        const tempImportedItemIdsForThisBatch = new Set<string>(); // To track IDs used *within this import batch* to ensure uniqueness if file has duplicate IDs

        const newInventoryState = [...inventory]; // Start with a copy of current inventory

        parsedItems.forEach(rawItemFromFile => {
          // For ID uniqueness check, consider IDs already in inventory AND IDs of items already processed *from this file*
          const combinedExistingIds = new Set([...currentInventoryItemIds, ...tempImportedItemIdsForThisBatch]);
          
          const importedItem = mapRawItemToInventoryItemEnsuringUniqueId(
            rawItemFromFile,
            combinedExistingIds, // Pass the combined set of all known IDs
            tempImportedItemIdsForThisBatch // Pass the set for items processed in this batch
          );

          if (!importedItem) {
            skippedCount++;
            return; // Skip this item if it's invalid
          }

          // Check if item (by name and category, case-insensitive) already exists
          const existingItemIndex = newInventoryState.findIndex(
            invItem => invItem.name.toLowerCase() === importedItem.name.toLowerCase() &&
                       invItem.category.toLowerCase() === importedItem.category.toLowerCase()
          );

          if (existingItemIndex !== -1) {
            // Item exists, update it
            const currentItem = newInventoryState[existingItemIndex];
            newInventoryState[existingItemIndex] = {
              ...currentItem, // Keep existing ID and other unmentioned fields
              stock: currentItem.stock + importedItem.stock, // Add to existing stock
              price: importedItem.price, // Update price from imported file
              description: importedItem.description, // Update description
            };
            updatedCount++;
          } else {
            // Item is new, add it
            newInventoryState.push(importedItem);
            currentInventoryItemIds.add(importedItem.id); // Add new ID to the main set for future checks within this loop
            addedCount++;
          }
        });
        
        toast({ title: "DEBUG", description: "Preparing to set inventory.", variant: "default", duration: 5000 });
        setInventory(newInventoryState);
        toast({ title: "DEBUG", description: "Inventory set.", variant: "default", duration: 5000 });


        if (importedInvoiceCounter !== undefined) {
          toast({ title: "DEBUG", description: "Preparing to set invoice counter.", variant: "default", duration: 5000 });
          setInvoiceCounter(importedInvoiceCounter);
          toast({ title: "DEBUG", description: "Invoice counter set.", variant: "default", duration: 5000 });
        }
        if (importedBuyerAddress) {
          toast({ title: "DEBUG", description: "Preparing to set buyer address.", variant: "default", duration: 5000 });
          setBuyerAddress(importedBuyerAddress);
          toast({ title: "DEBUG", description: "Buyer address set.", variant: "default", duration: 5000 });
        }
        
        toast({ title: "DEBUG", description: "Preparing to clear current invoice items.", variant: "default", duration: 5000 });
        setInvoiceItems([]); // Clear current invoice items
        toast({ title: "DEBUG", description: "Current invoice items cleared.", variant: "default", duration: 5000 });


        toast({
          title: 'Import Complete',
          description: `Processed ${parsedItems.length} item records from file. Settings updated if present.`,
        });

        // Delayed toast for summary to ensure it's noticeable
        setTimeout(() => {
          toast({
            title: 'Import Summary',
            description: `Items Added: ${addedCount}, Items Updated: ${updatedCount}, Items Skipped: ${skippedCount}. Current invoice cleared.`,
            duration: 7000, // Longer duration for summary
          });
        }, 1000); // 1 second delay

      } catch (error: any) {
        console.error('Error processing imported data:', error);
        toast({
          title: 'Import Error',
          description: `Failed to process data. ${error.message || 'Unknown error'}`,
          variant: 'destructive',
        });
      } finally {
        // File input reset is now handled in AppHeader.tsx
      }
    };

    reader.onerror = () => {
      toast({
        title: 'File Read Error',
        description: 'Could not read the selected file.',
        variant: 'destructive',
      });
      // File input reset is now handled in AppHeader.tsx
    };

    reader.readAsText(file);
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
    setBuyerAddress(initialBuyerAddress); // Reset buyer address to initial on new invoice
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
        onImportData={handleImportData} // Prop now expects FileList | null
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
