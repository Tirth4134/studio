"use client";

import { useState, useEffect, useMemo } from 'react';
import type { InventoryItem, InvoiceLineItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, PlusSquare } from 'lucide-react'; // ShoppingCart for fa-shopping-cart, PlusSquare for fa-cart-plus
import { useToast } from '@/hooks/use-toast';

interface CreateInvoiceFormProps {
  inventory: InventoryItem[];
  onAddItemToInvoice: (item: InvoiceLineItem) => void;
}

export default function CreateInvoiceForm({ inventory, onAddItemToInvoice }: CreateInvoiceFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const { toast } = useToast();

  const categories = useMemo(() => {
    return [...new Set(inventory.map((item) => item.category))];
  }, [inventory]);

  const itemsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return inventory.filter((item) => item.category === selectedCategory && item.stock > 0);
  }, [inventory, selectedCategory]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find((i) => i.id === selectedItemId);
    const qty = parseInt(quantity, 10);

    if (!item || !qty || qty <= 0) {
      toast({ title: "Error", description: "Please select an item and enter a valid quantity.", variant: "destructive" });
      return;
    }

    if (item.stock < qty) {
      toast({ title: "Error", description: `Not enough stock for ${item.name}. Available: ${item.stock}`, variant: "destructive" });
      return;
    }
    
    onAddItemToInvoice({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: qty,
      total: item.price * qty,
    });

    if (item.stock - qty < 5 && item.stock - qty > 0) {
        toast({ title: "Warning", description: `Low stock for ${item.name}. Only ${item.stock - qty} left!`, variant: "default" });
    } else if (item.stock - qty === 0) {
        toast({ title: "Warning", description: `${item.name} is now out of stock.`, variant: "default" });
    }


    setSelectedItemId('');
    setQuantity('1');
    // The category can remain selected for adding more items from the same category
  };

  useEffect(() => {
    setSelectedItemId(''); // Reset item selection when category changes
  }, [selectedCategory]);

  return (
    <Card className="mb-6 shadow-lg no-print">
      <CardHeader className="bg-accent/50">
        <CardTitle className="flex items-center font-headline text-xl">
          <ShoppingCart className="mr-2 h-6 w-6 text-accent" /> Create Invoice
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Label htmlFor="selectCategory">Select Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="selectCategory">
                  <SelectValue placeholder="Choose Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="selectItem">Select Item</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId} disabled={!selectedCategory}>
                <SelectTrigger id="selectItem">
                  <SelectValue placeholder={selectedCategory ? "Select Item" : "First select category"} />
                </SelectTrigger>
                <SelectContent>
                  {itemsInCategory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Stock: {item.stock}) - ${item.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" min="1" />
            </div>
          </div>
          <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/80">
            <PlusSquare className="mr-2 h-5 w-5" /> Add to Invoice
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
