import React, { useState, useEffect } from "react";
import { auth, getInventoryFromFirestore, loginUser, monitorAuthState } from "./firebase";
import type { InventoryItem } from "@/types";
import { onAuthStateChanged } from "firebase/auth";

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = monitorAuthState((user) => {
      if (user) {
        setIsLoggedIn(true);
        loadInventory();
      } else {
        setIsLoggedIn(false);
        setLoading(false);
        setError("User not logged in. Please login first.");
      }
    });
    return () => unsubscribe();
  }, []);



  const loadInventory = async () => {
    try {
      setLoading(true);
      const items = await getInventoryFromFirestore();
      setInventory(items);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Could not load data from Firestore. Using defaults.");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await loginUser("tirth123@gmail.com", "Tirth#234"); // Replace with actual credentials or a form
      setIsLoggedIn(true);
      loadInventory();
    } catch (err: any) {
      setError("Login failed: " + err.message);
    }
  };

  if (isLoggedIn === null) {
    return <div>Checking authentication...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <h1>InvoiceFlow</h1>
      {loading && <p>Loading inventory...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <div>
          <h2>Add New Item to Inventory</h2>
          {/* Your form for adding items */}
          <h2>Current Inventory</h2>
          {inventory.length === 0 ? (
            <p>No items in inventory.</p>
          ) : (
            <ul>
              {inventory.map((item) => (
                <li key={item.id}>{item.name} - {item.stock} in stock</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryPage;

function fetchData() {
    throw new Error("Function not implemented.");
}
