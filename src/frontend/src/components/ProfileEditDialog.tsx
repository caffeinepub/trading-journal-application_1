import { useState, useEffect } from 'react';
import { useSaveCallerUserProfile, useGetCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { AVAILABLE_CURRENCIES, getCurrencySymbol } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function ProfileEditDialog() {
  const { data: userProfile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [monthlyProfitGoal, setMonthlyProfitGoal] = useState('');
  const [weeklyProfitTarget, setWeeklyProfitTarget] = useState('');
  const [maxDrawdownLimit, setMaxDrawdownLimit] = useState('');

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setAccountBalance(userProfile.accountBalance.toString());
      setCurrency(userProfile.currency || 'USD');
      setMonthlyProfitGoal(userProfile.performanceGoals.monthlyProfitGoal.toString());
      setWeeklyProfitTarget(userProfile.performanceGoals.weeklyProfitTarget.toString());
      setMaxDrawdownLimit((userProfile.performanceGoals.maxDrawdownLimit * 100).toString());
    }
  }, [userProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && accountBalance) {
      const balance = parseFloat(accountBalance);
      const profitGoal = parseFloat(monthlyProfitGoal) || 0;
      const weeklyTarget = parseFloat(weeklyProfitTarget) || 0;
      const drawdownLimit = parseFloat(maxDrawdownLimit) || 0;

      if (!isNaN(balance) && balance >= 0 && profitGoal >= 0 && weeklyTarget >= 0 && drawdownLimit >= 0 && drawdownLimit <= 100) {
        saveProfile.mutate(
          {
            name: name.trim(),
            accountBalance: balance,
            currency,
            performanceGoals: {
              monthlyProfitGoal: profitGoal,
              weeklyProfitTarget: weeklyTarget,
              maxDrawdownLimit: drawdownLimit / 100,
            },
          },
          {
            onSuccess: () => {
              setOpen(false);
            },
          }
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Edit Profile</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information, account balance, currency preference, and performance goals.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Your Name</Label>
            <Input
              id="edit-name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-currency">Account Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="edit-currency">
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
              Currency used for displaying monetary values
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-accountBalance">Account Balance</Label>
            <Input
              id="edit-accountBalance"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter your account balance"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Used to calculate percentage returns on your trades
            </p>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Performance Goals</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Set custom targets to track your trading performance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-weeklyProfitTarget">Weekly Profit Target</Label>
              <Input
                id="edit-weeklyProfitTarget"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter weekly profit target"
                value={weeklyProfitTarget}
                onChange={(e) => setWeeklyProfitTarget(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Target profit amount you aim to achieve each week (leave 0 to disable)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-monthlyProfitGoal">Monthly Profit Goal</Label>
              <Input
                id="edit-monthlyProfitGoal"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter monthly profit target"
                value={monthlyProfitGoal}
                onChange={(e) => setMonthlyProfitGoal(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Target profit amount you aim to achieve each month (leave 0 to disable)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-maxDrawdownLimit">Maximum Drawdown Limit (%)</Label>
              <Input
                id="edit-maxDrawdownLimit"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Enter max drawdown percentage"
                value={maxDrawdownLimit}
                onChange={(e) => setMaxDrawdownLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum acceptable loss as percentage of peak equity (leave 0 to disable)
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!name.trim() || !accountBalance || saveProfile.isPending}>
              {saveProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
