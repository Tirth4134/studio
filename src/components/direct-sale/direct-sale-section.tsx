
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { InventoryItem, DirectSaleLineItem, DirectSaleLogEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from "@/components/ui/date-picker";
import { ShoppingBag, PlusSquare, Trash2, DollarSign, Package, Tag, Hash, Percent, Loader2, CalendarDays, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import DirectSaleLogTable from './direct-sale-log-table';


interface DirectSaleSectionProps {
  inventory: InventoryItem[];
  setInventory: (inventoryOrUpdater: InventoryItem[] | ((prevState: InventoryItem[]) => InventoryItem[])) => Promise<void> | void;
  directSaleItems: DirectSaleLineItem[];
  setDirectSaleItems: React.Dispatch<React.SetStateAction<DirectSaleLineItem[]>>;
  onFinalizeDirectSale: (saleDate: string, items: DirectSaleLineItem[]) => Promise<void>;
  isFinalizing: boolean;
  pastDirectSalesLog: DirectSaleLogEntry[];
  fetchPastDirectSalesLog: () => Promise<void>;
}

export default function DirectSaleSection({
  inventory,
  setInventory,
  directSaleItems,
  setDirectSaleItems,
  onFinalizeDirectSale,
  isFinalizing,
  pastDirectSalesLog,
  fetchPastDirectSalesLog,
}: DirectSaleSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const [isRefreshingLog, setIsRefreshingLog] = useState(false);

  const categories = useMemo(() => {
    return [...new Set(inventory.map((item) => item.category))];
  }, [inventory]);

  const itemsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return inventory.filter((item) => item.category === selectedCategory && item.stock > 0);
  }, [inventory, selectedCategory]);

  const handleAddItemToDirectSale = (e: React.FormEvent) => {
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

    const existingItemIndex = directSaleItems.findIndex(dsItem => dsItem.id === item.id);

    if (existingItemIndex !== -1) {
      setDirectSaleItems(prevItems =>
        prevItems.map((dsItem, index) =>
          index === existingItemIndex
            ? { ...dsItem, quantity: dsItem.quantity + qty, total: dsItem.price * (dsItem.quantity + qty) }
            : dsItem
        )
      );
    } else {
      setDirectSaleItems(prevItems => [
        ...prevItems,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: qty,
          total: item.price * qty,
          hsnSac: item.hsnSac,
          gstRate: item.gstRate,
          stock: item.stock,
        },
      ]);
    }

    setInventory(prevInv => prevInv.map(invItem =>
        invItem.id === item.id ? {...invItem, stock: invItem.stock - qty} : invItem
    ));


    if (item.stock - qty < 5 && item.stock - qty > 0) {
        toast({ title: "Low Stock Warning", description: `Low stock for ${item.name}. Only ${item.stock - qty} left!`, variant: "default" });
    } else if (item.stock - qty === 0) {
        toast({ title: "Out of Stock", description: `${item.name} is now out of stock.`, variant: "default" });
    }

    toast({ title: "Item Added", description: `${item.name} (${qty}) added to direct sale.` });
    setSelectedItemId('');
    setQuantity('1');
  };

  const handleRemoveItemFromDirectSale = (itemIdToRemove: string) => {
    const itemBeingRemoved = directSaleItems.find(item => item.id === itemIdToRemove);
    if (!itemBeingRemoved) return;

    setInventory(prevInv => prevInv.map(invItem =>
        invItem.id === itemIdToRemove ? {...invItem, stock: invItem.stock + itemBeingRemoved.quantity} : invItem
    ));
    setDirectSaleItems(prevItems => prevItems.filter(item => item.id !== itemIdToRemove));
    toast({ title: "Item Removed", description: `${itemBeingRemoved.name} removed from direct sale.` });
  };

  const handleFinalizeClick = async () => {
    if (!saleDate) {
      toast({ title: "Error", description: "Please select a sale date.", variant: "destructive" });
      return;
    }
    if (directSaleItems.length === 0) {
      toast({ title: "Error", description: "No items added to the sale.", variant: "destructive" });
      return;
    }
    const formattedSaleDate = format(saleDate, 'yyyy-MM-dd');
    await onFinalizeDirectSale(formattedSaleDate, directSaleItems);
  };

  const currentSaleTotal = useMemo(() => {
    return directSaleItems.reduce((sum, item) => sum + item.total, 0);
  }, [directSaleItems]);

  const handleRefreshLog = async () => {
    setIsRefreshingLog(true);
    try {
      await fetchPastDirectSalesLog();
      toast({ title: "Direct Sales Log Refreshed", description: "The list of past direct sales has been updated." });
    } catch (e) {
      toast({ title: "Refresh Failed", description: `Could not refresh direct sales log. ${(e as Error).message}`, variant: "destructive" });
    } finally {
      setIsRefreshingLog(false);
    }
  };

  useEffect(() => { setSelectedItemId(''); }, [selectedCategory]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-accent/50">
          <CardTitle className="flex items-center font-headline text-xl">
            <ShoppingBag className="mr-2 h-6 w-6 text-accent" /> Record Direct Sale
          </CardTitle>
          <CardDescription>Quickly record over-the-counter sales. Items will be deducted from inventory. Sales are recorded separately from formal invoices.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <form onSubmit={handleAddItemToDirectSale} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-1">
                <Label htmlFor="saleDate" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />Sale Date</Label>
                <DatePicker date={saleDate} setDate={setSaleDate} />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="selectCategoryDirect" className="flex items-center"><Package className="mr-2 h-4 w-4 text-muted-foreground"/>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="selectCategoryDirect"><SelectValue placeholder="Choose Category" /></SelectTrigger>
                  <SelectContent>{categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="selectItemDirect" className="flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground"/>Item</Label>
                <Select value={selectedItemId} onValueChange={setSelectedItemId} disabled={!selectedCategory}>
                  <SelectTrigger id="selectItemDirect"><SelectValue placeholder={selectedCategory ? "Select Item" : "First select category"} /></SelectTrigger>
                  <SelectContent>{itemsInCategory.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} (Stock: {item.stock}) - ${item.price.toFixed(2)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantityDirect" className="flex items-center"><Hash className="mr-2 h-4 w-4 text-muted-foreground"/>Quantity</Label>
                <Input id="quantityDirect" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" min="1" />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/80">
              <PlusSquare className="mr-2 h-5 w-5" /> Add Item to Sale
            </Button>
          </form>

          {directSaleItems.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-2 flex items-center">Current Sale Items</h3>
              <Card className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directSaleItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="icon" onClick={() => handleRemoveItemFromDirectSale(item.id)} className="h-7 w-7">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              <div className="mt-4 text-right">
                <p className="text-xl font-semibold">
                  Grand Total: <span className="text-primary">${currentSaleTotal.toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}

          <div className="border-t pt-6 flex justify-end">
            <Button
              onClick={handleFinalizeClick}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isFinalizing || directSaleItems.length === 0}
            >
              {isFinalizing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <DollarSign className="mr-2 h-5 w-5" />}
              {isFinalizing ? "Processing..." : "Finalize & Record Sale"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg mt-6">
        <CardHeader className="bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="font-headline text-xl">Direct Sales History</CardTitle>
              <CardDescription>Log of all finalized direct sales.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshLog} disabled={isRefreshingLog}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingLog ? 'animate-spin' : ''}`} />
                {isRefreshingLog ? 'Refreshing...' : 'Refresh History'}
            </Button>
        </CardHeader>
        <CardContent className="pt-4">
            <DirectSaleLogTable directSalesLog={pastDirectSalesLog} />
        </CardContent>
      </Card>
    </div>
  );
}
