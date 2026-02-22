import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TradeImage {
    file: ExternalBlob;
    description: string;
}
export interface AddTradeRequest {
    direction: TradeDirection;
    asset: string;
    date: Time;
    takeProfit: number;
    tags: Array<string>;
    positionSize: number;
    afterTradeImage?: TradeImage;
    stopLoss: number;
    beforeTradeImage?: TradeImage;
    notes: string;
    entryPrice: number;
    checklist: TradeChecklist;
    exitPrice: number;
}
export type Time = bigint;
export interface PerformanceGoals {
    maxDrawdownLimit: number;
    weeklyProfitTarget: number;
    monthlyProfitGoal: number;
}
export interface TradeChecklist {
    items: Array<TradeChecklistItem>;
}
export interface PerformanceGoalsSummary {
    weeklyProgress: number;
    maxDrawdownLimit: number;
    weeklyGoalStatus: GoalStatus;
    currentDrawdown: number;
    goalStatus: GoalStatus;
    monthlyProfitProgress: number;
    currentWeekProfit: number;
    weeklyProfitTarget: number;
    monthlyProfitGoal: number;
    achievementBadge?: AchievementBadge;
}
export type ChecklistItemId = string;
export interface TradeChecklistItem {
    id: ChecklistItemId;
    description: string;
    confirmed: boolean;
}
export interface AddTradeResult {
    trade: TradeEntry;
    updatedGoals: PerformanceGoalsSummary;
}
export interface AchievementBadge {
    status: AchievementBadgeStatus;
    title: string;
    description: string;
    timestamp: Time;
}
export interface TradeEntry {
    id: TradeEntryId;
    direction: TradeDirection;
    asset: string;
    date: Time;
    takeProfit: number;
    tags: Array<string>;
    profitLoss: number;
    positionSize: number;
    riskPercentage: number;
    afterTradeImage?: TradeImage;
    stopLoss: number;
    beforeTradeImage?: TradeImage;
    notes: string;
    entryPrice: number;
    checklist: TradeChecklist;
    exitPrice: number;
    riskRewardRatio: number;
}
export type TradeEntryId = string;
export interface UserProfile {
    name: string;
    performanceGoals: PerformanceGoals;
    accountBalance: number;
    currency: string;
}
export enum AchievementBadgeStatus {
    goalAchieved = "goalAchieved",
    targetReached = "targetReached",
    milestone = "milestone"
}
export enum GoalStatus {
    atLimit = "atLimit",
    overTarget = "overTarget",
    onTrack = "onTrack",
    underTarget = "underTarget"
}
export enum TradeDirection {
    buy = "buy",
    sell = "sell"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTradeEntry(request: AddTradeRequest): Promise<AddTradeResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteTradeEntry(tradeId: TradeEntryId): Promise<PerformanceGoalsSummary>;
    getAllTradeEntries(): Promise<Array<TradeEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPaginatedTrades(page: bigint, pageSize: bigint): Promise<Array<TradeEntry>>;
    getPerformanceGoalsSummary(): Promise<PerformanceGoalsSummary>;
    getTradeById(tradeId: TradeEntryId): Promise<TradeEntry | null>;
    getTradeStatistics(): Promise<{
        totalTrades: bigint;
        totalProfit: number;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
