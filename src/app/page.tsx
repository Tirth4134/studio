
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, InvoiceLineItem, AppData, BuyerAddress } from '@/types';
import AppHeader from '@/components/layout/app-header';
import InventorySection from '@/components/inventory/inventory-section';
import InvoiceSection from '@/components/invoice/invoice-section';
import ShortcutsDialog from '@/components/shortcuts-dialog';
import { generateInvoiceNumber, generateUniqueId } from '@/lib/invoice-utils';
import { useToast } from '@/hooks/use-toast';
import {
  getInventoryFromFirestore,
  saveInventoryItemToFirestore,
  saveMultipleInventoryItemsToFirestore,
  deleteInventoryItemFromFirestore,
  getAppSettingsFromFirestore,
  saveInvoiceCounterToFirestore,
  saveBuyerAddressToFirestore,
  saveAllAppSettingsToFirestore
} from '@/lib/firebase';

const initialInventoryForSeed: InventoryItem[] = [
  { id: generateUniqueId(), category: "Mobile", name: "iPhone 15 Pro", price: 999.99, stock: 10, description: "The latest iPhone with Pro features." },
  { id: generateUniqueId(), category: "Mobile", name: "Samsung Galaxy S24 Ultra", price: 1199.99, stock: 15, description: "Flagship Android phone from Samsung." },
  { id: generateUniqueId(), category: "Laptop", name: "MacBook Air M3", price: 1099.00, stock: 8, description: "Thin and light laptop with Apple's M3 chip." },
  { id: generateUniqueId(), category: "Accessories", name: "Wireless Charger", price: 49.99, stock: 25, description: "Qi-certified wireless charging pad." },
];

const initialBuyerAddressGlobal: BuyerAddress = {
  name: 'NEELKANTH ELECTRICAL (Placeholder)',
  addressLine1: 'SHOP NO 15 N KARCADE, NR NK-3 IND PARK',
  addressLine2: 'BAKROL (Placeholder)',
  gstin: '24AAXFN4403B1ZH (Placeholder)',
  stateNameAndCode: 'Gujarat, Code: 24 (Placeholder)',
  contact: '9313647568 (Placeholder)',
};

export default function HomePage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([]);
  const [invoiceCounter, setInvoiceCounter] = useState<number>(1);
  const [buyerAddress, setBuyerAddress] = useState<BuyerAddress>(initialBuyerAddressGlobal);
  
  const [activeSection, setActiveSection] = useState('inventory');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const today = new Date();
    setInvoiceDate(today.toLocaleDateString());
  }, []);

  // Fetch initial data from Firestore
  useEffect(() => {
    if (isClient) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const firestoreInventory = await getInventoryFromFirestore();
          const appSettings = await getAppSettingsFromFirestore(initialBuyerAddressGlobal);

          if (firestoreInventory.length === 0 && appSettings.invoiceCounter === 1 && appSettings.buyerAddress.name === initialBuyerAddressGlobal.name) {
            // Firestore is likely empty or new, seed initial data
            await saveMultipleInventoryItemsToFirestore(initialInventoryForSeed);
            setInventory(initialInventoryForSeed);
            // App settings will be the defaults (invoiceCounter: 1, initialBuyerAddress)
            // getAppSettingsFromFirestore already saves these defaults if not present.
            setInvoiceCounter(appSettings.invoiceCounter); 
            setBuyerAddress(appSettings.buyerAddress);   
          } else {
            setInventory(firestoreInventory);
            setInvoiceCounter(appSettings.invoiceCounter);
            setBuyerAddress(appSettings.buyerAddress);
          }
        } catch (error) {
            console.error("Error during initial data fetch and processing:", error);
            // Set to default/empty states if fetching fails, so UI doesn't hang on error.
            setInventory([]);
            setInvoiceCounter(1);
            setBuyerAddress(initialBuyerAddressGlobal);
            toast({
                title: "Loading Error",
                description: "Could not load data from the server. Please check your connection or Firebase setup.",
                variant: "destructive",
                duration: 7000
            });
        } finally {
            setIsLoading(false); 
        }
      };
      fetchData();
    }
  }, [isClient, toast]); // Added toast to dependencies as it's used in catch

  useEffect(() => {
    setCurrentInvoiceNumber(generateInvoiceNumber(invoiceCounter));
  }, [invoiceCounter]);

  const updateInvoiceCounter = async (newCounter: number) => {
    setInvoiceCounter(newCounter);
    await saveInvoiceCounterToFirestore(newCounter);
  };

  const updateBuyerAddress = async (newAddress: BuyerAddress) => {
    setBuyerAddress(newAddress);
    await saveBuyerAddressToFirestore(newAddress);
  };
  
  const updateInventory = async (newInventory: InventoryItem[] | ((prevState: InventoryItem[]) => InventoryItem[])) => {
    if (typeof newInventory === 'function') {
      setInventory(prevState => {
        const updatedState = newInventory(prevState);
        saveMultipleInventoryItemsToFirestore(updatedState).catch(err => {
          console.error("Failed to save updated inventory state", err);
          toast({ title: "Save Error", description: "Could not save inventory changes to the server.", variant: "destructive"});
        });
        return updatedState;
      });
    } else {
      setInventory(newInventory);
      await saveMultipleInventoryItemsToFirestore(newInventory).catch(err => {
          console.error("Failed to save inventory to the server", err);
          toast({ title: "Save Error", description: "Could not save inventory to the server.", variant: "destructive"});
      });
    }
  };


  const handlePrintInvoice = useCallback(() => {
    if (invoiceItems.length === 0) {
      toast({ title: "Cannot Print", description: "Invoice is empty. Add items to print.", variant: "destructive" });
      return;
    }
    window.print();
    updateInvoiceCounter(invoiceCounter + 1);
  }, [invoiceItems.length, invoiceCounter, toast]);


  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const currentInventory = await getInventoryFromFirestore();
      const currentSettings = await getAppSettingsFromFirestore(initialBuyerAddressGlobal);
      
      const appData: AppData = {
        items: currentInventory,
        invoiceCounter: currentSettings.invoiceCounter,
        buyerAddress: currentSettings.buyerAddress,
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
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({ title: "Export Error", description: "Failed to export data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const mapRawItemToInventoryItemEnsuringUniqueId = (
    rawItem: any,
    allExistingItemIds: Set<string>, 
    tempImportedItemIdsForThisBatch: Set<string> 
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

    let finalId = rawItem.id && typeof rawItem.id === 'string' ? rawItem.id : generateUniqueId();
    while (allExistingItemIds.has(finalId) || tempImportedItemIdsForThisBatch.has(finalId)) {
      finalId = generateUniqueId();
    }
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

  const handleImportData = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      toast({ title: "Import Cancelled", description: "No file selected.", variant: "default" });
      return;
    }

    const MAX_FILE_SIZE_MB = 5;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({ title: 'File Too Large', description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`, variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      setIsLoading(true);
      try {
        const result = e.target?.result as string;
        if (!result) throw new Error("File content is empty or unreadable.");
        
        const parsedData = JSON.parse(result);

        let parsedItems: any[] = [];
        let importedInvoiceCounter: number | undefined = undefined;
        let importedBuyerAddress: BuyerAddress | undefined = undefined;

        if (Array.isArray(parsedData)) {
          parsedItems = parsedData;
        } else if (typeof parsedData === 'object' && parsedData !== null) {
          if (Array.isArray(parsedData.items)) parsedItems = parsedData.items;
          if (typeof parsedData.invoiceCounter === 'number') importedInvoiceCounter = parsedData.invoiceCounter;
          if (typeof parsedData.buyerAddress === 'object' && parsedData.buyerAddress !== null) {
             const ba = parsedData.buyerAddress;
             if (ba.name && ba.addressLine1 && ba.gstin && ba.stateNameAndCode && ba.contact) {
                importedBuyerAddress = ba;
             } else {
                toast({ title: "Warning", description: "Buyer address in file is incomplete, skipping.", variant: "default"});
             }
          }
        } else {
          throw new Error("Invalid JSON structure.");
        }

        if (parsedItems.length === 0 && importedInvoiceCounter === undefined && importedBuyerAddress === undefined) {
          toast({ title: "No Valid Data Found", description: "File does not contain items, invoice counter, or buyer address.", variant: "default" });
          setIsLoading(false);
          return;
        }
        
        const currentFirestoreInventory = await getInventoryFromFirestore();
        const newInventoryState = [...currentFirestoreInventory];
        const currentInventoryItemIds = new Set(newInventoryState.map(item => item.id));
        const tempImportedItemIdsForThisBatch = new Set<string>();
        
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        parsedItems.forEach(rawItemFromFile => {
          const combinedExistingIds = new Set([...currentInventoryItemIds, ...tempImportedItemIdsForThisBatch]);
          const importedItem = mapRawItemToInventoryItemEnsuringUniqueId(rawItemFromFile, combinedExistingIds, tempImportedItemIdsForThisBatch);

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
              id: currentItem.id, 
              stock: currentItem.stock + importedItem.stock,
              price: importedItem.price,
              description: importedItem.description,
            };
            updatedCount++;
          } else {
            newInventoryState.push(importedItem);
            currentInventoryItemIds.add(importedItem.id); 
            tempImportedItemIdsForThisBatch.add(importedItem.id);
            addedCount++;
          }
        });
        
        await saveMultipleInventoryItemsToFirestore(newInventoryState);
        setInventory(newInventoryState); 

        if (importedInvoiceCounter !== undefined) {
          await saveInvoiceCounterToFirestore(importedInvoiceCounter);
          setInvoiceCounter(importedInvoiceCounter);
        }
        if (importedBuyerAddress) {
          await saveBuyerAddressToFirestore(importedBuyerAddress);
          setBuyerAddress(importedBuyerAddress);
        }
        
        setInvoiceItems([]); 

        toast({ title: 'Import Complete', description: `Processed ${parsedItems.length} records. Settings updated.`, });
        setTimeout(() => {
          toast({ title: 'Import Summary', description: `Items Added: ${addedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}.`, duration: 7000 });
        }, 1000);

      } catch (error: any) {
        console.error('Error processing imported data:', error);
        toast({ title: 'Import Error', description: `Failed to process data. ${error.message || 'Unknown error'}`, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    };
    reader.readAsText(file);
  };
  
  const handleShowShortcuts = () => setIsShortcutsDialogOpen(true);

  const clearCurrentInvoice = useCallback(async () => {
    if (invoiceItems.length > 0) {
        const inventoryUpdatesMap = new Map<string, number>(); // Store ID and quantity to add back

        invoiceItems.forEach(invoiceItem => {
            inventoryUpdatesMap.set(invoiceItem.id, (inventoryUpdatesMap.get(invoiceItem.id) || 0) + invoiceItem.quantity);
        });

        const currentInventory = await getInventoryFromFirestore();
        const updatedInventoryForFirestore = currentInventory.map(invItem => {
            if (inventoryUpdatesMap.has(invItem.id)) {
                return { ...invItem, stock: invItem.stock + (inventoryUpdatesMap.get(invItem.id) || 0) };
            }
            return invItem;
        });
        
        await saveMultipleInventoryItemsToFirestore(updatedInventoryForFirestore);
        setInventory(updatedInventoryForFirestore); // Update local state
        
        setInvoiceItems([]); // Clear local invoice items
        toast({ title: "New Invoice", description: "Current invoice cleared and stock restored." });
    } else {
        toast({ title: "New Invoice", description: "Invoice is already empty.", variant: "default" });
    }
    // Optionally reset buyer address if it's not meant to persist across new invoices
    // await updateBuyerAddress(initialBuyerAddressGlobal); 
  }, [invoiceItems, toast, setInventory]); // Added setInventory to dependencies

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (ctrlOrCmd && event.key.toLowerCase() === 'p') { event.preventDefault(); handlePrintInvoice(); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'n') { event.preventDefault(); clearCurrentInvoice(); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'i') { event.preventDefault(); setActiveSection('inventory'); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'b') { event.preventDefault(); setActiveSection('invoice'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrintInvoice, clearCurrentInvoice]);

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <p className="mt-4 text-lg text-muted-foreground">Loading Application Data...</p>
      </div>
    );
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
          <InventorySection 
            inventory={inventory} 
            setInventory={updateInventory} 
          />
        )}
        {activeSection === 'invoice' && (
          <InvoiceSection
            inventory={inventory}
            setInventory={updateInventory} 
            invoiceItems={invoiceItems}
            setInvoiceItems={setInvoiceItems} 
            invoiceNumber={currentInvoiceNumber}
            invoiceDate={invoiceDate}
            onPrintInvoice={handlePrintInvoice}
            buyerAddress={buyerAddress}
            setBuyerAddress={updateBuyerAddress} 
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
