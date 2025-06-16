
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { SalesRecord } from '@/types';
import { getSalesRecordsFromFirestore } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { BarChart3, CalendarDays, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import ProfitLossChart from './profit-loss-chart';
import { subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, differenceInDays, startOfYear, endOfYear } from 'date-fns';
import type { DateRange } from "react-day-picker";

interface AggregatedDataPoint {
  date: string;
  profit: number;
  loss: number;
}

export default function ReportsSection() {
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRangeOption, setTimeRangeOption] = useState<string>('last7days'); 
  const [customDateRange, setCustomDateRange] = React.useState<DateRange | undefined>(undefined);

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const records = await getSalesRecordsFromFirestore();
        setSalesRecords(records.sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime()));
      } catch (err) {
        console.error("Error fetching sales records:", err);
        setError("Failed to load sales records. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  const processedChartData = useMemo(() => {
    if (salesRecords.length === 0) return [];

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now; // Default end date is today

    if (timeRangeOption === 'custom' && customDateRange?.from) {
        startDate = customDateRange.from;
        endDate = customDateRange.to || customDateRange.from; // If no 'to', use 'from' as single day
    } else {
        switch (timeRangeOption) {
            case 'today':
                startDate = now;
                endDate = now;
                break;
            case 'last7days':
                startDate = subDays(now, 6);
                break;
            case 'last30days':
                startDate = subDays(now, 29);
                break;
            case 'thisWeek':
                startDate = startOfWeek(now, { weekStartsOn: 1 });
                endDate = endOfWeek(now, { weekStartsOn: 1});
                break;
            case 'thisMonth':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case 'lastYear':
                startDate = startOfYear(subDays(now, 365));
                endDate = endOfYear(subDays(now, 365));
                break;
            case 'thisYear':
                startDate = startOfYear(now);
                endDate = endOfYear(now);
                break;
            case 'allTime':
            default:
                // Find earliest date from records if 'allTime'
                startDate = salesRecords.length > 0 ? parseISO(salesRecords[0].saleDate) : now;
                // endDate is already 'now'
                break;
        }
    }
    
    // Ensure dates are compared at midnight for consistency by normalizing them
    const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);


    const filteredRecords = salesRecords.filter(record => {
      const recordDate = parseISO(record.saleDate);
      const normalizedRecordDate = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
      return normalizedRecordDate >= normalizedStartDate && normalizedRecordDate <= normalizedEndDate;
    });
    
    const aggregatedMap: Record<string, { profit: number; loss: number }> = {};

    // Determine aggregation period (daily, weekly, monthly) based on range
    const daysDiff = differenceInDays(normalizedEndDate, normalizedStartDate);
    let aggregationFormat = 'yyyy-MM-dd'; // Daily
    if (daysDiff > 90) aggregationFormat = 'yyyy-MM'; // Monthly for > 3 months
    else if (daysDiff > 30) aggregationFormat = 'yyyy-MM-dd'; // Could be weekly, stick to daily for now 'yyyy-ww' but formatting date object for week is trickier.

    filteredRecords.forEach(record => {
      let dateKey: string;
      const saleDateObj = parseISO(record.saleDate);

      if (aggregationFormat === 'yyyy-MM') {
          dateKey = format(saleDateObj, 'MMM yyyy'); // e.g., "Oct 2023"
      } else { // daily
          dateKey = format(saleDateObj, 'yyyy-MM-dd'); // e.g., "2023-10-27"
      }
      
      if (!aggregatedMap[dateKey]) {
        aggregatedMap[dateKey] = { profit: 0, loss: 0 };
      }
      if (record.totalProfit > 0) {
        aggregatedMap[dateKey].profit += record.totalProfit;
      } else if (record.totalProfit < 0) {
        aggregatedMap[dateKey].loss += Math.abs(record.totalProfit);
      }
    });

    return Object.entries(aggregatedMap)
      .map(([date, { profit, loss }]) => ({ date, profit, loss }))
      // Sort logic needs to handle 'MMM yyyy' vs 'yyyy-MM-dd'
      .sort((a,b) => {
          // A simple way to sort if keys are consistently formatted, otherwise parse them
          if (aggregationFormat === 'yyyy-MM') {
             // This will sort "Apr 2023" before "Jan 2024", but "Feb 2023" before "Jan 2023" if not careful
             // Proper date object comparison is better for mixed formats
             return new Date(a.date.replace(/(\w{3}) (\d{4})/, '$1 1, $2')).getTime() - new Date(b.date.replace(/(\w{3}) (\d{4})/, '$1 1, $2')).getTime();

          }
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

  }, [salesRecords, timeRangeOption, customDateRange]);

  const summaryStats = useMemo(() => {
    const totalProfit = processedChartData.reduce((sum, item) => sum + item.profit, 0);
    const totalLoss = processedChartData.reduce((sum, item) => sum + item.loss, 0);
    const netProfit = totalProfit - totalLoss;
    return { totalProfit, totalLoss, netProfit };
  }, [processedChartData]);

  const handleTimeRangeChange = (value: string) => {
    setTimeRangeOption(value);
    if (value !== 'custom') {
      setCustomDateRange(undefined); // Clear custom range if a predefined one is selected
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Loading sales data...</p>
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
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-secondary/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center">
                <BarChart3 className="mr-2 h-6 w-6 text-secondary-foreground" />
                <CardTitle className="font-headline text-xl">Profit & Loss Report</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <Select value={timeRangeOption} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="last7days">Last 7 Days</SelectItem>
                        <SelectItem value="last30days">Last 30 Days</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="thisYear">This Year</SelectItem>
                        <SelectItem value="lastYear">Last Year</SelectItem>
                        <SelectItem value="allTime">All Time</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                </Select>
                {timeRangeOption === 'custom' && (
                    <DatePickerWithRange 
                        date={customDateRange} 
                        setDate={setCustomDateRange} 
                        className="w-full sm:w-auto"
                    />
                )}
            </div>
          </div>
          <CardDescription className="pt-4">
            Visual overview of your profits and losses. Current View: <span className="font-semibold">
            {
                timeRangeOption === 'custom' ? (customDateRange?.from ? (customDateRange.to ? `${format(customDateRange.from, "LLL dd, y")} - ${format(customDateRange.to, "LLL dd, y")}`: format(customDateRange.from, "LLL dd, y")) : "Custom Range") :
                timeRangeOption === 'today' ? 'Today' :
                timeRangeOption === 'last7days' ? 'Last 7 Days' :
                timeRangeOption === 'last30days' ? 'Last 30 Days' :
                timeRangeOption === 'thisWeek' ? 'This Week' :
                timeRangeOption === 'thisMonth' ? 'This Month' :
                timeRangeOption === 'thisYear' ? 'This Year' :
                timeRangeOption === 'lastYear' ? 'Last Year' :
                'All Time'
            }
            </span>
          </CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Card className="bg-background/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue (from Profit)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">₹{summaryStats.totalProfit.toFixed(2)}</div>
                </CardContent>
            </Card>
            <Card className="bg-background/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Losses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">₹{summaryStats.totalLoss.toFixed(2)}</div>
                </CardContent>
            </Card>
            <Card className="bg-background/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <DollarSign className={`h-4 w-4 ${summaryStats.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${summaryStats.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        ₹{summaryStats.netProfit.toFixed(2)}
                    </div>
                </CardContent>
            </Card>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {processedChartData.length > 0 ? (
            <ProfitLossChart data={processedChartData} />
          ) : (
            <div className="text-center py-10">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No sales data available for the selected period.</p>
              {salesRecords.length > 0 && <p className="text-sm text-muted-foreground">Try selecting a different time range or check if sales have been recorded.</p>}
              {salesRecords.length === 0 && <p className="text-sm text-muted-foreground">Start making sales to see your profit data here!</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

