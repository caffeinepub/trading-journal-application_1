import { useGetPerformanceGoalsSummary, useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Sparkles, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { GoalStatus } from '../types';
import { Skeleton } from '@/components/ui/skeleton';
import AchievementBadge from './AchievementBadge';

export default function PerformanceGoals() {
  const { data: goalsSummary, isLoading, isFetching } = useGetPerformanceGoalsSummary();
  const { data: userProfile } = useGetCallerUserProfile();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Goals</CardTitle>
          <CardDescription>Track your weekly and monthly profit targets and drawdown limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!goalsSummary || !userProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Goals</CardTitle>
          <CardDescription>Track your weekly and monthly profit targets and drawdown limits</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set up your performance goals in your profile to start tracking your progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currency = userProfile.currency || 'USD';

  // Calculate progress percentages
  const monthlyProfitPercentage = goalsSummary.monthlyProfitGoal > 0
    ? Math.min((goalsSummary.monthlyProfitProgress * 100), 100)
    : 0;

  const weeklyProfitPercentage = goalsSummary.weeklyProfitTarget > 0
    ? Math.min((goalsSummary.weeklyProgress * 100), 100)
    : 0;

  const drawdownPercentage = goalsSummary.maxDrawdownLimit > 0
    ? Math.min((goalsSummary.currentDrawdown / goalsSummary.maxDrawdownLimit) * 100, 100)
    : 0;

  // Determine status colors and icons
  const getMonthlyProfitStatus = () => {
    if (goalsSummary.monthlyProfitGoal === 0) {
      return { color: 'text-muted-foreground', progressColor: 'bg-muted', icon: Target };
    }
    if (goalsSummary.monthlyProfitProgress >= 1.0) {
      return { color: 'text-emerald-600 dark:text-emerald-400', progressColor: '[&>div]:bg-emerald-500', icon: TrendingUp };
    }
    if (goalsSummary.monthlyProfitProgress >= 0.7) {
      return { color: 'text-amber-600 dark:text-amber-400', progressColor: '[&>div]:bg-amber-500', icon: Target };
    }
    return { color: 'text-red-600 dark:text-red-400', progressColor: '[&>div]:bg-red-500', icon: TrendingDown };
  };

  const getWeeklyProfitStatus = () => {
    if (goalsSummary.weeklyProfitTarget === 0) {
      return { color: 'text-muted-foreground', progressColor: 'bg-muted', icon: Calendar };
    }
    if (goalsSummary.weeklyProgress >= 1.0) {
      return { color: 'text-emerald-600 dark:text-emerald-400', progressColor: '[&>div]:bg-emerald-500', icon: TrendingUp };
    }
    if (goalsSummary.weeklyProgress >= 0.7) {
      return { color: 'text-amber-600 dark:text-amber-400', progressColor: '[&>div]:bg-amber-500', icon: Calendar };
    }
    return { color: 'text-red-600 dark:text-red-400', progressColor: '[&>div]:bg-red-500', icon: TrendingDown };
  };

  const getDrawdownStatus = () => {
    if (goalsSummary.maxDrawdownLimit === 0) {
      return { color: 'text-muted-foreground', progressColor: 'bg-muted', icon: Target };
    }
    if (goalsSummary.currentDrawdown >= goalsSummary.maxDrawdownLimit) {
      return { color: 'text-red-600 dark:text-red-400', progressColor: '[&>div]:bg-red-500', icon: AlertTriangle };
    }
    if (goalsSummary.currentDrawdown >= goalsSummary.maxDrawdownLimit * 0.8) {
      return { color: 'text-amber-600 dark:text-amber-400', progressColor: '[&>div]:bg-amber-500', icon: AlertTriangle };
    }
    return { color: 'text-emerald-600 dark:text-emerald-400', progressColor: '[&>div]:bg-emerald-500', icon: TrendingUp };
  };

  const getWeeklyGoalStatusLabel = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.onTrack:
        return 'On Track';
      case GoalStatus.overTarget:
        return 'Over Target';
      case GoalStatus.underTarget:
        return 'Under Target';
      case GoalStatus.atLimit:
        return 'At Limit';
      default:
        return 'Unknown';
    }
  };

  const monthlyProfitStatus = getMonthlyProfitStatus();
  const weeklyProfitStatus = getWeeklyProfitStatus();
  const drawdownStatus = getDrawdownStatus();
  const MonthlyProfitIcon = monthlyProfitStatus.icon;
  const WeeklyProfitIcon = weeklyProfitStatus.icon;
  const DrawdownIcon = drawdownStatus.icon;

  return (
    <Card className={isFetching ? 'opacity-70 transition-opacity' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Performance Goals
          {goalsSummary.achievementBadge && (
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          )}
        </CardTitle>
        <CardDescription>Track your weekly and monthly profit targets and drawdown limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Achievement Badge Display */}
        {goalsSummary.achievementBadge && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            <AchievementBadge badge={goalsSummary.achievementBadge} size="md" />
          </div>
        )}

        {/* Weekly Profit Target */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WeeklyProfitIcon className={`h-5 w-5 ${weeklyProfitStatus.color}`} />
              <h3 className="font-semibold">Weekly Profit Target</h3>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${weeklyProfitStatus.color}`}>
                {formatCurrency(goalsSummary.currentWeekProfit, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                of {formatCurrency(goalsSummary.weeklyProfitTarget, currency)}
              </p>
            </div>
          </div>
          {goalsSummary.weeklyProfitTarget > 0 ? (
            <>
              <Progress value={weeklyProfitPercentage} className={`h-2 ${weeklyProfitStatus.progressColor}`} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{weeklyProfitPercentage.toFixed(1)}% achieved</span>
                <span className={`font-medium ${
                  goalsSummary.weeklyGoalStatus === GoalStatus.onTrack ? 'text-emerald-600 dark:text-emerald-400' :
                  goalsSummary.weeklyGoalStatus === GoalStatus.overTarget ? 'text-red-600 dark:text-red-400' :
                  goalsSummary.weeklyGoalStatus === GoalStatus.atLimit ? 'text-amber-600 dark:text-amber-400' :
                  'text-amber-600 dark:text-amber-400'
                }`}>
                  {getWeeklyGoalStatusLabel(goalsSummary.weeklyGoalStatus)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {goalsSummary.weeklyProgress >= 1.0
                  ? 'Weekly target reached!'
                  : `${formatCurrency(goalsSummary.weeklyProfitTarget - goalsSummary.currentWeekProfit, currency)} remaining`}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No weekly profit target set. Update your profile to set a target.</p>
          )}
        </div>

        {/* Monthly Profit Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MonthlyProfitIcon className={`h-5 w-5 ${monthlyProfitStatus.color}`} />
              <h3 className="font-semibold">Monthly Profit Goal</h3>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${monthlyProfitStatus.color}`}>
                {formatCurrency(goalsSummary.monthlyProfitProgress * goalsSummary.monthlyProfitGoal, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                of {formatCurrency(goalsSummary.monthlyProfitGoal, currency)}
              </p>
            </div>
          </div>
          {goalsSummary.monthlyProfitGoal > 0 ? (
            <>
              <Progress value={monthlyProfitPercentage} className={`h-2 ${monthlyProfitStatus.progressColor}`} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{monthlyProfitPercentage.toFixed(1)}% achieved</span>
                <span>
                  {goalsSummary.monthlyProfitProgress >= 1.0
                    ? 'Goal reached!'
                    : `${formatCurrency(goalsSummary.monthlyProfitGoal * (1 - goalsSummary.monthlyProfitProgress), currency)} remaining`}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No monthly profit goal set. Update your profile to set a target.</p>
          )}
        </div>

        {/* Maximum Drawdown Limit */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DrawdownIcon className={`h-5 w-5 ${drawdownStatus.color}`} />
              <h3 className="font-semibold">Maximum Drawdown Limit</h3>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${drawdownStatus.color}`}>
                {(goalsSummary.currentDrawdown * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">
                of {(goalsSummary.maxDrawdownLimit * 100).toFixed(2)}% limit
              </p>
            </div>
          </div>
          {goalsSummary.maxDrawdownLimit > 0 ? (
            <>
              <Progress value={drawdownPercentage} className={`h-2 ${drawdownStatus.progressColor}`} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{drawdownPercentage.toFixed(1)}% of limit</span>
                <span>
                  {goalsSummary.currentDrawdown >= goalsSummary.maxDrawdownLimit
                    ? 'Limit exceeded!'
                    : `${((goalsSummary.maxDrawdownLimit - goalsSummary.currentDrawdown) * 100).toFixed(2)}% buffer remaining`}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No drawdown limit set. Update your profile to set a limit.</p>
          )}
        </div>

        {/* Overall Status */}
        {(goalsSummary.monthlyProfitGoal > 0 || goalsSummary.weeklyProfitTarget > 0 || goalsSummary.maxDrawdownLimit > 0) ? (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              {goalsSummary.goalStatus === GoalStatus.onTrack && (
                <>
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">On Track</p>
                </>
              )}
              {goalsSummary.goalStatus === GoalStatus.underTarget && (
                <>
                  <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Below Target</p>
                </>
              )}
              {goalsSummary.goalStatus === GoalStatus.overTarget && (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Limit Exceeded</p>
                </>
              )}
              {goalsSummary.goalStatus === GoalStatus.atLimit && (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">At Limit</p>
                </>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
