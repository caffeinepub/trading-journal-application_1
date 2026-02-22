import { useState } from 'react';
import { useAddTradeEntry, useGetTags, useAddTag, useGetCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react';
import { ExternalBlob, TradeDirection as BackendTradeDirection } from '../backend';
import type { AddTradeRequest, TradeImage } from '../backend';
import type { TradeChecklistItem } from '../types';
import { toast } from 'sonner';

interface AddTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CHECKLIST_ITEMS: TradeChecklistItem[] = [
  { id: 'bias', description: 'Bias - Market direction', confirmed: false },
  { id: 'obs', description: 'OBS - Order blocks', confirmed: false },
  { id: 'lqs', description: 'LQS - Liquidity sweeps', confirmed: false },
  { id: 'fvg', description: 'FVG - Fair value gaps', confirmed: false },
];

export default function AddTradeDialog({ open, onOpenChange }: AddTradeDialogProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    asset: '',
    direction: 'buy' as 'buy' | 'sell',
    entryPrice: '',
    exitPrice: '',
    positionSize: '',
    stopLoss: '',
    takeProfit: '',
    notes: '',
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforeImagePreview, setBeforeImagePreview] = useState<string | null>(null);
  const [afterImagePreview, setAfterImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ before: number; after: number }>({ before: 0, after: 0 });
  const [checklistItems, setChecklistItems] = useState<TradeChecklistItem[]>(DEFAULT_CHECKLIST_ITEMS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tags = [] } = useGetTags();
  const { data: userProfile } = useGetCallerUserProfile();
  const addTrade = useAddTradeEntry();
  const addTag = useAddTag();

  const calculateProfitLoss = () => {
    const entry = parseFloat(formData.entryPrice);
    const exit = parseFloat(formData.exitPrice);
    const size = parseFloat(formData.positionSize);
    
    if (!isNaN(entry) && !isNaN(exit) && !isNaN(size) && size > 0) {
      if (formData.direction === 'buy') {
        return (exit - entry) * size;
      } else {
        return (entry - exit) * size;
      }
    }
    return 0;
  };

  const calculateRiskMetrics = () => {
    const entry = parseFloat(formData.entryPrice);
    const stopLoss = parseFloat(formData.stopLoss);
    const takeProfit = parseFloat(formData.takeProfit);
    const size = parseFloat(formData.positionSize);
    const accountBalance = userProfile?.accountBalance || 0;

    if (!isNaN(entry) && !isNaN(stopLoss) && !isNaN(size) && size > 0 && accountBalance > 0) {
      const stopLossDistance = Math.abs(entry - stopLoss);
      const riskPercentage = (stopLossDistance * size / accountBalance) * 100;
      
      let riskRewardRatio = 0;
      if (!isNaN(takeProfit) && stopLossDistance > 0) {
        const takeProfitDistance = Math.abs(takeProfit - entry);
        riskRewardRatio = takeProfitDistance / stopLossDistance;
      }
      
      return { riskPercentage, riskRewardRatio };
    }
    return { riskPercentage: 0, riskRewardRatio: 0 };
  };

  const profitLoss = calculateProfitLoss();
  const { riskPercentage, riskRewardRatio } = calculateRiskMetrics();

  const getProfitLossColor = (value: number) => {
    if (value > 0) return 'text-emerald-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getRiskColor = (risk: number) => {
    if (risk > 2) return 'text-red-500';
    if (risk > 1) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getRRColor = (rr: number) => {
    if (rr >= 2) return 'text-emerald-500';
    if (rr >= 1) return 'text-amber-500';
    return 'text-red-500';
  };

  const handleImageChange = (type: 'before' | 'after', file: File | null) => {
    if (type === 'before') {
      setBeforeImage(file);
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setBeforeImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setBeforeImagePreview(null);
      }
    } else {
      setAfterImage(file);
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setAfterImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setAfterImagePreview(null);
      }
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    setChecklistItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, confirmed: !item.confirmed } : item))
    );
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      asset: '',
      direction: 'buy',
      entryPrice: '',
      exitPrice: '',
      positionSize: '',
      stopLoss: '',
      takeProfit: '',
      notes: '',
    });
    setSelectedTags([]);
    setBeforeImage(null);
    setAfterImage(null);
    setBeforeImagePreview(null);
    setAfterImagePreview(null);
    setUploadProgress({ before: 0, after: 0 });
    setChecklistItems(DEFAULT_CHECKLIST_ITEMS);
    setIsSubmitting(false);
  };

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Date validation
    if (!formData.date) {
      errors.push('Date is required');
    }

    // Asset validation
    if (!formData.asset.trim()) {
      errors.push('Asset symbol is required');
    }

    // Trade direction validation
    if (!formData.direction || (formData.direction !== 'buy' && formData.direction !== 'sell')) {
      errors.push('Trade direction must be either Buy or Sell');
    }

    // Entry price validation
    const entryPrice = parseFloat(formData.entryPrice);
    if (!formData.entryPrice || isNaN(entryPrice) || entryPrice <= 0) {
      errors.push('Entry price must be a valid positive number');
    }

    // Exit price validation
    const exitPrice = parseFloat(formData.exitPrice);
    if (!formData.exitPrice || isNaN(exitPrice) || exitPrice <= 0) {
      errors.push('Exit price must be a valid positive number');
    }

    // Position size validation
    const positionSize = parseFloat(formData.positionSize);
    if (!formData.positionSize || isNaN(positionSize) || positionSize <= 0) {
      errors.push('Position size must be a valid number greater than zero');
    }

    // Stop loss validation
    const stopLoss = parseFloat(formData.stopLoss);
    if (!formData.stopLoss || isNaN(stopLoss) || stopLoss <= 0) {
      errors.push('Stop loss is required and must be a valid positive number');
    } else if (!isNaN(entryPrice) && !isNaN(stopLoss)) {
      if (formData.direction === 'buy' && stopLoss >= entryPrice) {
        errors.push('For Buy trades, stop loss must be below entry price');
      } else if (formData.direction === 'sell' && stopLoss <= entryPrice) {
        errors.push('For Sell trades, stop loss must be above entry price');
      }
    }

    // Take profit validation
    const takeProfit = parseFloat(formData.takeProfit);
    if (!formData.takeProfit || isNaN(takeProfit) || takeProfit <= 0) {
      errors.push('Take profit is required and must be a valid positive number');
    } else if (!isNaN(entryPrice) && !isNaN(takeProfit)) {
      if (formData.direction === 'buy' && takeProfit <= entryPrice) {
        errors.push('For Buy trades, take profit must be above entry price');
      } else if (formData.direction === 'sell' && takeProfit >= entryPrice) {
        errors.push('For Sell trades, take profit must be below entry price');
      }
    }

    // User profile validation
    if (!userProfile) {
      errors.push('User profile not found. Please refresh the page and try again.');
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateForm();
    if (!validation.valid) {
      toast.error('Invalid form data', {
        description: (
          <div className="space-y-1">
            {validation.errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <span className="text-sm">{error}</span>
              </div>
            ))}
          </div>
        ),
        duration: 6000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse date and convert to nanoseconds timestamp
      const dateObj = new Date(formData.date + 'T12:00:00.000Z'); // Use noon UTC to avoid timezone issues
      const timestamp = BigInt(dateObj.getTime() * 1000000);

      let beforeTradeImage: TradeImage | undefined = undefined;
      let afterTradeImage: TradeImage | undefined = undefined;

      // Upload before image if present
      if (beforeImage) {
        try {
          const arrayBuffer = await beforeImage.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
            setUploadProgress((prev) => ({ ...prev, before: percentage }));
          });
          beforeTradeImage = {
            file: blob,
            description: 'Before Trade',
          };
        } catch (error) {
          console.error('Error uploading before image:', error);
          toast.warning('Image upload issue', {
            description: 'The before image could not be uploaded. The trade will be saved without it.',
          });
        }
      }

      // Upload after image if present
      if (afterImage) {
        try {
          const arrayBuffer = await afterImage.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
            setUploadProgress((prev) => ({ ...prev, after: percentage }));
          });
          afterTradeImage = {
            file: blob,
            description: 'After Trade',
          };
        } catch (error) {
          console.error('Error uploading after image:', error);
          toast.warning('Image upload issue', {
            description: 'The after image could not be uploaded. The trade will be saved without it.',
          });
        }
      }

      // Prepare trade request matching backend AddTradeRequest structure
      const tradeRequest: AddTradeRequest = {
        date: timestamp,
        asset: formData.asset.trim(),
        direction: formData.direction === 'buy' ? BackendTradeDirection.buy : BackendTradeDirection.sell,
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: parseFloat(formData.exitPrice),
        positionSize: parseFloat(formData.positionSize),
        stopLoss: parseFloat(formData.stopLoss),
        takeProfit: parseFloat(formData.takeProfit),
        notes: formData.notes.trim(),
        tags: selectedTags,
        beforeTradeImage,
        afterTradeImage,
        checklist: {
          items: checklistItems,
        },
      };

      // Submit trade to backend
      await addTrade.mutateAsync(tradeRequest);

      // Success - reset form and close dialog
      toast.success('Trade added successfully!', {
        description: 'Your trade has been recorded. All metrics, performance goals, and calendar have been updated.',
        duration: 4000,
      });

      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding trade:', error);
      
      // Extract and display detailed error message
      let errorMessage = 'Failed to add trade';
      let errorDetails: string[] = [];

      if (error?.message) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes('actor not available') || msg.includes('canister') || msg.includes('not deployed')) {
          errorMessage = 'Backend service unavailable';
          errorDetails.push('The backend canister is not available or not properly initialized.');
          errorDetails.push('Please try refreshing the page or contact support.');
        } else if (msg.includes('not implemented') || msg.includes('function does not exist') || msg.includes('has no update method')) {
          errorMessage = 'Backend function not implemented';
          errorDetails.push('The addTradeEntry function is not yet implemented in the backend.');
          errorDetails.push('Please contact the development team.');
        } else if (msg.includes('validation') || msg.includes('invalid')) {
          errorMessage = 'Validation error';
          errorDetails.push(error.message);
        } else if (msg.includes('unauthorized') || msg.includes('permission') || msg.includes('not allowed')) {
          errorMessage = 'Authorization error';
          errorDetails.push('You do not have permission to add trades.');
          errorDetails.push('Please log in again.');
        } else if (msg.includes('trap') || msg.includes('rejected')) {
          errorMessage = 'Backend error';
          errorDetails.push(error.message);
        } else {
          errorMessage = 'Unexpected error';
          errorDetails.push(error.message);
        }
      } else {
        errorDetails.push('An unknown error occurred while adding the trade.');
        errorDetails.push('Please verify your input and try again.');
      }

      toast.error(errorMessage, {
        description: (
          <div className="space-y-2">
            {errorDetails.map((detail, index) => (
              <p key={index} className="text-sm">{detail}</p>
            ))}
            <p className="text-xs text-muted-foreground mt-2">
              If the problem persists, try refreshing the page or contact support.
            </p>
          </div>
        ),
        duration: 8000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      addTag.mutate(newTag.trim(), {
        onSuccess: () => {
          setSelectedTags([...selectedTags, newTag.trim()]);
          setNewTag('');
          setShowNewTagInput(false);
        },
        onError: (error: any) => {
          toast.error('Failed to add tag', {
            description: error?.message || 'Please try again.',
          });
        },
      });
    }
  };

  const handleAddExistingTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const confirmedCount = checklistItems.filter((item) => item.confirmed).length;

  const isFormValid = 
    formData.date !== '' &&
    formData.asset.trim() !== '' &&
    formData.entryPrice !== '' &&
    formData.exitPrice !== '' &&
    formData.positionSize !== '' &&
    formData.stopLoss !== '' &&
    formData.takeProfit !== '' &&
    parseFloat(formData.positionSize) > 0 &&
    !isNaN(parseFloat(formData.entryPrice)) &&
    !isNaN(parseFloat(formData.exitPrice)) &&
    !isNaN(parseFloat(formData.stopLoss)) &&
    !isNaN(parseFloat(formData.takeProfit)) &&
    parseFloat(formData.entryPrice) > 0 &&
    parseFloat(formData.exitPrice) > 0 &&
    parseFloat(formData.stopLoss) > 0 &&
    parseFloat(formData.takeProfit) > 0;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && !isSubmitting) {
        resetForm();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Trade</DialogTitle>
          <DialogDescription>Record a new trade entry with all relevant details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset">Asset *</Label>
              <Input
                id="asset"
                placeholder="e.g., AAPL, BTC/USD"
                value={formData.asset}
                onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direction">Trade Direction *</Label>
            <Select
              value={formData.direction}
              onValueChange={(value: 'buy' | 'sell') => setFormData({ ...formData, direction: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span>Buy</span>
                  </div>
                </SelectItem>
                <SelectItem value="sell">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span>Sell</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price *</Label>
              <Input
                id="entryPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price *</Label>
              <Input
                id="exitPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.exitPrice}
                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="positionSize">Position Size (Lot Size) *</Label>
              <Input
                id="positionSize"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.positionSize}
                onChange={(e) => setFormData({ ...formData, positionSize: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stopLoss">Stop Loss *</Label>
              <Input
                id="stopLoss"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.stopLoss}
                onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="takeProfit">Take Profit *</Label>
              <Input
                id="takeProfit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.takeProfit}
                onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {formData.entryPrice && formData.exitPrice && formData.positionSize && (
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Calculated Profit/Loss:</span>
                <span className={`text-lg font-bold ${getProfitLossColor(profitLoss)}`}>
                  {profitLoss > 0 ? '+' : ''}{profitLoss.toFixed(2)} USD
                </span>
              </div>
              {formData.stopLoss && formData.entryPrice && formData.positionSize && userProfile && (
                <>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-sm font-medium text-muted-foreground">Risk %:</span>
                    <span className={`text-lg font-bold ${getRiskColor(riskPercentage)}`}>
                      {riskPercentage.toFixed(2)}%
                    </span>
                  </div>
                  {formData.takeProfit && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Risk/Reward Ratio:</span>
                      <span className={`text-lg font-bold ${getRRColor(riskRewardRatio)}`}>
                        1:{riskRewardRatio.toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {formData.direction === 'buy' 
                  ? 'Buy: P/L = (Exit - Entry) × Size' 
                  : 'Sell: P/L = (Entry - Exit) × Size'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this trade..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Pre-Trade Checklist ({confirmedCount}/{checklistItems.length})</Label>
            <div className="space-y-2 rounded-md border p-3">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={item.id}
                    checked={item.confirmed}
                    onCheckedChange={() => handleChecklistToggle(item.id)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={item.id} className="cursor-pointer font-normal">
                    {item.description}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              {!showNewTagInput ? (
                <>
                  {tags.length > 0 && (
                    <Select onValueChange={handleAddExistingTag} disabled={isSubmitting}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Add tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {tags.filter((tag) => !selectedTags.includes(tag)).map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewTagInput(true)}
                    disabled={isSubmitting}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    New Tag
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Tag name"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewTag();
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Button type="button" size="sm" onClick={handleAddNewTag} disabled={isSubmitting}>
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewTagInput(false);
                      setNewTag('');
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="beforeImage">Before Trade Picture</Label>
              <Input
                id="beforeImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange('before', e.target.files?.[0] || null)}
                className="cursor-pointer"
                disabled={isSubmitting}
              />
              {beforeImagePreview && (
                <div className="relative">
                  <img src={beforeImagePreview} alt="Before preview" className="h-32 w-full rounded-md object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={() => handleImageChange('before', null)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {uploadProgress.before > 0 && uploadProgress.before < 100 && (
                <div className="text-sm text-muted-foreground">Uploading: {uploadProgress.before}%</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="afterImage">After Trade Picture</Label>
              <Input
                id="afterImage"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange('after', e.target.files?.[0] || null)}
                className="cursor-pointer"
                disabled={isSubmitting}
              />
              {afterImagePreview && (
                <div className="relative">
                  <img src={afterImagePreview} alt="After preview" className="h-32 w-full rounded-md object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={() => handleImageChange('after', null)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {uploadProgress.after > 0 && uploadProgress.after < 100 && (
                <div className="text-sm text-muted-foreground">Uploading: {uploadProgress.after}%</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Trade...
                </>
              ) : (
                'Add Trade'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
