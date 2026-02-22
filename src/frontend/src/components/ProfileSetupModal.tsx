import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AVAILABLE_CURRENCIES, getCurrencySymbol } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [monthlyProfitGoal, setMonthlyProfitGoal] = useState('');
  const [weeklyProfitTarget, setWeeklyProfitTarget] = useState('');
  const [maxDrawdownLimit, setMaxDrawdownLimit] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && accountBalance) {
      const balance = parseFloat(accountBalance);
      const profitGoal = parseFloat(monthlyProfitGoal) || 0;
      const weeklyTarget = parseFloat(weeklyProfitTarget) || 0;
      const drawdownLimit = parseFloat(maxDrawdownLimit) || 0;

      if (!isNaN(balance) && balance >= 0 && profitGoal >= 0 && weeklyTarget >= 0 && drawdownLimit >= 0 && drawdownLimit <= 100) {
        saveProfile.mutate({
          name: name.trim(),
          accountBalance: balance,
          currency,
          performanceGoals: {
            monthlyProfitGoal: profitGoal,
            weeklyProfitTarget: weeklyTarget,
            maxDrawdownLimit: drawdownLimit / 100,
          },
        });
      }
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to TradeJournal</DialogTitle>
          <DialogDescription>Please enter your information to get started with your trading journal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Account Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_CURRENCIES.map((currCode) => (
                  <SelectItem key={currCode} value={currCode}>
                    {getCurrencySymbol(currCode)} {currCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred currency for displaying monetary values
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountBalance">Account Balance</Label>
            <Input
              id="accountBalance"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter your starting balance"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be used to calculate percentage returns on your trades
            </p>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Performance Goals (Optional)</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Set custom targets to track your trading performance. You can skip this and set them later.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeklyProfitTarget">Weekly Profit Target</Label>
              <Input
                id="weeklyProfitTarget"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional: Enter weekly profit target"
                value={weeklyProfitTarget}
                onChange={(e) => setWeeklyProfitTarget(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Target profit amount you aim to achieve each week
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyProfitGoal">Monthly Profit Goal</Label>
              <Input
                id="monthlyProfitGoal"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional: Enter monthly profit target"
                value={monthlyProfitGoal}
                onChange={(e) => setMonthlyProfitGoal(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Target profit amount you aim to achieve each month
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDrawdownLimit">Maximum Drawdown Limit (%)</Label>
              <Input
                id="maxDrawdownLimit"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Optional: Enter max drawdown percentage"
                value={maxDrawdownLimit}
                onChange={(e) => setMaxDrawdownLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum acceptable loss as percentage of peak equity
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!name.trim() || !accountBalance || saveProfile.isPending}>
            {saveProfile.isPending ? 'Saving...' : 'Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
