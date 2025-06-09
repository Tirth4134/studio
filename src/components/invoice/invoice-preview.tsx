
"use client";

import type { InvoiceLineItem } from '@/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Printer } from 'lucide-react';
import Image from 'next/image';

interface InvoicePreviewProps {
  invoiceItems: InvoiceLineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  onRemoveItem: (itemId: string, quantity: number) => void;
  onClearInvoice: () => void;
  onPrintInvoice: () => void;
}

// Dummy tax rate for display
const GST_RATE = 0.18; // 18%

export default function InvoicePreview({
  invoiceItems,
  invoiceNumber,
  invoiceDate,
  onRemoveItem,
  onClearInvoice,
  onPrintInvoice,
}: InvoicePreviewProps) {
  const subTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subTotal * GST_RATE;
  const grandTotal = subTotal + taxAmount;
  const totalQuantity = invoiceItems.reduce((sum, item) => sum + item.quantity, 0);

  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";
    // This is a highly simplified placeholder
    return `INR ${num.toFixed(2)} in words (placeholder)`;
  };


  return (
    <Card className="shadow-lg print-container border-2 border-black">
      <CardHeader className="p-4 border-b-2 border-black card-header">
        <h1 className="text-2xl font-bold text-center font-headline mb-4">TAX INVOICE</h1>
        <div className="grid grid-cols-2 gap-4 text-xs card-header-spacing">
          {/* Seller Info */}
          <div>
            <p className="font-bold">VISHW ENTERPRISE [2025-2026]</p>
            <p>5, SAHAJ COMMERCIAL CORNER,</p>
            <p>OPP.KARNAVATI MEGA MALL,</p>
            <p>SWAMINARAYAN GURUKUL ROAD,</p>
            <p>VASTRAL AHMEDABAD-382418</p>
            <p>COMPLAIN:- 8128664532/8128664529</p>
            <p>INQUIRY:- 8511137641/8511137647</p>
            <p>GSTIN/UIN: 24ABIPP9187G1Z6</p>
            <p>State Name: Gujarat, Code: 24</p>
            <p>E-Mail: vishw_enterprise@yahoo.in</p>
          </div>
          {/* Invoice Metadata */}
          <div className="border border-black p-1 invoice-meta-table">
            <div className="grid grid-cols-2 border-b border-black">
                <div className="font-bold p-1 border-r border-black">Invoice No.</div>
                <div className="p-1">{invoiceNumber}</div>
            </div>
            <div className="grid grid-cols-2 border-b border-black">
                <div className="font-bold p-1 border-r border-black">Dated</div>
                <div className="p-1">{invoiceDate}</div>
            </div>
            <div className="grid grid-cols-2 border-b border-black">
                <div className="font-bold p-1 border-r border-black">Delivery Note</div>
                <div className="p-1">T22/11 (Placeholder)</div>
            </div>
             <div className="grid grid-cols-2 border-b border-black">
                <div className="font-bold p-1 border-r border-black">Mode/Terms of Payment</div>
                <div className="p-1">FINANCE (Placeholder)</div>
            </div>
            <div className="grid grid-cols-2 border-b border-black">
                <div className="font-bold p-1 border-r border-black">Reference No. & Date</div>
                <div className="p-1">Ref123 (Placeholder)</div>
            </div>
            <div className="grid grid-cols-2 border-b border-black">
                <div className="font-bold p-1 border-r border-black">Buyer's Order No.</div>
                <div className="p-1">B333845738 (Placeholder)</div>
            </div>
             <div className="grid grid-cols-2">
                <div className="font-bold p-1 border-r border-black">Other References</div>
                <div className="p-1">-</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 text-xs card-content">
        <div className="grid grid-cols-2 gap-2 mb-2 border-y-2 border-black py-1 address-section-spacing">
          <div>
            <p className="font-bold">Consignee (Ship to)</p>
            <p>NEELKANTH ELECTRICAL (Placeholder)</p>
            <p>SHOP NO 15 N KARCADE, NR NK-3 IND PARK, BAKROL (Placeholder)</p>
            <p>GSTIN/UIN: 24AAXFN4403B1ZH (Placeholder)</p>
            <p>State Name: Gujarat, Code: 24 (Placeholder)</p>
            <p>Contact: 9313647568 (Placeholder)</p>
          </div>
          <div>
            <p className="font-bold">Buyer (Bill to)</p>
            <p>NEELKANTH ELECTRICAL (Placeholder)</p>
            <p>SHOP NO 15 N KARCADE, NR NK-3 IND PARK, BAKROL (Placeholder)</p>
            <p>GSTIN/UIN: 24AAXFN4403B1ZH (Placeholder)</p>
            <p>State Name: Gujarat, Code: 24 (Placeholder)</p>
            <p>Contact: 9313647568 (Placeholder)</p>
          </div>
        </div>
        
        <div className="overflow-x-auto border-x-2 border-black">
          <Table className="min-w-full print-items-table">
            <TableHeader className="border-b-2 border-black">
              <TableRow>
                <TableHead className="slno-col border-r border-black">Sl No.</TableHead>
                <TableHead className="description-col border-r border-black">Description of Goods</TableHead>
                <TableHead className="hsn-col border-r border-black">HSN/SAC</TableHead>
                <TableHead className="quantity-col text-right border-r border-black">Quantity</TableHead>
                <TableHead className="rate-col text-right border-r border-black">Rate ($)</TableHead>
                <TableHead className="per-col text-right border-r border-black">Per</TableHead>
                <TableHead className="amount-col text-right">Amount ($)</TableHead>
                <TableHead className="no-print w-[80px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.length === 0 ? (
                <TableRow className="border-b border-black">
                  <TableCell colSpan={8} className="text-center h-24">No items added to invoice.</TableCell>
                </TableRow>
              ) : (
                invoiceItems.map((item, index) => (
                  <TableRow key={`${item.id}-${index}`} className="border-b border-black">
                    <TableCell className="slno-col border-r border-black">{index + 1}</TableCell>
                    <TableCell className="description-col border-r border-black">{item.name}</TableCell>
                    <TableCell className="hsn-col border-r border-black">{(item as any).category || item.id.substring(0,6)}</TableCell>
                    <TableCell className="quantity-col text-right border-r border-black">{item.quantity}</TableCell>
                    <TableCell className="rate-col text-right border-r border-black">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="per-col text-right border-r border-black">PCS</TableCell>
                    <TableCell className="amount-col text-right">${item.total.toFixed(2)}</TableCell>
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
            <UiTableFooter className="border-t-2 border-black">
              <TableRow className="print-grand-total-row">
                <TableCell colSpan={3} className="text-right font-bold border-r border-black">Total</TableCell>
                <TableCell className="text-right font-bold border-r border-black">{totalQuantity} PCS</TableCell>
                <TableCell colSpan={2} className="border-r border-black"></TableCell>
                <TableCell className="text-right font-bold">${subTotal.toFixed(2)}</TableCell>
                <TableCell className="no-print"></TableCell>
              </TableRow>
            </UiTableFooter>
          </Table>
        </div>

        <div className="mt-2 text-xs border-t-2 border-black pt-1">
            <p><span className="font-bold">Amount Chargeable (in words):</span> {numberToWords(grandTotal)}</p>
        </div>

        <div className="mt-1 overflow-x-auto border-x-2 border-black border-b-2 text-xs tax-summary-table">
             <Table className="min-w-full">
                <TableHeader className="border-b border-black">
                    <TableRow>
                        <TableHead className="w-[100px] border-r border-black">HSN/SAC</TableHead>
                        <TableHead className="border-r border-black">Taxable Value</TableHead>
                        <TableHead colSpan={2} className="text-center border-r border-black">Central Tax</TableHead>
                        <TableHead colSpan={2} className="text-center border-r border-black">State Tax</TableHead>
                        <TableHead>Total Tax Amount</TableHead>
                    </TableRow>
                    <TableRow className="border-b-2 border-black">
                        <TableHead className="border-r border-black"></TableHead>
                        <TableHead className="border-r border-black"></TableHead>
                        <TableHead className="w-[70px] border-r border-black">Rate</TableHead>
                        <TableHead className="w-[100px] border-r border-black">Amount</TableHead>
                        <TableHead className="w-[70px] border-r border-black">Rate</TableHead>
                        <TableHead className="w-[100px] border-r border-black">Amount</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow className="border-b-0">
                        <TableCell className="border-r border-black">Total (Placeholder)</TableCell>
                        <TableCell className="text-right border-r border-black">${subTotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right border-r border-black">{(GST_RATE / 2 * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right border-r border-black">${(taxAmount / 2).toFixed(2)}</TableCell>
                        <TableCell className="text-right border-r border-black">{(GST_RATE / 2 * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right border-r border-black">${(taxAmount / 2).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold">${taxAmount.toFixed(2)}</TableCell>
                    </TableRow>
                </TableBody>
             </Table>
        </div>
         <div className="mt-1 text-xs">
            <p><span className="font-bold">Tax Amount (in words):</span> {numberToWords(taxAmount)}</p>
        </div>


      </CardContent>
      <CardFooter className="p-4 text-xs border-t-2 border-black card-footer">
        <div className="grid grid-cols-3 gap-4 w-full invoice-footer-grid">
            <div>
                <p><span className="font-bold">Remarks:</span> 03 (Placeholder)</p>
                <p className="font-bold mt-2">Declaration:</p>
                <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            </div>
            <div>
                <p className="font-bold">Company's Bank Details</p>
                <p>Bank Name: ICICI Bank (Placeholder)</p>
                <p>A/c No.: 747005500275 (Placeholder)</p>
                <p>Branch & IFS Code: Vastral & ICIC0007470 (Placeholder)</p>
            </div>
            <div className="text-center">
                 <Image src="https://placehold.co/120x40.png" alt="Signature Placeholder" width={120} height={30} data-ai-hint="signature stamp" className="mx-auto mb-1" />
                <p className="font-bold">For: VISHW ENTERPRISE [2025-2026]</p>
                <p className="mt-2 pt-2 border-t border-dashed border-black">Authorised Signatory</p>
            </div>
        </div>
      </CardFooter>
      <div className="p-6 flex justify-between no-print mt-4">
        <Button variant="destructive" onClick={onClearInvoice}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear Invoice
        </Button>
        <Button variant="default" onClick={onPrintInvoice} className="bg-primary hover:bg-primary/90">
          <Printer className="mr-2 h-4 w-4" /> Print Invoice
        </Button>
      </div>
    </Card>
  );
}

