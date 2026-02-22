# Specification

## Summary
**Goal:** Update the pre-trade checklist to display four labeled checkbox items (Bias, OBS, LQS, FVG) with descriptive labels across all dialogs and trade detail views.

**Planned changes:**
- Update AddTradeDialog to show four checkboxes with labels: "Bias - Market direction", "OBS - Order blocks", "LQS - Liquidity sweeps", "FVG - Fair value gaps"
- Update EditTradeDialog to match the same four labeled checkboxes
- Update TradesList component to display the four checklist items with their full descriptive labels in trade detail views

**User-visible outcome:** Users will see clearly labeled checklist items with both the term and its description (e.g., "Bias - Market direction") when adding, editing, or viewing trades, making the pre-trade checklist more informative and easier to understand.
