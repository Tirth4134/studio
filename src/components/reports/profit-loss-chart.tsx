
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ProfitDataPoint {
  date: string; // e.g., "2023-10-27" or "Oct 2023"
  totalProfit: number;
}

interface ProfitLossChartProps {
  data: ProfitDataPoint[];
}

export default function ProfitLossChart({ data }: ProfitLossChartProps) {
  if (!data || data.length === 0) {
    return (
        <div className="text-center py-8 text-muted-foreground">
            <p>No data to display in chart.</p>
        </div>
    );
  }
  
  const formatYAxis = (tickItem: number) => {
    return `₹${tickItem.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 backdrop-blur-sm p-3 shadow-lg rounded-md border border-border">
          <p className="label font-semibold text-foreground">{`Date: ${label}`}</p>
          <p className="intro text-primary">{`Profit: ₹${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
            stroke="hsl(var(--border))"
            />
          <YAxis 
            tickFormatter={formatYAxis} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
            stroke="hsl(var(--border))"
            />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--accent))', fillOpacity: 0.3}}/>
          <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
          <Bar dataKey="totalProfit" fill="hsl(var(--primary))" name="Total Profit" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
