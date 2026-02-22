import { useGetPerformanceSummary, useGetCallerUserProfile, useGetAllTradeEntries } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, DollarSign, Percent, Calendar, Minus, AlertTriangle, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FTMOAnalytics from './FTMOAnalytics';
import { formatCurrency } from '@/lib/utils';

export default function PerformanceSummary() {
  const { data: summary, isLoading } = useGetPerformanceSummary();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: trades = [] } = useGetAllTradeEntries();

  const currency = userProfile?.currency || 'USD';

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getProfitLossColor = (value: number) => {
    if (value > 0) return 'text-emerald-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getProfitLossBgColor = (value: number) => {
    if (value > 0) return 'bg-emerald-500/10';
    if (value < 0) return 'bg-red-500/10';
    return 'bg-muted/50';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const summaryMetrics = [
    {
      title: 'Total P&L',
      value: formatCurrency(summary.totalProfitLoss, currency),
      icon: DollarSign,
      color: getProfitLossColor(summary.totalProfitLoss),
      bgColor: getProfitLossBgColor(summary.totalProfitLoss),
    },
    {
      title: 'Cumulative Return',
      value: formatPercentage(summary.cumulativePercentageReturn),
      icon: Percent,
      color: getProfitLossColor(summary.cumulativePercentageReturn),
      bgColor: getProfitLossBgColor(summary.cumulativePercentageReturn),
    },
    {
      title: 'Average Win Rate',
      value: `${(summary.averageWinRate * 100).toFixed(1)}%`,
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Trades',
      value: Number(summary.totalTrades).toString(),
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Avg Risk %',
      value: `${summary.averageRiskPercentage.toFixed(2)}%`,
      icon: AlertTriangle,
      color: summary.averageRiskPercentage > 2 ? 'text-red-500' : summary.averageRiskPercentage > 1 ? 'text-amber-500' : 'text-emerald-500',
      bgColor: summary.averageRiskPercentage > 2 ? 'bg-red-500/10' : summary.averageRiskPercentage > 1 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
    },
    {
      title: 'Avg R:R Ratio',
      value: `1:${summary.averageRiskRewardRatio.toFixed(2)}`,
      icon: Award,
      color: summary.averageRiskRewardRatio >= 2 ? 'text-emerald-500' : summary.averageRiskRewardRatio >= 1 ? 'text-amber-500' : 'text-red-500',
      bgColor: summary.averageRiskRewardRatio >= 2 ? 'bg-emerald-500/10' : summary.averageRiskRewardRatio >= 1 ? 'bg-amber-500/10' : 'bg-red-500/10',
    },
  ];

  const weeklyChartData = summary.weeklyPerformance.map((period) => ({
    period: period.period,
    profitLoss: Number(period.profitLoss.toFixed(2)),
    winRate: Number((period.winRate * 100).toFixed(1)),
    trades: Number(period.numTrades),
    percentageReturn: Number((period.percentageReturn * 100).toFixed(2)),
  }));

  const monthlyChartData = summary.monthlyPerformance.map((period) => ({
    period: period.period,
    profitLoss: Number(period.profitLoss.toFixed(2)),
    winRate: Number((period.winRate * 100).toFixed(1)),
    trades: Number(period.numTrades),
    percentageReturn: Number((period.percentageReturn * 100).toFixed(2)),
  }));

  const calculateFTMOAnalytics = () => {
    if (!userProfile || trades.length === 0) {
      return {
        maxDailyLoss: 0,
        maxDailyProfit: 0,
        profitTargetProgress: 0,
        consistencyRate: 0,
        averageRiskPercentage: 0,
        averageRiskRewardRatio: 0,
        overallCompliance: false,
      };
    }

    const dailyProfits = new Map<number, number>();
    trades.forEach((trade) => {
      const day = Math.floor(Number(trade.date) / (24 * 60 * 60 * 1000000000));
      const currentProfit = dailyProfits.get(day) || 0;
      dailyProfits.set(day, currentProfit + trade.profitLoss);
    });

    const dailyTotals = Array.from(dailyProfits.values());
    const maxDailyLoss = dailyTotals.length > 0 ? Math.min(...dailyTotals) : 0;
    const maxDailyProfit = dailyTotals.length > 0 ? Math.max(...dailyTotals) : 0;

    const totalProfit = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const profitTargetProgress = totalProfit / (userProfile.accountBalance * 0.1);

    const mean = dailyTotals.length > 0 ? dailyTotals.reduce((sum, p) => sum + p, 0) / dailyTotals.length : 0;
    const squaredDiffs = dailyTotals.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0);
    const variance = dailyTotals.length > 1 ? squaredDiffs / (dailyTotals.length - 1) : 0;
    const consistencyRate = mean !== 0 ? variance / Math.abs(mean) : 0;

    const tradesWithRisk = trades.filter(t => !isNaN(t.riskPercentage) && !isNaN(t.riskRewardRatio));
    const averageRiskPercentage = tradesWithRisk.length > 0 
      ? tradesWithRisk.reduce((sum, t) => sum + t.riskPercentage, 0) / tradesWithRisk.length 
      : 0;
    const averageRiskRewardRatio = tradesWithRisk.length > 0 
      ? tradesWithRisk.reduce((sum, t) => sum + t.riskRewardRatio, 0) / tradesWithRisk.length 
      : 0;

    const overallCompliance =
      maxDailyLoss >= userProfile.accountBalance * -0.05 &&
      profitTargetProgress >= 1.0 &&
      consistencyRate <= 0.5;

    return {
      maxDailyLoss,
      maxDailyProfit,
      profitTargetProgress,
      consistencyRate,
      averageRiskPercentage,
      averageRiskRewardRatio,
      overallCompliance,
    };
  };

  const ftmoAnalytics = calculateFTMOAnalytics();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`rounded-lg p-2 ${metric.bgColor}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {userProfile && (
        <FTMOAnalytics analytics={ftmoAnalytics} accountBalance={userProfile.accountBalance} currency={currency} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Weekly and monthly performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly" className="mt-6">
              {weeklyChartData.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-4 text-sm font-medium">Profit/Loss by Week</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'oklch(var(--popover))',
                            border: '1px solid oklch(var(--border))',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: 'oklch(var(--popover-foreground))' }}
                          formatter={(value: number, name: string) => {
                            if (name === 'profitLoss') return [formatCurrency(value, currency), 'P&L'];
                            if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                            if (name === 'percentageReturn') return [`${value}%`, 'Return'];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="profitLoss" name="P&L">
                          {weeklyChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.profitLoss > 0 
                                  ? 'oklch(var(--chart-1))' 
                                  : entry.profitLoss < 0 
                                  ? 'oklch(var(--chart-5))' 
                                  : 'oklch(var(--muted))'
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h4 className="mb-4 text-sm font-medium">Win Rate by Week</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'oklch(var(--popover))',
                            border: '1px solid oklch(var(--border))',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: 'oklch(var(--popover-foreground))' }}
                          formatter={(value: number) => [`${value}%`, 'Win Rate']}
                        />
                        <Bar dataKey="winRate" fill="oklch(var(--chart-2))" name="Win Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No weekly data available</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="monthly" className="mt-6">
              {monthlyChartData.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-4 text-sm font-medium">Profit/Loss by Month</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'oklch(var(--popover))',
                            border: '1px solid oklch(var(--border))',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: 'oklch(var(--popover-foreground))' }}
                          formatter={(value: number, name: string) => {
                            if (name === 'profitLoss') return [formatCurrency(value, currency), 'P&L'];
                            if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                            if (name === 'percentageReturn') return [`${value}%`, 'Return'];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="profitLoss" name="P&L">
                          {monthlyChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.profitLoss > 0 
                                  ? 'oklch(var(--chart-1))' 
                                  : entry.profitLoss < 0 
                                  ? 'oklch(var(--chart-5))' 
                                  : 'oklch(var(--muted))'
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h4 className="mb-4 text-sm font-medium">Win Rate by Month</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'oklch(var(--muted-foreground))' }} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'oklch(var(--popover))',
                            border: '1px solid oklch(var(--border))',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: 'oklch(var(--popover-foreground))' }}
                          formatter={(value: number) => [`${value}%`, 'Win Rate']}
                        />
                        <Bar dataKey="winRate" fill="oklch(var(--chart-2))" name="Win Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No monthly data available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
