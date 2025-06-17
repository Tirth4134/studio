
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, InvoiceLineItem, AppData, BuyerAddress, SalesRecord, Invoice, BuyerProfile, DirectSaleLineItem, DirectSaleLogEntry, DirectSaleItemDetail, AppSettings } from '@/types';
import AppHeader from '@/components/layout/app-header';
import InventorySection from '@/components/inventory/inventory-section';
import InvoiceSection from '@/components/invoice/invoice-section';
import DirectSaleSection from '@/components/direct-sale/direct-sale-section';
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
  saveDirectSaleCounterToFirestore,
  saveBuyerAddressToAppSettings,
  saveAllAppSettingsToFirestore,
  saveBuyerProfile,
  getBuyerProfileByGSTIN,
  getBuyerProfilesByName,
  saveSalesRecordsToFirestore,
  saveInvoiceToFirestore,
  getInvoicesFromFirestore,
  saveDirectSaleLogEntryToFirestore,
  getDirectSaleLogEntriesFromFirestore,
} from '@/lib/firebase';
import { format } from 'date-fns';

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
  const [directSaleItems, setDirectSaleItems] = useState<DirectSaleLineItem[]>([]);
  const [invoiceCounter, setInvoiceCounter] = useState<number>(1);
  const [directSaleCounter, setDirectSaleCounter] = useState<number>(1);
  const [buyerAddress, setBuyerAddress] = useState<BuyerAddress>(initialBuyerAddressGlobal);
  const [pastInvoices, setPastInvoices] = useState<Invoice[]>([]);
  const [pastDirectSalesLog, setPastDirectSalesLog] = useState<DirectSaleLogEntry[]>([]);
  const [activeSection, setActiveSection] = useState('inventory');
  const [invoiceDate, setInvoiceDate] = useState(''); // For regular invoices
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isFinalizingDirectSale, setIsFinalizingDirectSale] = useState(false);
  const [searchedBuyerProfiles, setSearchedBuyerProfiles] = useState<BuyerProfile[]>([]);


  useEffect(() => {
    setIsClient(true);
    const today = new Date();
    setInvoiceDate(today.toLocaleDateString('en-CA'));
    console.log("[HomePage] Mounted, isClient set to true.");
  }, []);

  const fetchPastSalesData = useCallback(async () => {
    console.log("[HomePage] fetchPastSalesData called (fetches both invoices and direct sales).");
    try {
      const [fetchedInvoices, fetchedDirectSales] = await Promise.all([
        getInvoicesFromFirestore(),
        getDirectSaleLogEntriesFromFirestore()
      ]);
      console.log(`[HomePage] Successfully fetched ${fetchedInvoices.length} past invoices and ${fetchedDirectSales.length} direct sales log entries.`);
      setPastInvoices(fetchedInvoices);
      setPastDirectSalesLog(fetchedDirectSales);
    } catch (error: any) {
      console.error("[HomePage] Error fetching past invoices or direct sales:", error);
      toast({ title: "Error Fetching Sales History", description: `Could not fetch past sales. ${error.message}`, variant: "destructive" });
      setPastInvoices([]); // Reset to empty on error to avoid displaying stale data
      setPastDirectSalesLog([]);
    }
  }, [toast]);

  useEffect(() => {
    if (isClient) {
      const fetchData = async () => {
        console.log("[HomePage] fetchData triggered (isClient true).");
        setIsLoading(true);
        try {
          // Fetch inventory and settings first
          const firestoreInventory = await getInventoryFromFirestore();
          console.log("[HomePage] fetchData: Fetched inventory from Firestore:", firestoreInventory.length, "items.");
          const appSettings = await getAppSettingsFromFirestore(initialBuyerAddressGlobal);
          console.log("[HomePage] fetchData: Fetched app settings. InvoiceCounter:", appSettings.invoiceCounter, "DirectSaleCounter:", appSettings.directSaleCounter);

          // Then fetch past sales data
          await fetchPastSalesData();
          console.log("[HomePage] fetchData: Past invoices and direct sales fetched using combined function.");

          // Seeding logic (only if everything is truly empty)
          if (firestoreInventory.length === 0 && appSettings.invoiceCounter === 1 && appSettings.directSaleCounter === 1 && appSettings.buyerAddress.name === initialBuyerAddressGlobal.name && pastInvoices.length === 0 && pastDirectSalesLog.length === 0) {
            toast({
                title: "Initializing Database",
                description: "No existing data found. Seeding with default data...",
                variant: "default",
                duration: 5000,
            });
            console.log("[HomePage] fetchData: Firestore is empty, seeding with initial data:", initialInventoryForSeed.length, "items.");
            await saveMultipleInventoryItemsToFirestore(initialInventoryForSeed);
            const initialSettingsToSave: AppSettings = {
                invoiceCounter: 1,
                directSaleCounter: 1,
                buyerAddress: initialBuyerAddressGlobal
            };
            await saveAllAppSettingsToFirestore(initialSettingsToSave);
            console.log("[HomePage] fetchData: Initial data seeded to Firestore.");

            setInventory(initialInventoryForSeed);
            setInvoiceCounter(initialSettingsToSave.invoiceCounter);
            setDirectSaleCounter(initialSettingsToSave.directSaleCounter);
            setBuyerAddress(initialSettingsToSave.buyerAddress);
            // No need to set pastInvoices/pastDirectSalesLog here as they are fetched above and would be empty
            toast({
                title: "Application Initialized",
                description: "Default data loaded into the database.",
                variant: "default",
                duration: 3000,
            });
          } else {
            setInventory(firestoreInventory);
            setInvoiceCounter(appSettings.invoiceCounter);
            setDirectSaleCounter(appSettings.directSaleCounter);
            setBuyerAddress(appSettings.buyerAddress);
            // Past invoices and direct sales are already set by fetchPastSalesData
            toast({
                title: "Data Loaded",
                description: "Successfully fetched inventory, settings, and sales history from Firestore.",
                variant: "default",
                duration: 3000,
            });
          }
        } catch (error: any) {
            console.error("[HomePage] fetchData: Error during initial data fetch or processing:", error);
            // Set to defaults/empty on major error
            setInventory([]);
            setInvoiceCounter(1);
            setDirectSaleCounter(1);
            setBuyerAddress(initialBuyerAddressGlobal);
            setPastInvoices([]);
            setPastDirectSalesLog([]);
            toast({
                title: "Data Loading Error",
                description: `Could not load data from Firestore. Using defaults. Error: ${error.message || 'Unknown error'}`,
                variant: "destructive",
                duration: 7000
            });
        } finally {
            setIsLoading(false);
            console.log("[HomePage] fetchData finished, isLoading set to false.");
        }
      };
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, toast, fetchPastSalesData]); // fetchPastSalesData is stable due to useCallback

  useEffect(() => {
    setCurrentInvoiceNumber(generateInvoiceNumber(invoiceCounter));
  }, [invoiceCounter]);

  const updateInvoiceCounterStateAndDb = async (newCounter: number) => {
    setInvoiceCounter(newCounter);
    await saveInvoiceCounterToFirestore(newCounter);
  };

  const updateDirectSaleCounterStateAndDb = async (newCounter: number) => {
    setDirectSaleCounter(newCounter);
    await saveDirectSaleCounterToFirestore(newCounter);
  };

  const updateInventoryStateAndDb = async (newInventory: InventoryItem[] | ((prevState: InventoryItem[]) => InventoryItem[])) => {
    console.log("[HomePage] updateInventoryStateAndDb called.");
    let finalInventoryToSave: InventoryItem[];
    if (typeof newInventory === 'function') {
      console.log("[HomePage] updateInventoryStateAndDb called with a function.");
      setInventory(prevState => {
        const updatedState = newInventory(prevState);
        finalInventoryToSave = updatedState;
        console.log("[HomePage] Inventory state updated (functional update). Items to save:", finalInventoryToSave.length);
        saveMultipleInventoryItemsToFirestore(finalInventoryToSave).catch(err => {
          console.error("[HomePage] Failed to save updated inventory state to Firestore (functional update)", err);
          toast({ title: "Database Save Error", description: `Could not save inventory changes to the database. ${(err as Error).message}`, variant: "destructive"});
        });
        return updatedState;
      });
    } else {
      console.log("[HomePage] updateInventoryStateAndDb called with a direct value.");
      finalInventoryToSave = newInventory;
      console.log("[HomePage] Inventory state updated (direct set). Items to save:", finalInventoryToSave.length);
      setInventory(newInventory);
      await saveMultipleInventoryItemsToFirestore(finalInventoryToSave).catch(err => {
          console.error("[HomePage] Failed to save inventory to Firestore (direct set)", err);
          toast({ title: "Database Save Error", description: `Could not save inventory to the database. ${(err as Error).message}`, variant: "destructive"});
      });
    }
  };

  const handlePrintInvoice = useCallback(async () => {
    console.log("[HomePage] handlePrintInvoice initiated.");
    if (isPrinting) {
      toast({ title: "Processing", description: "Invoice finalization is already in progress.", variant: "default" });
      return;
    }
    if (invoiceItems.length === 0) {
      toast({ title: "Cannot Print", description: "Invoice is empty. Add items to print.", variant: "destructive" });
      console.log("[HomePage] handlePrintInvoice - No items to print.");
      return;
    }
    setIsPrinting(true);

    try {
      const validGstin = buyerAddress.gstin && buyerAddress.gstin.trim() !== "" && !buyerAddress.gstin.includes("(Placeholder)") && buyerAddress.gstin !== "N/A";
      if (validGstin) {
        try {
          console.log("[HomePage] handlePrintInvoice: Attempting to save buyer profile for GSTIN:", buyerAddress.gstin);
          await saveBuyerProfile(buyerAddress.gstin, buyerAddress);
          toast({ title: "Buyer Profile Saved", description: `Details for GSTIN ${buyerAddress.gstin} stored.`, variant: "default", duration: 3000});
          console.log("[HomePage] handlePrintInvoice: Buyer profile saved successfully.");
        } catch (error) {
          console.error("[HomePage] handlePrintInvoice: Error saving buyer profile:", error);
          toast({ title: "Profile Save Error", description: `Could not save buyer profile. Error: ${(error as Error).message}`, variant: "destructive"});
        }
      } else {
           toast({ title: "Info", description: `Buyer profile not saved: GSTIN is empty, placeholder, or N/A.`, variant: "default", duration: 3000});
           console.log("[HomePage] handlePrintInvoice: Buyer profile not saved, GSTIN invalid, placeholder, or N/A.");
      }

      const salesRecordsToSave: SalesRecord[] = [];
      for (const invoiceItem of invoiceItems) {
        const inventoryItem = inventory.find(inv => inv.id === invoiceItem.id);
        if (inventoryItem) {
          const profit = (invoiceItem.price - inventoryItem.buyingPrice) * invoiceItem.quantity;
          salesRecordsToSave.push({
            id: generateUniqueId(),
            invoiceNumber: currentInvoiceNumber, // INV-XXXX
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
          console.warn(`[HomePage] handlePrintInvoice: Could not find inventory item with ID ${invoiceItem.id} to record sale.`);
        }
      }

      let invoiceSavedSuccessfully = false;
      let salesRecordsSavedSuccessfully = false;

      if (salesRecordsToSave.length > 0) {
          console.log("[HomePage] handlePrintInvoice: Attempting to save sales records:", salesRecordsToSave.length, "records.");
          await saveSalesRecordsToFirestore(salesRecordsToSave);
          salesRecordsSavedSuccessfully = true;
          toast({ title: "Sales Recorded", description: `${salesRecordsToSave.length} item sales recorded successfully for profit tracking.`, variant: "default", duration: 4000 });
          console.log("[HomePage] handlePrintInvoice: Sales records saved successfully.");
      } else {
          salesRecordsSavedSuccessfully = true; // No records to save, so "successful" in that regard
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
        amountPaid: 0, // New invoice starts unpaid
        status: 'Unpaid',
        latestPaymentDate: null,
      };

      console.log("[HomePage] handlePrintInvoice: Attempting to save invoice. Data:", JSON.stringify(invoiceToSave, null, 2).substring(0, 500) + "...");
      await saveInvoiceToFirestore(invoiceToSave);
      invoiceSavedSuccessfully = true;
      toast({ title: "Invoice Saved", description: `Invoice ${currentInvoiceNumber} saved successfully to database.`, variant: "default" });
      console.log(`[HomePage] handlePrintInvoice: Invoice ${currentInvoiceNumber} saved successfully to Firestore.`);

      if (invoiceSavedSuccessfully && salesRecordsSavedSuccessfully) {
        setPastInvoices(prev => [invoiceToSave, ...prev].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime() || b.invoiceNumber.localeCompare(a.invoiceNumber)));
        console.log("[HomePage] handlePrintInvoice: Past invoices state updated locally.");

        console.log("[HomePage] handlePrintInvoice: Triggering window.print().");
        window.print();

        updateInvoiceCounterStateAndDb(invoiceCounter + 1);
        console.log("[HomePage] handlePrintInvoice: Invoice counter updated.");

        // Reset buyer address to global default for the next invoice
        getAppSettingsFromFirestore(initialBuyerAddressGlobal).then(settings => {
          setBuyerAddress(settings.buyerAddress);
          console.log("[HomePage] handlePrintInvoice: Buyer address reset from settings for new invoice.");
        });
         setInvoiceItems([]); // Clear invoice items for the next one
      } else {
        throw new Error("One or more database save operations failed during invoice finalization.");
      }

    } catch (error) {
        console.error("[HomePage] handlePrintInvoice: CRITICAL ERROR during invoice finalization:", error);
        toast({ title: "Invoice Finalization Error", description: `Could not finalize invoice ${currentInvoiceNumber}. Error: ${(error as Error).message}. Please check console.`, variant: "destructive", duration: 10000});
    } finally {
        setIsPrinting(false);
        console.log("[HomePage] handlePrintInvoice: Finalization process finished, isPrinting set to false.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrinting, invoiceItems, inventory, currentInvoiceNumber, invoiceDate, invoiceCounter, toast, buyerAddress]);


  const handleFinalizeDirectSale = useCallback(async (saleDate: string, items: DirectSaleLineItem[]) => {
    if (isFinalizingDirectSale) {
        toast({ title: "Processing", description: "Direct sale finalization is already in progress.", variant: "default" });
        return;
    }
    if (items.length === 0) {
        toast({ title: "Cannot Record", description: "No items in the direct sale.", variant: "destructive" });
        return;
    }
    setIsFinalizingDirectSale(true);

    const currentDirectSaleNumber = `DS-${String(directSaleCounter).padStart(4, '0')}`;

    try {
        const salesRecordsToSave: SalesRecord[] = [];
        const directSaleLogItems: DirectSaleItemDetail[] = [];
        let grandTotalSaleAmount = 0;
        let totalSaleProfit = 0;

        for (const saleItem of items) {
            const inventoryItem = inventory.find(inv => inv.id === saleItem.id);
            if (inventoryItem) {
                const itemProfit = (saleItem.price - inventoryItem.buyingPrice) * saleItem.quantity;
                const itemTotalPrice = saleItem.price * saleItem.quantity;

                salesRecordsToSave.push({
                    id: generateUniqueId(),
                    invoiceNumber: currentDirectSaleNumber, // Use DS-XXXX for SalesRecord link
                    saleDate: saleDate, // This is the date of the direct sale
                    itemId: saleItem.id,
                    itemName: saleItem.name,
                    category: inventoryItem.category,
                    quantitySold: saleItem.quantity,
                    sellingPricePerUnit: saleItem.price,
                    buyingPricePerUnit: inventoryItem.buyingPrice,
                    totalProfit: itemProfit,
                });

                directSaleLogItems.push({
                    itemId: saleItem.id,
                    itemName: saleItem.name,
                    category: inventoryItem.category,
                    quantitySold: saleItem.quantity,
                    sellingPricePerUnit: saleItem.price,
                    buyingPricePerUnit: inventoryItem.buyingPrice,
                    totalItemProfit: itemProfit,
                    totalItemPrice: itemTotalPrice,
                });
                grandTotalSaleAmount += itemTotalPrice;
                totalSaleProfit += itemProfit;
            } else {
                console.warn(`[HomePage] handleFinalizeDirectSale: Could not find inventory item with ID ${saleItem.id}.`);
            }
        }

        if (salesRecordsToSave.length === 0) {
            // This implies all items in the directSaleItems list couldn't be found in inventory
            // which should ideally be prevented by the UI, but a safeguard is good.
            throw new Error("No valid items processed for direct sale. Inventory might be out of sync.");
        }

        console.log("[HomePage] handleFinalizeDirectSale: Attempting to save sales records:", salesRecordsToSave.length, "records.");
        await saveSalesRecordsToFirestore(salesRecordsToSave);
        console.log("[HomePage] handleFinalizeDirectSale: Sales records saved successfully.");

        const directSaleLogEntry: DirectSaleLogEntry = {
            id: currentDirectSaleNumber, // Use DS-XXXX as the ID for the log entry document
            directSaleNumber: currentDirectSaleNumber,
            saleDate: saleDate,
            items: directSaleLogItems,
            grandTotalSaleAmount: grandTotalSaleAmount,
            totalSaleProfit: totalSaleProfit,
        };

        console.log("[HomePage] handleFinalizeDirectSale: Attempting to save direct sale log entry. Data:", JSON.stringify(directSaleLogEntry, null, 2).substring(0, 500) + "...");
        await saveDirectSaleLogEntryToFirestore(directSaleLogEntry);
        toast({ title: "Direct Sale Recorded", description: `Sale ${currentDirectSaleNumber} recorded successfully.`, variant: "default" });
        console.log(`[HomePage] handleFinalizeDirectSale: Direct sale log entry ${currentDirectSaleNumber} saved successfully.`);

        // Update local state for direct sales log
        setPastDirectSalesLog(prev => [directSaleLogEntry, ...prev].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime() || b.directSaleNumber.localeCompare(a.directSaleNumber)));
        console.log("[HomePage] handleFinalizeDirectSale: Past direct sales log state updated locally.");

        updateDirectSaleCounterStateAndDb(directSaleCounter + 1);
        console.log("[HomePage] handleFinalizeDirectSale: Direct sale counter updated.");

        setDirectSaleItems([]); // Clear the direct sale items form

    } catch (error) {
        console.error("[HomePage] handleFinalizeDirectSale: CRITICAL ERROR during direct sale finalization:", error);
        toast({ title: "Direct Sale Error", description: `Could not finalize direct sale. Error: ${(error as Error).message}.`, variant: "destructive", duration: 7000 });
    } finally {
        setIsFinalizingDirectSale(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinalizingDirectSale, inventory, directSaleCounter, toast]);


  const lookupBuyerByGstin = async (gstin: string) => {
    if (!gstin || gstin.trim() === "") {
      toast({ title: "Info", description: "GSTIN cannot be empty for lookup.", variant: "default" });
      return;
    }
    // Consider adding a loading state specific to this lookup if it's noticeable
    try {
      const profile = await getBuyerProfileByGSTIN(gstin);
      if (profile) {
        const completeProfile: BuyerAddress = {
            name: profile.name || '',
            addressLine1: profile.addressLine1 || '',
            addressLine2: profile.addressLine2 || '',
            gstin: profile.gstin, // GSTIN from profile should be used
            stateNameAndCode: profile.stateNameAndCode || '',
            contact: profile.contact || '',
            email: profile.email || '',
        };
        setBuyerAddress(completeProfile);
        toast({ title: "Buyer Found", description: `Details for ${profile.name || 'Buyer'} loaded.`, variant: "default" });
        setSearchedBuyerProfiles([]); // Clear search results
      } else {
        toast({ title: "Buyer Not Found", description: "No existing profile for this GSTIN. Please enter details manually.", variant: "default" });
        // Optionally pre-fill GSTIN in form if not found, clear other fields
        setBuyerAddress(prev => ({
          ...initialBuyerAddressGlobal, // Or a blank address structure
          gstin: gstin.trim().toUpperCase(), // Keep the searched GSTIN
          name: '', addressLine1: '', addressLine2: '', stateNameAndCode: '', contact: '', email: ''
        }));
        setSearchedBuyerProfiles([]);
      }
    } catch (error) {
      console.error("Error looking up buyer by GSTIN:", error);
      toast({ title: "Lookup Error", description: `Could not fetch buyer details. Error: ${(error as Error).message}`, variant: "destructive" });
    }
  };

  const lookupBuyerProfilesByName = async (nameQuery: string) => {
    if (!nameQuery || nameQuery.trim() === "") {
      toast({ title: "Info", description: "Company name cannot be empty for lookup.", variant: "default" });
      setSearchedBuyerProfiles([]);
      return;
    }
    // Consider adding a loading state
    try {
      const profiles = await getBuyerProfilesByName(nameQuery);
      if (profiles.length > 0) {
        setSearchedBuyerProfiles(profiles);
        if (profiles.length === 1) {
          // If only one match, auto-fill it
          const singleProfile = profiles[0];
           const completeProfile: BuyerAddress = { // Ensure all fields are present
              name: singleProfile.name || '',
              addressLine1: singleProfile.addressLine1 || '',
              addressLine2: singleProfile.addressLine2 || '',
              gstin: singleProfile.gstin, // GSTIN from profile
              stateNameAndCode: singleProfile.stateNameAndCode || '',
              contact: singleProfile.contact || '',
              email: singleProfile.email || '',
          };
          setBuyerAddress(completeProfile);
          toast({ title: "Buyer Found", description: `Details for ${singleProfile.name} loaded.`, variant: "default" });
          setSearchedBuyerProfiles([]); // Clear search results
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
    }
  };


  const handleExportData = async () => {
    // Consider adding loading state for export
    try {
      const currentInventory = await getInventoryFromFirestore(); // Fetch latest
      const currentSettings = await getAppSettingsFromFirestore(initialBuyerAddressGlobal); // Fetch latest

      const appData: AppData = {
        items: currentInventory,
        invoiceCounter: currentSettings.invoiceCounter,
        directSaleCounter: currentSettings.directSaleCounter, // Include directSaleCounter
        buyerAddress: currentSettings.buyerAddress, // Include global buyer address settings
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
    }
  };

  // mapRawItemToInventoryItemEnsuringUniqueId, handleImportData remain complex, ensure thorough testing.
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
    const buyingPrice = normalizePrice(rawItem.buyingPrice || rawItem.costPrice || rawItem.cost_price || 0); // Default buyingPrice to 0 if not present
    const stock = normalizeStock(rawItem.stock || rawItem.Stock);
    const description = rawItem.description || rawItem.Description || '';
    const purchaseDate = rawItem.purchaseDate || rawItem.purchase_date;
    const hsnSac = rawItem.hsnSac || rawItem.hsn_sac || rawItem.HSN_SAC || '';
    const gstRate = normalizePrice(rawItem.gstRate || rawItem.gst_rate || rawItem.GSTRate);


    // Basic validation
    if (!name || typeof name !== 'string' || name.trim() === '') return null;
    if (isNaN(sellingPrice) || sellingPrice < 0) return null;
    if (isNaN(buyingPrice) || buyingPrice < 0) return null; // Ensure buying price isn't negative
    if (isNaN(stock) || stock < 0) return null;
    if (!category || typeof category !== 'string' || category.trim() === '') return null;
    if (gstRate !== undefined && (isNaN(gstRate) || gstRate < 0 || gstRate > 100)) return null; // GST rate validation


    // ID generation and uniqueness check
    let finalId = rawItem.id && typeof rawItem.id === 'string' ? rawItem.id : generateUniqueId();
    while (allExistingItemIds.has(finalId) || tempImportedItemIdsForThisBatch.has(finalId)) {
      finalId = generateUniqueId();
    }
    tempImportedItemIdsForThisBatch.add(finalId); // Track IDs generated in this batch

    // Validate or default purchaseDate
    const validatedPurchaseDate = typeof purchaseDate === 'string' && purchaseDate.match(/^\d{4}-\d{2}-\d{2}$/)
                                 ? purchaseDate
                                 : new Date().toLocaleDateString('en-CA'); // Default to today if invalid/missing

    return {
      id: finalId,
      name: name.trim(),
      category: category.trim(),
      buyingPrice: buyingPrice, // Already defaulted if necessary
      price: sellingPrice,
      stock,
      description: typeof description === 'string' ? description.trim() : '',
      purchaseDate: validatedPurchaseDate,
      hsnSac: typeof hsnSac === 'string' ? hsnSac.trim() : undefined, // Use undefined if empty for consistency
      gstRate: gstRate === undefined || isNaN(gstRate) ? undefined : gstRate, // Use undefined if invalid/missing
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
      // Consider setting loading state for import
      try {
        const result = e.target?.result as string;
        if (!result) {
          throw new Error("File content is empty or unreadable.");
        }

        const parsedData = JSON.parse(result);

        let parsedItems: any[] = [];
        let importedInvoiceCounter: number | undefined = undefined;
        let importedDirectSaleCounter: number | undefined = undefined; // Added for direct sale counter
        let importedBuyerAddress: BuyerAddress | undefined = undefined;

        // Flexible parsing for different JSON structures
        if (Array.isArray(parsedData)) {
          parsedItems = parsedData; // Assume it's an array of items
        } else if (typeof parsedData === 'object' && parsedData !== null) {
          if (Array.isArray(parsedData.items)) parsedItems = parsedData.items;
          if (typeof parsedData.invoiceCounter === 'number') importedInvoiceCounter = parsedData.invoiceCounter;
          if (typeof parsedData.directSaleCounter === 'number') importedDirectSaleCounter = parsedData.directSaleCounter; // Handle direct sale counter
          if (typeof parsedData.buyerAddress === 'object' && parsedData.buyerAddress !== null) {
             // Validate buyerAddress structure before assigning
             const ba = parsedData.buyerAddress;
             if (ba.name && ba.addressLine1 && ba.gstin && ba.stateNameAndCode && ba.contact) {
                importedBuyerAddress = {
                    name: ba.name,
                    addressLine1: ba.addressLine1,
                    addressLine2: ba.addressLine2 || '', // Default to empty string if missing
                    gstin: ba.gstin,
                    stateNameAndCode: ba.stateNameAndCode,
                    contact: ba.contact,
                    email: ba.email || '', // Default to empty string if missing
                };
             } else {
                toast({ title: "Warning", description: "Buyer address in file is incomplete, skipping.", variant: "default"});
             }
          }
        } else {
          throw new Error("Invalid JSON structure. Expected an array of items or an object with 'items', counters, 'buyerAddress'.");
        }

        if (parsedItems.length === 0 && importedInvoiceCounter === undefined && importedDirectSaleCounter === undefined && importedBuyerAddress === undefined) {
          toast({ title: "No Valid Data Found", description: "File does not contain items or settings.", variant: "default" });
          // Reset loading state if any
          return;
        }

        // Fetch current inventory from Firestore to merge, not from local state
        const currentFirestoreInventory = await getInventoryFromFirestore();
        const newInventoryState = [...currentFirestoreInventory];
        const currentInventoryItemIds = new Set(newInventoryState.map(item => item.id));
        const tempImportedItemIdsForThisBatch = new Set<string>(); // To track IDs generated within this import batch

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        parsedItems.forEach(rawItemFromFile => {
          // Ensure allExistingItemIds includes those already processed in this batch to prevent duplicates from the file itself
          const combinedExistingIds = new Set([...currentInventoryItemIds, ...tempImportedItemIdsForThisBatch]);
          const importedItem = mapRawItemToInventoryItemEnsuringUniqueId(rawItemFromFile, combinedExistingIds, tempImportedItemIdsForThisBatch);

          if (!importedItem) {
            skippedCount++;
            return;
          }

          // Check if item already exists by name and category (case-insensitive)
          const existingItemIndex = newInventoryState.findIndex(
            invItem => invItem.name.toLowerCase() === importedItem.name.toLowerCase() &&
                       invItem.category.toLowerCase() === importedItem.category.toLowerCase()
          );

          if (existingItemIndex !== -1) { // Item exists, update it
            const currentItem = newInventoryState[existingItemIndex];
            newInventoryState[existingItemIndex] = {
              ...currentItem, // Keep existing ID and potentially other fields
              id: currentItem.id, // Explicitly keep existing ID
              stock: currentItem.stock + importedItem.stock, // Add to existing stock
              buyingPrice: importedItem.buyingPrice, // Update buying price
              price: importedItem.price, // Update selling price
              description: importedItem.description, // Update description
              purchaseDate: importedItem.purchaseDate || currentItem.purchaseDate, // Update purchase date if provided
              hsnSac: importedItem.hsnSac || currentItem.hsnSac, // Update HSN/SAC
              gstRate: importedItem.gstRate !== undefined ? importedItem.gstRate : currentItem.gstRate, // Update GST rate
            };
            updatedCount++;
          } else { // New item
            newInventoryState.push(importedItem);
            currentInventoryItemIds.add(importedItem.id); // Add new ID to set for future checks in this session
            tempImportedItemIdsForThisBatch.add(importedItem.id); // Also track in this batch
            addedCount++;
          }
        });

        // Save the potentially merged inventory to Firestore
        await saveMultipleInventoryItemsToFirestore(newInventoryState);
        setInventory(newInventoryState); // Update local state

        // Update settings if imported
        const settingsToUpdate: Partial<AppSettings> = {};
        if (importedInvoiceCounter !== undefined) {
          settingsToUpdate.invoiceCounter = importedInvoiceCounter;
          setInvoiceCounter(importedInvoiceCounter);
        }
        if (importedDirectSaleCounter !== undefined) { // Handle direct sale counter
          settingsToUpdate.directSaleCounter = importedDirectSaleCounter;
          setDirectSaleCounter(importedDirectSaleCounter);
        }
        if (importedBuyerAddress) {
          settingsToUpdate.buyerAddress = importedBuyerAddress;
          setBuyerAddress(importedBuyerAddress);
        }
        if (Object.keys(settingsToUpdate).length > 0) {
          // Fetch existing settings to merge with, rather than overwriting entirely if only some are imported
          const currentSettings = await getAppSettingsFromFirestore(initialBuyerAddressGlobal);
          const finalSettingsToSave: AppSettings = {
            invoiceCounter: settingsToUpdate.invoiceCounter ?? currentSettings.invoiceCounter,
            directSaleCounter: settingsToUpdate.directSaleCounter ?? currentSettings.directSaleCounter,
            buyerAddress: settingsToUpdate.buyerAddress ?? currentSettings.buyerAddress,
          };
          await saveAllAppSettingsToFirestore(finalSettingsToSave);
        }


        // Optionally clear current invoice/sale forms
        setInvoiceItems([]);
        setDirectSaleItems([]);

        toast({ title: 'Import Complete', description: `Processed ${parsedItems.length} records. Settings updated.`, });
        setTimeout(() => {
          toast({ title: 'Import Summary', description: `Items Added: ${addedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}.`, duration: 7000 });
        }, 1000);

      } catch (error: any) {
        console.error('Error processing imported data:', error);
        toast({ title: 'Import Error', description: `Failed to process data. ${error.message || 'Unknown error'}`, variant: 'destructive' });
      } finally {
        // Reset loading state if any
      }
    };
    reader.onerror = () => {
      // Reset loading state if any
      toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    };
    reader.readAsText(file);
  };

  const handleShowShortcuts = () => setIsShortcutsDialogOpen(true);

  const clearCurrentInvoice = useCallback(async () => {
    if (invoiceItems.length > 0) {
        // Create a map to efficiently update stock for multiple items
        const inventoryUpdatesMap = new Map<string, number>();

        invoiceItems.forEach(invoiceItem => {
            inventoryUpdatesMap.set(invoiceItem.id, (inventoryUpdatesMap.get(invoiceItem.id) || 0) + invoiceItem.quantity);
        });

        // Fetch the latest inventory from Firestore to avoid race conditions with local state
        const currentInventory = await getInventoryFromFirestore();
        const updatedInventoryForFirestore = currentInventory.map(invItem => {
            if (inventoryUpdatesMap.has(invItem.id)) {
                return { ...invItem, stock: invItem.stock + (inventoryUpdatesMap.get(invItem.id) || 0) };
            }
            return invItem;
        });

        await saveMultipleInventoryItemsToFirestore(updatedInventoryForFirestore); // Save updated stock to Firestore
        setInventory(updatedInventoryForFirestore); // Update local state

        setInvoiceItems([]); // Clear the invoice items
        // Reset buyer address to global default
        getAppSettingsFromFirestore(initialBuyerAddressGlobal).then(settings => setBuyerAddress(settings.buyerAddress));
        toast({ title: "New Invoice", description: "Current invoice cleared and stock restored." });
    } else {
        toast({ title: "New Invoice", description: "Invoice is already empty.", variant: "default" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceItems, toast, setInventory]); // Dependencies updated

  // Callback for when an invoice is updated in ReportsSection (e.g., payment status)
  const handleInvoiceUpdate = (updatedInvoice: Invoice) => {
    setPastInvoices(prev =>
      prev.map(inv => inv.invoiceNumber === updatedInvoice.invoiceNumber ? updatedInvoice : inv)
        .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime() || b.invoiceNumber.localeCompare(a.invoiceNumber)) // Re-sort
    );
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (ctrlOrCmd && event.key.toLowerCase() === 'p' && activeSection === 'invoice') { event.preventDefault(); handlePrintInvoice(); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'n' && activeSection === 'invoice') { event.preventDefault(); clearCurrentInvoice(); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'i') { event.preventDefault(); setActiveSection('inventory'); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'b') { event.preventDefault(); setActiveSection('invoice'); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 's') { event.preventDefault(); setActiveSection('directSale'); }
      else if (ctrlOrCmd && event.key.toLowerCase() === 'r') { event.preventDefault(); setActiveSection('reports'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlePrintInvoice, clearCurrentInvoice, activeSection]); // Dependencies for shortcuts

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <p className="mt-4 text-lg text-muted-foreground">Loading Application Data...</p>
      </div>
    );
  }
  console.log("[HomePage] Rendering. Past invoices count:", pastInvoices.length, "Past direct sales log count:", pastDirectSalesLog.length, "isLoading:", isLoading);
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onPrint={handlePrintInvoice}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onShowShortcuts={handleShowShortcuts}
        isPrinting={isPrinting}
      />
      <main className="flex-grow container mx-auto p-4 md:p-6">
        {activeSection === 'inventory' && (
          <InventorySection
            inventory={inventory}
            setInventory={updateInventoryStateAndDb}
          />
        )}
        {activeSection === 'invoice' && (
          <InvoiceSection
            inventory={inventory}
            setInventory={updateInventoryStateAndDb}
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
            isPrinting={isPrinting}
          />
        )}
        {activeSection === 'directSale' && (
          <DirectSaleSection
            inventory={inventory}
            setInventory={updateInventoryStateAndDb}
            directSaleItems={directSaleItems}
            setDirectSaleItems={setDirectSaleItems}
            onFinalizeDirectSale={handleFinalizeDirectSale}
            isFinalizing={isFinalizingDirectSale}
            pastDirectSalesLog={pastDirectSalesLog}
            fetchPastDirectSalesLog={fetchPastSalesData} // Pass the combined fetcher
          />
        )}
        {activeSection === 'reports' && (
          <ReportsSection
            pastInvoices={pastInvoices}
            pastDirectSalesLog={pastDirectSalesLog}
            onInvoiceUpdate={handleInvoiceUpdate}
            isLoading={isLoading} // Pass the main loading state
            fetchPastSalesData={fetchPastSalesData} // Pass the combined fetcher
            inventoryItems={inventory}
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

      
      