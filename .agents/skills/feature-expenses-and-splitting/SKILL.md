---
name: feature-expenses-and-splitting
description: Trip expense tracking, categories, and member bill splitting for Travee - itinerary_expenses and member_split_bills tables, local services, DTOs, and UI forms. Use when working on budgets, expenses, costs, or split bills.
---

# Expenses & Bill Splitting

Two related domains:

1. **Expenses** — money spent on a trip, optionally tied to an activity and a member.
2. **Split bills** — per-member settlement of the trip cost (how much each member owes / has paid).

## Tables

`itinerary_expenses` (`src/db/models/Expense.ts`):
- Relations: `travel_id` (travels), `activity_id` (itinerary_activities, optional), `member_id` (trip_members, optional).
- Fields: `title`, `amount` (number), `date_time`, `currency`, `category` (string), `expense_category` (number), `user_id`, `notes`, `is_offline`, `is_include_in_bill`, timestamps.

`member_split_bills` (`src/db/models/MemberSplitBill.ts`):
- Relations: `travel_id`, `member_id`.
- Fields: `owes_amount`, `percentage_share`, `is_paid`, `payment_type`, `paid_date`, `notes`, `is_offline`, timestamps.

## Expense Categories

`ExpenseCategory` in `src/types/enums.ts` (19 values): `None=0, FoodAndDining=1, Transportation=2, Accommodation=3, Shopping=4, Entertainment=5, Sightseeing=6, HealthAndWellness=7, VisasAndDocuments=8, Gifts=9, Insurance=10, Emergency=11, Subscriptions=12, BankAndFees=13, Communication=14, Fuel=15, Activities=16, Laundry=17, Others=18`.

Icon mapping lives in `src/features/Travel/components/Forms/Expense/ExpenseCategoryIcon.tsx`. Note `category` (free string) and `expense_category` (enum number) coexist.

## Services (`src/services/local/`)

`expenseService.ts`
- `saveExpenseLocally(expenseData)` — create if no `id`, else update; always sets `isOffline = true`; defaults `isIncludeInBill` to `true`.
- `fetchLocalExpenses(travelId)` — all trip expenses, mapped to `ItineraryExpense[]`.
- `fetchLocalExpensesByActivity(activityId)`.

`memberSplitBillService.ts`
- `fetchLocalMemberSplitBills(travelId)`.
- `saveMemberSplitBillLocally(splitData)` — **upsert by `(travel_id, member_id)`** on create; updates the existing row if found.
- `saveManyMemberSplitBillsLocally(splits)` — batch upsert in a single `database.write`, preserving existing `isPaid`/fields when omitted.

Both files follow the offline-data relation-write convention (`// @ts-ignore` then `record.travel.id = ...`).

## DTOs & Hooks

- DTOs: `src/features/Travel/types/TravelDto.ts` (`ItineraryExpense`, `MemberSplitBill`).
- Hooks: `src/features/Travel/hooks/useExpense.ts`, `useMemberSplitBills.ts` (React Query + optimistic updates).
- UI forms: `src/features/Travel/components/Forms/Expense/` (`index.tsx`, `Modal.tsx`, `ExpenseCategoryIcon.tsx`).

## Rules

- Always set `isOffline = true` on local writes.
- Expenses are per-trip; `activityId`/`memberId` are optional.
- `is_include_in_bill` controls whether an expense contributes to split calculations.
- Prefer the batch upsert for split recalculation to avoid partial writes.
- Amount is a raw number — do not assume a currency is present; check `currency`.
- Money UI should use theme tokens and existing category icons (see `design-system` skill).

## Known Issues / Gotchas

- Relation ids are assigned with `// @ts-ignore` — matching the existing pattern is required.
- `category` vs `expense_category`: the string field is legacy/loose; the enum number is authoritative for icons/grouping.
- No currency conversion or multi-currency normalization exists; amounts are stored as-is.
- Split calculations are not encoded in a single service — callers compute `owesAmount`/`percentageShare` before saving.
