"use client";

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface InventorySearchProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export default function InventorySearch({ searchTerm, onSearchTermChange }: InventorySearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search inventory by name or category..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="pl-10 w-full md:w-1/3"
      />
    </div>
  );
}
