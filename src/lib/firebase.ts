
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, writeBatch, deleteDoc, query, where, orderBy, limit, FieldValue, deleteField } from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type User
} from "firebase/auth";
import type { InventoryItem, BuyerAddress, BuyerProfile, AppSettings as AppSettingsType, SalesRecord, Invoice, InvoiceLineItem, DirectSaleLogEntry } from '@/types';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFkOKPJM9N0aoP5pVYkIV30DFjTHTEiGo",
  authDomain: "invoiceflow-kyl1w.firebaseapp.com",
  projectId: "invoiceflow-kyl1w",
  storageBucket: "invoiceflow-kyl1w.appspot.com",
  messagingSenderId: "1040042171668",
  appId: "1:1040042171668:web:5326322aceada82f167601"
};

// Initialize Firebase app
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized with config. ProjectID:", firebaseConfig.projectId);
} else {
  app = getApps()[0]!;
  console.log("Firebase app already initialized. Using config. ProjectID:", firebaseConfig.projectId || app.options.projectId);
}

const db = getFirestore(app);
const auth = getAuth(app);

// --- Auth Functions ---
export const loginUser = async (email: string, password: string):Promise<User> => {
  console.log('[Firebase] Attempting loginUser for:', email);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('[Firebase] loginUser successful for:', email);
    return userCredential.user;
  } catch (error) {
    console.error("[Firebase] Error in loginUser:", error);
    throw error;
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  console.log('[Firebase] Attempting signInWithGoogle.');
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('[Firebase] signInWithGoogle successful for:', result.user.email);
    return result.user;
  } catch (error) {
    console.error("[Firebase] Error in signInWithGoogle:", error);
    throw error;
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  console.log('[Firebase] Attempting sendPasswordReset for:', email);
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('[Firebase] sendPasswordReset email sent for:', email);
  } catch (error) {
    console.error("[Firebase] Error in sendPasswordReset:", error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  console.log('[Firebase] Attempting logoutUser.');
  try {
    await signOut(auth);
    console.log('[Firebase] logoutUser successful.');
  } catch (error) {
    console.error("[Firebase] Error in logoutUser:", error);
    throw error;
  }
};

export const monitorAuthState = (callback: (user: User | null) => void) => {
  console.log('[Firebase] Subscribing to auth state changes (monitorAuthState).');
  return onAuthStateChanged(auth, (user) => {
    console.log('[Firebase] onAuthStateChanged triggered. User email:', user ? user.email : 'null');
    callback(user);
  });
};


// --- Inventory Functions ---
const inventoryCollectionRef = collection(db, "inventory");

export const getInventoryFromFirestore = async (): Promise<InventoryItem[]> => {
  try {
    const querySnapshot = await getDocs(inventoryCollectionRef);
    const items: InventoryItem[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: docSnap.id,
        name: data.name || "Unnamed Item",
        category: data.category || "Uncategorized",
        buyingPrice: typeof data.buyingPrice === 'number' ? data.buyingPrice : 0,
        price: typeof data.price === 'number' ? data.price : 0, // Selling price
        stock: typeof data.stock === 'number' ? data.stock : 0,
        description: data.description || '',
        purchaseDate: typeof data.purchaseDate === 'string' ? data.purchaseDate : new Date().toLocaleDateString('en-CA'),
        hsnSac: data.hsnSac || '',
        gstRate: data.gstRate === undefined || data.gstRate === null ? 0 : Number(data.gstRate)
      } as InventoryItem);
    });
    return items;
  } catch (error) {
    console.error("Error fetching inventory from Firestore:", error);
    throw error;
  }
};

export const saveInventoryItemToFirestore = async (item: InventoryItem): Promise<void> => {
  try {
    if (!item.id || item.id.trim() === "") throw new Error("Invalid or missing item ID.");
    if (typeof item.category !== 'string' || typeof item.name !== 'string' || typeof item.buyingPrice !== 'number' || typeof item.price !== 'number' || typeof item.stock !== 'number') {
      throw new Error("Invalid item data types for single save.");
    }
    const itemDocRef = doc(db, "inventory", item.id);
    const dataToSave: Omit<InventoryItem, 'id'> = {
      category: item.category,
      name: item.name,
      buyingPrice: item.buyingPrice,
      price: item.price,
      stock: item.stock,
      description: item.description || '',
      purchaseDate: item.purchaseDate || new Date().toLocaleDateString('en-CA'),
      hsnSac: item.hsnSac || '',
      gstRate: item.gstRate === undefined || item.gstRate === null ? 0 : Number(item.gstRate),
    };
    await setDoc(itemDocRef, dataToSave);
  } catch (error) {
    console.error(`Error saving single inventory item (ID: ${item.id}) to Firestore:`, error);
    throw error;
  }
};

export const saveMultipleInventoryItemsToFirestore = async (items: InventoryItem[]): Promise<void> => {
  if (!db) throw new Error("Database not initialized.");
  if (!items || items.length === 0) return;

  const batch = writeBatch(db);
  let validItemsInBatchCount = 0;
  items.forEach(item => {
    if (!item.id || item.id.trim() === "") {
      console.warn("Item missing ID during batch prep, skipping:", item); return;
    }
    if (typeof item.category !== 'string' || typeof item.name !== 'string' || typeof item.buyingPrice !== 'number' || typeof item.price !== 'number' || typeof item.stock !== 'number') {
      console.warn("Invalid item data types in batch prep, skipping:", item); return;
    }
    const itemDocRef = doc(db, "inventory", item.id);
    const itemData: Omit<InventoryItem, 'id'> = {
      category: item.category,
      name: item.name,
      buyingPrice: item.buyingPrice,
      price: item.price,
      stock: item.stock,
      description: item.description || '',
      purchaseDate: item.purchaseDate || new Date().toLocaleDateString('en-CA'),
      hsnSac: item.hsnSac || '',
      gstRate: item.gstRate === undefined || item.gstRate === null ? 0 : Number(item.gstRate),
    };
    batch.set(itemDocRef, itemData);
    validItemsInBatchCount++;
  });

  if (validItemsInBatchCount === 0) {
    console.warn("No valid items in batch. Nothing to commit."); return;
  }
  try {
    console.log(`Attempting to commit batch with ${validItemsInBatchCount} valid items to Firestore.`);
    await batch.commit();
    console.log(`BATCH COMMIT SUCCESSFUL: ${validItemsInBatchCount} items saved/updated in Firestore.`);
  } catch (error) {
    console.error("CRITICAL ERROR during batch.commit() in saveMultipleInventoryItemsToFirestore:", error);
    throw error;
  }
};

export const deleteInventoryItemFromFirestore = async (itemId: string): Promise<void> => {
  try {
    const itemDocRef = doc(db, "inventory", itemId);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error(`Error deleting inventory item (ID: ${itemId}) from Firestore:`, error);
    throw error;
  }
};

// Firestore collection references
const settingsDocRef = doc(db, "settings", "appState");
const buyerProfilesCollectionRef = collection(db, "buyerProfiles");
const salesRecordsCollectionRef = collection(db, "salesRecords");
const invoicesCollectionRef = collection(db, "invoices");
const directSalesLogCollectionRef = collection(db, "directSalesLog");


// --- Settings Functions ---
export const getAppSettingsFromFirestore = async (initialGlobalBuyerAddress: BuyerAddress): Promise<AppSettingsType> => {
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const mergedBuyerAddress: BuyerAddress = {
        name: data.buyerAddress?.name || initialGlobalBuyerAddress.name,
        addressLine1: data.buyerAddress?.addressLine1 || initialGlobalBuyerAddress.addressLine1,
        addressLine2: data.buyerAddress?.addressLine2 || initialGlobalBuyerAddress.addressLine2 || '',
        gstin: data.buyerAddress?.gstin || initialGlobalBuyerAddress.gstin,
        stateNameAndCode: data.buyerAddress?.stateNameAndCode || initialGlobalBuyerAddress.stateNameAndCode,
        contact: data.buyerAddress?.contact || initialGlobalBuyerAddress.contact,
        email: data.buyerAddress?.email || initialGlobalBuyerAddress.email || '',
      };
      return {
        invoiceCounter: data.invoiceCounter || 1,
        directSaleCounter: data.directSaleCounter || 1, // Initialize directSaleCounter
        buyerAddress: mergedBuyerAddress
      };
    } else {
      const defaultSettings: AppSettingsType = {
        invoiceCounter: 1,
        directSaleCounter: 1, // Default directSaleCounter
        buyerAddress: {...initialGlobalBuyerAddress, email: initialGlobalBuyerAddress.email || '', addressLine2: initialGlobalBuyerAddress.addressLine2 || ''},
      };
      await setDoc(settingsDocRef, defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching/setting app settings from Firestore:", error);
    throw error;
  }
};

export const saveInvoiceCounterToFirestore = async (counter: number): Promise<void> => {
  try {
    await setDoc(settingsDocRef, { invoiceCounter: counter }, { merge: true });
  } catch (error) {
    console.error("Error saving invoice counter to Firestore:", error);
    throw error;
  }
};

export const saveDirectSaleCounterToFirestore = async (counter: number): Promise<void> => {
  try {
    await setDoc(settingsDocRef, { directSaleCounter: counter }, { merge: true });
  } catch (error) {
    console.error("Error saving direct sale counter to Firestore:", error);
    throw error;
  }
};

export const saveBuyerAddressToAppSettings = async (address: BuyerAddress): Promise<void> => {
  try {
    const addressToSave = {...address, email: address.email || '', addressLine2: address.addressLine2 || ''};
    await setDoc(settingsDocRef, { buyerAddress: addressToSave }, { merge: true });
  } catch (error) {
    console.error("Error saving buyer address to app settings in Firestore:", error);
    throw error;
  }
};

export const saveAllAppSettingsToFirestore = async (settings: AppSettingsType): Promise<void> => {
  try {
    const settingsToSave = {
      ...settings,
      invoiceCounter: settings.invoiceCounter || 1,
      directSaleCounter: settings.directSaleCounter || 1,
      buyerAddress: {
        ...(settings.buyerAddress || {}),
        email: settings.buyerAddress?.email || '',
        addressLine2: settings.buyerAddress?.addressLine2 || ''
      }
    };
    await setDoc(settingsDocRef, settingsToSave);
  } catch (error) {
    console.error("Error saving all app settings to Firestore:", error);
    throw error;
  }
};

// --- Buyer Profiles ---
export const getBuyerProfileByGSTIN = async (gstin: string): Promise<BuyerProfile | null> => {
  if (!gstin || gstin.trim() === "") return null;
  try {
    const profileDocRef = doc(buyerProfilesCollectionRef, gstin.trim().toUpperCase());
    const docSnap = await getDoc(profileDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as BuyerProfile;
      return { ...data, email: data.email || '', addressLine2: data.addressLine2 || '' };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching buyer profile for GSTIN ${gstin} from Firestore:`, error);
    throw error;
  }
};

export const getBuyerProfilesByName = async (nameQuery: string): Promise<BuyerProfile[]> => {
  if (!nameQuery || nameQuery.trim() === "") return [];
  try {
    const standardizedQuery = nameQuery.trim();
    const q = query(
      buyerProfilesCollectionRef,
      where("name", ">=", standardizedQuery),
      where("name", "<=", standardizedQuery + '\uf8ff'),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    const profiles: BuyerProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as BuyerProfile;
      profiles.push({ ...data, email: data.email || '', addressLine2: data.addressLine2 || '' });
    });
    return profiles;
  } catch (error) {
    console.error(`Error fetching buyer profiles by name "${nameQuery}":`, error);
    return [];
  }
};


export const saveBuyerProfile = async (gstin: string, address: BuyerAddress): Promise<void> => {
  const idToUse = gstin && gstin.trim() !== "" && !gstin.includes("(Placeholder)")
                  ? gstin.trim().toUpperCase()
                  : null;

  if (!idToUse) {
    console.log("Buyer profile not saved: No valid GSTIN provided to use as document ID.");
    return;
  }

  try {
    const profileDocRef = doc(buyerProfilesCollectionRef, idToUse);
    const profileData: BuyerProfile = {
      name: address.name || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      gstin: idToUse,
      stateNameAndCode: address.stateNameAndCode || '',
      contact: address.contact || '',
      email: address.email || '',
    };
    await setDoc(profileDocRef, profileData, { merge: true });
  } catch (error) {
    console.error(`Error saving buyer profile for GSTIN ${idToUse} to Firestore:`, error);
    throw error;
  }
};


// --- Sales Records Functions ---
export const saveSalesRecordsToFirestore = async (salesRecords: SalesRecord[]): Promise<void> => {
  if (!db) throw new Error("Database not initialized.");
  if (!salesRecords || salesRecords.length === 0) return;

  try {
    const batch = writeBatch(db);
    salesRecords.forEach(record => {
      const recordDocRef = doc(salesRecordsCollectionRef, record.id);
      batch.set(recordDocRef, record);
    });
    await batch.commit();
  } catch (error: any) {
    console.error("CRITICAL ERROR during batch.commit() in saveSalesRecordsToFirestore:", error);
    throw error;
  }
};

export const getSalesRecordsFromFirestore = async (): Promise<SalesRecord[]> => {
  try {
    const querySnapshot = await getDocs(salesRecordsCollectionRef);
    const records: SalesRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      records.push({
        id: docSnap.id,
        invoiceNumber: data.invoiceNumber || "N/A", // This can be INV- or DS-
        saleDate: typeof data.saleDate === 'string' ? data.saleDate : new Date().toLocaleDateString('en-CA'),
        itemId: data.itemId || "N/A",
        itemName: data.itemName || "N/A",
        category: data.category || "N/A",
        quantitySold: typeof data.quantitySold === 'number' ? data.quantitySold : 0,
        sellingPricePerUnit: typeof data.sellingPricePerUnit === 'number' ? data.sellingPricePerUnit : 0,
        buyingPricePerUnit: typeof data.buyingPricePerUnit === 'number' ? data.buyingPricePerUnit : 0,
        totalProfit: typeof data.totalProfit === 'number' ? data.totalProfit : 0,
      } as SalesRecord);
    });
    return records;
  } catch (error) {
    console.error("Error fetching sales records from Firestore:", error);
    return [];
  }
};


// --- Invoice Storage (Formal Invoices) ---
export const saveInvoiceToFirestore = async (invoice: Invoice): Promise<void> => {
  console.log("[Firebase] saveInvoiceToFirestore called with invoice number:", invoice.invoiceNumber);
  try {
    const invoiceDocRef = doc(invoicesCollectionRef, invoice.invoiceNumber);

    const itemsToSave: InvoiceLineItem[] = (invoice.items || []).map(item => ({
      ...item,
      hsnSac: item.hsnSac || '',
      gstRate: item.gstRate === undefined || item.gstRate === null ? 0 : Number(item.gstRate),
    }));

    const sanitizedBuyerAddress: BuyerAddress = {
      name: invoice.buyerAddress?.name || '',
      addressLine1: invoice.buyerAddress?.addressLine1 || '',
      addressLine2: invoice.buyerAddress?.addressLine2 || '',
      gstin: invoice.buyerAddress?.gstin || '',
      stateNameAndCode: invoice.buyerAddress?.stateNameAndCode || '',
      contact: invoice.buyerAddress?.contact || '',
      email: invoice.buyerAddress?.email || '',
    };

    const invoiceDataToSave: Invoice = {
      ...invoice,
      items: itemsToSave,
      buyerAddress: sanitizedBuyerAddress,
      latestPaymentDate: invoice.latestPaymentDate === undefined ? null : (invoice.latestPaymentDate === '' ? null : invoice.latestPaymentDate),
      invoiceNumber: invoice.invoiceNumber || `INV-ERR-${Date.now()}`,
      invoiceDate: invoice.invoiceDate || new Date().toLocaleDateString('en-CA'),
      buyerGstin: invoice.buyerGstin || '',
      buyerName: invoice.buyerName || '',
      subTotal: typeof invoice.subTotal === 'number' ? invoice.subTotal : 0,
      taxAmount: typeof invoice.taxAmount === 'number' ? invoice.taxAmount : 0,
      grandTotal: typeof invoice.grandTotal === 'number' ? invoice.grandTotal : 0,
      amountPaid: typeof invoice.amountPaid === 'number' ? invoice.amountPaid : 0,
      status: invoice.status || 'Unpaid',
    };

    await setDoc(invoiceDocRef, invoiceDataToSave);
    console.log("[Firebase] Invoice successfully saved to Firestore:", invoice.invoiceNumber);
  } catch (error) {
    console.error(`[Firebase] Error saving invoice ${invoice.invoiceNumber} to Firestore:`, error);
    throw error;
  }
};

export const getInvoicesFromFirestore = async (): Promise<Invoice[]> => {
  console.log("[Firebase] getInvoicesFromFirestore called.");
  try {
    const q = query(invoicesCollectionRef, orderBy("invoiceDate", "desc"), orderBy("invoiceNumber", "desc"));
    const querySnapshot = await getDocs(q);
    const invoices: Invoice[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // console.log(`[Firebase] Raw invoice data for ${docSnap.id}:`, data);

      if (!data.invoiceNumber || typeof data.invoiceNumber !== 'string') {
        console.warn(`[Firebase] Invoice document ${docSnap.id} missing or invalid invoiceNumber. Skipping.`);
        return;
      }
      if (!data.invoiceDate || typeof data.invoiceDate !== 'string') {
        console.warn(`[Firebase] Invoice document ${docSnap.id} missing or invalid invoiceDate. Using fallback.`, data.invoiceDate);
        data.invoiceDate = new Date().toLocaleDateString('en-CA');
      }


      const items = (data.items || []).map((item: any) => ({
        id: item.id || `item-${Date.now()}`,
        name: item.name || "N/A",
        price: typeof item.price === 'number' ? item.price : 0,
        quantity: typeof item.quantity === 'number' ? item.quantity : 0,
        total: typeof item.total === 'number' ? item.total : 0,
        hsnSac: item.hsnSac || '',
        gstRate: item.gstRate === undefined || item.gstRate === null ? 0 : Number(item.gstRate)
      }));

      const buyerAddress: BuyerAddress = {
        name: data.buyerAddress?.name || '',
        addressLine1: data.buyerAddress?.addressLine1 || '',
        addressLine2: data.buyerAddress?.addressLine2 || '',
        gstin: data.buyerAddress?.gstin || '',
        stateNameAndCode: data.buyerAddress?.stateNameAndCode || '',
        contact: data.buyerAddress?.contact || '',
        email: data.buyerAddress?.email || '',
      };

      invoices.push({
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        buyerGstin: data.buyerGstin || '',
        buyerName: data.buyerName || '',
        buyerAddress,
        items,
        subTotal: typeof data.subTotal === 'number' ? data.subTotal : 0,
        taxAmount: typeof data.taxAmount === 'number' ? data.taxAmount : 0,
        grandTotal: typeof data.grandTotal === 'number' ? data.grandTotal : 0,
        amountPaid: typeof data.amountPaid === 'number' ? data.amountPaid : 0,
        status: data.status || 'Unpaid',
        latestPaymentDate: data.latestPaymentDate === null ? undefined : (data.latestPaymentDate === '' ? undefined : data.latestPaymentDate),
      } as Invoice);
    });

    console.log(`[Firebase] Fetched and mapped ${invoices.length} invoices. Sorted by date and number.`);
    return invoices;
  } catch (error) {
    console.error("[Firebase] Error fetching invoices from Firestore:", error);
    return [];
  }
};

export const updateInvoiceInFirestore = async (invoiceNumber: string, updates: Partial<Invoice>): Promise<void> => {
  console.log(`[Firebase] updateInvoiceInFirestore called for ${invoiceNumber} with updates:`, updates);
  try {
    const invoiceDocRef = doc(invoicesCollectionRef, invoiceNumber);
    const updatesToApply: { [key: string]: any } = {};

    if (updates.items) {
      updatesToApply.items = updates.items.map(item => ({
        ...item,
        hsnSac: item.hsnSac || '',
        gstRate: item.gstRate === undefined || item.gstRate === null ? 0 : Number(item.gstRate),
      }));
    }

    if (updates.buyerAddress) {
        updatesToApply.buyerAddress = {
            ...updates.buyerAddress,
            addressLine2: updates.buyerAddress.addressLine2 || '',
            email: updates.buyerAddress.email || '',
        };
    }

    if (updates.hasOwnProperty('latestPaymentDate')) {
      updatesToApply.latestPaymentDate = updates.latestPaymentDate === undefined ? null : (updates.latestPaymentDate === '' ? null : updates.latestPaymentDate) ;
    }

    for (const key in updates) {
      if (updates.hasOwnProperty(key) && !updatesToApply.hasOwnProperty(key)) {
        (updatesToApply as any)[key] = (updates as any)[key];
        if ((updatesToApply as any)[key] === undefined) {
            (updatesToApply as any)[key] = null;
        }
      }
    }

    await setDoc(invoiceDocRef, updatesToApply, { merge: true });
    console.log(`[Firebase] Invoice ${invoiceNumber} updated successfully.`);
  } catch (error) {
    console.error(`[Firebase] Error updating invoice ${invoiceNumber} in Firestore:`, error);
    throw error;
  }
};

// --- Direct Sales Log Functions ---
export const saveDirectSaleLogEntryToFirestore = async (entry: DirectSaleLogEntry): Promise<void> => {
  console.log("[Firebase] saveDirectSaleLogEntryToFirestore called with DS number:", entry.directSaleNumber);
  try {
    const saleDocRef = doc(directSalesLogCollectionRef, entry.directSaleNumber);
    await setDoc(saleDocRef, entry);
    console.log("[Firebase] Direct Sale Log Entry successfully saved:", entry.directSaleNumber);
  } catch (error) {
    console.error(`[Firebase] Error saving Direct Sale Log Entry ${entry.directSaleNumber} to Firestore:`, error);
    throw error;
  }
};

export const getDirectSaleLogEntriesFromFirestore = async (): Promise<DirectSaleLogEntry[]> => {
  console.log("[Firebase] getDirectSaleLogEntriesFromFirestore called.");
  try {
    const q = query(directSalesLogCollectionRef, orderBy("saleDate", "desc"), orderBy("directSaleNumber", "desc"));
    const querySnapshot = await getDocs(q);
    const entries: DirectSaleLogEntry[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      entries.push({
        id: docSnap.id, // or data.id if you store it redundantly
        directSaleNumber: data.directSaleNumber || "DS-ERR",
        saleDate: data.saleDate || new Date().toLocaleDateString('en-CA'),
        items: data.items || [],
        grandTotalSaleAmount: typeof data.grandTotalSaleAmount === 'number' ? data.grandTotalSaleAmount : 0,
        totalSaleProfit: typeof data.totalSaleProfit === 'number' ? data.totalSaleProfit : 0,
      } as DirectSaleLogEntry);
    });
    console.log(`[Firebase] Fetched ${entries.length} direct sale log entries.`);
    return entries;
  } catch (error) {
    console.error("[Firebase] Error fetching direct sale log entries:", error);
    return [];
  }
};


export { db, auth, User };
export type { InventoryItem, BuyerAddress, BuyerProfile, AppSettingsType, SalesRecord, Invoice, InvoiceLineItem, DirectSaleLogEntry };
