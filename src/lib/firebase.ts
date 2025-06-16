
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, writeBatch, deleteDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import type { InventoryItem, BuyerAddress, BuyerProfile, AppSettings as AppSettingsType } from '@/types';

// Firebase configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace
  authDomain: "YOUR_AUTH_DOMAIN", // Replace
  projectId: "YOUR_PROJECT_ID", // Replace
  storageBucket: "YOUR_STORAGE_BUCKET", // Replace
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace
  appId: "YOUR_APP_ID" // Replace
};

// Initialize Firebase app
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

const db = getFirestore(app);
const auth = getAuth(app);

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
    // Removed user check for fetching for now, assuming public read or rules handle auth
    console.log("Fetching inventory...");
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
    // const user = auth.currentUser;
    // if (!user) {
    //   throw new Error("User not logged in. Please login first.");
    // }
    if (!item.id || item.id.trim() === "") {
      throw new Error("Invalid or missing item ID");
    }
    if (typeof item.category !== 'string' || typeof item.name !== 'string' || typeof item.buyingPrice !== 'number' || typeof item.price !== 'number' || typeof item.stock !== 'number') {
      console.error("Invalid item data types:", item);
      throw new Error("Invalid item data: incorrect data types for fields. Check console for details.");
    }

    console.log("Attempting to save item to Firestore:", item);
    const itemDocRef = doc(db, "inventory", item.id);
    await setDoc(itemDocRef, {
      category: item.category,
      name: item.name,
      buyingPrice: item.buyingPrice,
      price: item.price,
      stock: item.stock,
      description: item.description || ''
      // uid: user.uid // Add user ID for ownership if rules require it
    });
    console.log("Item saved successfully with ID:", item.id);
  } catch (error) {
    console.error("Error saving inventory item to Firestore:", error);
    throw error;
  }
};

export const saveMultipleInventoryItemsToFirestore = async (items: InventoryItem[]): Promise<void> => {
  if (!db) {
    console.error("Firestore database instance (db) is not initialized.");
    throw new Error("Database not initialized. Check Firebase configuration.");
  }
  console.log("saveMultipleInventoryItemsToFirestore received items:", items);
  // const user = auth.currentUser;
  // if (!user) {
  //   throw new Error("User not logged in. Please login first.");
  // }
  try {
    const batch = writeBatch(db);
    items.forEach(item => {
      if (!item.id || item.id.trim() === "") {
        console.error("Item missing ID during batch save:", item);
        // Decide: throw error or skip this item? For now, let's throw to highlight.
        throw new Error(`Invalid or missing item ID for item: ${item.name || 'Unknown item'}`);
      }
       if (typeof item.category !== 'string' || typeof item.name !== 'string' || typeof item.buyingPrice !== 'number' || typeof item.price !== 'number' || typeof item.stock !== 'number') {
        console.error("Invalid item data types in batch save:", item);
        throw new Error(`Invalid item data types for item ${item.name}. Check console.`);
      }
      const itemDocRef = doc(db, "inventory", item.id);
      batch.set(itemDocRef, {
        category: item.category,
        name: item.name,
        buyingPrice: item.buyingPrice,
        price: item.price,
        stock: item.stock,
        description: item.description || ''
        // uid: user.uid // Add user ID for ownership if rules require it
      });
    });
    await batch.commit();
    console.log("Multiple items saved successfully to Firestore via batch.");
  } catch (error) {
    console.error("Error saving multiple inventory items to Firestore:", error);
    throw error; // Re-throw to be caught by caller
  }
};

export const deleteInventoryItemFromFirestore = async (itemId: string): Promise<void> => {
  try {
    // const user = auth.currentUser;
    // if (!user) {
    //   throw new Error("User not logged in. Please login first.");
    // }
    const itemDocRef = doc(db, "inventory", itemId);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting inventory item from Firestore:", error);
    throw error;
  }
};

// --- Settings Functions ---
export const getAppSettingsFromFirestore = async (initialGlobalBuyerAddress: BuyerAddress): Promise<AppSettingsType> => {
  try {
    // const user = auth.currentUser;
    // if (!user) {
    //   throw new Error("User not logged in. Please login first.");
    // }
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
        buyerAddress: {
          ...initialGlobalBuyerAddress,
          email: initialGlobalBuyerAddress.email || ''
        },
      };
      await setDoc(settingsDocRef, defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching app settings from Firestore:", error);
    throw error;
  }
};

export const saveInvoiceCounterToFirestore = async (counter: number): Promise<void> => {
  try {
    // const user = auth.currentUser;
    // if (!user) {
    //   throw new Error("User not logged in. Please login first.");
    // }
    await setDoc(settingsDocRef, { invoiceCounter: counter }, { merge: true });
  } catch (error) {
    console.error("Error saving invoice counter to Firestore:", error);
    throw error;
  }
};

export const saveBuyerAddressToAppSettings = async (address: BuyerAddress): Promise<void> => {
  try {
    // const user = auth.currentUser;
    // if (!user) {
    //   throw new Error("User not logged in. Please login first.");
    // }
    const addressToSave = {
      ...address,
      email: address.email || ''
    };
    await setDoc(settingsDocRef, { buyerAddress: addressToSave }, { merge: true });
  } catch (error) {
    console.error("Error saving buyer address to app settings:", error);
    throw error;
  }
};

export const saveAllAppSettingsToFirestore = async (settings: AppSettingsType): Promise<void> => {
  try {
    // const user = auth.currentUser;
    // if (!user) {
    //   throw new Error("User not logged in. Please login first.");
    // }
    const settingsToSave = {
      ...settings,
      buyerAddress: {
        ...(settings.buyerAddress || {}), // Ensure buyerAddress exists before spreading
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
    // const user = auth.currentUser;
    // if (!user) {
    //   throw new Error("User not logged in. Please login first.");
    // }
    const profileDocRef = doc(buyerProfilesCollectionRef, gstin);
    const docSnap = await getDoc(profileDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as BuyerProfile;
      return { ...data, email: data.email || '' };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching buyer profile for GSTIN ${gstin}:`, error);
    throw error;
  }
};

export const saveBuyerProfile = async (gstin: string, address: BuyerAddress): Promise<void> => {
  if (!gstin || gstin.trim() === "") return;
  try {
    // const user = auth.currentUser;
    // if (!user) {
    //   throw new Error("User not logged in. Please login first.");
    // }
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
    await setDoc(profileDocRef, profileData);
  } catch (error) {
    console.error(`Error saving buyer profile for GSTIN ${gstin}:`, error);
    throw error;
  }
};

export { db, auth };
    