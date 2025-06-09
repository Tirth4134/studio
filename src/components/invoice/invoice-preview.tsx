
"use client";

// import type { InvoiceLineItem, BuyerAddress } from '@/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as UiTableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Printer } from 'lucide-react';

export interface InvoiceLineItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface BuyerAddress {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  gstin?: string;
  stateNameAndCode?: string;
  contact?: string;
}

interface InvoicePreviewProps {
  invoiceItems: InvoiceLineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  onRemoveItem: (itemId: string, quantity: number) => void;
  onClearInvoice: () => void;
  onPrintInvoice: () => void;
  buyerAddress: BuyerAddress;
}

const GST_RATE = 0.18; // 18%

export default function InvoicePreview({
  invoiceItems,
  invoiceNumber,
  invoiceDate,
  onRemoveItem,
  onClearInvoice,
  onPrintInvoice,
  buyerAddress,
}: InvoicePreviewProps) {
  const subTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subTotal * GST_RATE;
  const grandTotal = subTotal + taxAmount;
  const totalQuantity = invoiceItems.reduce((sum, item) => sum + item.quantity, 0);

  const numberToWords = (num: number): string => {
    const numStr = num.toFixed(2);
    const mainPart = Math.floor(num);
    const decimalPart = Math.round((num - mainPart) * 100);
    let words = `INR Thirty Eight Thousand and One paise Only`; // Placeholder
    return words;
  };

  return (
    <div className="max-w-6xl mx-auto bg-white print-container">
      {/* Header with company details and invoice info */}
      <div className="border-2 border-black">
        {/* Title */}
        <div className="text-center py-2 bg-gray-100 border-b border-black">
          <h1 className="text-xl font-bold">TAX INVOICE</h1>
        </div>
        
        {/* Company and Invoice Details Grid */}
        <div className="grid grid-cols-2 border-b border-black text-xs">
          {/* Left - Company Details */}
          <div className="p-2 border-r border-black">
            <div className="font-bold text-sm mb-1">VISHW ENTERPRISE [2025-2026]</div>
            <div className="space-y-0.5">
              <div>5, SAHAJ COMMERCIAL CORNER,</div>
              <div>OPP.KARNAVATI MEGA MALL,</div>
              <div>SWAMINARAYAN GURUKUL ROAD,</div>
              <div>VASTRAL AHMEDABAD-382418</div>
              <div>COMPLAIN:- 8128664532/8128664529</div>
              <div>INQUIRY:- 8511137641/8511137647</div>
              <div>GSTIN/UIN: 24ABIPP9187G1Z6</div>
              <div>State Name: Gujarat, Code: 24</div>
              <div>E-Mail: vishw_enterprise@yahoo.in</div>
            </div>
          </div>
          
          {/* Right - Invoice Details */}
          <div className="text-xs">
            <div className="grid grid-cols-3 h-full">
              <div className="border-r border-black">
                <div className="p-1 border-b border-black font-bold">Invoice No.</div>
                <div className="p-1 border-b border-black font-bold">Dated</div>
                <div className="p-1 border-b border-black font-bold">Delivery Note</div>
                <div className="p-1 border-b border-black font-bold">Mode/Terms of Payment</div>
                <div className="p-1 border-b border-black font-bold">Reference No. & Date</div>
                <div className="p-1 border-b border-black font-bold">Buyer's Order No.</div>
                <div className="p-1 border-b border-black font-bold">Dispatch Doc No.</div>
                <div className="p-1 border-b border-black font-bold">Dispatched through</div>
                <div className="p-1 font-bold">Terms of Delivery</div>
              </div>
              <div className="border-r border-black">
                <div className="p-1 border-b border-black">{invoiceNumber}</div>
                <div className="p-1 border-b border-black">{invoiceDate}</div>
                <div className="p-1 border-b border-black">T22/11</div>
                <div className="p-1 border-b border-black">FINANCE</div>
                <div className="p-1 border-b border-black">-</div>
                <div className="p-1 border-b border-black">B333845738</div>
                <div className="p-1 border-b border-black">-</div>
                <div className="p-1 border-b border-black">-</div>
                <div className="p-1">-</div>
              </div>
              <div>
                <div className="p-1 border-b border-black font-bold">Dated</div>
                <div className="p-1 border-b border-black">{invoiceDate}</div>
                <div className="p-1 border-b border-black">-</div>
                <div className="p-1 border-b border-black">-</div>
                <div className="p-1 border-b border-black">Other References</div>
                <div className="p-1 border-b border-black">Dated</div>
                <div className="p-1 border-b border-black">{invoiceDate}</div>
                <div className="p-1 border-b border-black">Destination</div>
                <div className="p-1">-</div>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Details (Moved to Left) */}
        <div className="grid grid-cols-2 border-b border-black text-xs">
          <div className="p-2 border-r border-black"> {/* Buyer details now on the left */}
            <div className="font-bold mb-1">Buyer (Bill to)</div>
            <div className="font-bold">{buyerAddress.name || 'NEELKANTH ELECTRICAL'}</div>
            <div>{buyerAddress.addressLine1 || 'SHOP NO 15 N K ARCADE, NR NK-3 IND PARK,'}</div>
            <div>{buyerAddress.addressLine2 || 'BAKROL'}</div>
            <div>GSTIN/UIN: {buyerAddress.gstin || '24AAXFN4403B1ZH'}</div>
            <div>State Name: {buyerAddress.stateNameAndCode || 'Gujarat, Code: 24'}</div>
            <div>Contact: {buyerAddress.contact || '9313647568'}</div>
          </div>
          <div className="p-2"> {/* This is now the empty right column */}
            {/* Intentionally left blank or for future use */}
          </div>
        </div>

        {/* Items Table */}
        <div className="border-b border-black">
          <table className="w-full text-xs print-items-table">
            <thead>
              <tr className="border-b border-black">
                <th className="slno-col border-r border-black p-1">SI</th>
                <th className="description-col border-r border-black p-1">Description of Goods</th>
                <th className="hsn-col border-r border-black p-1">HSN/SAC</th>
                <th className="quantity-col border-r border-black p-1">Quantity</th>
                <th className="rate-col border-r border-black p-1">Rate</th>
                <th className="per-col border-r border-black p-1">per</th>
                <th className="border-r border-black p-1 w-12">Disc. %</th>
                <th className="amount-col border-r border-black p-1">Amount</th>
                <th className="no-print p-1 w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-8">No items added to invoice.</td>
                </tr>
              ) : (
                invoiceItems.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="border-b border-black">
                    <td className="slno-col border-r border-black p-1 text-center">{index + 1}</td>
                    <td className="description-col border-r border-black p-1">{item.name}</td>
                    <td className="hsn-col border-r border-black p-1 text-center">{item.category || 'N/A'}</td>
                    <td className="quantity-col border-r border-black p-1 text-center">{item.quantity} PCS</td>
                    <td className="rate-col border-r border-black p-1 text-right">{item.price.toFixed(2)}</td>
                    <td className="per-col border-r border-black p-1 text-center">PCS</td>
                    <td className="border-r border-black p-1 text-center">-</td>
                    <td className="amount-col border-r border-black p-1 text-right">{item.total.toFixed(2)}</td>
                    <td className="no-print p-1 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveItem(item.id, item.quantity)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              {/* Spacer rows to match image format */}
              {invoiceItems.length > 0 && Array.from({ length: Math.max(0, 8 - invoiceItems.length) }).map((_, i) => (
                <tr key={`spacer-${i}`} className="border-b border-black">
                  <td className="slno-col border-r border-black p-1">&nbsp;</td>
                  <td className="description-col border-r border-black p-1">&nbsp;</td>
                  <td className="hsn-col border-r border-black p-1">&nbsp;</td>
                  <td className="quantity-col border-r border-black p-1">&nbsp;</td>
                  <td className="rate-col border-r border-black p-1">&nbsp;</td>
                  <td className="per-col border-r border-black p-1">&nbsp;</td>
                  <td className="border-r border-black p-1">&nbsp;</td>
                  <td className="amount-col border-r border-black p-1">&nbsp;</td>
                  <td className="no-print p-1">&nbsp;</td>
                </tr>
              ))}
              <tr className="border-b-2 border-black font-bold print-grand-total-row">
                <td colSpan={3} className="border-r border-black p-1 text-right">Total</td>
                <td className="border-r border-black p-1 text-center quantity-col">{totalQuantity} PCS</td>
                <td className="border-r border-black p-1 rate-col">&nbsp;</td>
                <td className="border-r border-black p-1 per-col">&nbsp;</td>
                <td className="border-r border-black p-1">&nbsp;</td>
                <td className="border-r border-black p-1 text-right amount-col">₹ {subTotal.toFixed(2)}</td>
                <td className="no-print p-1">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in words */}
        <div className="border-b border-black p-2 text-xs">
          <div><strong>Amount Chargeable (in words):</strong> {numberToWords(grandTotal)}</div>
        </div>

        {/* Tax Summary Table */}
        <div className="border-b border-black tax-summary-table">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black p-1">HSN/SAC</th>
                <th className="border-r border-black p-1">Taxable Value</th>
                <th colSpan={2} className="border-r border-black p-1">Central Tax</th>
                <th colSpan={2} className="border-r border-black p-1">State Tax</th>
                <th className="p-1">Total Tax Amount</th>
              </tr>
              <tr className="border-b border-black">
                <th className="border-r border-black p-1">&nbsp;</th>
                <th className="border-r border-black p-1">&nbsp;</th>
                <th className="border-r border-black p-1">Rate</th>
                <th className="border-r border-black p-1">Amount</th>
                <th className="border-r border-black p-1">Rate</th>
                <th className="border-r border-black p-1">Amount</th>
                <th className="p-1">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black p-1">{invoiceItems.length > 0 ? (invoiceItems[0].category || 'N/A') : 'N/A'}</td>
                <td className="border-r border-black p-1 text-right">{subTotal.toFixed(2)}</td>
                <td className="border-r border-black p-1 text-center">{(GST_RATE / 2 * 100).toFixed(0)}%</td>
                <td className="border-r border-black p-1 text-right">{(taxAmount / 2).toFixed(2)}</td>
                <td className="border-r border-black p-1 text-center">{(GST_RATE / 2 * 100).toFixed(0)}%</td>
                <td className="border-r border-black p-1 text-right">{(taxAmount / 2).toFixed(2)}</td>
                <td className="p-1 text-right">{taxAmount.toFixed(2)}</td>
              </tr>
              <tr className="border-b-0 font-bold">
                <td className="border-r border-black p-1">Total</td>
                <td className="border-r border-black p-1 text-right">{subTotal.toFixed(2)}</td>
                <td className="border-r border-black p-1">&nbsp;</td>
                <td className="border-r border-black p-1 text-right">{(taxAmount / 2).toFixed(2)}</td>
                <td className="border-r border-black p-1">&nbsp;</td>
                <td className="border-r border-black p-1 text-right">{(taxAmount / 2).toFixed(2)}</td>
                <td className="p-1 text-right">{taxAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tax amount in words */}
        <div className="border-b border-black p-2 text-xs">
          <div><strong>Tax Amount (in words):</strong> {numberToWords(taxAmount)}</div>
        </div>

        {/* Footer with company details, bank details, and signature */}
        <div className="grid grid-cols-3 text-xs invoice-footer-grid">
          <div className="border-r border-black p-2">
            <div className="mb-2">
              <strong>Remarks:</strong><br />
              03
            </div>
            <div>
              <strong>Declaration:</strong><br />
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </div>
          </div>
          <div className="border-r border-black p-2">
            <div className="font-bold mb-1">Company's Bank Details</div>
            <div>Bank Name: ICICI Bank</div>
            <div>A/c No.: 747055500275</div>
            <div>Branch & IFS Code: Vastral & ICIC0007470</div>
          </div>
          <div className="p-2 text-center">
            <div className="mt-8">
              <strong>For: VISHW ENTERPRISE [2025-2026]</strong>
            </div>
            <div className="mt-7 border-t border-black pt-1">
              <strong>Authorised Signatory</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="no-print p-4 flex justify-between bg-gray-50 mt-4">
        <Button variant="destructive" onClick={onClearInvoice}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear Invoice
        </Button>
        <Button onClick={onPrintInvoice} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Printer className="mr-2 h-4 w-4" /> Print Invoice
        </Button>
      </div>
    </div>
  );
}

