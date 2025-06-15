
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, writeBatch, deleteDoc } from "firebase/firestore";
import type { InventoryItem, BuyerAddress } from '@/types';

// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

const db = getFirestore(app);

// Firestore collection references
const inventoryCollection = collection(db, "inventory");
const settingsDocRef = doc(db, "settings", "appState");

// --- Inventory Functions ---
export const getInventoryFromFirestore = async (): Promise<InventoryItem[]> => {
  try {
    const querySnapshot = await getDocs(inventoryCollection);
    const items: InventoryItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as InventoryItem);
    });
    return items;
  } catch (error) {
    console.error("Error fetching inventory from Firestore:", error);
    return [];
  }
};

export const saveInventoryItemToFirestore = async (item: InventoryItem): Promise<void> => {
  try {
    const itemDocRef = doc(db, "inventory", item.id);
    await setDoc(itemDocRef, { 
      category: item.category,
      name: item.name,
      price: item.price,
      stock: item.stock,
      description: item.description || ''
    });
  } catch (error) {
    console.error("Error saving inventory item to Firestore:", error);
  }
};

export const saveMultipleInventoryItemsToFirestore = async (items: InventoryItem[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    items.forEach(item => {
      const itemDocRef = doc(db, "inventory", item.id);
      batch.set(itemDocRef, {
        category: item.category,
        name: item.name,
        price: item.price,
        stock: item.stock,
        description: item.description || ''
      });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error saving multiple inventory items to Firestore:", error);
  }
}

export const deleteInventoryItemFromFirestore = async (itemId: string): Promise<void> => {
  try {
    const itemDocRef = doc(db, "inventory", itemId);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting inventory item from Firestore:", error);
  }
};

// --- Settings Functions (Invoice Counter & Buyer Address) ---
interface AppSettings {
  invoiceCounter: number;
  buyerAddress: BuyerAddress;
}

export const getAppSettingsFromFirestore = async (initialBuyerAddress: BuyerAddress): Promise<AppSettings> => {
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    } else {
      // Initialize settings if they don't exist
      const defaultSettings: AppSettings = { invoiceCounter: 1, buyerAddress: initialBuyerAddress };
      await setDoc(settingsDocRef, defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching app settings from Firestore:", error);
    return { invoiceCounter: 1, buyerAddress: initialBuyerAddress }; // Fallback to defaults
  }
};

export const saveInvoiceCounterToFirestore = async (counter: number): Promise<void> => {
  try {
    await setDoc(settingsDocRef, { invoiceCounter: counter }, { merge: true });
  } catch (error) {
    console.error("Error saving invoice counter to Firestore:", error);
  }
};

export const saveBuyerAddressToFirestore = async (address: BuyerAddress): Promise<void> => {
  try {
    await setDoc(settingsDocRef, { buyerAddress: address }, { merge: true });
  } catch (error) {
    console.error("Error saving buyer address to Firestore:", error);
  }
};

export const saveAllAppSettingsToFirestore = async (settings: AppSettings): Promise<void> => {
  try {
    await setDoc(settingsDocRef, settings);
  } catch (error) {
    console.error("Error saving all app settings to Firestore:", error);
  }
}

export { db };
