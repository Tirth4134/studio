
"use client";

import { useState, useMemo } from 'react';
import type { InventoryItem } from '@/types';
import AddItemForm from './add-item-form';
import InventoryTable from './inventory-table';
import InventorySearch from './inventory-search';
import EditItemDialog from './edit-item-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Archive, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InventorySectionProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export default function InventorySection({ inventory, setInventory }: InventorySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddItem = (item: InventoryItem) => {
    setInventory((prevInventory) => [...prevInventory, item]);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setInventory((prevInventory) =>
      prevInventory.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    setItemToDeleteId(itemId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDeleteId) {
      setInventory((prevInventory) => prevInventory.filter((item) => item.id !== itemToDeleteId));
      toast({ title: "Success", description: "Item deleted successfully." });
    }
    setIsDeleteDialogOpen(false);
    setItemToDeleteId(null);
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
          <InventoryTable
            items={filteredInventory}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
        </CardContent>
      </Card>

      {editingItem && (
        <EditItemDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          itemToEdit={editingItem}
          onUpdateItem={handleUpdateItem}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
