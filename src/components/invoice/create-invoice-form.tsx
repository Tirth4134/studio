
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { InventoryItem, InvoiceLineItem, BuyerAddress } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingCart, PlusSquare, UserSquare2, Building2, Mail, Phone, Landmark, Hash, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';

interface CreateInvoiceFormProps {
  inventory: InventoryItem[];
  onAddItemToInvoice: (item: InvoiceLineItem) => void;
  buyerAddress: BuyerAddress;
  setBuyerAddress: (address: BuyerAddress | ((prevState: BuyerAddress) => BuyerAddress)) => void; // Allow functional updates
  onLookupBuyerByGSTIN: (gstin: string) => Promise<void>;
}

export default function CreateInvoiceForm({ 
  inventory, 
  onAddItemToInvoice, 
  buyerAddress, 
  setBuyerAddress,
  onLookupBuyerByGSTIN 
}: CreateInvoiceFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [gstinForLookup, setGstinForLookup] = useState(buyerAddress.gstin || '');
  const { toast } = useToast();

  const categories = useMemo(() => {
    return [...new Set(inventory.map((item) => item.category))];
  }, [inventory]);

  const itemsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return inventory.filter((item) => item.category === selectedCategory && item.stock > 0);
  }, [inventory, selectedCategory]);

  // Sync gstinForLookup with buyerAddress.gstin from props
  useEffect(() => {
    setGstinForLookup(buyerAddress.gstin || '');
  }, [buyerAddress.gstin]);

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
      price: item.price, // This is selling price
      quantity: qty,
      total: item.price * qty,
    });

    if (item.stock - qty < 5 && item.stock - qty > 0) {
        toast({ title: "Low Stock Warning", description: `Low stock for ${item.name}. Only ${item.stock - qty} left!`, variant: "warning" });
    } else if (item.stock - qty === 0) {
        toast({ title: "Out of Stock", description: `${item.name} is now out of stock.`, variant: "warning" });
    }

    setSelectedItemId('');
    setQuantity('1');
  };

  useEffect(() => {
    setSelectedItemId(''); 
  }, [selectedCategory]);

  const handleAddressChange = (field: keyof BuyerAddress, value: string) => {
    setBuyerAddress(prev => ({ ...prev, [field]: value }));
    if (field === 'gstin') {
      setGstinForLookup(value);
    }
  };

  const handleGstinBlur = () => {
    if (gstinForLookup && gstinForLookup.trim() !== "" && gstinForLookup !== buyerAddress.gstin) {
       // Only lookup if gstinForLookup is different from current buyerAddress.gstin to avoid redundant lookups on field updates
      onLookupBuyerByGSTIN(gstinForLookup.trim());
    } else if (gstinForLookup && gstinForLookup.trim() !== "" && gstinForLookup === buyerAddress.gstin && !buyerAddress.name.includes("Placeholder")) {
        // If gstin is same and name is not placeholder, means details are likely already loaded for this gstin
        // No need to lookup again unless explicitly requested by a button.
    } else if(gstinForLookup && gstinForLookup.trim() !== "") {
        onLookupBuyerByGSTIN(gstinForLookup.trim());
    }
  };
  
  const handleGstinLookupButtonClick = () => {
    if (gstinForLookup && gstinForLookup.trim() !== "") {
      onLookupBuyerByGSTIN(gstinForLookup.trim());
    } else {
      toast({ title: "Info", description: "Please enter a GSTIN to lookup.", variant: "default"});
    }
  };


  return (
    <Card className="mb-6 shadow-lg no-print">
      <CardHeader className="bg-accent/50">
        <CardTitle className="flex items-center font-headline text-xl">
          <ShoppingCart className="mr-2 h-6 w-6 text-accent" /> Create Invoice
        </CardTitle>
        <CardDescription>Add items to the invoice and specify buyer details.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
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

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center font-headline">
            <UserSquare2 className="mr-2 h-5 w-5 text-primary" /> Buyer Details (Bill To)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="gstin" className="flex items-center"><Hash className="mr-2 h-4 w-4 text-muted-foreground" />GSTIN/UIN</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="gstin" 
                  value={gstinForLookup} 
                  onChange={(e) => handleAddressChange('gstin', e.target.value)}
                  onBlur={handleGstinBlur}
                  placeholder="Buyer's GSTIN (for auto-fill)" 
                />
                <Button type="button" variant="outline" size="icon" onClick={handleGstinLookupButtonClick} aria-label="Lookup GSTIN">
                  <Search className="h-4 w-4"/>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Enter GSTIN and move out of the field or click search to auto-fill address if previously stored.</p>
            </div>
            <div>
              <Label htmlFor="buyerName" className="flex items-center"><Building2 className="mr-2 h-4 w-4 text-muted-foreground" />Buyer Name</Label>
              <Input id="buyerName" value={buyerAddress.name} onChange={(e) => handleAddressChange('name', e.target.value)} placeholder="Full Name or Company Name" />
            </div>
             <div>
              <Label htmlFor="buyerEmail" className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Buyer Email (Optional)</Label>
              <Input id="buyerEmail" type="email" value={buyerAddress.email || ''} onChange={(e) => handleAddressChange('email', e.target.value)} placeholder="buyer@example.com" />
            </div>
            <div>
              <Label htmlFor="addressLine1" className="flex items-center"><Landmark className="mr-2 h-4 w-4 text-muted-foreground" />Address Line 1</Label>
              <Input id="addressLine1" value={buyerAddress.addressLine1} onChange={(e) => handleAddressChange('addressLine1', e.target.value)} placeholder="Street Address, P.O. Box" />
            </div>
            <div>
              <Label htmlFor="addressLine2" className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Address Line 2 / City</Label>
              <Input id="addressLine2" value={buyerAddress.addressLine2} onChange={(e) => handleAddressChange('addressLine2', e.target.value)} placeholder="Apartment, suite, unit, city" />
            </div>
             <div>
              <Label htmlFor="stateNameAndCode" className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />State Name, Code</Label>
              <Input id="stateNameAndCode" value={buyerAddress.stateNameAndCode} onChange={(e) => handleAddressChange('stateNameAndCode', e.target.value)} placeholder="e.g., Gujarat, Code: 24" />
            </div>
            <div>
              <Label htmlFor="contact" className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Contact Number</Label>
              <Input id="contact" type="tel" value={buyerAddress.contact} onChange={(e) => handleAddressChange('contact', e.target.value)} placeholder="Buyer's Phone Number" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper icon, as MapPin is not in Lucide by default
const MapPin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
