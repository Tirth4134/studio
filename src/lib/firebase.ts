
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, writeBatch, deleteDoc } from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider, // Added
  signInWithPopup,      // Added
  sendPasswordResetEmail, // Added
  type User
} from "firebase/auth";
import type { InventoryItem, BuyerAddress, BuyerProfile, AppSettings as AppSettingsType, SalesRecord } from '@/types';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFkOKPJM9N0aoP5pVYkIV30DFjTHTEiGo",
  authDomain: "invoiceflow-kyl1w.firebaseapp.com",
  projectId: "invoiceflow-kyl1w",
  storageBucket: "invoiceflow-kyl1w.appspot.com", // Standard is .appspot.com, check your console if .firebasestorage.app is specifically listed for config
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
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error; // Re-throw to be handled by the caller, which can set specific messages
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const monitorAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};


// --- Inventory Functions ---
const inventoryCollectionRef = collection(db, "inventory");

export const getInventoryFromFirestore = async (): Promise<InventoryItem[]> => {
  try {
    const querySnapshot = await getDocs(inventoryCollectionRef);
    const items: InventoryItem[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as InventoryItem);
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
    const dataToSave = { 
      category: item.category, name: item.name, buyingPrice: item.buyingPrice, 
      price: item.price, stock: item.stock, description: item.description || '',
      purchaseDate: item.purchaseDate || new Date().toLocaleDateString('en-CA')
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
    const itemData = { 
      category: item.category, name: item.name, buyingPrice: item.buyingPrice, 
      price: item.price, stock: item.stock, description: item.description || '',
      purchaseDate: item.purchaseDate || new Date().toLocaleDateString('en-CA')
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


// --- Settings Functions ---
export const getAppSettingsFromFirestore = async (initialGlobalBuyerAddress: BuyerAddress): Promise<AppSettingsType> => {
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppSettingsType;
      const mergedBuyerAddress: BuyerAddress = {
        name: data.buyerAddress?.name || initialGlobalBuyerAddress.name,
        addressLine1: data.buyerAddress?.addressLine1 || initialGlobalBuyerAddress.addressLine1,
        addressLine2: data.buyerAddress?.addressLine2 || initialGlobalBuyerAddress.addressLine2,
        gstin: data.buyerAddress?.gstin || initialGlobalBuyerAddress.gstin,
        stateNameAndCode: data.buyerAddress?.stateNameAndCode || initialGlobalBuyerAddress.stateNameAndCode,
        contact: data.buyerAddress?.contact || initialGlobalBuyerAddress.contact,
        email: data.buyerAddress?.email || initialGlobalBuyerAddress.email || '',
      };
      return {
        invoiceCounter: data.invoiceCounter || 1,
        buyerAddress: mergedBuyerAddress
      };
    } else {
      const defaultSettings: AppSettingsType = {
        invoiceCounter: 1,
        buyerAddress: {...initialGlobalBuyerAddress, email: initialGlobalBuyerAddress.email || ''},
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

export const saveBuyerAddressToAppSettings = async (address: BuyerAddress): Promise<void> => {
  try {
    const addressToSave = {...address, email: address.email || ''};
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
      buyerAddress: {
        ...(settings.buyerAddress || {}),
        email: settings.buyerAddress?.email || ''
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
    const profileDocRef = doc(buyerProfilesCollectionRef, gstin);
    const docSnap = await getDoc(profileDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as BuyerProfile;
      return { ...data, email: data.email || '' };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching buyer profile for GSTIN ${gstin} from Firestore:`, error);
    throw error;
  }
};

export const saveBuyerProfile = async (gstin: string, address: BuyerAddress): Promise<void> => {
  if (!gstin || gstin.trim() === "") return;
  try {
    const profileDocRef = doc(buyerProfilesCollectionRef, gstin);
    const profileData: BuyerProfile = {
      name: address.name, addressLine1: address.addressLine1, addressLine2: address.addressLine2,
      gstin: address.gstin, stateNameAndCode: address.stateNameAndCode, contact: address.contact,
      email: address.email || '',
    };
    await setDoc(profileDocRef, profileData);
  } catch (error) {
    console.error(`Error saving buyer profile for GSTIN ${gstin} to Firestore:`, error);
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
      records.push(docSnap.data() as SalesRecord); 
    });
    return records;
  } catch (error) {
    console.error("Error fetching sales records from Firestore:", error);
    throw error;
  }
};


export { db, auth, User };
