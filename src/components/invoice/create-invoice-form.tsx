
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { InventoryItem, InvoiceLineItem, BuyerAddress, BuyerProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingCart, PlusSquare, UserSquare2, Building2, Mail, Phone, Landmark, Hash, Search, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateInvoiceFormProps {
  inventory: InventoryItem[];
  onAddItemToInvoice: (item: InvoiceLineItem) => void;
  buyerAddress: BuyerAddress;
  setBuyerAddress: (addressOrUpdater: BuyerAddress | ((prevState: BuyerAddress) => BuyerAddress)) => void;
  onLookupBuyerByGSTIN: (gstin: string) => Promise<void>;
  onLookupBuyerByName: (nameQuery: string) => Promise<void>;
  searchedBuyerProfiles: BuyerProfile[];
  clearSearchedBuyerProfiles: () => void;
}

const CustomMapPinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-map-pin"
    {...props}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function CreateInvoiceForm({ 
  inventory, 
  onAddItemToInvoice, 
  buyerAddress, 
  setBuyerAddress,
  onLookupBuyerByGSTIN,
  onLookupBuyerByName,
  searchedBuyerProfiles,
  clearSearchedBuyerProfiles,
}: CreateInvoiceFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [currentGstinInput, setCurrentGstinInput] = useState(buyerAddress.gstin || '');
  const [companyNameSearch, setCompanyNameSearch] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(''); // To hold ID of profile selected from name search

  const { toast } = useToast();

  const categories = useMemo(() => {
    return [...new Set(inventory.map((item) => item.category))];
  }, [inventory]);

  const itemsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return inventory.filter((item) => item.category === selectedCategory && item.stock > 0);
  }, [inventory, selectedCategory]);

  useEffect(() => {
    setCurrentGstinInput(buyerAddress.gstin || '');
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
      id: item.id, name: item.name, price: item.price, quantity: qty,
      total: item.price * qty, category: item.category,
    });
    if (item.stock - qty < 5 && item.stock - qty > 0) {
        toast({ title: "Low Stock Warning", description: `Low stock for ${item.name}. Only ${item.stock - qty} left!`, variant: "default" });
    } else if (item.stock - qty === 0) {
        toast({ title: "Out of Stock", description: `${item.name} is now out of stock.`, variant: "default" });
    }
    setSelectedItemId('');
    setQuantity('1');
  };

  useEffect(() => { setSelectedItemId(''); }, [selectedCategory]);

  const handleAddressChange = (field: keyof BuyerAddress, value: string) => {
    setBuyerAddress(prev => ({ ...prev, [field]: value }));
    if (field === 'gstin') setCurrentGstinInput(value);
  };
  
  const handleGstinLookupButtonClick = () => {
    const gstinToLookup = currentGstinInput.trim().toUpperCase();
    if (gstinToLookup) onLookupBuyerByGSTIN(gstinToLookup);
    else toast({ title: "Info", description: "Please enter a GSTIN to lookup.", variant: "default"});
  };

  const handleGstinBlur = () => {
    const gstinToLookup = currentGstinInput.trim().toUpperCase();
    if (gstinToLookup && (gstinToLookup !== buyerAddress.gstin.toUpperCase() || buyerAddress.name.includes("(Placeholder)"))) {
      onLookupBuyerByGSTIN(gstinToLookup);
    }
  };

  const handleCompanyNameSearchClick = () => {
    const nameQuery = companyNameSearch.trim();
    if (nameQuery) {
      onLookupBuyerByName(nameQuery);
      setSelectedProfileId(''); // Reset selection when new search is made
    } else {
      toast({ title: "Info", description: "Please enter a company name to search.", variant: "default"});
      clearSearchedBuyerProfiles();
    }
  };

  const handleSelectProfileByName = (profileGstin: string) => {
    const selectedProfile = searchedBuyerProfiles.find(p => p.gstin === profileGstin); // Assuming GSTIN is unique ID for profiles
    if (selectedProfile) {
      setBuyerAddress({ // Directly set the full address
        name: selectedProfile.name,
        addressLine1: selectedProfile.addressLine1,
        addressLine2: selectedProfile.addressLine2,
        gstin: selectedProfile.gstin,
        stateNameAndCode: selectedProfile.stateNameAndCode,
        contact: selectedProfile.contact,
        email: selectedProfile.email || '',
      });
      setCurrentGstinInput(selectedProfile.gstin); // Update GSTIN input as well
      toast({title: "Profile Selected", description: `Details for ${selectedProfile.name} loaded.`});
      clearSearchedBuyerProfiles(); // Clear search results after selection
      setCompanyNameSearch(''); // Clear company name search input
      setSelectedProfileId(''); // Clear selected profile ID
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
                <SelectTrigger id="selectCategory"><SelectValue placeholder="Choose Category" /></SelectTrigger>
                <SelectContent>{categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="selectItem">Select Item</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId} disabled={!selectedCategory}>
                <SelectTrigger id="selectItem"><SelectValue placeholder={selectedCategory ? "Select Item" : "First select category"} /></SelectTrigger>
                <SelectContent>{itemsInCategory.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} (Stock: {item.stock}) - ${item.price.toFixed(2)}</SelectItem>)}</SelectContent>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-4">
            <div>
              <Label htmlFor="gstin" className="flex items-center"><Hash className="mr-2 h-4 w-4 text-muted-foreground" />Search by GSTIN/UIN</Label>
              <div className="flex items-center gap-2">
                <Input id="gstin" value={currentGstinInput} onChange={(e) => setCurrentGstinInput(e.target.value.toUpperCase())} onBlur={handleGstinBlur} placeholder="Buyer's GSTIN" />
                <Button type="button" variant="outline" size="icon" onClick={handleGstinLookupButtonClick} aria-label="Lookup GSTIN"><Search className="h-4 w-4"/></Button>
              </div>
            </div>
            <div>
              <Label htmlFor="companyNameSearch" className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />Search by Company Name</Label>
              <div className="flex items-center gap-2">
                <Input id="companyNameSearch" value={companyNameSearch} onChange={(e) => setCompanyNameSearch(e.target.value)} placeholder="Type company name" />
                <Button type="button" variant="outline" size="icon" onClick={handleCompanyNameSearchClick} aria-label="Search Company Name"><Search className="h-4 w-4"/></Button>
              </div>
            </div>
          </div>

          {searchedBuyerProfiles.length > 0 && (
            <div className="mb-4">
              <Label htmlFor="selectFoundProfile">Select Found Profile</Label>
              <Select onValueChange={handleSelectProfileByName} value={selectedProfileId}>
                <SelectTrigger id="selectFoundProfile">
                  <SelectValue placeholder="-- Select a profile --" />
                </SelectTrigger>
                <SelectContent>
                  {searchedBuyerProfiles.map(profile => (
                    <SelectItem key={profile.gstin || profile.name} value={profile.gstin || profile.name}> {/* Use GSTIN as value, fallback to name if no GSTIN */}
                      {profile.name} ({profile.gstin || 'No GSTIN'}) - {profile.addressLine1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1 mb-3">Enter GSTIN or Company Name and search. Or fill details manually below.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="addressLine2" className="flex items-center"><CustomMapPinIcon className="mr-2 h-4 w-4 text-muted-foreground" />Address Line 2 / City</Label>
              <Input id="addressLine2" value={buyerAddress.addressLine2} onChange={(e) => handleAddressChange('addressLine2', e.target.value)} placeholder="Apartment, suite, unit, city" />
            </div>
            <div>
              <Label htmlFor="stateNameAndCode" className="flex items-center"><CustomMapPinIcon className="mr-2 h-4 w-4 text-muted-foreground" />State Name, Code</Label>
              <Input id="stateNameAndCode" value={buyerAddress.stateNameAndCode} onChange={(e) => handleAddressChange('stateNameAndCode', e.target.value)} placeholder="e.g., Gujarat, Code: 24" />
            </div>
            <div>
              <Label htmlFor="contact" className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Contact Number</Label>
              <Input id="contact" type="tel" value={buyerAddress.contact} onChange={(e) => handleAddressChange('contact', e.target.value)} placeholder="Buyer's Phone Number" />
            </div>
            <div>
                <Label htmlFor="finalGstin" className="flex items-center"><Hash className="mr-2 h-4 w-4 text-muted-foreground" />GSTIN/UIN (Final for Invoice)</Label>
                <Input 
                    id="finalGstin" 
                    value={buyerAddress.gstin} 
                    onChange={(e) => handleAddressChange('gstin', e.target.value.toUpperCase())} 
                    placeholder="Buyer's GSTIN for invoice" 
                />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
