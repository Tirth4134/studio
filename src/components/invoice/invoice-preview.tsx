
"use client";

import type { InvoiceLineItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Printer } from 'lucide-react'; // FileText for fa-file-invoice
import Image from 'next/image';

interface InvoicePreviewProps {
  invoiceItems: InvoiceLineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  onRemoveItem: (itemId: string, quantity: number) => void;
  onClearInvoice: () => void;
  onPrintInvoice: () => void;
}

export default function InvoicePreview({
  invoiceItems,
  invoiceNumber,
  invoiceDate,
  onRemoveItem,
  onClearInvoice,
  onPrintInvoice,
}: InvoicePreviewProps) {
  const grandTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card className="shadow-lg print-container">
      <CardHeader className="bg-primary text-primary-foreground text-center print-card-header">
        <div className="flex items-center justify-center mb-2">
          <Image src="https://placehold.co/100x50.png" alt="Company Logo" width={100} height={50} data-ai-hint="company logo" className="mr-4" />
          <div>
            <h2 className="text-3xl font-headline">INVOICE</h2>
            <p className="text-sm">Electronic Shop - InvoiceFlow</p>
          </div>
        </div>
        <div className="text-left text-xs mt-2">
          <p><strong>Your Company Name</strong></p>
          <p>123 Business Rd, Suite 456</p>
          <p>City, State, ZIP Code</p>
          <p>Phone: (123) 456-7890</p>
          <p>Email: contact@yourshop.com</p>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between mb-6 text-sm">
          <div>
            <strong>Invoice Date:</strong> {invoiceDate}
          </div>
          <div>
            <strong>Invoice #:</strong> {invoiceNumber}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="print-table-header">
              <TableRow>
                <TableHead className="w-[50px]">S.No</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Price ($)</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total ($)</TableHead>
                <TableHead className="no-print w-[100px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">No items added to invoice.</TableCell>
                </TableRow>
              ) : (
                invoiceItems.map((item, index) => (
                  <TableRow key={`${item.id}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                    <TableCell className="no-print text-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => onRemoveItem(item.id, item.quantity)}
                      >
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Remove item</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <UiTableFooter>
              <TableRow className="print-grand-total-row">
                <TableCell colSpan={4} className="text-right font-bold text-lg">Grand Total:</TableCell>
                <TableCell className="text-right font-bold text-lg">${grandTotal.toFixed(2)}</TableCell>
                <TableCell className="no-print"></TableCell>
              </TableRow>
            </UiTableFooter>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="p-6 flex justify-between no-print">
        <Button variant="destructive" onClick={onClearInvoice}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear Invoice
        </Button>
        <Button variant="default" onClick={onPrintInvoice} className="bg-primary hover:bg-primary/90">
          <Printer className="mr-2 h-4 w-4" /> Print Invoice
        </Button>
      </CardFooter>
    </Card>
  );
}
