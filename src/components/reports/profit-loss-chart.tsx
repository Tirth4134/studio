
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ProfitLossDataPoint {
  date: string; 
  profit: number;
  loss: number; 
}

interface ProfitLossChartProps {
  data: ProfitLossDataPoint[];
}

export default function ProfitLossChart({ data }: ProfitLossChartProps) {
  if (!data || data.length === 0) {
    return (
        <div className="text-center py-8 text-muted-foreground">
            <p>No data to display in chart for the selected period.</p>
        </div>
    );
  }
  
  const formatYAxis = (tickItem: number) => {
    return `₹${tickItem.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const profitData = payload.find((p: any) => p.dataKey === 'profit');
      const lossData = payload.find((p: any) => p.dataKey === 'loss');

      return (
        <div className="bg-background/90 backdrop-blur-sm p-3 shadow-lg rounded-md border border-border">
          <p className="label font-semibold text-foreground">{`Date: ${label}`}</p>
          {profitData && profitData.value > 0 && (
            <p style={{ color: profitData.stroke }}>{`Profit: ₹${profitData.value.toFixed(2)}`}</p>
          )}
          {lossData && lossData.value > 0 && (
             <p style={{ color: lossData.stroke }}>{`Loss: ₹${lossData.value.toFixed(2)}`}</p>
          )}
           {(profitData?.value === 0 || !profitData) && (lossData?.value === 0 || !lossData) && (
             <p className="text-muted-foreground">No profit or loss this day.</p>
           )}
        </div>
      );
    }
    return null;
  };


  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart
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
            domain={['auto', 'auto']}
            />
          <Tooltip content={<CustomTooltip />} cursor={{stroke: 'hsl(var(--accent))', strokeWidth: 1, fillOpacity: 0.1}}/>
          <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="hsl(var(--chart-2))" /* Greenish */
            strokeWidth={2}
            name="Profit" 
            dot={{ r: 3 }} 
            activeDot={{ r: 5 }} 
            connectNulls={false} 
          />
          <Line 
            type="monotone" 
            dataKey="loss" 
            stroke="hsl(var(--chart-1))" /* Reddish */
            strokeWidth={2}
            name="Loss" 
            dot={{ r: 3 }} 
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
