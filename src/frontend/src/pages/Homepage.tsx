import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetHomepageSummary, useGetCallerUserProfile, useGetPerformanceGoalsSummary } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3, Calendar, List, ArrowRight, Loader2, Minus, CheckCircle2, AlertCircle, Award, Plus, LogIn, LayoutDashboard } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import AchievementBadge from '../components/AchievementBadge';
import AddTradeDialog from '../components/AddTradeDialog';

export default function Homepage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: summary, isLoading: summaryLoading } = useGetHomepageSummary();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: performanceGoals } = useGetPerformanceGoalsSummary();
  const navigate = useNavigate();
  const [addTradeOpen, setAddTradeOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const currency = userProfile?.currency || 'USD';

  // Get achievement badge from performance goals if available
  const achievementBadge = performanceGoals?.achievementBadge;

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <TrendingUp className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight">Private Trading Journal</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Track your trades, analyze performance, and improve your trading strategy with secure, private journaling.
          </p>
          <div className="mb-12 grid gap-6 text-left sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Performance Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Visualize your trading performance with comprehensive charts and metrics.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Calendar View</h3>
              <p className="text-sm text-muted-foreground">
                Track daily performance with an intuitive calendar interface.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <List className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Trade Management</h3>
              <p className="text-sm text-muted-foreground">
                Document trades with images, notes, and custom checklists.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button size="lg" onClick={handleLogin} disabled={isLoggingIn} className="gap-2 px-8">
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Login with Internet Identity
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Secure authentication powered by Internet Computer
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching data for authenticated users
  if (summaryLoading || profileLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If no summary data, show empty state
  if (!summary) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-3 text-2xl font-bold">Welcome to Your Trading Journal</h2>
          <p className="mb-6 text-muted-foreground">
            Start tracking your trades to see your performance metrics and analytics.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button size="lg" onClick={() => setAddTradeOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              Add Your First Trade
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate({ to: '/dashboard' })} 
              className="gap-2"
            >
              <LayoutDashboard className="h-5 w-5" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getProfitLossColor = (value: number) => {
    if (value > 0) return 'text-emerald-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getProfitLossIcon = (value: number) => {
    if (value > 0) return TrendingUp;
    if (value < 0) return TrendingDown;
    return Minus;
  };

  const chartData = summary.miniEquityCurve.map((value, index) => ({
    index,
    value,
  }));

  const TotalPLIcon = getProfitLossIcon(summary.totalProfitLoss);
  const profitTargetPercentage = Math.min(summary.ftmoAnalytics.profitTargetProgress * 100, 100);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex-1">
          <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">Welcome Back, Trader</h1>
          <p className="text-lg text-muted-foreground">Here's your trading performance at a glance</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate({ to: '/dashboard' })} 
            className="gap-2 shadow-md"
          >
            <LayoutDashboard className="h-5 w-5" />
            Go to Dashboard
          </Button>
          <Button 
            size="lg" 
            onClick={() => setAddTradeOpen(true)} 
            className="gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-5 w-5" />
            Add Trade
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Achievement Badge Section */}
        {achievementBadge && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold">Recent Achievement</h2>
            </div>
            <AchievementBadge badge={achievementBadge} size="md" />
          </div>
        )}

        {/* Key Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${getProfitLossColor(summary.totalProfitLoss)}`}>
                  {formatCurrency(summary.totalProfitLoss, currency)}
                </span>
                <TotalPLIcon className={`h-5 w-5 ${getProfitLossColor(summary.totalProfitLoss)}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{(summary.winRate * 100).toFixed(1)}%</div>
              <p className="mt-1 text-xs text-muted-foreground">Overall success rate</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Risk %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${summary.averageRiskPercentage > 2 ? 'text-red-500' : summary.averageRiskPercentage > 1 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {summary.averageRiskPercentage.toFixed(2)}%
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Average risk per trade</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg R:R Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${summary.averageRiskRewardRatio >= 2 ? 'text-emerald-500' : summary.averageRiskRewardRatio >= 1 ? 'text-amber-500' : 'text-red-500'}`}>
                1:{summary.averageRiskRewardRatio.toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Average risk/reward</p>
            </CardContent>
          </Card>
        </div>

        {/* FTMO Progress Card */}
        <Card className="mb-8 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  FTMO Profit Target Progress
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Goal: 10% of account balance
                </p>
              </div>
              <div className="flex items-center gap-2">
                {summary.ftmoAnalytics.overallCompliance ? (
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
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-primary">
                  {profitTargetPercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {summary.ftmoAnalytics.profitTargetProgress >= 1.0 ? 'Target Achieved!' : 'In Progress'}
                </span>
              </div>
              <Progress value={profitTargetPercentage} className="h-3" />
              <div className="grid grid-cols-3 gap-4 pt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Max Daily Loss</p>
                  <p className={`font-semibold ${summary.ftmoAnalytics.maxDailyLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatCurrency(summary.ftmoAnalytics.maxDailyLoss, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Daily Profit</p>
                  <p className="font-semibold text-emerald-500">
                    {formatCurrency(summary.ftmoAnalytics.maxDailyProfit, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Consistency</p>
                  <p className={`font-semibold ${summary.ftmoAnalytics.consistencyRate <= 0.5 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {summary.ftmoAnalytics.consistencyRate.toFixed(3)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mini Equity Curve */}
        {chartData.length > 0 && (
          <Card className="mb-8 border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Recent Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="index" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                              <p className="text-sm font-medium">{formatCurrency(payload[0].value as number, currency)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="oklch(var(--primary))"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: 'oklch(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card
            className="group cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/50 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            onClick={() => navigate({ to: '/dashboard' })}
          >
            <CardHeader>
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="flex items-center justify-between">
                Dashboard
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View detailed analytics, charts, and comprehensive performance metrics.
              </p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/50 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            onClick={() => navigate({ to: '/dashboard', search: { tab: 'summary' } })}
          >
            <CardHeader>
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="flex items-center justify-between">
                Performance Summary
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Explore weekly and monthly aggregated performance data and trends.
              </p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer border-border/50 bg-gradient-to-br from-card to-card/50 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            onClick={() => navigate({ to: '/dashboard', search: { tab: 'calendar' } })}
          >
            <CardHeader>
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="flex items-center justify-between">
                Calendar View
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track daily trading performance with an interactive calendar interface.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action */}
        <div className="mt-8 text-center">
          <Button size="lg" onClick={() => navigate({ to: '/dashboard' })} className="gap-2 px-8">
            Go to Full Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add Trade Dialog */}
      <AddTradeDialog open={addTradeOpen} onOpenChange={setAddTradeOpen} />
    </div>
  );
}
