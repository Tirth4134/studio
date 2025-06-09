"use client";

import { useState, useMemo } from 'react';
import type { InventoryItem } from '@/types';
import AddItemForm from './add-item-form';
import InventoryTable from './inventory-table';
import InventorySearch from './inventory-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive } from 'lucide-react'; // Using Archive as fa-warehouse replacement

interface InventorySectionProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export default function InventorySection({ inventory, setInventory }: InventorySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddItem = (item: InventoryItem) => {
    setInventory((prevInventory) => [...prevInventory, item]);
  };

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  return (
    <div className="space-y-6">
      <AddItemForm onAddItem={handleAddItem} />
      <Card className="shadow-lg">
        <CardHeader className="bg-secondary/30 flex flex-row items-center justify-between py-4">
          <div className="flex items-center">
            <Archive className="mr-2 h-6 w-6 text-secondary-foreground" />
            <CardTitle className="font-headline text-xl">Current Inventory</CardTitle>
          </div>
          <InventorySearch searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
        </CardHeader>
        <CardContent className="pt-0">
          <InventoryTable items={filteredInventory} />
        </CardContent>
      </Card>
    </div>
  );
}
