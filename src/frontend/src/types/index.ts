// Local type definitions for frontend use
// These types mirror the backend structure exactly
// Using undefined for optional fields to match backend interface

export enum TradeDirection {
  buy = 'buy',
  sell = 'sell',
}

export interface TradeImage {
  file: any; // ExternalBlob
  description: string;
}

export interface TradeChecklistItem {
  id: string;
  description: string;
  confirmed: boolean;
}

export interface TradeChecklist {
  items: TradeChecklistItem[];
}

export interface TradeEntry {
  id: string;
  date: bigint;
  asset: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
  riskPercentage: number;
  riskRewardRatio: number;
  profitLoss: number;
  notes: string;
  tags: string[];
  beforeTradeImage?: TradeImage;
  afterTradeImage?: TradeImage;
  checklist: TradeChecklist;
}

export interface PerformanceGoals {
  monthlyProfitGoal: number;
  weeklyProfitTarget: number;
  maxDrawdownLimit: number;
}

export interface UserProfile {
  name: string;
  accountBalance: number;
  currency: string;
  performanceGoals: PerformanceGoals;
}

export enum CalendarDayStatus {
  profit = 'profit',
  loss = 'loss',
  neutral = 'neutral',
}

export interface CalendarDayPerformance {
  day: number;
  totalProfitLoss: number;
  trades: TradeEntry[];
  averageRiskPercentage: number;
  averageRiskRewardRatio: number;
  status: CalendarDayStatus;
}

export interface FTMOAnalytics {
  maxDailyLoss: number;
  maxDailyProfit: number;
  profitTargetProgress: number;
  consistencyRate: number;
  averageRiskPercentage: number;
  averageRiskRewardRatio: number;
  overallCompliance: boolean;
}

export interface HomepageSummaryMetrics {
  totalProfitLoss: number;
  winRate: number;
  lastWeekChange: WeekPerformanceChange;
  miniEquityCurve: number[];
  ftmoAnalytics: FTMOAnalytics;
  averageRiskPercentage: number;
  averageRiskRewardRatio: number;
}

export interface WeekPerformanceChange {
  profitLoss: number;
  percentageChange: number;
  comparisonToPreviousWeek: number;
  weekRange: [bigint, bigint];
}

export enum GoalStatus {
  onTrack = 'onTrack',
  overTarget = 'overTarget',
  underTarget = 'underTarget',
  atLimit = 'atLimit',
}

export enum AchievementBadgeStatus {
  targetReached = 'targetReached',
  milestone = 'milestone',
  goalAchieved = 'goalAchieved',
}

export interface AchievementBadge {
  title: string;
  status: AchievementBadgeStatus;
  description: string;
  timestamp: bigint;
}

export interface PerformanceGoalsSummary {
  monthlyProfitGoal: number;
  monthlyProfitProgress: number;
  weeklyProfitTarget: number;
  currentWeekProfit: number;
  weeklyProgress: number;
  weeklyGoalStatus: GoalStatus;
  maxDrawdownLimit: number;
  currentDrawdown: number;
  goalStatus: GoalStatus;
  achievementBadge?: AchievementBadge;
}

export interface PeriodicPerformanceData {
  period: string;
  profitLoss: number;
  numTrades: number;
  winRate: number;
  percentageReturn: number;
  averageRiskPercentage: number;
  averageRiskRewardRatio: number;
}

export interface PerformanceSummary {
  totalProfitLoss: number;
  averageWinRate: number;
  totalTrades: number;
  cumulativePercentageReturn: number;
  weeklyPerformance: PeriodicPerformanceData[];
  monthlyPerformance: PeriodicPerformanceData[];
  averageRiskPercentage: number;
  averageRiskRewardRatio: number;
}

export interface AddTradeResult {
  trade: TradeEntry;
  updatedGoals: PerformanceGoalsSummary;
}
