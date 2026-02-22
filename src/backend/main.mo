import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Array "mo:core/Array";

import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  type TradeEntryId = Text;
  type ChecklistItemId = Text;

  public type TradeDirection = {
    #buy;
    #sell;
  };

  public type TradeImage = {
    file : Storage.ExternalBlob;
    description : Text;
  };

  public type TradeChecklistItem = {
    id : ChecklistItemId;
    description : Text;
    confirmed : Bool;
  };

  public type TradeChecklist = {
    items : [TradeChecklistItem];
  };

  public type TradeEntry = {
    id : TradeEntryId;
    date : Time.Time;
    asset : Text;
    direction : TradeDirection;
    entryPrice : Float;
    exitPrice : Float;
    positionSize : Float;
    stopLoss : Float;
    takeProfit : Float;
    riskPercentage : Float;
    riskRewardRatio : Float;
    profitLoss : Float;
    notes : Text;
    tags : [Text];
    beforeTradeImage : ?TradeImage;
    afterTradeImage : ?TradeImage;
    checklist : TradeChecklist;
  };

  public type PerformanceGoals = {
    monthlyProfitGoal : Float;
    weeklyProfitTarget : Float;
    maxDrawdownLimit : Float;
  };

  public type UserProfile = {
    name : Text;
    accountBalance : Float;
    currency : Text;
    performanceGoals : PerformanceGoals;
  };

  public type CalendarDayPerformance = {
    day : Int;
    totalProfitLoss : Float;
    trades : [TradeEntry];
    averageRiskPercentage : Float;
    averageRiskRewardRatio : Float;
    status : CalendarDayStatus;
  };

  public type CalendarDayStatus = {
    #profit;
    #loss;
    #neutral;
  };

  public type FTMOAnalytics = {
    maxDailyLoss : Float;
    maxDailyProfit : Float;
    profitTargetProgress : Float;
    consistencyRate : Float;
    averageRiskPercentage : Float;
    averageRiskRewardRatio : Float;
    overallCompliance : Bool;
  };

  public type HomepageSummaryMetrics = {
    totalProfitLoss : Float;
    winRate : Float;
    lastWeekChange : WeekPerformanceChange;
    miniEquityCurve : [Float];
    ftmoAnalytics : FTMOAnalytics;
    averageRiskPercentage : Float;
    averageRiskRewardRatio : Float;
  };

  public type WeekPerformanceChange = {
    profitLoss : Float;
    percentageChange : Float;
    comparisonToPreviousWeek : Float;
    weekRange : (Time.Time, Time.Time);
  };

  public type PerformanceGoalsSummary = {
    monthlyProfitGoal : Float;
    monthlyProfitProgress : Float;
    weeklyProfitTarget : Float;
    currentWeekProfit : Float;
    weeklyProgress : Float;
    weeklyGoalStatus : GoalStatus;
    maxDrawdownLimit : Float;
    currentDrawdown : Float;
    goalStatus : GoalStatus;
    achievementBadge : ?AchievementBadge;
  };

  public type GoalStatus = {
    #onTrack;
    #overTarget;
    #underTarget;
    #atLimit;
  };

  public type AchievementBadge = {
    title : Text;
    status : AchievementBadgeStatus;
    description : Text;
    timestamp : Time.Time;
  };

  public type AchievementBadgeStatus = {
    #targetReached;
    #milestone;
    #goalAchieved;
  };

  public type PerformanceSummary = {
    totalProfitLoss : Float;
    averageWinRate : Float;
    totalTrades : Int;
    cumulativePercentageReturn : Float;
    weeklyPerformance : [PeriodicPerformanceData];
    monthlyPerformance : [PeriodicPerformanceData];
    averageRiskPercentage : Float;
    averageRiskRewardRatio : Float;
  };

  public type PeriodicPerformanceData = {
    period : Text;
    profitLoss : Float;
    numTrades : Int;
    winRate : Float;
    percentageReturn : Float;
    averageRiskPercentage : Float;
    averageRiskRewardRatio : Float;
  };

  public type PeriodicPerformanceType = {
    #weekly;
    #monthly;
  };

  public type AddTradeResult = {
    trade : TradeEntry;
    updatedGoals : PerformanceGoalsSummary;
  };

  let tradeEntries = Map.empty<Principal, Map.Map<TradeEntryId, TradeEntry>>();
  let tags = Map.empty<Principal, Map.Map<Text, ()>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let ftmoProfitGoals = Map.empty<Principal, Float>();
  let achievementBadges = Map.empty<Principal, Map.Map<Text, AchievementBadge>>();
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  module TradeEntries {
    public func compare(a : TradeEntry, b : TradeEntry) : Order.Order {
      Int.compare(a.date, b.date);
    };
  };

  let defaultFTMOProfitGoal = 0.1;

  let checklistItems : [TradeChecklistItem] = [
    { id = "market_bias"; description = "Market Bias (Bullish/Bearish)"; confirmed = false },
    { id = "higher_timeframe_setup"; description = "Higher Timeframe Setup (D+4H Zone Ready)"; confirmed = false },
    { id = "mitigation_candle"; description = "Mitigation Candle / Imbalance Aligned"; confirmed = false },
    { id = "break_of_structure"; description = "Break of Structure (1H/15M)"; confirmed = false },
    { id = "trade_execution"; description = "Trade Execution (Retracement)"; confirmed = false },
    { id = "fib_zone_valid"; description = "FIB Zone Valid (61–71%)"; confirmed = false },
  ];

  func createEmptyChecklist() : TradeChecklist {
    { items = checklistItems };
  };

  public query ({ caller }) func getTradeById(tradeId : TradeEntryId) : async ?TradeEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };

    switch (tradeEntries.get(caller)) {
      case (?userTrades) { userTrades.get(tradeId) };
      case (null) { null };
    };
  };

  public query ({ caller }) func getAllTradeEntries() : async [TradeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };
    getAllTradesInternal(caller);
  };

  func getAllTradesInternal(caller : Principal) : [TradeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };

    let userTrades = switch (tradeEntries.get(caller)) {
      case (?trades) { trades };
      case null { return [] };
    };

    let tradesArray = userTrades.values().toArray();
    tradesArray.sort();
  };

  public query ({ caller }) func getPaginatedTrades(page : Nat, pageSize : Nat) : async [TradeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };

    let allTrades = getAllTradesInternal(caller);
    let startIndex = page * pageSize;
    let endIndex = if ((startIndex + pageSize) < allTrades.size()) {
      startIndex + pageSize;
    } else {
      allTrades.size();
    };

    if (startIndex >= allTrades.size()) { return [] };

    allTrades.sliceToArray(startIndex, endIndex);
  };

  public query ({ caller }) func getTradeStatistics() : async { totalTrades : Nat; totalProfit : Float } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view statistics");
    };

    let allTrades = getAllTradesInternal(caller);
    var totalProfit = 0.0;

    for (trade in allTrades.values()) {
      totalProfit += trade.profitLoss;
    };

    {
      totalTrades = allTrades.size();
      totalProfit;
    };
  };

  public type AddTradeRequest = {
    date : Time.Time;
    asset : Text;
    direction : TradeDirection;
    entryPrice : Float;
    exitPrice : Float;
    positionSize : Float;
    stopLoss : Float;
    takeProfit : Float;
    notes : Text;
    tags : [Text];
    beforeTradeImage : ?TradeImage;
    afterTradeImage : ?TradeImage;
    checklist : TradeChecklist;
  };

  public shared ({ caller }) func addTradeEntry(request : AddTradeRequest) : async AddTradeResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add trades");
    };

    // Validate trade direction
    switch (request.direction) {
      case (#buy) { /* Valid direction, proceed with processing */ };
      case (#sell) { /* Valid direction, proceed with processing */ };
      case (_) {
        let directionError : Text = "Invalid trade direction. Please select a valid trade direction.";
        Runtime.trap(directionError);
      };
    };

    // Validate prices and position size
    if (request.entryPrice <= 0) {
      let entryPriceError : Text = "Invalid entry price. Entry price must be greater than zero.";
      Runtime.trap(entryPriceError);
    };
    if (request.exitPrice <= 0) {
      let exitPriceError : Text = "Invalid exit price. Exit price must be greater than zero.";
      Runtime.trap(exitPriceError);
    };
    if (request.positionSize <= 0) {
      let positionSizeError : Text = "Invalid position size. Position size must be greater than zero.";
      Runtime.trap(positionSizeError);
    };

    // Validate price relationships based on trade direction
    switch (request.direction) {
      case (#buy) {
        if (request.stopLoss >= request.entryPrice) {
          let stopLossError : Text = "Invalid stop loss for buy trade. Stop loss must be below entry price.";
          Runtime.trap(stopLossError);
        };
        if (request.takeProfit <= request.entryPrice) {
          let takeProfitError : Text = "Invalid take profit for buy trade. Take profit must be above entry price.";
          Runtime.trap(takeProfitError);
        };
      };
      case (#sell) {
        if (request.stopLoss <= request.entryPrice) {
          let stopLossError : Text = "Invalid stop loss for sell trade. Stop loss must be above entry price.";
          Runtime.trap(stopLossError);
        };
        if (request.takeProfit >= request.entryPrice) {
          let takeProfitError : Text = "Invalid take profit for sell trade. Take profit must be below entry price.";
          Runtime.trap(takeProfitError);
        };
      };
    };

    // Calculate profit/loss
    let profitLoss = switch (request.direction) {
      case (#buy) { (request.exitPrice - request.entryPrice) * request.positionSize };
      case (#sell) { (request.entryPrice - request.exitPrice) * request.positionSize };
    };

    // Calculate risk percentage
    let riskAmount = switch (request.direction) {
      case (#buy) { request.entryPrice - request.stopLoss };
      case (#sell) { request.stopLoss - request.entryPrice };
    };
    let riskPercentage = (riskAmount * request.positionSize) * 100;

    // Calculate risk/reward ratio
    let riskRewardRatio = switch (request.direction) {
      case (#buy) {
        let risk = request.entryPrice - request.stopLoss;
        let reward = request.takeProfit - request.entryPrice;
        if (risk <= 0) {
          let riskRewardRatioError = "Invalid risk/reward ratio calculation for buy trade. The risk must be greater than zero.";
          Runtime.trap(riskRewardRatioError);
        };
        reward / risk;
      };
      case (#sell) {
        let risk = request.stopLoss - request.entryPrice;
        let reward = request.entryPrice - request.takeProfit;
        if (risk <= 0) {
          let riskRewardRatioError = "Invalid risk/reward ratio calculation for sell trade. The risk must be greater than zero.";
          Runtime.trap(riskRewardRatioError);
        };
        reward / risk;
      };
    };

    let tradeId = "trade_" # Time.now().toText();
    let tradeEntry : TradeEntry = {
      id = tradeId;
      date = request.date;
      asset = request.asset;
      direction = request.direction;
      entryPrice = request.entryPrice;
      exitPrice = request.exitPrice;
      positionSize = request.positionSize;
      stopLoss = request.stopLoss;
      takeProfit = request.takeProfit;
      riskPercentage;
      riskRewardRatio;
      profitLoss;
      notes = request.notes;
      tags = request.tags;
      beforeTradeImage = request.beforeTradeImage;
      afterTradeImage = request.afterTradeImage;
      checklist = request.checklist;
    };

    // Store trade entry
    let userTrades = switch (tradeEntries.get(caller)) {
      case (?trades) { trades };
      case (null) {
        let newTrades = Map.empty<TradeEntryId, TradeEntry>();
        tradeEntries.add(caller, newTrades);
        newTrades;
      };
    };
    userTrades.add(tradeId, tradeEntry);

    let updatedGoals = calculatePerformanceGoalsInternal(caller);

    { trade = tradeEntry; updatedGoals };
  };

  func calculatePerformanceGoalsInternal(caller : Principal) : PerformanceGoalsSummary {
    let userProfile = switch (userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) { Runtime.trap("User profile not found. Please log in again.") };
    };

    let performanceGoals = userProfile.performanceGoals;

    // Calculate total monthly profit
    let allTrades = getAllTradesInternal(caller);
    let currentMonth = Time.now() / (30 * 24 * 60 * 60 * 1000000000);
    let totalMonthlyProfit = allTrades.foldLeft(
      0.0,
      func(acc, trade) {
        if ((trade.date / (30 * 24 * 60 * 60 * 1000000000)) == currentMonth) {
          acc + trade.profitLoss;
        } else {
          acc;
        };
      },
    );

    // Calculate current week profit
    let weeksSinceEpoch = Time.now() / (7 * 24 * 60 * 60 * 1000000000);
    let totalWeekProfit = allTrades.foldLeft(
      0.0,
      func(acc, trade) {
        if ((trade.date / (7 * 24 * 60 * 60 * 1000000000)) == weeksSinceEpoch) {
          acc + trade.profitLoss;
        } else {
          acc;
        };
      },
    );

    // Calculate drawdown metrics
    let initialBalance = userProfile.accountBalance;
    var balance : Float = initialBalance;
    var maxBalance = initialBalance;
    var drawdown : Float = 0.0;

    for (trade in allTrades.values()) {
      balance += trade.profitLoss;
      if (balance > maxBalance) {
        maxBalance := balance;
      };
      let currentDrawdown = if (maxBalance > 0) {
        ((maxBalance - balance) / maxBalance) * 100.0;
      } else {
        0.0;
      };
      if (currentDrawdown > drawdown) {
        drawdown := currentDrawdown;
      };
    };

    let weeklyProgress = if (performanceGoals.weeklyProfitTarget != 0.0) {
      (totalWeekProfit / performanceGoals.weeklyProfitTarget) * 100.0;
    } else {
      0.0;
    };

    {
      monthlyProfitGoal = performanceGoals.monthlyProfitGoal;
      monthlyProfitProgress = totalMonthlyProfit;
      weeklyProfitTarget = performanceGoals.weeklyProfitTarget;
      currentWeekProfit = totalWeekProfit;
      weeklyProgress;
      maxDrawdownLimit = performanceGoals.maxDrawdownLimit;
      currentDrawdown = drawdown;
      goalStatus = #onTrack;
      achievementBadge = null;
      weeklyGoalStatus = #onTrack;
    };
  };

  public shared ({ caller }) func deleteTradeEntry(tradeId : TradeEntryId) : async PerformanceGoalsSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete trades");
    };

    switch (tradeEntries.get(caller)) {
      case (null) {
        Runtime.trap("Trade not found. Please try again later.");
      };
      case (?userTrades) {
        switch (userTrades.get(tradeId)) {
          case (null) {
            Runtime.trap("Trade not found. Please try again later.");
          };
          case (?_existingTrade) {
            userTrades.remove(tradeId);
            calculatePerformanceGoalsInternal(caller);
          };
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getPerformanceGoalsSummary() : async PerformanceGoalsSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view performance goals");
    };
    calculatePerformanceGoalsInternal(caller);
  };
};
