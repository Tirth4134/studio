
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, InvoiceLineItem, AppData, BuyerAddress, SalesRecord, Invoice, BuyerProfile } from '@/types';
import AppHeader from '@/components/layout/app-header';
import InventorySection from '@/components/inventory/inventory-section';
import InvoiceSection from '@/components/invoice/invoice-section';
import ReportsSection from '@/components/reports/reports-section'; 
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
  saveBuyerAddressToAppSettings,
  saveAllAppSettingsToFirestore,
  saveBuyerProfile,
  getBuyerProfileByGSTIN,
  getBuyerProfilesByName, 
  saveSalesRecordsToFirestore,
  saveInvoiceToFirestore, 
  getInvoicesFromFirestore,
  updateInvoiceInFirestore
} from '@/lib/firebase';

const todayForSeed = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

const initialInventoryForSeed: InventoryItem[] = [
  { id: generateUniqueId(), category: "Mobile", name: "iPhone 15 Pro", buyingPrice: 800, price: 999.99, stock: 10, description: "The latest iPhone with Pro features.", purchaseDate: todayForSeed, hsnSac: "851712", gstRate: 18 },
  { id: generateUniqueId(), category: "Mobile", name: "Samsung Galaxy S24 Ultra", buyingPrice: 950, price: 1199.99, stock: 15, description: "Flagship Android phone from Samsung.", purchaseDate: todayForSeed, hsnSac: "851712", gstRate: 18 },
  { id: generateUniqueId(), category: "Laptop", name: "MacBook Air M3", buyingPrice: 900, price: 1099.00, stock: 8, description: "Thin and light laptop with Apple's M3 chip.", purchaseDate: todayForSeed, hsnSac: "847130", gstRate: 18 },
  { id: generateUniqueId(), category: "Accessories", name: "Wireless Charger", buyingPrice: 25, price: 49.99, stock: 25, description: "Qi-certified wireless charging pad.", purchaseDate: todayForSeed, hsnSac: "850440", gstRate: 12 },
];

const initialBuyerAddressGlobal: BuyerAddress = {
  name: 'NEELKANTH ELECTRICAL (Placeholder)',
  addressLine1: 'SHOP NO 15 N KARCADE, NR NK-3 IND PARK',
  addressLine2: 'BAKROL (Placeholder)',
  gstin: '24AAXFN4403B1ZH (Placeholder)',
  stateNameAndCode: 'Gujarat, Code: 24 (Placeholder)',
  contact: '9313647568 (Placeholder)',
  email: 'contact@neelkanth.com (Placeholder)',
};

export default function HomePage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([]);
  const [invoiceCounter, setInvoiceCounter] = useState<number>(1);
  const [buyerAddress, setBuyerAddress] = useState<BuyerAddress>(initialBuyerAddressGlobal);
  const [pastInvoices, setPastInvoices] = useState<Invoice[]>([]);
  const [activeSection, setActiveSection] = useState('inventory'); 
  const [invoiceDate, setInvoiceDate] = useState('');
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchedBuyerProfiles, setSearchedBuyerProfiles] = useState<BuyerProfile[]>([]);


  useEffect(() => {
    setIsClient(true);
    const today = new Date();
    setInvoiceDate(today.toLocaleDateString('en-CA')); 
  }, []);

  const fetchPastInvoices = useCallback(async () => {
    try {
      const fetchedInvoices = await getInvoicesFromFirestore();
      setPastInvoices(fetchedInvoices);
    } catch (error: any) {
      console.error("HomePage: Error fetching past invoices:", error);
      toast({ title: "Error", description: `Could not fetch past invoices. ${error.message}`, variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if (isClient) {
      const fetchData = async () => {
        console.log("HomePage: fetchData triggered");
        setIsLoading(true); 
        try {
          const firestoreInventory = await getInventoryFromFirestore();
          console.log("HomePage: Fetched inventory from Firestore:", firestoreInventory);
          const appSettings = await getAppSettingsFromFirestore(initialBuyerAddressGlobal);
          console.log("HomePage: Fetched app settings from Firestore:", appSettings);
          await fetchPastInvoices(); 

          if (firestoreInventory.length === 0 && appSettings.invoiceCounter === 1 && appSettings.buyerAddress.name === initialBuyerAddressGlobal.name) {
            toast({
                title: "Initializing Database",
                description: "No existing data found. Seeding with default data...",
                variant: "default",
                duration: 5000,
            });
            console.log("HomePage: Firestore is empty, seeding with initial data:", initialInventoryForSeed);
            await saveMultipleInventoryItemsToFirestore(initialInventoryForSeed);
            const initialSettingsToSave = {
                invoiceCounter: 1,
                buyerAddress: initialBuyerAddressGlobal
            };
            await saveAllAppSettingsToFirestore(initialSettingsToSave);
            console.log("HomePage: Initial data seeded to Firestore.");
            
            setInventory(initialInventoryForSeed);
            setInvoiceCounter(initialSettingsToSave.invoiceCounter); 
            setBuyerAddress(initialSettingsToSave.buyerAddress);
            toast({
                title: "Application Initialized",
                description: "Default data loaded into the database.",
                variant: "default",
                duration: 3000,
            });   
          } else {
            setInventory(firestoreInventory);
            setInvoiceCounter(appSettings.invoiceCounter);
            setBuyerAddress(appSettings.buyerAddress); 
             toast({
                title: "Data Loaded",
                description: "Successfully fetched data from Firestore.",
                variant: "default",
                duration: 3000,
            });
          }
        } catch (error: any) {
            console.error("HomePage: Error during initial data fetch or processing:", error);
            setInventory([]); 
            setInvoiceCounter(1); 
            setBuyerAddress(initialBuyerAddressGlobal); 
            toast({
                title: "Data Loading Error",
                description: `Could not load data from Firestore. Using defaults. Error: ${error.message || 'Unknown error'}`,
                variant: "destructive",
                duration: 7000
            });
        } finally {
            setIsLoading(false); 
            console.log("HomePage: fetchData finished, isLoading set to false.");
        }
      };
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, toast, fetchPastInvoices]); 

  useEffect(() => {
    setCurrentInvoiceNumber(generateInvoiceNumber(invoiceCounter));
  }, [invoiceCounter]);

  const updateInvoiceCounter = async (newCounter: number) => {
    setInvoiceCounter(newCounter);
    await saveInvoiceCounterToFirestore(newCounter);
  };
  
  const updateInventory = async (newInventory: InventoryItem[] | ((prevState: InventoryItem[]) => InventoryItem[])) => {
    console.log("HomePage: updateInventory called.");
    let finalInventoryToSave: InventoryItem[];
    if (typeof newInventory === 'function') {
      console.log("HomePage: updateInventory called with a function.");
      setInventory(prevState => {
        const updatedState = newInventory(prevState);
        finalInventoryToSave = updatedState;
        console.log("HomePage: Inventory state updated (functional update). Items to save:", finalInventoryToSave.length);
        saveMultipleInventoryItemsToFirestore(finalInventoryToSave).catch(err => {
          console.error("HomePage: Failed to save updated inventory state to Firestore (functional update)", err);
          toast({ title: "Database Save Error", description: `Could not save inventory changes to the database. ${(err as Error).message}`, variant: "destructive"});
        });
        return updatedState;
      });
    } else {
      console.log("HomePage: updateInventory called with a direct value.");
      finalInventoryToSave = newInventory;
      console.log("HomePage: Inventory state updated (direct set). Items to save:", finalInventoryToSave.length);
      setInventory(newInventory);
      await saveMultipleInventoryItemsToFirestore(finalInventoryToSave).catch(err => {
          console.error("HomePage: Failed to save inventory to Firestore (direct set)", err);
          toast({ title: "Database Save Error", description: `Could not save inventory to the database. ${(err as Error).message}`, variant: "destructive"});
      });
    }
  };

  const handlePrintInvoice = useCallback(async () => {
    if (invoiceItems.length === 0) {
      toast({ title: "Cannot Print", description: "Invoice is empty. Add items to print.", variant: "destructive" });
      return;
    }

    const validGstin = buyerAddress.gstin && buyerAddress.gstin.trim() !== "" && !buyerAddress.gstin.includes("(Placeholder)");
    if (validGstin) {
      try {
        await saveBuyerProfile(buyerAddress.gstin, buyerAddress);
        toast({ title: "Buyer Profile Saved", description: `Details for GSTIN ${buyerAddress.gstin} stored.`, variant: "default", duration: 3000});
      } catch (error) {
        console.error("Error saving buyer profile:", error);
        toast({ title: "Profile Save Error", description: `Could not save buyer profile. Error: ${(error as Error).message}`, variant: "destructive"});
      }
    } else {
         toast({ title: "Info", description: `Buyer profile not saved: GSTIN is empty or placeholder.`, variant: "default", duration: 3000});
    }

    const salesRecordsToSave: SalesRecord[] = [];
    for (const invoiceItem of invoiceItems) {
      const inventoryItem = inventory.find(inv => inv.id === invoiceItem.id);
      if (inventoryItem) {
        const profit = (invoiceItem.price - inventoryItem.buyingPrice) * invoiceItem.quantity;
        salesRecordsToSave.push({
          id: generateUniqueId(), 
          invoiceNumber: currentInvoiceNumber,
          saleDate: invoiceDate,
          itemId: invoiceItem.id,
          itemName: invoiceItem.name,
          category: inventoryItem.category, 
          quantitySold: invoiceItem.quantity,
          sellingPricePerUnit: invoiceItem.price,
          buyingPricePerUnit: inventoryItem.buyingPrice,
          totalProfit: profit,
        });
      } else {
        console.warn(`Could not find inventory item with ID ${invoiceItem.id} to record sale.`);
      }
    }

    if (salesRecordsToSave.length > 0) {
      try {
        await saveSalesRecordsToFirestore(salesRecordsToSave);
        toast({ title: "Sales Recorded", description: `${salesRecordsToSave.length} item sales recorded successfully for profit tracking.`, variant: "default", duration: 4000 });
      } catch (error) {
        console.error("Error saving sales records:", error);
        toast({ title: "Sales Record Error", description: `Could not save sales details for profit tracking. Error: ${(error as Error).message}`, variant: "destructive"});
      }
    }
    
    const subTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    let totalTaxAmount = 0;
    invoiceItems.forEach(item => {
        const itemGstRate = item.gstRate === undefined || item.gstRate === null || isNaN(item.gstRate) ? 0 : item.gstRate;
        totalTaxAmount += item.total * (itemGstRate / 100);
    });
    const grandTotal = subTotal + totalTaxAmount;

    const invoiceToSave: Invoice = {
      invoiceNumber: currentInvoiceNumber,
      invoiceDate: invoiceDate,
      buyerGstin: buyerAddress.gstin, 
      buyerName: buyerAddress.name,
      buyerAddress: buyerAddress,
      items: invoiceItems,
      subTotal: subTotal,
      taxAmount: totalTaxAmount,
      grandTotal: grandTotal,
      amountPaid: 0, 
      status: 'Unpaid', 
    };

    try {
      await saveInvoiceToFirestore(invoiceToSave);
      toast({ title: "Invoice Saved", description: `Invoice ${currentInvoiceNumber} saved successfully.`, variant: "default" });
      setPastInvoices(prev => [invoiceToSave, ...prev].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime() || b.invoiceNumber.localeCompare(a.invoiceNumber)));
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({ title: "Invoice Save Error", description: `Could not save invoice ${currentInvoiceNumber}. Error: ${(error as Error).message}`, variant: "destructive"});
    }


    window.print();
    updateInvoiceCounter(invoiceCounter + 1);
    getAppSettingsFromFirestore(initialBuyerAddressGlobal).then(settings => setBuyerAddress(settings.buyerAddress));


  }, [invoiceItems, inventory, currentInvoiceNumber, invoiceDate, invoiceCounter, toast, buyerAddress]);

  const lookupBuyerByGstin = async (gstin: string) => {
    if (!gstin || gstin.trim() === "") {
      toast({ title: "Info", description: "GSTIN cannot be empty for lookup.", variant: "default" });
      return;
    }
    setIsLoading(true);
    try {
      const profile = await getBuyerProfileByGSTIN(gstin);
      if (profile) {
        const completeProfile: BuyerAddress = {
            name: profile.name || '',
            addressLine1: profile.addressLine1 || '',
            addressLine2: profile.addressLine2 || '',
            gstin: profile.gstin, 
            stateNameAndCode: profile.stateNameAndCode || '',
            contact: profile.contact || '',
            email: profile.email || '', 
        };
        setBuyerAddress(completeProfile); 
        // No need to call saveBuyerAddressToAppSettings here, as this is a lookup for current invoice.
        // It will be saved with the buyer profile when printing.
        toast({ title: "Buyer Found", description: `Details for ${profile.name || 'Buyer'} loaded.`, variant: "default" });
        setSearchedBuyerProfiles([]); 
      } else {
        toast({ title: "Buyer Not Found", description: "No existing profile for this GSTIN. Please enter details manually.", variant: "default" });
        setBuyerAddress(prev => ({
          ...initialBuyerAddressGlobal, 
          gstin: gstin.trim().toUpperCase(), 
          name: '', 
          addressLine1: '',
          addressLine2: '',
          stateNameAndCode: '',
          contact: '',
          email: ''
        }));
        setSearchedBuyerProfiles([]); 
      }
    } catch (error) {
      console.error("Error looking up buyer by GSTIN:", error);
      toast({ title: "Lookup Error", description: `Could not fetch buyer details. Error: ${(error as Error).message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const lookupBuyerProfilesByName = async (nameQuery: string) => {
    if (!nameQuery || nameQuery.trim() === "") {
      toast({ title: "Info", description: "Company name cannot be empty for lookup.", variant: "default" });
      setSearchedBuyerProfiles([]);
      return;
    }
    setIsLoading(true);
    try {
      const profiles = await getBuyerProfilesByName(nameQuery);
      if (profiles.length > 0) {
        setSearchedBuyerProfiles(profiles);
        if (profiles.length === 1) { 
          const singleProfile = profiles[0];
           const completeProfile: BuyerAddress = {
              name: singleProfile.name || '',
              addressLine1: singleProfile.addressLine1 || '',
              addressLine2: singleProfile.addressLine2 || '',
              gstin: singleProfile.gstin, 
              stateNameAndCode: singleProfile.stateNameAndCode || '',
              contact: singleProfile.contact || '',
              email: singleProfile.email || '', 
          };
          setBuyerAddress(completeProfile);
          // No need to call saveBuyerAddressToAppSettings here for same reason as GSTIN lookup
          toast({ title: "Buyer Found", description: `Details for ${singleProfile.name} loaded.`, variant: "default" });
          setSearchedBuyerProfiles([]); 
        } else {
          toast({ title: "Multiple Buyers Found", description: `Found ${profiles.length} profiles. Please select one.`, variant: "default" });
        }
      } else {
        setSearchedBuyerProfiles([]);
        toast({ title: "No Buyers Found", description: "No profiles match this company name. Please enter details manually.", variant: "default" });
      }
    } catch (error) {
      console.error("Error looking up buyer by name:", error);
      toast({ title: "Lookup Error", description: `Could not fetch buyer details by name. Error: ${(error as Error).message}`, variant: "destructive" });
      setSearchedBuyerProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };


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
      toast({ title: "Export Error", description: `Failed to export data. Error: ${(error as Error).message}`, variant: "destructive" });
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
    const sellingPrice = normalizePrice(rawItem.price || rawItem.Price || rawItem.sellingPrice);
    const buyingPrice = normalizePrice(rawItem.buyingPrice || rawItem.costPrice || rawItem.cost_price || 0); 
    const stock = normalizeStock(rawItem.stock || rawItem.Stock);
    const description = rawItem.description || rawItem.Description || '';
    const purchaseDate = rawItem.purchaseDate || rawItem.purchase_date;
    const hsnSac = rawItem.hsnSac || rawItem.hsn_sac || rawItem.HSN_SAC || '';
    const gstRate = normalizePrice(rawItem.gstRate || rawItem.gst_rate || rawItem.GSTRate);


    if (!name || typeof name !== 'string' || name.trim() === '') return null;
    if (isNaN(sellingPrice) || sellingPrice < 0) return null;
    if (isNaN(buyingPrice) || buyingPrice < 0) return null; 
    if (isNaN(stock) || stock < 0) return null; 
    if (!category || typeof category !== 'string' || category.trim() === '') return null;
    if (gstRate !== undefined && (isNaN(gstRate) || gstRate < 0 || gstRate > 100)) return null;


    let finalId = rawItem.id && typeof rawItem.id === 'string' ? rawItem.id : generateUniqueId();
    while (allExistingItemIds.has(finalId) || tempImportedItemIdsForThisBatch.has(finalId)) {
      finalId = generateUniqueId();
    }
    tempImportedItemIdsForThisBatch.add(finalId);

    const validatedPurchaseDate = typeof purchaseDate === 'string' && purchaseDate.match(/^\d{4}-\d{2}-\d{2}$/) 
                                 ? purchaseDate 
                                 : new Date().toLocaleDateString('en-CA');
  
    return {
      id: finalId,
      name: name.trim(),
      category: category.trim(),
      buyingPrice: buyingPrice,
      price: sellingPrice,
      stock,
      description: typeof description === 'string' ? description.trim() : '',
      purchaseDate: validatedPurchaseDate,
      hsnSac: typeof hsnSac === 'string' ? hsnSac.trim() : undefined,
      gstRate: gstRate === undefined || isNaN(gstRate) ? undefined : gstRate,
    };
  };

  const handleImportData = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      toast({ title: "No File Selected", description: "Please select a JSON file to import.", variant: "default" });
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
        if (!result) {
          throw new Error("File content is empty or unreadable.");
        }
        
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
                importedBuyerAddress = {
                    name: ba.name,
                    addressLine1: ba.addressLine1,
                    addressLine2: ba.addressLine2 || '', 
                    gstin: ba.gstin,
                    stateNameAndCode: ba.stateNameAndCode,
                    contact: ba.contact,
                    email: ba.email || '', 
                };
             } else {
                toast({ title: "Warning", description: "Buyer address in file is incomplete, skipping.", variant: "default"});
             }
          }
        } else {
          throw new Error("Invalid JSON structure. Expected an array of items or an object with 'items', 'invoiceCounter', 'buyerAddress'.");
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
              buyingPrice: importedItem.buyingPrice, 
              price: importedItem.price, 
              description: importedItem.description,
              purchaseDate: importedItem.purchaseDate || currentItem.purchaseDate, 
              hsnSac: importedItem.hsnSac || currentItem.hsnSac,
              gstRate: importedItem.gstRate !== undefined ? importedItem.gstRate : currentItem.gstRate,
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
          await saveBuyerAddressToAppSettings(importedBuyerAddress); 
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
        const inventoryUpdatesMap = new Map<string, number>(); 

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
        setInventory(updatedInventoryForFirestore);
        
        setInvoiceItems([]); 
        getAppSettingsFromFirestore(initialBuyerAddressGlobal).then(settings => setBuyerAddress(settings.buyerAddress));
        toast({ title: "New Invoice", description: "Current invoice cleared and stock restored." });
    } else {
        toast({ title: "New Invoice", description: "Invoice is already empty.", variant: "default" });
    }
  }, [invoiceItems, toast, setInventory]);

  const handleInvoiceUpdate = (updatedInvoice: Invoice) => {
    setPastInvoices(prev => 
      prev.map(inv => inv.invoiceNumber === updatedInvoice.invoiceNumber ? updatedInvoice : inv)
        .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime() || b.invoiceNumber.localeCompare(a.invoiceNumber))
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (ctrlOrCmd && event.key.toLowerCase() === 'p') { event.preventDefault(); handlePrintInvoice(); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'n') { event.preventDefault(); clearCurrentInvoice(); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'i') { event.preventDefault(); setActiveSection('inventory'); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'b') { event.preventDefault(); setActiveSection('invoice'); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'r') { event.preventDefault(); setActiveSection('reports'); } 
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
            setBuyerAddress={setBuyerAddress} 
            onLookupBuyerByGSTIN={lookupBuyerByGstin}
            onLookupBuyerByName={lookupBuyerProfilesByName}
            searchedBuyerProfiles={searchedBuyerProfiles}
            clearSearchedBuyerProfiles={() => setSearchedBuyerProfiles([])}
          />
        )}
        {activeSection === 'reports' && (
          <ReportsSection 
            pastInvoices={pastInvoices}
            onInvoiceUpdate={handleInvoiceUpdate} 
            isLoading={isLoading}
            fetchPastInvoices={fetchPastInvoices}
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
