
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { SalesRecord } from '@/types';
import { getSalesRecordsFromFirestore } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, CalendarDays, AlertTriangle } from 'lucide-react';
import ProfitLossChart from './profit-loss-chart'; // We'll create this next
import { subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface AggregatedProfitData {
  date: string; // Or a more specific type like 'YYYY-MM-DD' or month name
  totalProfit: number;
}

export default function ReportsSection() {
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('last7days'); // 'last7days', 'last30days', 'thisWeek', 'thisMonth', 'allTime'

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const records = await getSalesRecordsFromFirestore();
        setSalesRecords(records.sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime())); // Sort by date
      } catch (err) {
        console.error("Error fetching sales records:", err);
        setError("Failed to load sales records. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  const filteredAndAggregatedData = useMemo(() => {
    if (salesRecords.length === 0) return [];

    const now = new Date();
    let startDate: Date | null = null;

    switch (timeRange) {
      case 'last7days':
        startDate = subDays(now, 6); // Inclusive of today, so 6 days back
        break;
      case 'last30days':
        startDate = subDays(now, 29);
        break;
      case 'thisWeek':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Assuming Monday is start of week
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        break;
      case 'allTime':
      default:
        startDate = null; // No filter
        break;
    }
    
    const endDate = timeRange === 'thisWeek' ? endOfWeek(now, { weekStartsOn: 1 }) : 
                    timeRange === 'thisMonth' ? endOfMonth(now) : 
                    now; // For 'lastNdays' and 'allTime', end date is today

    const filteredRecords = salesRecords.filter(record => {
      const recordDate = parseISO(record.saleDate); // Handles YYYY-MM-DD
      if (startDate) {
         // Ensure dates are compared at midnight for consistency
        const startOfDayRecord = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
        const startOfDayFilterStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const startOfDayFilterEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return startOfDayRecord >= startOfDayFilterStart && startOfDayRecord <= startOfDayFilterEnd;
      }
      return true; // For 'allTime'
    });
    
    // Aggregate by date (day for now, could be week/month for longer ranges)
    const dailyProfit: Record<string, number> = {};
    filteredRecords.forEach(record => {
      const dateKey = format(parseISO(record.saleDate), 'yyyy-MM-dd');
      dailyProfit[dateKey] = (dailyProfit[dateKey] || 0) + record.totalProfit;
    });

    return Object.entries(dailyProfit)
      .map(([date, totalProfit]) => ({ date, totalProfit }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ensure chronological order for chart

  }, [salesRecords, timeRange]);

  const totalProfitOverall = useMemo(() => {
    return filteredAndAggregatedData.reduce((sum, item) => sum + item.totalProfit, 0);
  }, [filteredAndAggregatedData]);


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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
                <BarChart3 className="mr-2 h-6 w-6 text-secondary-foreground" />
                <CardTitle className="font-headline text-xl">Profit & Loss Report</CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="last7days">Last 7 Days</SelectItem>
                        <SelectItem value="last30days">Last 30 Days</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="allTime">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
           <CardDescription className="pt-2">
            Overview of your sales performance and profitability. Current view: {
                timeRange === 'last7days' ? 'Last 7 Days' :
                timeRange === 'last30days' ? 'Last 30 Days' :
                timeRange === 'thisWeek' ? 'This Week' :
                timeRange === 'thisMonth' ? 'This Month' : 'All Time'
            }. Total Profit: <span className="font-semibold text-primary">₹{totalProfitOverall.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredAndAggregatedData.length > 0 ? (
            <ProfitLossChart data={filteredAndAggregatedData} />
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
