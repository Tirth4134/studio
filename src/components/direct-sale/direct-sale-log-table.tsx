
"use client";

import type { DirectSaleLogEntry, DirectSaleItemDetail } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PackageOpen } from 'lucide-react';

interface DirectSaleLogTableProps {
  directSalesLog: DirectSaleLogEntry[];
}

export default function DirectSaleLogTable({ directSalesLog }: DirectSaleLogTableProps) {
  if (!directSalesLog || directSalesLog.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No direct sales recorded yet.</p>;
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow>
            <TableHead>DS Number</TableHead>
            <TableHead>Sale Date</TableHead>
            <TableHead className="text-right">Total Amount (₹)</TableHead>
            <TableHead className="text-right">Total Profit (₹)</TableHead>
            <TableHead className="text-center">Items</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {directSalesLog.map((logEntry) => (
            <TableRow key={logEntry.id}>
              <TableCell className="font-medium">{logEntry.directSaleNumber}</TableCell>
              <TableCell>{format(new Date(logEntry.saleDate), 'dd MMM yyyy')}</TableCell>
              <TableCell className="text-right">{logEntry.grandTotalSaleAmount.toFixed(2)}</TableCell>
              <TableCell className="text-right">{logEntry.totalSaleProfit.toFixed(2)}</TableCell>
              <TableCell className="text-center">
                 <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={`item-${logEntry.id}`} className="border-none">
                    <AccordionTrigger className="text-xs p-1 hover:no-underline justify-center">
                       <PackageOpen className="h-4 w-4 mr-1" /> {logEntry.items.length} item(s)
                    </AccordionTrigger>
                    <AccordionContent className="text-left p-2 bg-muted/50 rounded-md">
                      <ul className="list-disc pl-4 text-xs space-y-1">
                        {logEntry.items.map((item, index) => (
                          <li key={index}>
                            {item.itemName} (Qty: {item.quantitySold}, Price: ₹{item.sellingPricePerUnit.toFixed(2)} each, Profit: ₹{item.totalItemProfit.toFixed(2)})
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
