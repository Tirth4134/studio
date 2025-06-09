"use client";

import { useState } from 'react';
import type { InventoryItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Sparkles, Loader2 } from 'lucide-react';
import { generateUniqueId } from '@/lib/invoice-utils';
import { useToast } from '@/hooks/use-toast';
import { generateItemDescription } from '@/ai/flows/enrich-item-description';


interface AddItemFormProps {
  onAddItem: (item: InventoryItem) => void;
}

export default function AddItemForm({ onAddItem }: AddItemFormProps) {
  const [category, setCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  // const [isEnriching, setIsEnriching] = useState(false);
  const { toast } = useToast();

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !itemName || !price || !stock) {
      toast({ title: "Error", description: "Please fill all required fields correctly.", variant: "destructive" });
      return;
    }
    const numPrice = parseFloat(price);
    const numStock = parseInt(stock, 10);

    if (isNaN(numPrice) || numPrice <= 0 || isNaN(numStock) || numStock < 0) {
      toast({ title: "Error", description: "Price and stock must be valid positive numbers.", variant: "destructive" });
      return;
    }
    
    onAddItem({
      id: generateUniqueId(),
      category,
      name: itemName,
      price: numPrice,
      stock: numStock,
      description: description,
    });

    toast({ title: "Success", description: `${itemName} added to inventory.` });
    setCategory('');
    setItemName('');
    setPrice('');
    setStock('');
    setDescription('');
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


  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="bg-accent/50">
        <CardTitle className="flex items-center font-headline text-xl">
          <PlusCircle className="mr-2 h-6 w-6 text-accent" /> Add New Item to Inventory
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Mobile, Laptop" />
            </div>
            <div>
              <Label htmlFor="itemName">Item Name</Label>
              <Input id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. iPhone 15" />
            </div>
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" step="0.01" />
            </div>
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
            </div>
             <div className="pt-6 self-end">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Item
                </Button>
              </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter item description or use AI to enrich it." />
            {/* <Button type="button" variant="outline" onClick={handleEnrichDescription} disabled={isEnriching}>
              {isEnriching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />}
              Enrich Description
            </Button> */}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
