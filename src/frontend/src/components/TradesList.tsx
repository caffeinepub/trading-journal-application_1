import { useState } from 'react';
import type { TradeEntry } from '../types';
import { TradeDirection } from '../types';
import { useDeleteTradeEntry, useGetTags } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Edit, Trash2, Filter, Download, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import EditTradeDialog from './EditTradeDialog';

interface TradesListProps {
  trades: TradeEntry[];
}

export default function TradesList({ trades }: TradesListProps) {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [editingTrade, setEditingTrade] = useState<TradeEntry | null>(null);
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const [viewingTrade, setViewingTrade] = useState<TradeEntry | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { data: tags = [] } = useGetTags();
  const deleteTrade = useDeleteTradeEntry();

  const filteredTrades = selectedTag === 'all' 
    ? trades 
    : trades.filter((trade) => trade.tags.includes(selectedTag));

  const sortedTrades = [...filteredTrades].sort((a, b) => Number(b.date - a.date));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTimeForCSV = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const getProfitLossColor = (value: number) => {
    if (value > 0) return 'font-semibold text-emerald-500';
    if (value < 0) return 'font-semibold text-red-500';
    return 'font-semibold text-muted-foreground';
  };

  const handleExportToCSV = () => {
    if (sortedTrades.length === 0) {
      return;
    }

    const headers = [
      'Date',
      'Asset',
      'Direction',
      'Entry Price',
      'Exit Price',
      'Stop Loss',
      'Take Profit',
      'Position Size',
      'Risk %',
      'Risk/Reward Ratio',
      'Profit/Loss',
      'Status',
      'Notes',
      'Tags',
      'Before Image URL',
      'After Image URL',
      'Checklist Confirmations',
      'Bias',
      'OBS',
      'LQS',
      'FVG',
    ];

    const rows = sortedTrades.map((trade) => {
      const confirmedCount = trade.checklist.items.filter((item) => item.confirmed).length;
      const totalCount = trade.checklist.items.length;
      
      const checklistMap = new Map(
        trade.checklist.items.map((item) => [item.id, item.confirmed])
      );

      const status = trade.profitLoss > 0 ? 'Profit' : trade.profitLoss < 0 ? 'Loss' : 'Break-even';
      const direction = trade.direction === TradeDirection.buy ? 'Buy' : 'Sell';

      return [
        formatDateTimeForCSV(trade.date),
        escapeCSVValue(trade.asset),
        direction,
        trade.entryPrice.toFixed(2),
        trade.exitPrice.toFixed(2),
        trade.stopLoss.toFixed(2),
        trade.takeProfit.toFixed(2),
        trade.positionSize.toFixed(2),
        trade.riskPercentage.toFixed(2) + '%',
        '1:' + trade.riskRewardRatio.toFixed(2),
        trade.profitLoss.toFixed(2),
        status,
        escapeCSVValue(trade.notes || ''),
        escapeCSVValue(trade.tags.join('; ')),
        trade.beforeTradeImage ? trade.beforeTradeImage.file.getDirectURL() : 'N/A',
        trade.afterTradeImage ? trade.afterTradeImage.file.getDirectURL() : 'N/A',
        `${confirmedCount}/${totalCount}`,
        checklistMap.get('bias') ? 'Yes' : 'No',
        checklistMap.get('obs') ? 'Yes' : 'No',
        checklistMap.get('lqs') ? 'Yes' : 'No',
        checklistMap.get('fvg') ? 'Yes' : 'No',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `trading-journal-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (deletingTradeId) {
      deleteTrade.mutate(deletingTradeId);
      setDeletingTradeId(null);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>Your trades will appear here</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">No trades recorded yet. Add your first trade to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>View and manage all your trades</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExportToCSV}
                variant="outline"
                className="gap-2"
                disabled={sortedTrades.length === 0}
              >
                <Download className="h-4 w-4" />
                Export to CSV
              </Button>
              {tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedTag} onValueChange={setSelectedTag}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {tags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="text-right">Entry</TableHead>
                  <TableHead className="text-right">Exit</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Risk %</TableHead>
                  <TableHead className="text-right">R:R</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Checklist</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTrades.map((trade) => {
                  const confirmedCount = trade.checklist.items.filter((item) => item.confirmed).length;
                  const totalCount = trade.checklist.items.length;
                  return (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">{formatDate(trade.date)}</TableCell>
                      <TableCell className="font-semibold">{trade.asset}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {trade.direction === TradeDirection.buy ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                              <span className="text-sm font-medium text-emerald-500">Buy</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-500" />
                              <span className="text-sm font-medium text-red-500">Sell</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(trade.entryPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(trade.exitPrice)}</TableCell>
                      <TableCell className="text-right">{trade.positionSize}</TableCell>
                      <TableCell className="text-right">
                        <span className={trade.riskPercentage > 2 ? 'text-red-500' : trade.riskPercentage > 1 ? 'text-amber-500' : 'text-emerald-500'}>
                          {trade.riskPercentage.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={trade.riskRewardRatio >= 2 ? 'text-emerald-500' : trade.riskRewardRatio >= 1 ? 'text-amber-500' : 'text-red-500'}>
                          1:{trade.riskRewardRatio.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={getProfitLossColor(trade.profitLoss)}>
                          {formatCurrency(trade.profitLoss)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {trade.beforeTradeImage && (
                            <button
                              onClick={() => handleImageClick(trade.beforeTradeImage!.file.getDirectURL())}
                              className="relative h-10 w-10 overflow-hidden rounded border hover:opacity-80"
                            >
                              <img
                                src={trade.beforeTradeImage.file.getDirectURL()}
                                alt="Before"
                                className="h-full w-full object-cover"
                              />
                            </button>
                          )}
                          {trade.afterTradeImage && (
                            <button
                              onClick={() => handleImageClick(trade.afterTradeImage!.file.getDirectURL())}
                              className="relative h-10 w-10 overflow-hidden rounded border hover:opacity-80"
                            >
                              <img
                                src={trade.afterTradeImage.file.getDirectURL()}
                                alt="After"
                                className="h-full w-full object-cover"
                              />
                            </button>
                          )}
                          {!trade.beforeTradeImage && !trade.afterTradeImage && (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingTrade(trade)}
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {confirmedCount}/{totalCount}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {trade.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingTrade(trade)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingTradeId(trade.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editingTrade && (
        <EditTradeDialog
          trade={editingTrade}
          open={!!editingTrade}
          onOpenChange={(open) => !open && setEditingTrade(null)}
        />
      )}

      <AlertDialog open={!!deletingTradeId} onOpenChange={(open) => !open && setDeletingTradeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Trade Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex items-center justify-center">
              <img src={selectedImage} alt="Trade" className="max-h-[70vh] rounded-lg object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingTrade} onOpenChange={(open) => !open && setViewingTrade(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pre-Trade Checklist</DialogTitle>
            <DialogDescription>
              {viewingTrade && `${viewingTrade.asset} - ${formatDate(viewingTrade.date)}`}
            </DialogDescription>
          </DialogHeader>
          {viewingTrade && (
            <div className="space-y-3">
              {viewingTrade.checklist.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-5 w-5 ${item.confirmed ? 'text-emerald-500' : 'text-muted-foreground'}`}
                  />
                  <span className={item.confirmed ? 'font-medium' : 'text-muted-foreground'}>
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
