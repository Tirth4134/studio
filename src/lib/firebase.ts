
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Added for Firebase Auth
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, writeBatch, deleteDoc } from "firebase/firestore";
import type { InventoryItem, BuyerAddress, BuyerProfile, AppSettings as AppSettingsType } from '@/types';

// IMPORTANT: REPLACE WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION
// You can find these details in your Firebase project settings:
// Project settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your actual API key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your actual auth domain
  projectId: "YOUR_PROJECT_ID", // Replace with your actual project ID
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // Replace with your actual storage bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your actual messaging sender ID
  appId: "YOUR_APP_ID" // Replace with your actual app ID
};


let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

const db = getFirestore(app);
const auth = getAuth(app); // Initialize Firebase Auth

// Firestore collection references
const inventoryCollectionRef = collection(db, "inventory");
const settingsDocRef = doc(db, "settings", "appState");
const buyerProfilesCollectionRef = collection(db, "buyerProfiles");

// --- Inventory Functions ---
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
    const itemDocRef = doc(db, "inventory", item.id);
    await setDoc(itemDocRef, {
      category: item.category,
      name: item.name,
      buyingPrice: item.buyingPrice,
      price: item.price,
      stock: item.stock,
      description: item.description || ''
    });
  } catch (error) {
    console.error("Error saving inventory item to Firestore:", error);
    throw error;
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
        buyingPrice: item.buyingPrice,
        price: item.price,
        stock: item.stock,
        description: item.description || ''
      });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error saving multiple inventory items to Firestore:", error);
    throw error;
  }
}

export const deleteInventoryItemFromFirestore = async (itemId: string): Promise<void> => {
  try {
    const itemDocRef = doc(db, "inventory", itemId);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting inventory item from Firestore:", error);
    throw error;
  }
};

// --- Settings Functions (Invoice Counter & Default/Last Used Buyer Address) ---

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
    await setDoc(settingsDocRef, { invoiceCounter: counter }, { merge: true });
  } catch (error) {
    console.error("Error saving invoice counter to Firestore:", error);
    throw error;
  }
};

export const saveBuyerAddressToAppSettings = async (address: BuyerAddress): Promise<void> => {
  try {
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
}

// --- Buyer Profiles (Stored by GSTIN) ---
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
    console.error(`Error fetching buyer profile for GSTIN ${gstin}:`, error);
    throw error;
  }
};

export const saveBuyerProfile = async (gstin: string, address: BuyerAddress): Promise<void> => {
   if (!gstin || gstin.trim() === "") return;
  try {
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

export { db, auth }; // Export auth instance
