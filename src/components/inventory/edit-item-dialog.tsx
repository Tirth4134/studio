
"use client";

import { useState, useEffect } from 'react';
import type { InventoryItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Sparkles, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateItemDescription } from '@/ai/flows/enrich-item-description';

interface EditItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  itemToEdit: InventoryItem | null;
  onUpdateItem: (item: InventoryItem) => void;
}

export default function EditItemDialog({ isOpen, onOpenChange, itemToEdit, onUpdateItem }: EditItemDialogProps) {
  const [category, setCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  // const [isEnriching, setIsEnriching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (itemToEdit) {
      setCategory(itemToEdit.category);
      setItemName(itemToEdit.name);
      setPrice(itemToEdit.price.toString());
      setStock(itemToEdit.stock.toString());
      setDescription(itemToEdit.description || '');
    }
  }, [itemToEdit]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !itemName || !price || !stock || !itemToEdit) {
      toast({ title: "Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    const numPrice = parseFloat(price);
    const numStock = parseInt(stock, 10);

    if (isNaN(numPrice) || numPrice <= 0 || isNaN(numStock) || numStock < 0) {
       toast({ title: "Error", description: "Price and stock must be valid positive numbers.", variant: "destructive" });
      return;
    }
    
    onUpdateItem({
      ...itemToEdit,
      category,
      name: itemName,
      price: numPrice,
      stock: numStock,
      description: description,
    });
    toast({ title: "Success", description: `${itemName} updated successfully.` });
    onOpenChange(false); // Close dialog on successful update
  };

  const handleEnrichDescription = async () => {
    if (!category || !itemName || !price) {
       toast({ title: "Info", description: "Please enter Category, Item Name, and Price to enrich description.", variant: "default"});
      return;
    }
    // setIsEnriching(true);
    try {
      const numPrice = parseFloat(price);
       if (isNaN(numPrice) || numPrice <=0) {
         toast({ title: "Error", description: "Please enter a valid price.", variant: "destructive" });
        //  setIsEnriching(false);
         return;
      }
      const result = await generateItemDescription({ category, itemName, price: numPrice });
      setDescription(result.description);
      toast({ title: "Success", description: "Description enriched successfully." });
    } catch (error) {
      console.error("Error enriching description:", error);
      toast({ title: "Error", description: "Failed to enrich description.", variant: "destructive" });
    }
    // setIsEnriching(false);
  };

  if (!itemToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Item: {itemToEdit.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input id="edit-category" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-itemName">Item Name</Label>
              <Input id="edit-itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input id="edit-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} step="0.01" />
            </div>
            <div>
              <Label htmlFor="edit-stock">Stock Quantity</Label>
              <Input id="edit-stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Item description" />
             {/* <Button type="button" variant="outline" onClick={handleEnrichDescription} disabled={isEnriching}>
              {isEnriching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />}
              Enrich Description
            </Button> */}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-5 w-5" /> Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
