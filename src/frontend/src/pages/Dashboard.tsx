import { useState } from 'react';
import { useGetAllTradeEntries, useGetCallerUserProfile } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import MetricsOverview from '../components/MetricsOverview';
import PerformanceCharts from '../components/PerformanceCharts';
import TradesList from '../components/TradesList';
import CalendarView from '../components/CalendarView';
import PerformanceSummary from '../components/PerformanceSummary';
import FTMOAnalytics from '../components/FTMOAnalytics';
import PerformanceGoals from '../components/PerformanceGoals';
import AddTradeDialog from '../components/AddTradeDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: trades = [], isLoading: tradesLoading } = useGetAllTradeEntries();
  const { data: userProfile } = useGetCallerUserProfile();
  const navigate = useNavigate();
  const search = useSearch({ from: '/dashboard' });
  const activeTab = (search as { tab?: string })?.tab || 'charts';
  const [addTradeOpen, setAddTradeOpen] = useState(false);

  const handleTabChange = (value: string) => {
    navigate({ to: '/dashboard', search: { tab: value } });
  };

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

    // Calculate average risk metrics
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comprehensive view of your trading performance and analytics
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => navigate({ to: '/' })} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <Button 
            onClick={() => setAddTradeOpen(true)} 
            className="gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-5 w-5" />
            Add Trade
          </Button>
        </div>
      </div>

      {tradesLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <MetricsOverview trades={trades} />

          <div className="grid gap-6 lg:grid-cols-2">
            {userProfile && trades.length > 0 && (
              <FTMOAnalytics 
                analytics={ftmoAnalytics} 
                accountBalance={userProfile.accountBalance} 
                currency={userProfile.currency || 'USD'} 
              />
            )}
            <PerformanceGoals />
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
            </TabsList>
            <TabsContent value="charts" className="mt-6">
              <PerformanceCharts trades={trades} />
            </TabsContent>
            <TabsContent value="summary" className="mt-6">
              <PerformanceSummary />
            </TabsContent>
            <TabsContent value="calendar" className="mt-6">
              <CalendarView />
            </TabsContent>
            <TabsContent value="trades" className="mt-6">
              <TradesList trades={trades} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Add Trade Dialog */}
      <AddTradeDialog open={addTradeOpen} onOpenChange={setAddTradeOpen} />
    </div>
  );
}
