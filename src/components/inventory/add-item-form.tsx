
"use client";

import { useState } from 'react';
import type { InventoryItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, CalendarDays, Percent, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddItemFormProps {
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
}

export default function AddItemForm({ onAddItem }: AddItemFormProps) {
  const [category, setCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toLocaleDateString('en-CA')); // Default to today
  const [hsnSac, setHsnSac] = useState('');
  const [gstRate, setGstRate] = useState('');
  const { toast } = useToast();

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !itemName || !buyingPrice || !sellingPrice || !stock || !purchaseDate) {
      toast({ title: "Error", description: "Please fill all required fields correctly, including Purchase Date.", variant: "destructive" });
      return;
    }
    const numBuyingPrice = parseFloat(buyingPrice);
    const numSellingPrice = parseFloat(sellingPrice);
    const numStock = parseInt(stock, 10);
    const numGstRate = gstRate ? parseFloat(gstRate) : undefined; // GST Rate is optional

    if (isNaN(numBuyingPrice) || numBuyingPrice <= 0 || isNaN(numSellingPrice) || numSellingPrice <= 0 || isNaN(numStock) || numStock < 0) {
      toast({ title: "Error", description: "Prices and stock must be valid positive numbers.", variant: "destructive" });
      return;
    }
    if (numGstRate !== undefined && (isNaN(numGstRate) || numGstRate < 0 || numGstRate > 100)) {
      toast({ title: "Error", description: "GST Rate must be a valid percentage (0-100) or left empty.", variant: "destructive" });
      return;
    }
    
    onAddItem({
      category,
      name: itemName,
      buyingPrice: numBuyingPrice,
      price: numSellingPrice, // 'price' field is used for selling price in InventoryItem
      stock: numStock,
      description: description,
      purchaseDate: purchaseDate,
      hsnSac: hsnSac.trim() || undefined,
      gstRate: numGstRate,
    });

    // Keep category, clear other fields, reset purchaseDate to today
    setItemName('');
    setBuyingPrice('');
    setSellingPrice('');
    setStock('');
    setDescription('');
    setPurchaseDate(new Date().toLocaleDateString('en-CA'));
    setHsnSac('');
    setGstRate('');
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Mobile" />
            </div>
            <div className="lg:col-span-1">
              <Label htmlFor="itemName">Item Name</Label>
              <Input id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. iPhone 15" />
            </div>
             <div>
              <Label htmlFor="hsnSac" className="flex items-center">
                <Hash className="mr-2 h-4 w-4 text-muted-foreground" /> HSN/SAC Code
              </Label>
              <Input id="hsnSac" value={hsnSac} onChange={(e) => setHsnSac(e.target.value)} placeholder="e.g. 851712" />
            </div>
            <div>
              <Label htmlFor="gstRate"  className="flex items-center">
                <Percent className="mr-2 h-4 w-4 text-muted-foreground" /> GST Rate (%)
              </Label>
              <Input id="gstRate" type="number" value={gstRate} onChange={(e) => setGstRate(e.target.value)} placeholder="e.g. 18" step="0.01" min="0" max="100"/>
            </div>
            <div>
              <Label htmlFor="buyingPrice" >Buying Price ($)</Label>
              <Input id="buyingPrice" type="number" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} placeholder="0.00" step="0.01" />
            </div>
            <div>
              <Label htmlFor="sellingPrice">Selling Price ($)</Label>
              <Input id="sellingPrice" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0.00" step="0.01" />
            </div>
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
            </div>
             <div className="md:col-span-1">
              <Label htmlFor="purchaseDate" className="flex items-center">
                <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                Purchase Date
              </Label>
              <Input id="purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
          </div>
           <div className="space-y-2 md:col-span-4">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter item description." />
          </div>
          <div className="pt-2 flex justify-end md:col-span-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Item
              </Button>
            </div>
        </form>
      </CardContent>
    </Card>
  );
}
