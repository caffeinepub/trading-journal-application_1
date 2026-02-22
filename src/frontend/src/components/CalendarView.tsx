import { useState, useMemo, useEffect } from 'react';
import { useGetCalendarPerformance, useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { CalendarDayStatus, TradeDirection, type TradeEntry, type CalendarDayPerformance } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

type CalendarDay = 
  | { isEmpty: true; key: string }
  | { isEmpty: false; day: number; data: CalendarDayPerformance | undefined; key: string };

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{
    day: number;
    totalProfitLoss: number;
    trades: TradeEntry[];
    averageRiskPercentage: number;
    averageRiskRewardRatio: number;
  } | null>(null);

  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const currency = userProfile?.currency || 'USD';

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: calendarData = [], isLoading, isFetching, refetch } = useGetCalendarPerformance(month, year);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  // Refetch calendar data when month/year changes or when dialog closes
  useEffect(() => {
    refetch();
  }, [month, year, refetch]);

  // Refetch when dialog closes to ensure fresh data
  useEffect(() => {
    if (!selectedDay) {
      refetch();
    }
  }, [selectedDay, refetch]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDay(null);
  };

  const handleRefresh = async () => {
    // Invalidate all related queries to ensure complete refresh
    await queryClient.invalidateQueries({ queryKey: ['calendarPerformance'] });
    await queryClient.invalidateQueries({ queryKey: ['tradeEntries'] });
    await queryClient.invalidateQueries({ queryKey: ['performanceGoalsSummary'] });
    await refetch();
  };

  const handleDayClick = (dayData: CalendarDayPerformance, day: number) => {
    if (dayData.trades.length > 0) {
      setSelectedDay({
        day,
        totalProfitLoss: dayData.totalProfitLoss,
        trades: dayData.trades,
        averageRiskPercentage: dayData.averageRiskPercentage,
        averageRiskRewardRatio: dayData.averageRiskRewardRatio,
      });
    }
  };

  const getDayColor = (status: CalendarDayStatus, hasTrades: boolean) => {
    if (!hasTrades) return 'bg-muted/30 text-muted-foreground cursor-default';
    
    switch (status) {
      case CalendarDayStatus.profit:
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 cursor-pointer border-emerald-500/50';
      case CalendarDayStatus.loss:
        return 'bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-500/30 cursor-pointer border-red-500/50';
      case CalendarDayStatus.neutral:
        return 'bg-muted hover:bg-muted/80 cursor-pointer border-border';
      default:
        return 'bg-muted/30 text-muted-foreground cursor-default';
    }
  };

  const getProfitLossColor = (value: number) => {
    if (value > 0) return 'font-semibold text-emerald-600 dark:text-emerald-400';
    if (value < 0) return 'font-semibold text-red-600 dark:text-red-400';
    return 'font-semibold text-muted-foreground';
  };

  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ isEmpty: true, key: `empty-${i}` });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = calendarData.find((d) => Number(d.day) === day);
      days.push({
        isEmpty: false,
        day,
        data: dayData,
        key: `day-${day}`,
      });
    }

    return days;
  }, [calendarData, daysInMonth, firstDayOfMonth]);

  // Count total trades in calendar
  const totalTradesInCalendar = useMemo(() => {
    return calendarData.reduce((sum, day) => sum + day.trades.length, 0);
  }, [calendarData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>Loading calendar data...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={isFetching ? 'opacity-70 transition-opacity' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Visual overview of daily trading performance
                {totalTradesInCalendar > 0 && (
                  <span className="ml-2 text-xs">
                    ({totalTradesInCalendar} trade{totalTradesInCalendar !== 1 ? 's' : ''} this month)
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                title="Refresh calendar data"
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[180px] text-center font-semibold">{monthName}</span>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border border-emerald-500/50 bg-emerald-500/20" />
              <span>Profit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border border-red-500/50 bg-red-500/20" />
              <span>Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border border-border bg-muted" />
              <span>Break-even</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-muted/30" />
              <span>No Trades</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
                {day}
              </div>
            ))}

            {calendarDays.map((item) => {
              if (item.isEmpty) {
                return <div key={item.key} className="aspect-square" />;
              }

              const dayData = item.data;
              const hasTrades = !!(dayData && dayData.trades.length > 0);
              const status = dayData?.status || CalendarDayStatus.neutral;

              return (
                <button
                  key={item.key}
                  onClick={() => hasTrades && dayData && handleDayClick(dayData, item.day)}
                  className={`aspect-square rounded-lg border p-2 text-center transition-colors ${getDayColor(
                    status,
                    hasTrades
                  )}`}
                  disabled={!hasTrades}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-0.5">
                    <span className="text-sm font-medium">{item.day}</span>
                    {hasTrades && dayData && (
                      <>
                        <span className={`text-xs font-bold leading-tight ${
                          dayData.totalProfitLoss > 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : dayData.totalProfitLoss < 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-muted-foreground'
                        }`}>
                          {dayData.totalProfitLoss > 0 ? '+' : ''}
                          {formatCurrency(dayData.totalProfitLoss, currency, { compact: true })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {dayData.trades.length} trade{dayData.trades.length !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Trades for {monthName.split(' ')[0]} {selectedDay?.day}, {year}
            </DialogTitle>
            <DialogDescription>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  Total P&L:{' '}
                  <span className={selectedDay ? getProfitLossColor(selectedDay.totalProfitLoss) : ''}>
                    {selectedDay && selectedDay.totalProfitLoss > 0 ? '+' : ''}
                    {selectedDay && formatCurrency(selectedDay.totalProfitLoss, currency)}
                  </span>
                </span>
                {selectedDay && selectedDay.trades.length > 0 && (
                  <>
                    <span>
                      • {selectedDay.trades.length} trade{selectedDay.trades.length !== 1 ? 's' : ''}
                    </span>
                    <span>
                      • Avg Risk: {selectedDay.averageRiskPercentage.toFixed(2)}%
                    </span>
                    <span>
                      • Avg R:R: {selectedDay.averageRiskRewardRatio.toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDay?.trades.map((trade, index) => {
              const tradeProfitLossColor = trade.profitLoss > 0 ? 'default' : trade.profitLoss < 0 ? 'destructive' : 'secondary';
              return (
                <div key={trade.id}>
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{trade.asset}</h4>
                          {trade.direction === TradeDirection.buy ? (
                            <Badge variant="outline" className="gap-1 border-emerald-500/50 text-emerald-500">
                              <TrendingUp className="h-3 w-3" />
                              Buy
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 border-red-500/50 text-red-500">
                              <TrendingDown className="h-3 w-3" />
                              Sell
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(Number(trade.date) / 1000000).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={tradeProfitLossColor} className="text-sm">
                        {trade.profitLoss > 0 ? '+' : ''}{formatCurrency(trade.profitLoss, currency)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Entry:</span>{' '}
                        <span className="font-medium">{formatCurrency(trade.entryPrice, currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Exit:</span>{' '}
                        <span className="font-medium">{formatCurrency(trade.exitPrice, currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Position Size:</span>{' '}
                        <span className="font-medium">{trade.positionSize}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Risk %:</span>{' '}
                        <span className={`font-medium ${
                          trade.riskPercentage > 2 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {trade.riskPercentage.toFixed(2)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stop Loss:</span>{' '}
                        <span className="font-medium">{formatCurrency(trade.stopLoss, currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Take Profit:</span>{' '}
                        <span className="font-medium">{formatCurrency(trade.takeProfit, currency)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Risk/Reward Ratio:</span>{' '}
                        <span className={`font-medium ${
                          trade.riskRewardRatio >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                        }`}>
                          1:{trade.riskRewardRatio.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {trade.notes && (
                      <div className="rounded-md bg-muted/50 p-3 text-sm">
                        <span className="font-medium text-muted-foreground">Notes:</span>
                        <p className="mt-1">{trade.notes}</p>
                      </div>
                    )}

                    {trade.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {trade.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {index < selectedDay.trades.length - 1 && <Separator className="my-2" />}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
