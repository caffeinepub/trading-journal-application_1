import { useState, useEffect } from 'react';
import type { TradeEntry, TradeImage, TradeChecklistItem } from '../types';
import { TradeDirection } from '../types';
import { useEditTradeEntry, useGetTags, useAddTag, useUpdateTradeChecklist, useGetCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { ExternalBlob } from '../backend';

interface EditTradeDialogProps {
  trade: TradeEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditTradeDialog({ trade, open, onOpenChange }: EditTradeDialogProps) {
  const [formData, setFormData] = useState({
    date: '',
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
  const [existingBeforeImage, setExistingBeforeImage] = useState<TradeImage | null>(null);
  const [existingAfterImage, setExistingAfterImage] = useState<TradeImage | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ before: number; after: number }>({ before: 0, after: 0 });
  const [checklistItems, setChecklistItems] = useState<TradeChecklistItem[]>([]);

  const { data: tags = [] } = useGetTags();
  const { data: userProfile } = useGetCallerUserProfile();
  const editTrade = useEditTradeEntry();
  const addTag = useAddTag();
  const updateChecklist = useUpdateTradeChecklist();

  useEffect(() => {
    if (trade) {
      const dateObj = new Date(Number(trade.date) / 1000000);
      setFormData({
        date: dateObj.toISOString().split('T')[0],
        asset: trade.asset,
        direction: trade.direction === TradeDirection.buy ? 'buy' : 'sell',
        entryPrice: trade.entryPrice.toString(),
        exitPrice: trade.exitPrice.toString(),
        positionSize: trade.positionSize.toString(),
        stopLoss: trade.stopLoss.toString(),
        takeProfit: trade.takeProfit.toString(),
        notes: trade.notes,
      });
      setSelectedTags(trade.tags);
      setExistingBeforeImage(trade.beforeTradeImage || null);
      setExistingAfterImage(trade.afterTradeImage || null);
      setChecklistItems(trade.checklist.items);
      setBeforeImage(null);
      setAfterImage(null);
      setBeforeImagePreview(null);
      setAfterImagePreview(null);
    }
  }, [trade]);

  const calculateProfitLoss = () => {
    const entry = parseFloat(formData.entryPrice);
    const exit = parseFloat(formData.exitPrice);
    const size = parseFloat(formData.positionSize);
    
    if (!isNaN(entry) && !isNaN(exit) && !isNaN(size)) {
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

    if (!isNaN(entry) && !isNaN(stopLoss) && !isNaN(size) && accountBalance > 0) {
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

  const handleRemoveExistingImage = (type: 'before' | 'after') => {
    if (type === 'before') {
      setExistingBeforeImage(null);
    } else {
      setExistingAfterImage(null);
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    setChecklistItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, confirmed: !item.confirmed } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const positionSize = parseFloat(formData.positionSize);
    if (positionSize <= 0) {
      return;
    }

    const dateObj = new Date(formData.date);
    const timestamp = BigInt(dateObj.getTime() * 1000000);

    let beforeTradeImage: TradeImage | null = existingBeforeImage;
    let afterTradeImage: TradeImage | null = existingAfterImage;

    if (beforeImage) {
      const arrayBuffer = await beforeImage.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress((prev) => ({ ...prev, before: percentage }));
      });
      beforeTradeImage = {
        file: blob,
        description: 'Before Trade',
      };
    }

    if (afterImage) {
      const arrayBuffer = await afterImage.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress((prev) => ({ ...prev, after: percentage }));
      });
      afterTradeImage = {
        file: blob,
        description: 'After Trade',
      };
    }

    editTrade.mutate(
      {
        id: trade.id,
        date: timestamp,
        asset: formData.asset,
        direction: formData.direction === 'buy' ? TradeDirection.buy : TradeDirection.sell,
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: parseFloat(formData.exitPrice),
        positionSize: positionSize,
        stopLoss: parseFloat(formData.stopLoss) || 0,
        takeProfit: parseFloat(formData.takeProfit) || 0,
        notes: formData.notes,
        tags: selectedTags,
        beforeImage: beforeTradeImage,
        afterImage: afterTradeImage,
      },
      {
        onSuccess: () => {
          updateChecklist.mutate({
            tradeId: trade.id,
            checklist: { items: checklistItems },
          });
          onOpenChange(false);
        },
      }
    );
  };

  const handleAddNewTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      addTag.mutate(newTag.trim(), {
        onSuccess: () => {
          setSelectedTags([...selectedTags, newTag.trim()]);
          setNewTag('');
          setShowNewTagInput(false);
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
    formData.asset.trim() !== '' &&
    formData.entryPrice !== '' &&
    formData.exitPrice !== '' &&
    formData.positionSize !== '' &&
    parseFloat(formData.positionSize) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Trade</DialogTitle>
          <DialogDescription>Update the details of this trade entry</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset">Asset</Label>
              <Input
                id="edit-asset"
                placeholder="e.g., AAPL, BTC/USD"
                value={formData.asset}
                onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-direction">Trade Direction</Label>
            <Select
              value={formData.direction}
              onValueChange={(value: 'buy' | 'sell') => setFormData({ ...formData, direction: value })}
            >
              <SelectTrigger id="edit-direction">
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
              <Label htmlFor="edit-entryPrice">Entry Price</Label>
              <Input
                id="edit-entryPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-exitPrice">Exit Price</Label>
              <Input
                id="edit-exitPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.exitPrice}
                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-positionSize">Position Size (Lot Size)</Label>
              <Input
                id="edit-positionSize"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.positionSize}
                onChange={(e) => setFormData({ ...formData, positionSize: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-stopLoss">Stop Loss</Label>
              <Input
                id="edit-stopLoss"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.stopLoss}
                onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-takeProfit">Take Profit</Label>
              <Input
                id="edit-takeProfit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.takeProfit}
                onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
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
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="Add any notes about this trade..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Pre-Trade Checklist ({confirmedCount}/{checklistItems.length})</Label>
            <div className="space-y-2 rounded-md border p-3">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${item.id}`}
                    checked={item.confirmed}
                    onCheckedChange={() => handleChecklistToggle(item.id)}
                  />
                  <Label htmlFor={`edit-${item.id}`} className="cursor-pointer font-normal">
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
                    <Select onValueChange={handleAddExistingTag}>
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
                  />
                  <Button type="button" size="sm" onClick={handleAddNewTag}>
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
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-beforeImage">Before Trade Picture</Label>
              <div className="space-y-2">
                {existingBeforeImage && !beforeImagePreview && (
                  <div className="relative">
                    <img
                      src={existingBeforeImage.file.getDirectURL()}
                      alt="Before trade"
                      className="h-32 w-full rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={() => handleRemoveExistingImage('before')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input
                  id="edit-beforeImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange('before', e.target.files?.[0] || null)}
                  className="cursor-pointer"
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
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {uploadProgress.before > 0 && uploadProgress.before < 100 && (
                  <div className="text-sm text-muted-foreground">Uploading: {uploadProgress.before}%</div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-afterImage">After Trade Picture</Label>
              <div className="space-y-2">
                {existingAfterImage && !afterImagePreview && (
                  <div className="relative">
                    <img
                      src={existingAfterImage.file.getDirectURL()}
                      alt="After trade"
                      className="h-32 w-full rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={() => handleRemoveExistingImage('after')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input
                  id="edit-afterImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange('after', e.target.files?.[0] || null)}
                  className="cursor-pointer"
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
