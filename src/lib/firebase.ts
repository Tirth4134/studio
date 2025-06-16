
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, writeBatch, deleteDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"; // Keep auth import
import type { InventoryItem, BuyerAddress, BuyerProfile, AppSettings as AppSettingsType } from '@/types';

// Firebase configuration - CRITICAL: REPLACE WITH YOUR ACTUAL CONFIG FROM YOUR FIREBASE PROJECT
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace
  authDomain: "YOUR_AUTH_DOMAIN", // Replace
  projectId: "YOUR_PROJECT_ID", // Replace - This MUST match your Firebase project ID
  storageBucket: "YOUR_STORAGE_BUCKET", // Replace
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace
  appId: "YOUR_APP_ID" // Replace
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
const auth = getAuth(app); // Initialize auth

// Firestore collection references
const inventoryCollectionRef = collection(db, "inventory");
const settingsDocRef = doc(db, "settings", "appState");
const buyerProfilesCollectionRef = collection(db, "buyerProfiles");

// --- Authentication Functions ---
export const loginUser = async (email: string, password: string): Promise<void> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in successfully");
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const monitorAuthState = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// --- Inventory Functions ---
export const getInventoryFromFirestore = async (): Promise<InventoryItem[]> => {
  try {
    // console.warn("Fetching inventory without logged-in user check.");
    console.log("Attempting to fetch inventory from Firestore collection path:", inventoryCollectionRef.path);
    const querySnapshot = await getDocs(inventoryCollectionRef);
    const items: InventoryItem[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as InventoryItem);
    });
    console.log(`Successfully fetched ${items.length} inventory items from Firestore.`);
    return items;
  } catch (error) {
    console.error("Error fetching inventory from Firestore:", error);
    throw error;
  }
};

export const saveInventoryItemToFirestore = async (item: InventoryItem): Promise<void> => {
  try {
    // console.warn("Saving inventory item without logged-in user check.");
    if (!item.id || item.id.trim() === "") {
      console.error("Invalid or missing item ID for single save:", item);
      throw new Error("Invalid or missing item ID for single save operation.");
    }
    if (typeof item.category !== 'string' || typeof item.name !== 'string' || typeof item.buyingPrice !== 'number' || typeof item.price !== 'number' || typeof item.stock !== 'number') {
      console.error("Invalid item data types for single save:", item);
      throw new Error("Invalid item data: incorrect data types for fields during single save. Check console.");
    }

    const itemDocPath = `inventory/${item.id}`;
    console.log(`Attempting to save single item to Firestore. Path: ${itemDocPath}`, "Data:", item);
    const itemDocRef = doc(db, "inventory", item.id);
    await setDoc(itemDocRef, {
      category: item.category,
      name: item.name,
      buyingPrice: item.buyingPrice,
      price: item.price,
      stock: item.stock,
      description: item.description || ''
    });
    console.log("Single item saved successfully to Firestore with ID:", item.id);
  } catch (error) {
    console.error(`Error saving single inventory item (ID: ${item.id}) to Firestore:`, error);
    throw error;
  }
};

export const saveMultipleInventoryItemsToFirestore = async (items: InventoryItem[]): Promise<void> => {
  if (!db) {
    console.error("Firestore database instance (db) is not initialized. Cannot save multiple items.");
    throw new Error("Database not initialized. Check Firebase configuration in firebase.ts.");
  }
  // console.warn("Saving multiple inventory items without logged-in user check.");
  console.log("saveMultipleInventoryItemsToFirestore received items for batch save:", items);

  if (!items || items.length === 0) {
    console.log("No items provided to save in batch. Skipping Firestore write.");
    return;
  }

  try {
    const batch = writeBatch(db);
    let validItemsInBatchCount = 0;
    items.forEach(item => {
      if (!item.id || item.id.trim() === "") {
        console.error("Item missing ID during batch preparation, skipping this item:", item);
        return; // Skip this invalid item
      }
       if (typeof item.category !== 'string' || typeof item.name !== 'string' || typeof item.buyingPrice !== 'number' || typeof item.price !== 'number' || typeof item.stock !== 'number') {
        console.error("Invalid item data types in batch preparation, skipping this item:", item);
        return; // Skip this invalid item
      }
      const itemDocRef = doc(db, "inventory", item.id);
      batch.set(itemDocRef, {
        category: item.category,
        name: item.name,
        buyingPrice: item.buyingPrice,
        price: item.price,
        stock: item.stock,
        description: item.description || ''
      });
      validItemsInBatchCount++;
      console.log(`Added item ID ${item.id} ('${item.name}') to batch.`);
    });

    if (validItemsInBatchCount === 0) {
        console.warn("No valid items were added to the batch (all items might have been missing IDs or had type errors). Nothing to commit to Firestore.");
        return;
    }

    console.log(`Attempting to commit batch with ${validItemsInBatchCount} valid items to Firestore.`);
    await batch.commit();
    console.log(`BATCH COMMIT SUCCESSFUL: ${validItemsInBatchCount} items saved/updated in Firestore.`);
  } catch (error) {
    console.error("CRITICAL ERROR during batch.commit() in saveMultipleInventoryItemsToFirestore:", error);
    // Log the full error object which might contain more details like error.code or error.message
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error; // Re-throw to be caught by caller in page.tsx
  }
};

export const deleteInventoryItemFromFirestore = async (itemId: string): Promise<void> => {
  try {
    // console.warn("Deleting inventory item without logged-in user check.");
    console.log("Attempting to delete item from Firestore. Path:", `inventory/${itemId}`);
    const itemDocRef = doc(db, "inventory", itemId);
    await deleteDoc(itemDocRef);
    console.log("Item deleted successfully from Firestore:", itemId);
  } catch (error) {
    console.error(`Error deleting inventory item (ID: ${itemId}) from Firestore:`, error);
    throw error;
  }
};

// --- Settings Functions ---
export const getAppSettingsFromFirestore = async (initialGlobalBuyerAddress: BuyerAddress): Promise<AppSettingsType> => {
  try {
    // console.warn("Fetching app settings without logged-in user check.");
    console.log("Attempting to fetch app settings from Firestore. Path:", settingsDocRef.path);
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
      const settings = {
        invoiceCounter: data.invoiceCounter || 1,
        buyerAddress: mergedBuyerAddress
      };
      console.log("Successfully fetched app settings from Firestore:", settings);
      return settings;
    } else {
      console.log("App settings document does not exist in Firestore. Creating with defaults.");
      const defaultSettings: AppSettingsType = {
        invoiceCounter: 1,
        buyerAddress: {
          ...initialGlobalBuyerAddress,
          email: initialGlobalBuyerAddress.email || ''
        },
      };
      await setDoc(settingsDocRef, defaultSettings);
      console.log("Default app settings saved to Firestore:", defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching/setting app settings from Firestore:", error);
    throw error;
  }
};

export const saveInvoiceCounterToFirestore = async (counter: number): Promise<void> => {
  try {
    // console.warn("Saving invoice counter without logged-in user check.");
    console.log("Attempting to save invoice counter to Firestore. Path:", settingsDocRef.path, "Counter:", counter);
    await setDoc(settingsDocRef, { invoiceCounter: counter }, { merge: true });
    console.log("Invoice counter saved successfully to Firestore.");
  } catch (error) {
    console.error("Error saving invoice counter to Firestore:", error);
    throw error;
  }
};

export const saveBuyerAddressToAppSettings = async (address: BuyerAddress): Promise<void> => {
  try {
    // console.warn("Saving buyer address without logged-in user check.");
    const addressToSave = {
      ...address,
      email: address.email || ''
    };
    console.log("Attempting to save buyer address to app settings in Firestore. Path:", settingsDocRef.path, "Address:", addressToSave);
    await setDoc(settingsDocRef, { buyerAddress: addressToSave }, { merge: true });
    console.log("Buyer address saved successfully to app settings in Firestore.");
  } catch (error) {
    console.error("Error saving buyer address to app settings in Firestore:", error);
    throw error;
  }
};

export const saveAllAppSettingsToFirestore = async (settings: AppSettingsType): Promise<void> => {
  try {
    // console.warn("Saving all app settings without logged-in user check.");
    const settingsToSave = {
      ...settings,
      buyerAddress: {
        ...(settings.buyerAddress || {}),
        email: settings.buyerAddress?.email || ''
      }
    };
    console.log("Attempting to save all app settings to Firestore. Path:", settingsDocRef.path, "Settings:", settingsToSave);
    await setDoc(settingsDocRef, settingsToSave);
    console.log("All app settings saved successfully to Firestore.");
  } catch (error) {
    console.error("Error saving all app settings to Firestore:", error);
    throw error;
  }
};

// --- Buyer Profiles ---
export const getBuyerProfileByGSTIN = async (gstin: string): Promise<BuyerProfile | null> => {
  if (!gstin || gstin.trim() === "") {
    console.log("GSTIN is empty, skipping buyer profile lookup.");
    return null;
  }
  try {
    // console.warn("Fetching buyer profile without logged-in user check.");
    const profileDocRef = doc(buyerProfilesCollectionRef, gstin);
    console.log("Attempting to fetch buyer profile from Firestore. Path:", profileDocRef.path);
    const docSnap = await getDoc(profileDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as BuyerProfile;
      const profile = { ...data, email: data.email || '' };
      console.log("Buyer profile found in Firestore for GSTIN", gstin, ":", profile);
      return profile;
    }
    console.log("No buyer profile found in Firestore for GSTIN:", gstin);
    return null;
  } catch (error) {
    console.error(`Error fetching buyer profile for GSTIN ${gstin} from Firestore:`, error);
    throw error;
  }
};

export const saveBuyerProfile = async (gstin: string, address: BuyerAddress): Promise<void> => {
  if (!gstin || gstin.trim() === "") {
    console.log("GSTIN is empty, skipping save buyer profile.");
    return;
  }
  try {
    // console.warn("Saving buyer profile without logged-in user check.");
    const profileDocRef = doc(buyerProfilesCollectionRef, gstin);
    const profileData: BuyerProfile = {
      name: address.name,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      gstin: address.gstin,
      stateNameAndCode: address.stateNameAndCode,
      contact: address.contact,
      email: address.email || '',
    };
    console.log("Attempting to save buyer profile to Firestore. Path:", profileDocRef.path, "Data:", profileData);
    await setDoc(profileDocRef, profileData);
    console.log("Buyer profile saved successfully to Firestore for GSTIN:", gstin);
  } catch (error)
{
    console.error(`Error saving buyer profile for GSTIN ${gstin} to Firestore:`, error);
    throw error;
  }
};

export { db, auth };

    