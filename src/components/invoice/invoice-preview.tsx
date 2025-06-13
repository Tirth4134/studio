
// "use client";

// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input'; // For editable buyer address
// import { Trash2, Printer } from 'lucide-react';
// import type { InvoiceLineItem, BuyerAddress } from '@/types'; // Ensure BuyerAddress is imported

// interface InvoicePreviewProps {
//   invoiceItems: InvoiceLineItem[];
//   invoiceNumber: string;
//   invoiceDate: string;
//   onRemoveItem: (itemId: string, quantity: number) => void;
//   onClearInvoice: () => void;
//   onPrintInvoice: () => void;
//   buyerAddress: BuyerAddress;
//   // setBuyerAddress is no longer needed here as editing moved to CreateInvoiceForm
// }

// const GST_RATE = 0.18; // 18%

// export default function InvoicePreview({
//   invoiceItems,
//   invoiceNumber,
//   invoiceDate,
//   onRemoveItem,
//   onClearInvoice,
//   onPrintInvoice,
//   buyerAddress,
// }: InvoicePreviewProps) {
//   const subTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
//   const taxAmount = subTotal * GST_RATE;
//   const grandTotal = subTotal + taxAmount;
//   const totalQuantity = invoiceItems.reduce((sum, item) => sum + item.quantity, 0);

//   // Basic number to words converter (placeholder - can be expanded)
//   const numberToWords = (num: number): string => {
//     const mainPart = Math.floor(num);
//     const decimalPart = Math.round((num - mainPart) * 100);
//     let words = `INR ${mainPart} Rupees`;
//     if (decimalPart > 0) {
//       words += ` and ${decimalPart} Paise`;
//     }
//     words += ' Only';
//     // This is a very basic placeholder. For a production app, use a robust library.
//     if (num === 38001.00) return `INR Thirty Eight Thousand and One Rupees Only`; // Specific placeholder for example
//     if (num === taxAmount && taxAmount > 0) return `INR ${taxAmount.toFixed(2).replace('.', ' Rupees and ')} Paise Only`; // Basic dynamic for tax
//     return words; // Fallback for other amounts
//   };

//   const numItems = invoiceItems.length;
//   let emptyRowsToRender;

//   if (numItems === 0) {
//     emptyRowsToRender = 5; // Show one full block of 5 empty rows if no items
//   } else {
//     const remainder = numItems % 5;
//     if (remainder === 0) {
//       emptyRowsToRender = 5; // Last block was full, add a new block of 5 empty rows
//     } else {
//       emptyRowsToRender = 5 - remainder; // Complete the current block
//     }
//   }


//   return (
//     <div className="max-w-5xl mx-auto bg-white print-container">
//       {/* Invoice Preview */}
//       <div className=""> {/* Removed border border-gray-400, handled by print-container */}
//         {/* Title */}
//         <div className="text-center py-3 bg-gray-50 border-b card-header">
//           <h1 className="text-lg font-bold">TAX INVOICE</h1>
//         </div>
        
//         {/* Company and Invoice Details Grid */}
//         <div className="grid grid-cols-2 border-b text-xs card-header-spacing">
//           {/* Left - Company Details */}
//           <div className="p-1 border-r"> {/* Reduced padding */}
//             <div className="font-bold text-sm mb-1 mt-1">VISHW ENTERPRISE [2025-2026]</div>
//             <div className="space-y-0.5 leading-tight"> {/* Reduced space-y */}
//               <p className="print-text-line">5, SAHAJ COMMERCIAL CORNER,</p>
//               <p className="print-text-line">OPP.KARNAVATI MEGA MALL,</p>
//               <p className="print-text-line">SWAMINARAYAN GURUKUL ROAD,</p>
//               <p className="print-text-line">VASTRAL AHMEDABAD-382418</p>
//               <p className="print-text-line">COMPLAIN:- 8128664532/8128664529</p>
//               <p className="print-text-line">INQUIRY:- 8511137641/8511137647</p>
//               <p className="print-text-line">GSTIN/UIN: 24ABIPP9187G1Z6</p>
//               <p className="print-text-line">State Name: Gujarat, Code: 24</p>
//               <p className="print-text-line">E-Mail: vishw_enterprise@yahoo.in</p>
//             </div>
//           </div>
          
//           {/* Right - Invoice Details */}
//           <div className="text-xs invoice-meta-table">
//             <div className="grid grid-cols-3 h-full">
//               <div className="border-r">
//                 <div className="p-0.5 border-b font-semibold text-center">Invoice No.</div>
//                 <div className="p-0.5 border-b font-semibold text-center">Dated</div>
//                 <div className="p-0.5 border-b font-semibold text-center">Delivery Note</div>
//                 <div className="p-0.5 border-b font-semibold text-center">Mode/Terms of Payment</div>
//                 <div className="p-0.5 border-b font-semibold text-center">Reference No. & Date</div>
//                 <div className="p-0.5 border-b font-semibold text-center">Buyer's Order No.</div>
//                 <div className="p-0.5 border-b font-semibold text-center">Other References</div>
//                 <div className="p-0.5 border-b font-semibold text-center">Dated</div>
//                 <div className="p-0.5 font-semibold text-center">Terms of Delivery</div>
//               </div>
//               <div className="border-r">
//                 <div className="p-0.5 border-b text-center">{invoiceNumber}</div>
//                 <div className="p-0.5 border-b text-center">{invoiceDate}</div>
//                 <div className="p-0.5 border-b text-center">T22/11</div>
//                 <div className="p-0.5 border-b text-center">FINANCE</div>
//                 <div className="p-0.5 border-b text-center">-</div>
//                 <div className="p-0.5 border-b text-center">B333845738</div>
//                 <div className="p-0.5 border-b text-center">-</div>
//                 <div className="p-0.5 border-b text-center">{invoiceDate}</div>
//                 <div className="p-0.5 text-center">-</div>
//               </div>
//               <div>
//                 <div className="p-0.5 border-b font-semibold text-center">Dated</div>
//                 <div className="p-0.5 border-b text-center">{invoiceDate}</div>
//                 <div className="p-0.5 border-b text-center">-</div>
//                 <div className="p-0.5 border-b text-center">-</div>
//                 <div className="p-0.5 border-b text-center">-</div>
//                 <div className="p-0.5 border-b text-center">Dated</div>
//                 <div className="p-0.5 border-b text-center">Destination</div>
//                 <div className="p-0.5 border-b text-center">-</div>
//                 <div className="p-0.5 text-center">-</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Buyer Details (Moved to Left) */}
//         <div className="grid grid-cols-1 border-b text-xs card-content address-section-spacing"> {/* Changed to grid-cols-1 as Consignee removed */}
//           <div className="p-1"> {/* Reduced padding */}
//             <div className="font-semibold mb-1">Buyer (Bill to)</div>
//             <p className="font-semibold print-text-line">{buyerAddress.name}</p>
//             <p className="print-text-line">{buyerAddress.addressLine1}</p>
//             <p className="print-text-line">{buyerAddress.addressLine2}</p>
//             <p className="print-text-line">GSTIN/UIN: {buyerAddress.gstin}</p>
//             <p className="print-text-line">State Name: {buyerAddress.stateNameAndCode}</p>
//             <p className="print-text-line">Contact: {buyerAddress.contact}</p>
//           </div>
//           {/* The right column for Consignee is now removed */}
//         </div>

//         {/* Items Table */}
//         <div className="border-b card-content">
//           <table className="w-full text-xs print-items-table">
//             <thead>
//               <tr className="border-b bg-gray-50">
//                 <th className="p-1 text-center slno-col">SI</th>
//                 <th className="p-1 text-left description-col">Description of Goods</th>
//                 <th className="p-1 text-center hsn-col">HSN/SAC</th>
//                 <th className="p-1 text-center quantity-col">Quantity</th>
//                 <th className="p-1 text-center rate-col">Rate</th>
//                 <th className="p-1 text-center per-col">per</th>
//                 <th className="p-1 text-center amount-col">Amount</th>
//                 <th className="no-print p-1 text-center w-16">Action</th> {/* Adjusted width */}
//               </tr>
//             </thead>
//             <tbody>
//               {invoiceItems.length === 0 && emptyRowsToRender > 0 ? (
//                 // This part is effectively covered by the Array.from logic below if invoiceItems is empty
//                 // Adding a specific "No items" row only if truly no items and no empty rows are desired (which isn't the case here)
//                 // So, this explicit "No items" row can be removed or adjusted
//                  <tr> 
//                    <td colSpan={8} className="text-center p-4 border-r">No items added to invoice.</td>
//                  </tr>
//               ) : (
//                 invoiceItems.map((item, index) => (
//                   <tr key={`${item.id}-${index}-${index}`} className="border-b">
//                     <td className="p-1 text-center">{index + 1}</td>
//                     <td className="p-1">{item.name}</td>
//                     <td className="p-1 text-center">{item.category || 'N/A'}</td> {/* Display category */}
//                     <td className="p-1 text-center">{item.quantity} PCS</td>
//                     <td className="p-1 text-right">{item.price.toFixed(2)}</td>
//                     <td className="p-1 text-center">PCS</td>
//                     <td className="p-1 text-right">{item.total.toFixed(2)}</td>
//                     <td className="no-print p-1 text-center">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => onRemoveItem(item.id, item.quantity)}
//                         className="h-6 w-6 p-0" 
//                       >
//                         <Trash2 className="h-3 w-3" />
//                       </Button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//               {/* Empty rows for spacing / next entries */}
//               {Array.from({ length: emptyRowsToRender }).map((_, i) => (
//                 <tr key={`spacer-${i}`} className="border-b h-6"> {/* Min height for empty rows */}
//                   <td className="p-1 text-center">&nbsp;</td>
//                   <td className="p-1">&nbsp;</td>
//                   <td className="p-1 text-center">&nbsp;</td>
//                   <td className="p-1 text-center">&nbsp;</td>
//                   <td className="p-1 text-right">&nbsp;</td>
//                   <td className="p-1 text-center">&nbsp;</td>
//                   <td className="p-1 text-right">&nbsp;</td>
//                   <td className="no-print p-1">&nbsp;</td>
//                 </tr>
//               ))}
//               <tr className="border-b font-semibold bg-gray-50 print-grand-total-row">
//                 <td colSpan={3} className="p-1 text-right">Total</td>
//                 <td className="p-1 text-center">{totalQuantity} PCS</td>
//                 <td className="p-1">&nbsp;</td>
//                 <td className="p-1">&nbsp;</td>
//                 <td className="p-1 text-right"> {subTotal.toFixed(2)}</td> {/* Added space for currency alignment */}
//                 <td className="no-print p-1">&nbsp;</td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         {/* Amount in words */}
//         <div className="border-b p-1 text-xs bg-gray-50 card-footer">
//           <div><strong>Amount Chargeable (in words):</strong> {numberToWords(grandTotal)}</div>
//         </div>

//         {/* Tax Summary Table */}
//         <div className="border-b card-content">
//           <table className="w-full text-xs tax-summary-table">
//             <thead>
//               <tr className="border-b bg-gray-50">
//                 <th className="p-1 text-center">HSN/SAC</th>
//                 <th className="p-1 text-center">Taxable Value</th>
//                 <th colSpan={2} className="p-1 text-center">Central Tax</th>
//                 <th colSpan={2} className="p-1 text-center">State Tax</th>
//                 <th className="p-1 text-center">Total Tax Amount</th>
//               </tr>
//               <tr className="border-b">
//                 <th className="p-1">&nbsp;</th>
//                 <th className="p-1">&nbsp;</th>
//                 <th className="p-1 text-center">Rate</th>
//                 <th className="p-1 text-center">Amount</th>
//                 <th className="p-1 text-center">Rate</th>
//                 <th className="p-1 text-center">Amount</th>
//                 <th className="p-1">&nbsp;</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr className="border-b">
//                 <td className="p-1 text-center">84151010</td> {/* Placeholder HSN */}
//                 <td className="p-1 text-right">{subTotal.toFixed(2)}</td>
//                 <td className="p-1 text-center">9%</td>
//                 <td className="p-1 text-right">{(taxAmount / 2).toFixed(2)}</td>
//                 <td className="p-1 text-center">9%</td>
//                 <td className="p-1 text-right">{(taxAmount / 2).toFixed(2)}</td>
//                 <td className="p-1 text-right">{taxAmount.toFixed(2)}</td>
//               </tr>
//               <tr className="font-semibold bg-gray-50">
//                 <td className="p-1 text-center">Total</td>
//                 <td className="p-1 text-right">{subTotal.toFixed(2)}</td>
//                 <td className="p-1">&nbsp;</td>
//                 <td className="p-1 text-right">{(taxAmount / 2).toFixed(2)}</td>
//                 <td className="p-1">&nbsp;</td>
//                 <td className="p-1 text-right">{(taxAmount / 2).toFixed(2)}</td>
//                 <td className="p-1 text-right">{taxAmount.toFixed(2)}</td>
//               </tr>
//             </tbody>
//           </table>
//         </div>

//         {/* Tax amount in words */}
//         <div className="border-b p-1 text-xs bg-gray-50 card-footer">
//           <div><strong>Tax Amount (in words):</strong> {numberToWords(taxAmount)}</div>
//         </div>

//         {/* Footer with company details, bank details, and signature */}
//         <div className="grid grid-cols-3 text-xs card-footer invoice-footer-grid">
//           <div className="p-1">
//             <div className="mb-2">
//               <p className="font-semibold print-text-line">Remarks:</p>
//               <p className="print-text-line">03</p> {/* Placeholder remark */}
//             </div>
//             <div>
//               <p className="font-semibold print-text-line">Declaration:</p>
//               <p className="print-text-line">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
//             </div>
//           </div>
//           <div className="p-1">
//             <div className="font-semibold mb-1 print-text-line">Company's Bank Details</div>
//             <p className="print-text-line">Bank Name: ICICI Bank</p>
//             <p className="print-text-line">A/c No.: 747055500275</p>
//             <p className="print-text-line">Branch & IFS Code: Vastral & ICIC0007470</p>
//           </div>
//           <div className="p-1 text-center">
//             {/* Removed placeholder image */}
//             <div className="mt-4"> {/* Adjusted margin */}
//               <strong className="print-text-line">For: VISHW ENTERPRISE [2025-2026]</strong>
//             </div>
//             <div className="mt-6 border-t pt-1"> {/* Adjusted margin and padding */}
//               <strong className="print-text-line">Authorised Signatory</strong>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="no-print p-4 flex justify-between bg-gray-50 mt-4 rounded-lg">
//         <Button variant="destructive" onClick={onClearInvoice}>
//           <Trash2 className="mr-2 h-4 w-4" /> Clear Invoice
//         </Button>
//         <Button onClick={onPrintInvoice} className="bg-primary hover:bg-primary/90 text-primary-foreground">
//           <Printer className="mr-2 h-4 w-4" /> Print Invoice
//         </Button>
//       </div>
//     </div>
//   );
// }


"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Printer } from 'lucide-react';
// import type { InvoiceLineItem, BuyerAddress } from '@/types';

 interface InvoiceLineItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
  total: number;
}

interface BuyerAddress {
  name: string;
  addressLine1: string;
  addressLine2: string;
  gstin: string;
  stateNameAndCode: string;
  contact: string;
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

  // Enhanced number to words converter
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
      result += " and " + convertHundreds(decimalPart) + "Paise";
    }
    
    result += " Only";
    return result.trim();
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
    <div className="max-w-4xl mx-auto bg-white">
      {/* Invoice Container with proper borders */}
      <div className="border border-gray-400 shadow-lg">
        {/* Title */}
        <div className="text-center py-2 bg-gray-50 border-b border-gray-400">
          <h1 className="text-lg font-bold">TAX INVOICE</h1>
        </div>
        
        {/* Company and Invoice Details Grid */}
        <div className="grid grid-cols-2 border-b border-gray-400 text-xs">
          {/* Left - Company Details */}
          <div className="p-2 border-r border-gray-400">
            <div className="font-bold text-sm mb-2">VISHW ENTERPRISE [2025-2026]</div>
            <div className="space-y-0.5 leading-tight">
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
          </div>
          
          {/* Right - Invoice Details */}
          <div className="text-xs">
            <div className="grid grid-cols-3 h-full">
              <div className="border-r border-gray-300">
                <div className="p-1 border-b border-gray-300 font-semibold text-center bg-gray-50">Invoice No.</div>
                <div className="p-1 border-b border-gray-300 font-semibold text-center bg-gray-50">Dated</div>
                <div className="p-1 border-b border-gray-300 font-semibold text-center bg-gray-50">Delivery Note</div>
                <div className="p-1 border-b border-gray-300 font-semibold text-center bg-gray-50">Mode/Terms of Payment</div>
                <div className="p-1 border-b border-gray-300 font-semibold text-center bg-gray-50">Reference No. & Date</div>
                <div className="p-1 border-b border-gray-300 font-semibold text-center bg-gray-50">Buyer's Order No.</div>
                <div className="p-1 border-b border-gray-300 font-semibold text-center bg-gray-50">Other References</div>
                <div className="p-1 border-b border-gray-300 font-semibold text-center bg-gray-50">Dated</div>
                <div className="p-1 font-semibold text-center bg-gray-50">Terms of Delivery</div>
              </div>
              <div className="border-r border-gray-300">
                <div className="p-1 border-b border-gray-300 text-center">{invoiceNumber}</div>
                <div className="p-1 border-b border-gray-300 text-center">{invoiceDate}</div>
                <div className="p-1 border-b border-gray-300 text-center">T22/11</div>
                <div className="p-1 border-b border-gray-300 text-center">FINANCE</div>
                <div className="p-1 border-b border-gray-300 text-center">-</div>
                <div className="p-1 border-b border-gray-300 text-center">B333845738</div>
                <div className="p-1 border-b border-gray-300 text-center">-</div>
                <div className="p-1 border-b border-gray-300 text-center">{invoiceDate}</div>
                <div className="p-1 text-center">-</div>
              </div>
              <div>
                <div className="p-1 border-b border-gray-300 font-semibold text-center bg-gray-50">Dated</div>
                <div className="p-1 border-b border-gray-300 text-center">{invoiceDate}</div>
                <div className="p-1 border-b border-gray-300 text-center">-</div>
                <div className="p-1 border-b border-gray-300 text-center">-</div>
                <div className="p-1 border-b border-gray-300 text-center">-</div>
                <div className="p-1 border-b border-gray-300 text-center">Dated</div>
                <div className="p-1 border-b border-gray-300 text-center">Destination</div>
                <div className="p-1 border-b border-gray-300 text-center">-</div>
                <div className="p-1 text-center">-</div>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="border-b border-gray-400 text-xs">
          <div className="p-2">
            <div className="font-semibold mb-2">Buyer (Bill to)</div>
            <p className="font-semibold">{buyerAddress.name}</p>
            <p>{buyerAddress.addressLine1}</p>
            <p>{buyerAddress.addressLine2}</p>
            <p>GSTIN/UIN: {buyerAddress.gstin}</p>
            <p>State Name: {buyerAddress.stateNameAndCode}</p>
            <p>Contact: {buyerAddress.contact}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-b border-gray-400">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="p-1 text-center border-r border-gray-300 w-8">SI</th>
                <th className="p-1 text-left border-r border-gray-300">Description of Goods</th>
                <th className="p-1 text-center border-r border-gray-300 w-20">HSN/SAC</th>
                <th className="p-1 text-center border-r border-gray-300 w-20">Quantity</th>
                <th className="p-1 text-center border-r border-gray-300 w-20">Rate</th>
                <th className="p-1 text-center border-r border-gray-300 w-12">per</th>
                <th className="p-1 text-center border-r border-gray-300 w-24">Amount</th>
                <th className="no-print p-1 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4 border-r border-gray-300">No items added to invoice.</td>
                </tr>
              ) : (
                invoiceItems.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="border-b border-gray-300">
                    <td className="p-1 text-center border-r border-gray-300">{index + 1}</td>
                    <td className="p-1 border-r border-gray-300">{item.name}</td>
                    <td className="p-1 text-center border-r border-gray-300">{item.category || 'N/A'}</td>
                    <td className="p-1 text-center border-r border-gray-300">{item.quantity} PCS</td>
                    <td className="p-1 text-right border-r border-gray-300">{item.price.toFixed(2)}</td>
                    <td className="p-1 text-center border-r border-gray-300">PCS</td>
                    <td className="p-1 text-right border-r border-gray-300">{item.total.toFixed(2)}</td>
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
              {/* Empty rows for spacing */}
              {Array.from({ length: emptyRowsToRender }).map((_, i) => (
                <tr key={`spacer-${i}`} className="border-b border-gray-300 h-6">
                  <td className="p-1 text-center border-r border-gray-300">&nbsp;</td>
                  <td className="p-1 border-r border-gray-300">&nbsp;</td>
                  <td className="p-1 text-center border-r border-gray-300">&nbsp;</td>
                  <td className="p-1 text-center border-r border-gray-300">&nbsp;</td>
                  <td className="p-1 text-right border-r border-gray-300">&nbsp;</td>
                  <td className="p-1 text-center border-r border-gray-300">&nbsp;</td>
                  <td className="p-1 text-right border-r border-gray-300">&nbsp;</td>
                  <td className="no-print p-1">&nbsp;</td>
                </tr>
              ))}
              <tr className="border-b border-gray-300 font-semibold bg-gray-50">
                <td colSpan={3} className="p-1 text-right border-r border-gray-300">Total</td>
                <td className="p-1 text-center border-r border-gray-300">{totalQuantity} PCS</td>
                <td className="p-1 border-r border-gray-300">&nbsp;</td>
                <td className="p-1 border-r border-gray-300">&nbsp;</td>
                <td className="p-1 text-right border-r border-gray-300">₹ {subTotal.toFixed(2)}</td>
                <td className="no-print p-1">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in words with Total Amount */}
        <div className="border-b border-gray-400 p-2 text-xs bg-gray-50">
          <div className="grid grid-cols-2">
            <div>
              <strong>Amount Chargeable (in words):</strong>
              <div className="mt-1">{numberToWords(grandTotal)}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg">
                Total Amount: ₹ {grandTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Tax Summary Table */}
        <div className="border-b border-gray-400">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="p-1 text-center border-r border-gray-300">HSN/SAC</th>
                <th className="p-1 text-center border-r border-gray-300">Taxable Value</th>
                <th colSpan={2} className="p-1 text-center border-r border-gray-300">Central Tax</th>
                <th colSpan={2} className="p-1 text-center border-r border-gray-300">State Tax</th>
                <th className="p-1 text-center">Total Tax Amount</th>
              </tr>
              <tr className="border-b border-gray-300">
                <th className="p-1 border-r border-gray-300">&nbsp;</th>
                <th className="p-1 border-r border-gray-300">&nbsp;</th>
                <th className="p-1 text-center border-r border-gray-300">Rate</th>
                <th className="p-1 text-center border-r border-gray-300">Amount</th>
                <th className="p-1 text-center border-r border-gray-300">Rate</th>
                <th className="p-1 text-center border-r border-gray-300">Amount</th>
                <th className="p-1">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="p-1 text-center border-r border-gray-300">84151010</td>
                <td className="p-1 text-right border-r border-gray-300">₹ {subTotal.toFixed(2)}</td>
                <td className="p-1 text-center border-r border-gray-300">9%</td>
                <td className="p-1 text-right border-r border-gray-300">₹ {(taxAmount / 2).toFixed(2)}</td>
                <td className="p-1 text-center border-r border-gray-300">9%</td>
                <td className="p-1 text-right border-r border-gray-300">₹ {(taxAmount / 2).toFixed(2)}</td>
                <td className="p-1 text-right">₹ {taxAmount.toFixed(2)}</td>
              </tr>
              <tr className="font-semibold bg-gray-50">
                <td className="p-1 text-center border-r border-gray-300">Total</td>
                <td className="p-1 text-right border-r border-gray-300">₹ {subTotal.toFixed(2)}</td>
                <td className="p-1 border-r border-gray-300">&nbsp;</td>
                <td className="p-1 text-right border-r border-gray-300">₹ {(taxAmount / 2).toFixed(2)}</td>
                <td className="p-1 border-r border-gray-300">&nbsp;</td>
                <td className="p-1 text-right border-r border-gray-300">₹ {(taxAmount / 2).toFixed(2)}</td>
                <td className="p-1 text-right">₹ {taxAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tax amount in words with Tax Amount */}
        <div className="border-b border-gray-400 p-2 text-xs bg-gray-50">
          <div className="grid grid-cols-2">
            <div>
              <strong>Tax Amount (in words):</strong>
              <div className="mt-1">{numberToWords(taxAmount)}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg">
                Tax Amount: ₹ {taxAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with company details, bank details, and signature */}
        <div className="grid grid-cols-3 text-xs">
          <div className="p-2 border-r border-gray-300">
            <div className="mb-3">
              <p className="font-semibold">Remarks:</p>
              <p>03</p>
            </div>
            <div>
              <p className="font-semibold">Declaration:</p>
              <p className="leading-tight">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            </div>
          </div>
          <div className="p-2 border-r border-gray-300">
            <div className="font-semibold mb-2">Company's Bank Details</div>
            <p>Bank Name: ICICI Bank</p>
            <p>A/c No.: 747055500275</p>
            <p>Branch & IFS Code: Vastral & ICIC0007470</p>
          </div>
          <div className="p-2 text-center">
            <div className="mt-4">
              <strong>For: VISHW ENTERPRISE [2025-2026]</strong>
            </div>
            <div className="mt-16 border-t border-gray-400 pt-2">
              <strong>Authorised Signatory</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
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