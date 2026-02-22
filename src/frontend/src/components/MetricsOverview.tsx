import type { TradeEntry } from '../types';
import { useGetCallerUserProfile, useCalculateUserPercentageProfitLoss } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, DollarSign, Percent, Minus, AlertTriangle, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MetricsOverviewProps {
  trades: TradeEntry[];
}

export default function MetricsOverview({ trades }: MetricsOverviewProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: percentageProfitLoss } = useCalculateUserPercentageProfitLoss();

  const currency = userProfile?.currency || 'USD';

  const totalProfitLoss = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const winningTrades = trades.filter((t) => t.profitLoss > 0).length;
  const losingTrades = trades.filter((t) => t.profitLoss < 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  const bestTrade = trades.length > 0 ? Math.max(...trades.map((t) => t.profitLoss)) : 0;
  const worstTrade = trades.length > 0 ? Math.min(...trades.map((t) => t.profitLoss)) : 0;

  // Calculate average risk metrics
  const tradesWithRisk = trades.filter(t => !isNaN(t.riskPercentage) && !isNaN(t.riskRewardRatio));
  const avgRiskPercentage = tradesWithRisk.length > 0 
    ? tradesWithRisk.reduce((sum, t) => sum + t.riskPercentage, 0) / tradesWithRisk.length 
    : 0;
  const avgRiskRewardRatio = tradesWithRisk.length > 0 
    ? tradesWithRisk.reduce((sum, t) => sum + t.riskRewardRatio, 0) / tradesWithRisk.length 
    : 0;

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

  const getRiskColor = (risk: number) => {
    if (risk > 2) return 'text-red-500';
    if (risk > 1) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getRiskBgColor = (risk: number) => {
    if (risk > 2) return 'bg-red-500/10';
    if (risk > 1) return 'bg-amber-500/10';
    return 'bg-emerald-500/10';
  };

  const getRRColor = (rr: number) => {
    if (rr >= 2) return 'text-emerald-500';
    if (rr >= 1) return 'text-amber-500';
    return 'text-red-500';
  };

  const getRRBgColor = (rr: number) => {
    if (rr >= 2) return 'bg-emerald-500/10';
    if (rr >= 1) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  const currentEquity = userProfile ? userProfile.accountBalance + totalProfitLoss : 0;

  const metrics = [
    {
      title: 'Total P&L',
      value: formatCurrency(totalProfitLoss, currency),
      icon: totalProfitLoss > 0 ? TrendingUp : totalProfitLoss < 0 ? TrendingDown : Minus,
      subtitle: userProfile ? `Equity: ${formatCurrency(currentEquity, currency)}` : undefined,
      color: getProfitLossColor(totalProfitLoss),
      bgColor: getProfitLossBgColor(totalProfitLoss),
    },
    {
      title: 'Total Return',
      value: formatPercentage(percentageProfitLoss || 0),
      icon: Percent,
      subtitle: userProfile ? `From ${formatCurrency(userProfile.accountBalance, currency)}` : undefined,
      color: getProfitLossColor(percentageProfitLoss || 0),
      bgColor: getProfitLossBgColor(percentageProfitLoss || 0),
    },
    {
      title: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      subtitle: `${winningTrades}W / ${losingTrades}L`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Avg Risk %',
      value: `${avgRiskPercentage.toFixed(2)}%`,
      icon: AlertTriangle,
      subtitle: tradesWithRisk.length > 0 ? `From ${tradesWithRisk.length} trades` : 'No data',
      color: getRiskColor(avgRiskPercentage),
      bgColor: getRiskBgColor(avgRiskPercentage),
    },
    {
      title: 'Avg R:R Ratio',
      value: `1:${avgRiskRewardRatio.toFixed(2)}`,
      icon: Award,
      subtitle: tradesWithRisk.length > 0 ? `From ${tradesWithRisk.length} trades` : 'No data',
      color: getRRColor(avgRiskRewardRatio),
      bgColor: getRRBgColor(avgRiskRewardRatio),
    },
    {
      title: 'Best Trade',
      value: formatCurrency(bestTrade, currency),
      icon: TrendingUp,
      subtitle: userProfile && bestTrade > 0 ? `+${formatPercentage(bestTrade / userProfile.accountBalance)}` : undefined,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Worst Trade',
      value: formatCurrency(worstTrade, currency),
      icon: TrendingDown,
      subtitle: userProfile && worstTrade < 0 ? `${formatPercentage(worstTrade / userProfile.accountBalance)}` : undefined,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {metrics.map((metric) => {
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
              {metric.subtitle && <p className="mt-1 text-xs text-muted-foreground">{metric.subtitle}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
