
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { SalesRecord, Invoice, InventoryItem } from '@/types';
import { getSalesRecordsFromFirestore, updateInvoiceInFirestore, getInventoryFromFirestore } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DatePicker } from "@/components/ui/date-picker"; 
import { BarChart3, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Edit, Save, XCircle, RefreshCw } from 'lucide-react';
import ProfitLossChart from './profit-loss-chart';
import { subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, differenceInDays, startOfYear, endOfYear, isValid, formatISO } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';


interface AggregatedProfitDataPoint {
  date: string; // Formatted for display
  profit: number;
  loss: number; 
  originalDate: string; // yyyy-MM-dd or yyyy-MM, for sorting
}

interface ReportsSectionProps {
  pastInvoices: Invoice[];
  onInvoiceUpdate: (updatedInvoice: Invoice) => void;
  isLoading: boolean; 
  fetchPastInvoices: () => Promise<void>; 
}


export default function ReportsSection({ pastInvoices, onInvoiceUpdate, isLoading: isLoadingProp, fetchPastInvoices }: ReportsSectionProps) {
  console.log("[ReportsSection] Rendering. Received pastInvoices count:", pastInvoices.length, "isLoadingProp:", isLoadingProp);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRangeOption, setTimeRangeOption] = useState<string>('last30days'); 
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditDialogOpén, setIsEditDialogOpen] = useState(false);
  const [editNewPaymentAmount, setEditNewPaymentAmount] = useState<string>('');
  const [editStatus, setEditStatus] = useState<Invoice['status']>('Unpaid');
  const [editPaymentDate, setEditPaymentDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const [isRefreshingInvoices, setIsRefreshingInvoices] = useState(false);

  useEffect(() => {
    console.log("[ReportsSection] useEffect for initial data fetch triggered.");
    setIsDataLoading(true); 
    const fetchReportData = async () => {
      setError(null);
      try {
        const [fetchedSalesRecords, fetchedInventoryItems] = await Promise.all([
          getSalesRecordsFromFirestore(),
          getInventoryFromFirestore() 
        ]);
        setSalesRecords(fetchedSalesRecords);
        setInventoryItems(fetchedInventoryItems);
        console.log(`[ReportsSection] Successfully fetched ${fetchedSalesRecords.length} sales records and ${fetchedInventoryItems.length} inventory items.`);
      } catch (err: any) {
        console.error("[ReportsSection] Error fetching report data:", err);
        setError(`Failed to load report data. ${err.message || 'Please try again later.'} This might be due to a missing Firestore index. Check the browser console for a link to create it.`);
      } finally {
        setIsDataLoading(false);
        console.log("[ReportsSection] Report data fetch finished.");
      }
    };
    fetchReportData();
  }, []); 

  const handleRefreshInvoices = async () => {
    console.log("[ReportsSection] handleRefreshInvoices called.");
    setIsRefreshingInvoices(true);
    try {
      await fetchPastInvoices(); 
      toast({title: "Invoices Refreshed", description: "Past invoices list has been updated."});
    } catch (e) {
       console.error("[ReportsSection] Error during manual invoice refresh:", e);
       toast({title: "Refresh Failed", description: `Could not refresh invoices. ${(e as Error).message}`, variant: "destructive"});
    } finally {
      setIsRefreshingInvoices(false);
      console.log("[ReportsSection] handleRefreshInvoices finished.");
    }
  };

  const processedChartData = useMemo(() => {
    console.log("[ReportsSection] Recomputing processedChartData. Past Invoices:", pastInvoices.length, "Sales Records:", salesRecords.length, "Inventory Items:", inventoryItems.length);
    if (isDataLoading && pastInvoices.length === 0) return []; // Wait for all data
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (timeRangeOption === 'custom' && customDateRange?.from) {
        startDate = customDateRange.from;
        endDate = customDateRange.to || customDateRange.from;
    } else {
        switch (timeRangeOption) {
            case 'today': startDate = now; endDate = now; break;
            case 'last7days': startDate = subDays(now, 6); break;
            case 'last30days': startDate = subDays(now, 29); break;
            case 'thisWeek': startDate = startOfWeek(now, { weekStartsOn: 1 }); endDate = endOfWeek(now, { weekStartsOn: 1}); break;
            case 'thisMonth': startDate = startOfMonth(now); endDate = endOfMonth(now); break;
            case 'lastYear': startDate = startOfYear(subDays(now, 365)); endDate = endOfYear(subDays(now, 365)); break;
            case 'thisYear': startDate = startOfYear(now); endDate = endOfYear(now); break;
            case 'allTime': default:
                 const allDates: Date[] = [];
                if (pastInvoices.length > 0) {
                    pastInvoices.forEach(inv => {
                        if (inv.latestPaymentDate && isValid(parseISO(inv.latestPaymentDate))) allDates.push(parseISO(inv.latestPaymentDate));
                        if (inv.invoiceDate && isValid(parseISO(inv.invoiceDate))) allDates.push(parseISO(inv.invoiceDate));
                    });
                }
                if (inventoryItems.length > 0) {
                    inventoryItems.forEach(item => {
                        if (item.purchaseDate && isValid(parseISO(item.purchaseDate))) allDates.push(parseISO(item.purchaseDate));
                    });
                }
                if(allDates.length > 0){
                    allDates.sort((a,b) => a.getTime() - b.getTime());
                    startDate = allDates[0];
                } else {
                    startDate = now; // Fallback if no dates found
                }
                break;
        }
    }
    
    const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

    const aggregatedMap: Record<string, { profit: number; loss: number }> = {};
    const daysDiff = differenceInDays(normalizedEndDate, normalizedStartDate);
    let aggregationFormat = 'yyyy-MM-dd';
    if (daysDiff > 90) aggregationFormat = 'yyyy-MM'; // Aggregate by month if range is > 90 days

    // 1. Process Sales-related Profit/Loss from Paid Invoices
    pastInvoices.forEach(invoice => {
        if (!invoice.latestPaymentDate || invoice.amountPaid <= 0) return;

        const paymentDate = parseISO(invoice.latestPaymentDate);
        if (!isValid(paymentDate) || paymentDate < normalizedStartDate || paymentDate > normalizedEndDate) {
            return;
        }

        const invoiceSalesRecords = salesRecords.filter(sr => sr.invoiceNumber === invoice.invoiceNumber);
        if (invoiceSalesRecords.length === 0) return;

        const totalOriginalProfitForInvoice = invoiceSalesRecords.reduce((sum, sr) => sum + sr.totalProfit, 0);
        
        const realizedProfitOrLoss = invoice.grandTotal > 0 
            ? (totalOriginalProfitForInvoice * invoice.amountPaid) / invoice.grandTotal
            : (invoice.amountPaid > 0 ? totalOriginalProfitForInvoice : 0);

        const dateKey = format(paymentDate, aggregationFormat);
        if (!aggregatedMap[dateKey]) aggregatedMap[dateKey] = { profit: 0, loss: 0 };

        if (realizedProfitOrLoss > 0) {
            aggregatedMap[dateKey].profit += realizedProfitOrLoss;
        } else if (realizedProfitOrLoss < 0) {
            aggregatedMap[dateKey].loss += Math.abs(realizedProfitOrLoss);
        }
    });

    // 2. Process Inventory Purchase Costs
    inventoryItems.forEach(item => {
        if (!item.purchaseDate || !item.buyingPrice || item.buyingPrice <= 0) return;
        
        const purchaseDate = parseISO(item.purchaseDate);
        if (!isValid(purchaseDate) || purchaseDate < normalizedStartDate || purchaseDate > normalizedEndDate) {
            return;
        }

        const dateKey = format(purchaseDate, aggregationFormat);
        if (!aggregatedMap[dateKey]) aggregatedMap[dateKey] = { profit: 0, loss: 0 };
        
        aggregatedMap[dateKey].loss += item.buyingPrice; // Add purchase cost to loss
    });
    
    let displayFormat = 'dd MMM';
    if (aggregationFormat === 'yyyy-MM') displayFormat = 'MMM yyyy';

    return Object.entries(aggregatedMap)
      .map(([dateKey, { profit, loss }]) => {
          const dateForDisplay = displayFormat === 'MMM yyyy' ? format(parseISO(dateKey + '-01'), displayFormat) : format(parseISO(dateKey), displayFormat);
          return { date: dateForDisplay, profit, loss, originalDate: dateKey };
      })
      .sort((a,b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime());

  }, [pastInvoices, salesRecords, inventoryItems, timeRangeOption, customDateRange, isDataLoading]);

  const summaryStats = useMemo(() => {
    const totalProfit = processedChartData.reduce((sum, item) => sum + item.profit, 0);
    const totalLoss = processedChartData.reduce((sum, item) => sum + item.loss, 0);
    const netProfit = totalProfit - totalLoss;
    return { totalProfit, totalLoss, netProfit };
  }, [processedChartData]);

  const handleTimeRangeChange = (value: string) => {
    setTimeRangeOption(value);
    if (value !== 'custom') setCustomDateRange(undefined);
  };

  const handleEditInvoiceStatus = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setEditNewPaymentAmount(''); 
    setEditStatus(invoice.status);
    setEditPaymentDate(invoice.latestPaymentDate ? parseISO(invoice.latestPaymentDate) : new Date());
    setIsEditDialogOpen(true);
  };

  const handleSaveInvoiceUpdate = async () => {
    if (!editingInvoice || editPaymentDate === undefined) {
        toast({ title: "Error", description: "No invoice selected for editing or payment date is missing.", variant: "destructive" });
        return;
    }
    
    const newPaymentAmountNum = parseFloat(editNewPaymentAmount) || 0; 

    if (newPaymentAmountNum < 0) {
      toast({ title: "Invalid Amount", description: "Payment amount cannot be negative.", variant: "destructive" });
      return;
    }

    const currentTotalPaid = editingInvoice.amountPaid;
    const updatedTotalPaid = currentTotalPaid + newPaymentAmountNum;

    let newStatus = editStatus; 
    if (editStatus !== 'Cancelled') { 
        if (updatedTotalPaid <= 0 && editingInvoice.grandTotal > 0) newStatus = 'Unpaid';
        else if (updatedTotalPaid < editingInvoice.grandTotal) newStatus = 'Partially Paid';
        else if (updatedTotalPaid >= editingInvoice.grandTotal) newStatus = 'Paid';
        else if (editingInvoice.grandTotal <= 0 && updatedTotalPaid >=0) newStatus = 'Paid'; 
    }

    const formattedPaymentDate = formatISO(editPaymentDate, { representation: 'date' });

    const updatedInvoiceData: Partial<Invoice> = {
      amountPaid: updatedTotalPaid,
      status: newStatus,
      latestPaymentDate: formattedPaymentDate,
    };

    try {
      await updateInvoiceInFirestore(editingInvoice.invoiceNumber, updatedInvoiceData);
      const fullyUpdatedInvoice: Invoice = {
        ...editingInvoice,
        amountPaid: updatedTotalPaid,
        status: newStatus,
        latestPaymentDate: formattedPaymentDate,
      };
      onInvoiceUpdate(fullyUpdatedInvoice); 
      toast({ title: "Invoice Updated", description: `Payment status for invoice ${editingInvoice.invoiceNumber} updated.` });
      setIsEditDialogOpen(false);
      setEditingInvoice(null);
    } catch (error: any) {
      toast({ title: "Update Failed", description: `Could not update invoice. ${error.message}`, variant: "destructive" });
    }
  };

  const getStatusBadgeVariant = (status: Invoice['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Paid': return 'default'; 
      case 'Partially Paid': return 'secondary'; 
      case 'Unpaid': return 'destructive'; 
      case 'Cancelled': return 'outline'; 
      default: return 'outline';
    }
  };


  if (isLoadingProp && pastInvoices.length === 0 && isDataLoading) { 
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Loading initial reports data...</p>
      </div>
    );
  }

  if (error) { 
    return (
      <Card className="shadow-lg border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Report Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-secondary/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center"> <BarChart3 className="mr-2 h-6 w-6 text-secondary-foreground" /> <CardTitle className="font-headline text-xl">Profit &amp; Loss Report</CardTitle> </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <Select value={timeRangeOption} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select time range" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem> <SelectItem value="last7days">Last 7 Days</SelectItem> <SelectItem value="last30days">Last 30 Days</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem> <SelectItem value="thisMonth">This Month</SelectItem> <SelectItem value="thisYear">This Year</SelectItem>
                        <SelectItem value="lastYear">Last Year</SelectItem> <SelectItem value="allTime">All Time</SelectItem> <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                </Select>
                {timeRangeOption === 'custom' && <DatePickerWithRange date={customDateRange} setDate={setCustomDateRange} className="w-full sm:w-auto"/>}
            </div>
          </div>
          <CardDescription className="pt-4">
            Visual overview of profits, losses from sales, and inventory purchase costs. Current View: <span className="font-semibold">
            { timeRangeOption === 'custom' ? (customDateRange?.from ? (customDateRange.to ? `${format(customDateRange.from, "LLL dd, y")} - ${format(customDateRange.to, "LLL dd, y")}`: format(customDateRange.from, "LLL dd, y")) : "Custom Range") :
              timeRangeOption.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
          </CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Card className="bg-background/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Realized Profit (Sales)</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">₹{summaryStats.totalProfit.toFixed(2)}</div></CardContent>
            </Card>
            <Card className="bg-background/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Losses &amp; Purchases</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">₹{summaryStats.totalLoss.toFixed(2)}</div></CardContent>
            </Card>
            <Card className="bg-background/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle><DollarSign className={`h-4 w-4 ${summaryStats.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} /></CardHeader>
                <CardContent><div className={`text-2xl font-bold ${summaryStats.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>₹{summaryStats.netProfit.toFixed(2)}</div></CardContent>
            </Card>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isDataLoading ? ( 
             <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="ml-3 text-muted-foreground">Loading profit/loss chart data...</p>
            </div>
          ) : processedChartData.length > 0 ? <ProfitLossChart data={processedChartData} /> : (
            <div className="text-center py-10">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No data available for the selected period to display chart.</p>
              {salesRecords.length > 0 && pastInvoices.length > 0 && <p className="text-sm text-muted-foreground">This could be due to no payments recorded or purchases made in this period.</p>}
              {(salesRecords.length === 0 || pastInvoices.length === 0 || inventoryItems.length === 0) && <p className="text-sm text-muted-foreground">Start making sales, purchases, and recording payments to see your data here!</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg mt-6">
        <CardHeader className="bg-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
                <CardTitle className="font-headline text-xl">Past Invoices</CardTitle>
                <CardDescription>Review and manage payment status for previously generated invoices.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshInvoices} disabled={isRefreshingInvoices || isLoadingProp}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingInvoices || (isLoadingProp && pastInvoices.length === 0) ? 'animate-spin' : ''}`} />
                {isRefreshingInvoices || (isLoadingProp && pastInvoices.length === 0 && !isRefreshingInvoices) ? 'Refreshing...' : 'Refresh Invoices'}
            </Button>
        </CardHeader>
        <CardContent>
          {isLoadingProp && pastInvoices.length === 0 ? ( 
             <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="ml-3 text-muted-foreground">Loading past invoices...</p>
            </div>
          ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inv #</TableHead>
                  <TableHead>Inv Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total (₹)</TableHead>
                  <TableHead className="text-right">Paid (₹)</TableHead>
                   <TableHead>Last Payment Date</TableHead>
                  <TableHead className="text-right">Outstanding (₹)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastInvoices.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    No past invoices found.
                    {(isLoadingProp && !isRefreshingInvoices) ? " Still loading or no data..." : ""}
                  </TableCell></TableRow>
                ) : (
                  pastInvoices.map(invoice => (
                    <TableRow key={invoice.invoiceNumber}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.invoiceDate ? format(parseISO(invoice.invoiceDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                      <TableCell>{invoice.buyerName} ({invoice.buyerGstin || 'N/A'})</TableCell>
                      <TableCell className="text-right">{invoice.grandTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{invoice.amountPaid.toFixed(2)}</TableCell>
                      <TableCell>{invoice.latestPaymentDate ? format(parseISO(invoice.latestPaymentDate), 'dd MMM yyyy') : 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold">{(invoice.grandTotal - invoice.amountPaid).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleEditInvoiceStatus(invoice)}>
                          <Edit className="mr-1 h-3 w-3" /> Edit Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          )}
        </CardContent>
      </Card>

      {editingInvoice && (
        <Dialog open={isEditDialogOpén} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Invoice: {editingInvoice.invoiceNumber}</DialogTitle>
              <CardDescription>
                Enter the new payment amount received for this invoice. This will be added to any previously paid amounts.
                Select the date of this payment and adjust status if necessary.
              </CardDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm space-y-1">
                  <p><strong>Grand Total:</strong> ₹{editingInvoice.grandTotal.toFixed(2)}</p>
                  <p><strong>Current Total Paid:</strong> ₹{editingInvoice.amountPaid.toFixed(2)}</p>
                  <p className="font-semibold"><strong>Outstanding (Before this payment):</strong> ₹{(editingInvoice.grandTotal - editingInvoice.amountPaid).toFixed(2)}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newPaymentAmount" className="text-right col-span-1">New Payment Amount (₹)</Label>
                <Input id="newPaymentAmount" type="number" value={editNewPaymentAmount} onChange={e => setEditNewPaymentAmount(e.target.value)} className="col-span-3" placeholder="0.00" step="0.01"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentDate" className="text-right col-span-1">Payment Date</Label>
                <DatePicker 
                    date={editPaymentDate} 
                    setDate={setEditPaymentDate} 
                    className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right col-span-1">Status</Label>
                <Select value={editStatus} onValueChange={(value) => setEditStatus(value as Invoice['status'])} >
                  <SelectTrigger className="col-span-3" id="status"> <SelectValue placeholder="Select status" /> </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <p className="text-xs text-muted-foreground col-span-4 px-1">Note: Status will be auto-adjusted based on total amount paid if not manually set to 'Cancelled'.</p>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline"><XCircle className="mr-2 h-4 w-4"/>Cancel</Button></DialogClose>
              <Button onClick={handleSaveInvoiceUpdate}><Save className="mr-2 h-4 w-4"/>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    
