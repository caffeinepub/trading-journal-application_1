import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Target, Activity, AlertTriangle, Award } from 'lucide-react';
import type { FTMOAnalytics } from '../types';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';

interface FTMOAnalyticsProps {
  analytics: FTMOAnalytics;
  accountBalance: number;
  currency: string;
}

export default function FTMOAnalytics({ analytics, accountBalance, currency }: FTMOAnalyticsProps) {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getComplianceColor = (isCompliant: boolean) => {
    return isCompliant ? 'text-emerald-500' : 'text-red-500';
  };

  const getComplianceBgColor = (isCompliant: boolean) => {
    return isCompliant ? 'bg-emerald-500/10' : 'bg-red-500/10';
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

  const maxDailyLossLimit = accountBalance * -0.05;
  const isMaxDailyLossCompliant = analytics.maxDailyLoss >= maxDailyLossLimit;

  const isProfitTargetCompliant = analytics.profitTargetProgress >= 1.0;

  const isConsistencyCompliant = analytics.consistencyRate <= 0.5;

  const metrics = [
    {
      title: 'Max Daily Loss',
      value: formatCurrency(analytics.maxDailyLoss, currency),
      icon: TrendingDown,
      subtitle: `Limit: ${formatCurrency(maxDailyLossLimit, currency)}`,
      isCompliant: isMaxDailyLossCompliant,
      description: 'Highest single-day loss amount',
    },
    {
      title: 'Max Daily Profit',
      value: formatCurrency(analytics.maxDailyProfit, currency),
      icon: TrendingUp,
      subtitle: 'Best single-day performance',
      isCompliant: true,
      description: 'Highest single-day profit amount',
    },
    {
      title: 'Profit Target Progress',
      value: formatPercentage(analytics.profitTargetProgress),
      icon: Target,
      subtitle: `Goal: ${formatPercentage(0.1)} of balance`,
      isCompliant: isProfitTargetCompliant,
      description: 'Progress toward profit goal',
      showProgress: true,
      progressValue: Math.min(analytics.profitTargetProgress * 100, 100),
    },
    {
      title: 'Consistency Rate',
      value: analytics.consistencyRate.toFixed(3),
      icon: Activity,
      subtitle: 'Target: ≤ 0.500',
      isCompliant: isConsistencyCompliant,
      description: 'Lower values indicate better consistency',
    },
    {
      title: 'Avg Risk %',
      value: `${analytics.averageRiskPercentage.toFixed(2)}%`,
      icon: AlertTriangle,
      subtitle: 'Average risk per trade',
      isCompliant: analytics.averageRiskPercentage <= 2,
      description: 'Average risk percentage across all trades',
      color: getRiskColor(analytics.averageRiskPercentage),
      bgColor: getRiskBgColor(analytics.averageRiskPercentage),
    },
    {
      title: 'Avg R:R Ratio',
      value: `1:${analytics.averageRiskRewardRatio.toFixed(2)}`,
      icon: Award,
      subtitle: 'Average risk/reward',
      isCompliant: analytics.averageRiskRewardRatio >= 1.5,
      description: 'Average risk/reward ratio across all trades',
      color: getRRColor(analytics.averageRiskRewardRatio),
      bgColor: getRRBgColor(analytics.averageRiskRewardRatio),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">FTMO-Style Analytics</h3>
          <p className="text-sm text-muted-foreground">Advanced risk management metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {analytics.overallCompliance ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">Compliant</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-red-500">Non-Compliant</span>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const color = metric.color || getComplianceColor(metric.isCompliant);
          const bgColor = metric.bgColor || getComplianceBgColor(metric.isCompliant);
          
          return (
            <Card key={metric.title} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`rounded-lg p-2 ${bgColor}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${color}`}>
                  {metric.value}
                </div>
                {metric.subtitle && (
                  <p className="mt-1 text-xs text-muted-foreground">{metric.subtitle}</p>
                )}
                {metric.showProgress && (
                  <div className="mt-3">
                    <Progress 
                      value={metric.progressValue} 
                      className="h-2"
                    />
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
