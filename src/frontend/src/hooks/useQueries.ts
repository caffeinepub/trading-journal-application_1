import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { AddTradeRequest, TradeEntry, UserProfile, PerformanceGoalsSummary, AddTradeResult } from '../backend';
import type {
  CalendarDayPerformance,
  TradeChecklist,
  PerformanceSummary,
  HomepageSummaryMetrics,
} from '../types';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['percentageProfitLoss'] });
      queryClient.invalidateQueries({ queryKey: ['performanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['homepageSummary'] });
      queryClient.invalidateQueries({ queryKey: ['performanceGoalsSummary'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to save profile', {
        description: error.message,
      });
    },
  });
}

// Trade Entry Queries
export function useGetAllTradeEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<TradeEntry[]>({
    queryKey: ['tradeEntries'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTradeEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTradeEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AddTradeRequest) => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        const result = await actor.addTradeEntry(request);
        return result;
      } catch (error: any) {
        // Extract meaningful error message from backend
        const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data: AddTradeResult) => {
      // Immediately update the performance goals cache with the returned data
      queryClient.setQueryData(['performanceGoalsSummary'], data.updatedGoals);
      
      // Invalidate all related queries to ensure full synchronization
      queryClient.invalidateQueries({ queryKey: ['tradeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['calendarPerformance'] });
      queryClient.invalidateQueries({ queryKey: ['percentageProfitLoss'] });
      queryClient.invalidateQueries({ queryKey: ['performanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['homepageSummary'] });
      queryClient.invalidateQueries({ queryKey: ['performanceGoalsSummary'] });
    },
    onError: (error: Error) => {
      // Error toast is handled in the component for better control
      console.error('Trade addition error:', error);
    },
  });
}

export function useEditTradeEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      date: bigint;
      asset: string;
      direction: any;
      entryPrice: number;
      exitPrice: number;
      positionSize: number;
      stopLoss: number;
      takeProfit: number;
      notes: string;
      tags: string[];
      beforeImage: any;
      afterImage: any;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - Backend method not in interface yet
      return actor.editTradeEntry(
        params.id,
        params.date,
        params.asset,
        params.direction,
        params.entryPrice,
        params.exitPrice,
        params.positionSize,
        params.stopLoss,
        params.takeProfit,
        params.notes,
        params.tags,
        params.beforeImage,
        params.afterImage
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['calendarPerformance'] });
      queryClient.invalidateQueries({ queryKey: ['percentageProfitLoss'] });
      queryClient.invalidateQueries({ queryKey: ['performanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['homepageSummary'] });
      queryClient.invalidateQueries({ queryKey: ['performanceGoalsSummary'] });
      toast.success('Trade updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update trade', {
        description: error.message,
      });
    },
  });
}

export function useDeleteTradeEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTradeEntry(id);
    },
    onSuccess: (updatedGoals: PerformanceGoalsSummary) => {
      // Immediately update the performance goals cache with the returned data
      queryClient.setQueryData(['performanceGoalsSummary'], updatedGoals);
      
      // Invalidate all related queries to ensure full synchronization
      queryClient.invalidateQueries({ queryKey: ['tradeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['calendarPerformance'] });
      queryClient.invalidateQueries({ queryKey: ['percentageProfitLoss'] });
      queryClient.invalidateQueries({ queryKey: ['performanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['homepageSummary'] });
      queryClient.invalidateQueries({ queryKey: ['performanceGoalsSummary'] });
      toast.success('Trade deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete trade', {
        description: error.message,
      });
    },
  });
}

export function useUpdateTradeChecklist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tradeId: string; checklist: TradeChecklist }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - Backend method not in interface yet
      return actor.updateTradeChecklist(params.tradeId, params.checklist);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeEntries'] });
      toast.success('Checklist updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update checklist', {
        description: error.message,
      });
    },
  });
}

// Tag Queries
export function useGetTags() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-ignore - Backend method not in interface yet
      return actor.getTags();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagName: string) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - Backend method not in interface yet
      return actor.addTag(tagName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add tag', {
        description: error.message,
      });
    },
  });
}

export function useFilterTradesByTag() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (tag: string) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - Backend method not in interface yet
      return actor.filterTradesByTag(tag);
    },
  });
}

// Calendar Queries
export function useGetCalendarPerformance(month: number, year: number) {
  const { actor, isFetching } = useActor();

  return useQuery<CalendarDayPerformance[]>({
    queryKey: ['calendarPerformance', month, year],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-ignore - Backend method not in interface yet
      return actor.getCalendarPerformance(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
    staleTime: 0, // Always refetch to ensure fresh data
  });
}

export function useGetTradesForDay(day: number, month: number, year: number) {
  const { actor, isFetching } = useActor();

  return useQuery<TradeEntry[]>({
    queryKey: ['tradesForDay', day, month, year],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-ignore - Backend method not in interface yet
      return actor.getTradesForDay(BigInt(day), BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching && day > 0,
  });
}

// Analytics Queries
export function useCalculateUserPercentageProfitLoss() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['percentageProfitLoss'],
    queryFn: async () => {
      if (!actor) return 0;
      // @ts-ignore - Backend method not in interface yet
      return actor.calculateUserPercentageProfitLoss();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPerformanceSummary() {
  const { actor, isFetching } = useActor();

  return useQuery<PerformanceSummary>({
    queryKey: ['performanceSummary'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - Backend method not in interface yet
      return actor.getPerformanceSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

// Homepage Summary Query
export function useGetHomepageSummary() {
  const { actor, isFetching } = useActor();

  return useQuery<HomepageSummaryMetrics>({
    queryKey: ['homepageSummary'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - Backend method not in interface yet
      return actor.getHomepageSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

// Performance Goals Query
export function useGetPerformanceGoalsSummary() {
  const { actor, isFetching } = useActor();

  return useQuery<PerformanceGoalsSummary>({
    queryKey: ['performanceGoalsSummary'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPerformanceGoalsSummary();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0, // Always refetch to ensure fresh data
  });
}
