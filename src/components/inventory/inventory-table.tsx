"use client";

import type { InventoryItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InventoryTableProps {
  items: InventoryItem[];
}

export default function InventoryTable({ items }: InventoryTableProps) {
  return (
    <ScrollArea className="h-[400px] rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">No items in inventory.</TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.category}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="hidden md:table-cell max-w-xs truncate" title={item.description}>
                  {item.description ? (item.description.length > 50 ? item.description.substring(0, 50) + "..." : item.description) : "N/A"}
                </TableCell>
                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                <TableCell className={`text-right ${item.stock < 5 ? 'text-destructive font-bold' : ''}`}>
                  {item.stock}
                </TableCell>
                <TableCell>
                  {item.stock === 0 ? (
                     <Badge variant="destructive">Out of Stock</Badge>
                  ) : item.stock < 5 ? (
                    <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">Low Stock</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">In Stock</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
