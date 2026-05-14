---
name: feature-activity-sorting
description: Specifications and algorithm for the LexoRank-based chronological itinerary activity sorting system.
---

# Activity Sorting Specification

## Overview
The application uses the `lexorank` library (an implementation of Jira's LexoRank algorithm) to maintain reliable, infinite-precision sorting for itinerary sections and activities. This allows users to drag-and-drop items and ensures newly created activities are perfectly positioned based on their chronological schedule without needing to reorder the entire database table.

## Core Implementation

### 1. The `useLexicographicSort` Hook
Located at `src/hooks/useLexicographicSort.ts`. This hook wraps the `lexorank` API to provide a safe `generateSortOrder(prev, next)` function.

**Rules Handled by the Hook:**
- **Empty List:** Returns `LexoRank.middle()`.
- **Prepend (No Prev):** Returns `LexoRank.min().between(nextRank)`.
- **Append (No Next):** Returns `prevRank.between(LexoRank.max())`.
- **Exact Equality:** If `prev === next`, it breaks the collision by generating the next possible rank via `prevRank.genNext()`.
- **Inverted Boundaries:** If the chronological neighbors are somehow lexicographically inverted (`prev > next` string-wise), the hook seamlessly swaps them and executes `nextRank.between(prevRank)` to find the true middle rank.

### 2. Chronological Insertion Logic
Located in `src/features/Travel/components/Edit/Itinerary/Activity/index.tsx`. When a user creates a new activity or updates the date/time of an existing one, the system must generate a `sortOrder` that respects the chronological flow of the itinerary.

**Algorithm:**
1. **Unify & Sort Existing Items**: The system gathers all activities in the current section (filtering out the activity currently being edited). It sorts them into a complete chronological timeline:
   - Items with a `startDate` are sorted ascending by timestamp.
   - Items with the exact same `startDate`, or items with no time assigned, fall back to being sorted by their existing `sortOrder` string.
2. **Find Position**: It uses `findIndex` to locate the *first* activity in the unified list that starts *after* the new activity's date/time.
3. **Determine Neighbors**:
   - `nextNeighbor` becomes the activity found at that index.
   - `prevNeighbor` becomes the activity immediately preceding it.
4. **Generate Rank**: The `sortOrder` values of `prevNeighbor` and `nextNeighbor` are passed to the `useLexicographicSort` hook to calculate the new string.
5. **Untimed Activities**: If the new activity has no date/time, it is simply appended to the very end of the unified list by generating a rank between the absolute last activity and `null`.

### 3. Drag and Drop Reordering
Located in `src/features/Travel/components/Edit/Itinerary/index.tsx`. 
- When an activity is manually dragged and dropped, the system takes its new visual position in the list.
- It pulls the `sortOrder` of the item immediately above it (`prevNeighbor`) and immediately below it (`nextNeighbor`).
- The `useLexicographicSort` hook generates the new intermediate rank.
- The UI triggers an optimistic local update followed by a backend mutation (`updateActivitySortMutation`), and alerts the user ("Success: Sort updated") upon database confirmation.
