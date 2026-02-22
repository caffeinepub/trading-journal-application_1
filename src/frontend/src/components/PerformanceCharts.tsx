import type { TradeEntry } from '../types';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';

interface PerformanceChartsProps {
  trades: TradeEntry[];
}

export default function PerformanceCharts({ trades }: PerformanceChartsProps) {
  const { data: userProfile } = useGetCallerUserProfile();

  const cumulativeData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => Number(a.date - b.date));
    let cumulative = 0;
    return sorted.map((trade) => {
      cumulative += trade.profitLoss;
      return {
        date: new Date(Number(trade.date) / 1000000).toLocaleDateString(),
        cumulative: Number(cumulative.toFixed(2)),
        profitLoss: Number(trade.profitLoss.toFixed(2)),
      };
    });
  }, [trades]);

  const equityCurveData = useMemo(() => {
    if (!userProfile) return [];
    const sorted = [...trades].sort((a, b) => Number(a.date - b.date));
    let equity = userProfile.accountBalance;
    return [
      {
        date: 'Start',
        equity: Number(userProfile.accountBalance.toFixed(2)),
        percentage: 0,
      },
      ...sorted.map((trade) => {
        equity += trade.profitLoss;
        const percentageChange = ((equity - userProfile.accountBalance) / userProfile.accountBalance) * 100;
        return {
          date: new Date(Number(trade.date) / 1000000).toLocaleDateString(),
          equity: Number(equity.toFixed(2)),
          percentage: Number(percentageChange.toFixed(2)),
        };
      }),
    ];
  }, [trades, userProfile]);

  const timeBasedData = useMemo(() => {
    const grouped: Record<string, { profit: number; loss: number; count: number }> = {};

    trades.forEach((trade) => {
      const date = new Date(Number(trade.date) / 1000000);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[key]) {
        grouped[key] = { profit: 0, loss: 0, count: 0 };
      }

      if (trade.profitLoss > 0) {
        grouped[key].profit += trade.profitLoss;
      } else {
        grouped[key].loss += Math.abs(trade.profitLoss);
      }
      grouped[key].count += 1;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        month: key,
        profit: Number(value.profit.toFixed(2)),
        loss: Number(value.loss.toFixed(2)),
        net: Number((value.profit - value.loss).toFixed(2)),
      }));
  }, [trades]);

  const winLossData = useMemo(() => {
    const wins = trades.filter((t) => t.profitLoss > 0).length;
    const losses = trades.filter((t) => t.profitLoss < 0).length;
    const breakeven = trades.filter((t) => t.profitLoss === 0).length;

    return [
      { name: 'Wins', value: wins, fill: 'oklch(var(--chart-1))' },
      { name: 'Losses', value: losses, fill: 'oklch(var(--chart-5))' },
      { name: 'Breakeven', value: breakeven, fill: 'oklch(var(--chart-3))' },
    ];
  }, [trades]);

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>Add trades to see your performance charts</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">No trade data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Profit & Loss</CardTitle>
          <CardDescription>Track your overall performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(var(--popover))',
                  border: '1px solid oklch(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'oklch(var(--popover-foreground))' }}
              />
              <Line type="monotone" dataKey="cumulative" stroke="oklch(var(--chart-1))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {userProfile && equityCurveData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
            <CardDescription>Account balance growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={equityCurveData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
                <YAxis
                  yAxisId="left"
                  className="text-xs"
                  tick={{ fill: 'oklch(var(--muted-foreground))' }}
                  label={{ value: 'Equity ($)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  className="text-xs"
                  tick={{ fill: 'oklch(var(--muted-foreground))' }}
                  label={{ value: 'Return (%)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(var(--popover))',
                    border: '1px solid oklch(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'oklch(var(--popover-foreground))' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'equity') return [`$${value.toFixed(2)}`, 'Equity'];
                    if (name === 'percentage') return [`${value.toFixed(2)}%`, 'Return'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="equity"
                  stroke="oklch(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                  name="Equity"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="percentage"
                  stroke="oklch(var(--chart-4))"
                  strokeWidth={2}
                  dot={false}
                  name="Return %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
          <CardDescription>Profit and loss breakdown by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeBasedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(var(--popover))',
                  border: '1px solid oklch(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'oklch(var(--popover-foreground))' }}
              />
              <Legend />
              <Bar dataKey="profit" fill="oklch(var(--chart-1))" name="Profit" />
              <Bar dataKey="loss" fill="oklch(var(--chart-5))" name="Loss" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Win/Loss Distribution</CardTitle>
          <CardDescription>Breakdown of winning and losing trades</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={winLossData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
              <YAxis dataKey="name" type="category" className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(var(--popover))',
                  border: '1px solid oklch(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
