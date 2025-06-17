
"use client";

import { Button } from '@/components/ui/button';
import { Trash2, Printer } from 'lucide-react';
import type { InvoiceLineItem, BuyerAddress } from '@/types';

interface InvoicePreviewProps {
  invoiceItems: InvoiceLineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  onRemoveItem: (itemId: string, quantity: number) => void;
  onClearInvoice: () => void;
  onPrintInvoice: () => void;
  buyerAddress: BuyerAddress;
}

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
  
  // Calculate the accurate total tax amount based on individual item GST rates
  let totalTaxAmount = 0;
  invoiceItems.forEach(item => {
    const itemGstRate = item.gstRate === undefined || item.gstRate === null || isNaN(item.gstRate) ? 0 : item.gstRate;
    const itemTaxableValue = item.total; 
    const itemIndividualTax = itemTaxableValue * (itemGstRate / 100);
    totalTaxAmount += itemIndividualTax;
  });
  
  // Calculate values for the simplified tax summary table display
  let totalTaxableValueForSummaryDisplay = 0;
  invoiceItems.forEach(item => {
    const itemGstRate = item.gstRate === undefined || item.gstRate === null || isNaN(item.gstRate) ? 0 : item.gstRate;
    if (itemGstRate > 0) {
      totalTaxableValueForSummaryDisplay += item.total;
    }
  });

  const cgstForSummaryDisplay = totalTaxableValueForSummaryDisplay * 0.09;
  const sgstForSummaryDisplay = totalTaxableValueForSummaryDisplay * 0.09;
  const totalTaxForSummaryTable = cgstForSummaryDisplay + sgstForSummaryDisplay;

  const grandTotal = subTotal + totalTaxAmount; // Grand total uses the accurate totalTaxAmount
  const totalQuantity = invoiceItems.reduce((sum, item) => sum + item.quantity, 0);

  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero Rupees Only";
    
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    const convertHundreds = (n: number): string => {
      let result = "";
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + " ";
        return result;
      }
      if (n > 0) {
        result += ones[n] + " ";
      }
      return result;
    };

    let mainPart = Math.floor(num);
    const decimalPart = Math.round((num - mainPart) * 100);
    
    let result = "INR ";
    
    if (mainPart >= 10000000) {
      result += convertHundreds(Math.floor(mainPart / 10000000)) + "Crore ";
      mainPart %= 10000000;
    }
    if (mainPart >= 100000) {
      result += convertHundreds(Math.floor(mainPart / 100000)) + "Lakh ";
      mainPart %= 100000;
    }
    if (mainPart >= 1000) {
      result += convertHundreds(Math.floor(mainPart / 1000)) + "Thousand ";
      mainPart %= 1000;
    }
    if (mainPart > 0) {
      result += convertHundreds(mainPart);
    }
    
    result += "Rupees";
    
    if (decimalPart > 0) {
      let पैसाWord = convertHundreds(decimalPart);
      if (decimalPart > 0 && पैसाWord.trim() === "") पैसाWord = ones[decimalPart] || ""; 
      if (पैसाWord.trim() !== "") result += " and " + पैसाWord + "Paise";
    }
    
    result += " Only";
    return result.trim().replace(/\s+/g, ' '); 
  };

  const numItems = invoiceItems.length;
  let emptyRowsToRender;

  if (numItems === 0) {
    emptyRowsToRender = 5;
  } else {
    const remainder = numItems % 5;
    if (remainder === 0) {
      emptyRowsToRender = 5;
    } else {
      emptyRowsToRender = 5 - remainder;
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white print-container">
      <div className=""> 
        <div className="text-center py-3 bg-gray-50 border-b card-header">
          <h1 className="text-lg font-bold">TAX INVOICE</h1>
        </div>
        
        <div className="grid grid-cols-2 border-b text-xs card-header-spacing">
          <div className="p-1 border-r"> 
            <div className="font-bold text-sm mb-1 mt-1">VISHW ENTERPRISE [2025-2026]</div>
            <div className="space-y-0.5 leading-tight">
              <p className="print-text-line">5, SAHAJ COMMERCIAL CORNER,</p>
              <p className="print-text-line">OPP.KARNAVATI MEGA MALL,</p>
              <p className="print-text-line">SWAMINARAYAN GURUKUL ROAD,</p>
              <p className="print-text-line">VASTRAL AHMEDABAD-382418</p>
              <p className="print-text-line">COMPLAIN:- 8128664532/8128664529</p>
              <p className="print-text-line">INQUIRY:- 8511137641/8511137647</p>
              <p className="print-text-line">GSTIN/UIN: 24ABIPP9187G1Z6</p>
              <p className="print-text-line">State Name: Gujarat, Code: 24</p>
              <p className="print-text-line">E-Mail: vishw_enterprise@yahoo.in</p>
            </div>
          </div>
          
          <div className="text-xs invoice-meta-table">
            <div className="grid grid-cols-3 h-full">
              <div className="border-r">
                <div className="p-0.5 border-b font-semibold text-center">Invoice No.</div>
                <div className="p-0.5 border-b font-semibold text-center">Dated</div>
                <div className="p-0.5 border-b font-semibold text-center">Delivery Note</div>
                <div className="p-0.5 border-b font-semibold text-center">Mode/Terms of Payment</div>
                <div className="p-0.5 border-b font-semibold text-center">Reference No. & Date</div>
                <div className="p-0.5 border-b font-semibold text-center">Buyer's Order No.</div>
                <div className="p-0.5 border-b font-semibold text-center">Other References</div>
                <div className="p-0.5 border-b font-semibold text-center">Dated</div>
                <div className="p-0.5 font-semibold text-center">Terms of Delivery</div>
              </div>
              <div className="border-r">
                <div className="p-0.5 border-b text-center">{invoiceNumber}</div>
                <div className="p-0.5 border-b text-center">{invoiceDate}</div>
                <div className="p-0.5 border-b text-center">T22/11</div>
                <div className="p-0.5 border-b text-center">FINANCE</div>
                <div className="p-0.5 border-b text-center">-</div>
                <div className="p-0.5 border-b text-center">B333845738</div>
                <div className="p-0.5 border-b text-center">-</div>
                <div className="p-0.5 border-b text-center">{invoiceDate}</div>
                <div className="p-0.5 text-center">-</div>
              </div>
              <div>
                <div className="p-0.5 border-b font-semibold text-center">Dated</div>
                <div className="p-0.5 border-b text-center">{invoiceDate}</div>
                <div className="p-0.5 border-b text-center">-</div>
                <div className="p-0.5 border-b text-center">-</div>
                <div className="p-0.5 border-b text-center">-</div>
                <div className="p-0.5 border-b text-center">Dated</div>
                <div className="p-0.5 border-b text-center">Destination</div>
                <div className="p-0.5 border-b text-center">-</div>
                <div className="p-0.5 text-center">-</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 border-b text-xs card-content address-section-spacing"> 
          <div className="p-1"> 
            <div className="font-semibold mb-1">Buyer (Bill to)</div>
            <p className="font-semibold print-text-line">{buyerAddress.name}</p>
            <p className="print-text-line">{buyerAddress.addressLine1}</p>
            <p className="print-text-line">{buyerAddress.addressLine2}</p>
            <p className="print-text-line">GSTIN/UIN: {buyerAddress.gstin}</p>
            <p className="print-text-line">State Name: {buyerAddress.stateNameAndCode}</p>
            <p className="print-text-line">Contact: {buyerAddress.contact}</p>
            {buyerAddress.email && <p className="print-text-line">Email: {buyerAddress.email}</p>}
          </div>
        </div>

        <div className="border-b card-content">
          <table className="w-full text-xs print-items-table">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-1 text-center slno-col">SI</th>
                <th className="p-1 text-left description-col">Description of Goods</th>
                <th className="p-1 text-center hsn-col">HSN/SAC</th>
                <th className="p-1 text-center gst-percent-col">GST %</th>
                <th className="p-1 text-center quantity-col">Quantity</th>
                <th className="p-1 text-center rate-col">Rate</th>
                <th className="p-1 text-center per-col">per</th>
                <th className="p-1 text-center amount-col">Amount</th>
                <th className="no-print p-1 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.length === 0 && emptyRowsToRender > 0 ? (
                 <tr> 
                   <td colSpan={9} className="text-center p-4 border-r">No items added to invoice.</td>
                 </tr>
              ) : (
                invoiceItems.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="border-b">
                    <td className="p-1 text-center">{index + 1}</td>
                    <td className="p-1">{item.name}</td>
                    <td className="p-1 text-center">{item.hsnSac || 'N/A'}</td>
                    <td className="p-1 text-center">{item.gstRate !== undefined ? `${item.gstRate.toFixed(2)}%` : 'N/A'}</td>
                    <td className="p-1 text-center">{item.quantity} PCS</td>
                    <td className="p-1 text-right">{item.price.toFixed(2)}</td>
                    <td className="p-1 text-center">PCS</td>
                    <td className="p-1 text-right">{item.total.toFixed(2)}</td>
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
              {Array.from({ length: emptyRowsToRender }).map((_, i) => (
                <tr key={`spacer-${i}`} className="border-b h-6"> 
                  <td className="p-1 text-center">&nbsp;</td>
                  <td className="p-1">&nbsp;</td>
                  <td className="p-1 text-center">&nbsp;</td>
                  <td className="p-1 text-center">&nbsp;</td>
                  <td className="p-1 text-center">&nbsp;</td>
                  <td className="p-1 text-right">&nbsp;</td>
                  <td className="p-1 text-center">&nbsp;</td>
                  <td className="p-1 text-right">&nbsp;</td>
                  <td className="no-print p-1">&nbsp;</td>
                </tr>
              ))}
              <tr className="border-b font-semibold bg-gray-50 print-grand-total-row">
                <td colSpan={4} className="p-1 text-right">Total</td>
                <td className="p-1 text-center">{totalQuantity} PCS</td>
                <td className="p-1">&nbsp;</td>
                <td className="p-1">&nbsp;</td>
                <td className="p-1 text-right">₹ {subTotal.toFixed(2)}</td>
                <td className="no-print p-1">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-b p-1 text-xs bg-gray-50 card-footer">
          <div><strong>Amount Chargeable (in words):</strong> {numberToWords(grandTotal)}</div>
        </div>

        <div className="border-b card-content">
          <table className="w-full text-xs tax-summary-table">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-1 text-left">Taxable Value</th>
                <th colSpan={2} className="p-1 text-center">Central Tax</th>
                <th colSpan={2} className="p-1 text-center">State Tax</th>
                <th className="p-1 text-center">Total Tax Amount</th>
              </tr>
              <tr className="border-b">
                <th className="p-1">&nbsp;</th>
                <th className="p-1 text-center">Rate</th>
                <th className="p-1 text-center">Amount</th>
                <th className="p-1 text-center">Rate</th>
                <th className="p-1 text-center">Amount</th>
                <th className="p-1">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                  <td className="p-1 text-right">₹ {totalTaxableValueForSummaryDisplay.toFixed(2)}</td>
                  <td className="p-1 text-center">9.00%</td>
                  <td className="p-1 text-right">₹ {cgstForSummaryDisplay.toFixed(2)}</td>
                  <td className="p-1 text-center">9.00%</td>
                  <td className="p-1 text-right">₹ {sgstForSummaryDisplay.toFixed(2)}</td>
                  <td className="p-1 text-right">₹ {totalTaxForSummaryTable.toFixed(2)}</td>
              </tr>
              <tr className="font-semibold bg-gray-50">
                <td className="p-1 text-left font-bold">Total</td>
                <td className="p-1">&nbsp;</td>
                <td className="p-1 text-right font-bold">₹ {cgstForSummaryDisplay.toFixed(2)}</td>
                <td className="p-1">&nbsp;</td>
                <td className="p-1 text-right font-bold">₹ {sgstForSummaryDisplay.toFixed(2)}</td>
                <td className="p-1 text-right font-bold">₹ {totalTaxForSummaryTable.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-b p-1 text-xs bg-gray-50 card-footer">
          {/* This uses the accurate totalTaxAmount from individual item calculations */}
          <div><strong>Tax Amount (in words):</strong> {numberToWords(totalTaxAmount)}</div>
        </div>

        <div className="grid grid-cols-3 text-xs card-footer invoice-footer-grid">
          <div className="p-1">
            <div className="mb-2">
              <p className="font-semibold print-text-line">Remarks:</p>
              <p className="print-text-line">03</p>
            </div>
            <div>
              <p className="font-semibold print-text-line">Declaration:</p>
              <p className="print-text-line">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            </div>
          </div>
          <div className="p-1">
            <div className="font-semibold mb-1 print-text-line">Company's Bank Details</div>
            <p className="print-text-line">Bank Name: ICICI Bank</p>
            <p className="print-text-line">A/c No.: 747055500275</p>
            <p className="print-text-line">Branch & IFS Code: Vastral & ICIC0007470</p>
          </div>
          <div className="p-1 text-center">
            <div className="mt-4"> 
              <strong className="print-text-line">For: VISHW ENTERPRISE [2025-2026]</strong>
            </div>
            <div className="mt-6 border-t pt-1"> 
              <strong className="print-text-line">Authorised Signatory</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print p-4 flex justify-between bg-gray-50 mt-4 rounded-lg">
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

