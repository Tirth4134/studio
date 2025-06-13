
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
    allExistingItemIds: Set<string>, // Combined set of current inventory IDs and IDs from this import batch
    tempImportedItemIdsForThisBatch: Set<string> // IDs from items processed *in this current import batch*
  ): InventoryItem | null => {
    const normalizePrice = (price: any): number => {
      if (typeof price === 'number') return price;
      if (typeof price === 'string') {
        const numStr = price.replace(/[^0-9.]/g, '');
        const val = parseFloat(numStr);
        return isNaN(val) ? NaN : val;
      }
      return NaN;
    };
  
    const normalizeStock = (stock: any): number => {
      if (typeof stock === 'number') return Math.floor(stock);
      if (typeof stock === 'string') {
        const val = parseInt(stock, 10);
        return isNaN(val) ? NaN : val;
      }
      return NaN;
    };

    const name = rawItem.name || rawItem.item_name || rawItem.itemName || rawItem['Item Name'];
    const category = rawItem.category || rawItem.Category;
    const price = normalizePrice(rawItem.price || rawItem.Price);
    const stock = normalizeStock(rawItem.stock || rawItem.Stock);
    const description = rawItem.description || rawItem.Description || '';
  
    if (!name || typeof name !== 'string' || name.trim() === '') return null;
    if (isNaN(price) || price < 0) return null;
    if (isNaN(stock) || stock < 0) return null;
    if (!category || typeof category !== 'string' || category.trim() === '') return null;

    let finalId = rawItem.id || generateUniqueId();
    // Ensure ID is unique against ALL known IDs (current inventory + previously processed in this batch)
    while (allExistingItemIds.has(finalId) || tempImportedItemIdsForThisBatch.has(finalId)) {
      finalId = generateUniqueId();
    }
    // Add to this batch's ID set *after* ensuring it's unique against prior items in batch
    tempImportedItemIdsForThisBatch.add(finalId); 
  
    return {
      id: finalId,
      name: name.trim(),
      category: category.trim(),
      price,
      stock,
      description: typeof description === 'string' ? description.trim() : '',
    };
  };


  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    toast({ title: "DEBUG", description: "handleImportData called in page.tsx" }); // <-- DIAGNOSTIC TOAST

    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: "Import Cancelled", description: "No file selected.", variant: "default" });
      if (event.target) {
        (event.target as HTMLInputElement).value = ''; // Reset if no file selected.
      }
      return;
    }

    const MAX_FILE_SIZE_MB = 5;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
        variant: 'destructive',
      });
      if (event.target) {
        (event.target as HTMLInputElement).value = '';
      }
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        if (!result) {
          throw new Error("File content is empty or unreadable.");
        }
        
        const parsedData = JSON.parse(result);
        let parsedItems: any[] = [];
        let importedInvoiceCounter: number | undefined = undefined;
        let importedBuyerAddress: BuyerAddress | undefined = undefined;

        if (Array.isArray(parsedData)) { // Case 1: File is just an array of items
          parsedItems = parsedData;
        } else if (typeof parsedData === 'object' && parsedData !== null) { // Case 2: File is an AppData object
          if (Array.isArray(parsedData.items)) {
            parsedItems = parsedData.items;
          }
          if (typeof parsedData.invoiceCounter === 'number') {
            importedInvoiceCounter = parsedData.invoiceCounter;
          }
          if (typeof parsedData.buyerAddress === 'object' && parsedData.buyerAddress !== null) {
            importedBuyerAddress = parsedData.buyerAddress;
          }
        } else {
          throw new Error("Invalid JSON structure. Expected an array of items or an object with an 'items' array.");
        }

        if (parsedItems.length === 0 && importedInvoiceCounter === undefined && importedBuyerAddress === undefined) {
          toast({ title: "No Data Found", description: "The file does not contain items, invoice counter, or buyer address to import.", variant: "default" });
          return;
        }
        
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        
        // Create a set of all current inventory IDs for uniqueness checks
        const currentInventoryItemIds = new Set(inventory.map(item => item.id));
        const tempImportedItemIdsForThisBatch = new Set<string>(); // Track IDs from items processed in *this current import batch*

        const newInventoryState = [...inventory]; // Start with a copy

        parsedItems.forEach(rawItemFromFile => {
          // When checking uniqueness for an item, consider both current inventory IDs AND IDs already used in this import batch
          const combinedExistingIds = new Set([...currentInventoryItemIds, ...tempImportedItemIdsForThisBatch]);
          
          const importedItem = mapRawItemToInventoryItemEnsuringUniqueId(
            rawItemFromFile,
            combinedExistingIds, // Pass the combined set of all known IDs
            tempImportedItemIdsForThisBatch // This set will be updated by mapRawItem...
          );

          if (!importedItem) {
            skippedCount++;
            return;
          }

          const existingItemIndex = newInventoryState.findIndex(
            invItem => invItem.name.toLowerCase() === importedItem.name.toLowerCase() &&
                       invItem.category.toLowerCase() === importedItem.category.toLowerCase()
          );

          if (existingItemIndex !== -1) {
            const currentItem = newInventoryState[existingItemIndex];
            newInventoryState[existingItemIndex] = {
              ...currentItem,
              stock: currentItem.stock + importedItem.stock,
              price: importedItem.price, 
              description: importedItem.description,
            };
            updatedCount++;
          } else {
            newInventoryState.push(importedItem);
            // The new ID is already added to tempImportedItemIdsForThisBatch inside mapRawItem...
            // Add it to currentInventoryItemIds as well for subsequent checks in this loop if needed,
            // though mapRawItem... already consults tempImportedItemIdsForThisBatch.
            currentInventoryItemIds.add(importedItem.id); 
            addedCount++;
          }
        });

        setInventory(newInventoryState);

        if (importedInvoiceCounter !== undefined) {
          setInvoiceCounter(importedInvoiceCounter);
        }
        if (importedBuyerAddress) {
          setBuyerAddress(importedBuyerAddress);
        }
        setInvoiceItems([]);

        toast({
          title: 'Import Complete',
          description: `Processed ${parsedItems.length} records from file.`,
        });

        setTimeout(() => {
          toast({
            title: 'Import Summary',
            description: `Items Added: ${addedCount}, Items Updated: ${updatedCount}, Items Skipped: ${skippedCount}. Settings updated if present. Current invoice cleared.`,
            duration: 7000,
          });
        }, 1000);

      } catch (error: any) {
        console.error('Error processing imported data:', error);
        toast({
          title: 'Import Error',
          description: `Failed to process data. ${error.message || 'Unknown error'}`,
          variant: 'destructive',
        });
      } finally {
        if (event.target) {
          (event.target as HTMLInputElement).value = '';
        }
      }
    };

    reader.onerror = () => {
      toast({
        title: 'File Read Error',
        description: 'Could not read the selected file.',
        variant: 'destructive',
      });
      if (event.target) {
        (event.target as HTMLInputElement).value = '';
      }
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

