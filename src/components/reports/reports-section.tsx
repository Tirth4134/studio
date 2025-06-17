
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { SalesRecord, Invoice, BuyerAddress } from '@/types';
import { getSalesRecordsFromFirestore, updateInvoiceInFirestore, getInvoicesFromFirestore } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DatePicker } from "@/components/ui/date-picker"; // Single date picker
import { BarChart3, CalendarDays, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Edit, Save, XCircle } from 'lucide-react';
import ProfitLossChart from './profit-loss-chart';
import { subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, differenceInDays, startOfYear, endOfYear, isValid } from 'date-fns';
import type { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';


interface AggregatedDataPoint {
  date: string;
  profit: number;
  loss: number;
}

interface ReportsSectionProps {
  pastInvoices: Invoice[];
  onInvoiceUpdate: (updatedInvoice: Invoice) => void;
  isLoading: boolean; 
  fetchPastInvoices: () => Promise<void>; 
}


export default function ReportsSection({ pastInvoices, onInvoiceUpdate, isLoading: initialIsLoading, fetchPastInvoices }: ReportsSectionProps) {
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(initialIsLoading);
  const [error, setError] = useState<string | null>(null);
  const [timeRangeOption, setTimeRangeOption] = useState<string>('last7days'); 
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditDialogOpén, setIsEditDialogOpen] = useState(false);
  const [editAmountPaid, setEditAmountPaid] = useState<string>('');
  const [editStatus, setEditStatus] = useState<Invoice['status']>('Unpaid');
  const [editPaymentDate, setEditPaymentDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true); 
    const fetchSalesAndInvoices = async () => {
      setError(null);
      try {
        const records = await getSalesRecordsFromFirestore();
        setSalesRecords(records.sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime()));
      } catch (err: any) {
        console.error("Error fetching data for reports:", err);
        setError(`Failed to load report data. ${err.message || 'Please try again later.'}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalesAndInvoices();
  }, []); 

  useEffect(() => {
    setIsLoading(initialIsLoading);
  }, [initialIsLoading]);

  const processedChartData = useMemo(() => {
    if (salesRecords.length === 0) return [];
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
                startDate = salesRecords.length > 0 ? parseISO(salesRecords[0].saleDate) : now;
                break;
        }
    }
    
    const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

    const filteredRecords = salesRecords.filter(record => {
      const recordDate = parseISO(record.saleDate); // Assuming saleDate on SalesRecord is YYYY-MM-DD
      return isValid(recordDate) && new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate()) >= normalizedStartDate && new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate()) <= normalizedEndDate;
    });
    
    const aggregatedMap: Record<string, { profit: number; loss: number }> = {};
    const daysDiff = differenceInDays(normalizedEndDate, normalizedStartDate);
    let aggregationFormat = 'yyyy-MM-dd'; 
    let displayFormat = 'dd MMM';
    if (daysDiff > 90) { 
      aggregationFormat = 'yyyy-MM'; 
      displayFormat = 'MMM yyyy';
    }


    filteredRecords.forEach(record => {
      const saleDateObj = parseISO(record.saleDate);
      if (!isValid(saleDateObj)) return;

      let dateKey: string;
      if (aggregationFormat === 'yyyy-MM') dateKey = format(saleDateObj, 'yyyy-MM');
      else dateKey = format(saleDateObj, 'yyyy-MM-dd');
      
      if (!aggregatedMap[dateKey]) aggregatedMap[dateKey] = { profit: 0, loss: 0 };
      
      if (record.totalProfit > 0) aggregatedMap[dateKey].profit += record.totalProfit;
      else if (record.totalProfit < 0) aggregatedMap[dateKey].loss += Math.abs(record.totalProfit); 
    });

    return Object.entries(aggregatedMap)
      .map(([dateKey, { profit, loss }]) => {
          const dateForDisplay = aggregationFormat === 'yyyy-MM' ? format(parseISO(dateKey + '-01'), displayFormat) : format(parseISO(dateKey), displayFormat);
          return { date: dateForDisplay, profit, loss, originalDate: dateKey };
      })
      .sort((a,b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime());

  }, [salesRecords, timeRangeOption, customDateRange]);

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
    setEditAmountPaid(invoice.amountPaid.toString());
    setEditStatus(invoice.status);
    setEditPaymentDate(invoice.latestPaymentDate ? parseISO(invoice.latestPaymentDate) : new Date());
    setIsEditDialogOpen(true);
  };

  const handleSaveInvoiceUpdate = async () => {
    if (!editingInvoice || editPaymentDate === undefined) return;
    const amountPaidNum = parseFloat(editAmountPaid);
    if (isNaN(amountPaidNum) || amountPaidNum < 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount paid.", variant: "destructive" });
      return;
    }

    let newStatus = editStatus;
    if (amountPaidNum === 0 && newStatus !== 'Cancelled') newStatus = 'Unpaid';
    else if (amountPaidNum > 0 && amountPaidNum < editingInvoice.grandTotal && newStatus !== 'Cancelled') newStatus = 'Partially Paid';
    else if (amountPaidNum >= editingInvoice.grandTotal && newStatus !== 'Cancelled') newStatus = 'Paid';

    const updatedInvoice: Invoice = {
      ...editingInvoice,
      amountPaid: amountPaidNum,
      status: newStatus,
      latestPaymentDate: format(editPaymentDate, 'yyyy-MM-dd'),
    };

    try {
      await updateInvoiceInFirestore(editingInvoice.invoiceNumber, { 
        amountPaid: amountPaidNum, 
        status: newStatus,
        latestPaymentDate: format(editPaymentDate, 'yyyy-MM-dd'),
      });
      onInvoiceUpdate(updatedInvoice); 
      toast({ title: "Invoice Updated", description: `Status for invoice ${editingInvoice.invoiceNumber} updated.` });
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


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Loading reports data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-6 w-6" /> Error Loading Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <p className="mt-2 text-sm">This might be due to a missing Firestore index. Please check your browser's developer console for a link to create the required index. The error message might provide more details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-secondary/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center"> <BarChart3 className="mr-2 h-6 w-6 text-secondary-foreground" /> <CardTitle className="font-headline text-xl">Profit & Loss Report</CardTitle> </div>
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
            Visual overview of your profits and losses. Current View: <span className="font-semibold">
            { timeRangeOption === 'custom' ? (customDateRange?.from ? (customDateRange.to ? `${format(customDateRange.from, "LLL dd, y")} - ${format(customDateRange.to, "LLL dd, y")}`: format(customDateRange.from, "LLL dd, y")) : "Custom Range") :
              timeRangeOption.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </span>
          </CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Card className="bg-background/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Profit</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">₹{summaryStats.totalProfit.toFixed(2)}</div></CardContent>
            </Card>
            <Card className="bg-background/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Losses</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">₹{summaryStats.totalLoss.toFixed(2)}</div></CardContent>
            </Card>
            <Card className="bg-background/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Net Profit</CardTitle><DollarSign className={`h-4 w-4 ${summaryStats.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} /></CardHeader>
                <CardContent><div className={`text-2xl font-bold ${summaryStats.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>₹{summaryStats.netProfit.toFixed(2)}</div></CardContent>
            </Card>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {processedChartData.length > 0 ? <ProfitLossChart data={processedChartData} /> : (
            <div className="text-center py-10">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No sales data available for the selected period.</p>
              {salesRecords.length > 0 && <p className="text-sm text-muted-foreground">Try selecting a different time range or check if sales have been recorded.</p>}
              {salesRecords.length === 0 && <p className="text-sm text-muted-foreground">Start making sales to see your profit data here!</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg mt-6">
        <CardHeader className="bg-secondary/30">
          <CardTitle className="font-headline text-xl">Past Invoices</CardTitle>
          <CardDescription>Review and manage payment status for previously generated invoices.</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableRow><TableCell colSpan={9} className="text-center">No past invoices found.</TableCell></TableRow>
                ) : (
                  pastInvoices.map(invoice => (
                    <TableRow key={invoice.invoiceNumber}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.invoiceDate}</TableCell>
                      <TableCell>{invoice.buyerName} ({invoice.buyerGstin || 'N/A'})</TableCell>
                      <TableCell className="text-right">{invoice.grandTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{invoice.amountPaid.toFixed(2)}</TableCell>
                      <TableCell>{invoice.latestPaymentDate || 'N/A'}</TableCell>
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
        </CardContent>
      </Card>

      {editingInvoice && (
        <Dialog open={isEditDialogOpén} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Invoice: {editingInvoice.invoiceNumber}</DialogTitle>
              <CardDescription>Update amount paid, payment date, and status for this invoice.</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amountPaid" className="text-right col-span-1">Amount Paid</Label>
                <Input id="amountPaid" type="number" value={editAmountPaid} onChange={e => setEditAmountPaid(e.target.value)} className="col-span-3" placeholder="0.00"/>
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
               <p className="text-sm text-muted-foreground col-span-4 px-1">Note: Status will be auto-adjusted based on amount paid if not 'Cancelled'.</p>
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

