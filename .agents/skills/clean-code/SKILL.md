---
name: clean-code
description: Transform, refactor, prettify, and format code to production-grade standards without altering implementation behavior or business logic. Focuses strictly on code cleanup, readability, Clean Code principles, industry standards, and best known methods (BKM) for scalability, performance, and efficiency while writing concise code ("code less") and avoiding long lines (<100 chars). Use whenever refactoring, formatting, simplifying complex functions, cleaning up technical debt, or optimizing code structure without changing how it works.
license: MIT
metadata:
  author: travee
  version: "1.0.0"
---

# Clean Code & Production Refactoring Guide

Comprehensive guide for transforming existing code into clean, concise, high-performance, production-grade code following industry standards and Best Known Methods (BKM).

> [!IMPORTANT]
> **GOLDEN RULE: PRESERVE IMPLEMENTATION & BEHAVIOR**
> Refactoring modifies internal structure, readability, and code hygiene — **NOT** what the code actually does.
> - **Do NOT change business logic**, calculation rules, state transitions, or user flows.
> - **Do NOT change public contracts**, exported function signatures, prop types, or API response handling.
> - **Do NOT introduce unrequested feature changes** or swap architectural patterns without instruction.
> - **Focus strictly on code cleanup**: flattening nesting, removing dead code, formatting long lines, simplifying syntax, improving readability, and removing technical debt.

---

## 1. Core Principles

Every code cleanup or refactor must uphold these foundational pillars:

1. **Behavioral Invariance (Implementation Preserved):** 100% fidelity to existing business logic, component behavior, edge case handling, and feature flows.
2. **Production-Grade Reliability:** Defensively typed, zero uncaught edge cases, graceful error degradation, structured logging, and no leaky abstractions.
3. **Clean Code & Simplicity:** Single Responsibility Principle (SRP), meaningful self-documenting names, small composable functions, and shallow indentation.
4. **Code Less (Conciseness Without Obscurity):** Eliminate boilerplate, dead code, and redundant state. Derive values on the fly rather than keeping synchronized states.
5. **Strict Line Length & Prettification:** Keep lines under 100 characters (target 80-90). Format JSX, function arguments, and complex conditionals cleanly across multiple lines.
6. **Scalability & Performance:** Minimize unnecessary re-renders, preserve stable references for memoized components, use $O(1)$ lookups over nested loops, and respect architectural boundaries.

---

## 2. Verified Refactoring Protocol

Never refactor blindly. Always execute in three controlled phases to guarantee zero behavioral drift:

```
[Phase 1: Baseline] ──> [Phase 2: Cleanup & Formatting] ──> [Phase 3: Verification]
- Check existing behavior - Keep exact business logic       - Run typechecks
- Run typecheck & tests   - Flatten nesting & guard clauses - Run unit/integration tests
- Identify boundaries     - Shorten lines & prettify        - Verify zero functional drift
```

### Phase 1: Baseline
1. Check test coverage and type-check status (`npx tsc --noEmit` and `npm test`).
2. Identify input/output contracts, side effects, and exact business logic to preserve.

### Phase 2: Atomic Cleanup (No Implementation Changes)
1. Perform small, focused edits rather than massive rewrites.
2. Preserve exact business outcomes: every input must yield the identical output.
3. Flatten control flow using early returns and guard clauses without altering conditional branches.
4. Extract reusable pure utility functions or custom hooks if it improves clarity.
5. Reformat and split long lines into structured, readable blocks (<100 characters).

### Phase 3: Verification
1. Re-run `npx tsc --noEmit` to confirm zero type errors.
2. Re-run `npm test` to verify zero functional regressions.
3. Verify that all components render and behave identically to their pre-refactor state.
4. Confirm clean formatting, correct theme usage, and accessibility standards.

---

## 3. "Code Less" Patterns (Brevity & Simplicity)

### 3.1 Flatten Nesting with Guard Clauses
Avoid deep nested `if-else` blocks ("arrow anti-pattern"). Return or exit early.

```typescript
// ❌ Poor: Deep nesting, high cognitive load
function processTripStatus(trip: Trip | null, user: User | null) {
  if (trip) {
    if (user) {
      if (trip.ownerId === user.id) {
        return updateTrip(trip);
      } else {
        throw new Error('Unauthorized');
      }
    } else {
      throw new Error('User not found');
    }
  } else {
    return null;
  }
}

// ✅ Clean: Guard clauses, flat structure, easy to read
function processTripStatus(trip: Trip | null, user: User | null) {
  if (!trip) return null;
  if (!user) throw new Error('User not found');
  if (trip.ownerId !== user.id) throw new Error('Unauthorized');

  return updateTrip(trip);
}
```

### 3.2 Derive State Instead of Syncing State
Do not duplicate state in `useEffect` when a value can be computed synchronously during render or wrapped in `useMemo`.

```typescript
// ❌ Poor: Redundant state + effect synchronization (causes extra render)
const [items, setItems] = useState<Item[]>([]);
const [totalPrice, setTotalPrice] = useState<number>(0);

useEffect(() => {
  const sum = items.reduce((acc, curr) => acc + curr.price, 0);
  setTotalPrice(sum);
}, [items]);

// ✅ Clean: Derived state (instant, 0 extra renders, less code)
const [items, setItems] = useState<Item[]>([]);
const totalPrice = useMemo(
  () => items.reduce((acc, curr) => acc + curr.price, 0),
  [items]
);
```

### 3.3 Declarative Data Transformations
Leverage modern JavaScript/TypeScript features (`??`, `?.`, `Array` methods, `Object.fromEntries`).

```typescript
// ❌ Verbose imperative loop
const activeTitles: string[] = [];
for (let i = 0; i < activities.length; i++) {
  if (activities[i].status === 'active' && activities[i].title) {
    activeTitles.push(activities[i].title.trim());
  }
}

// ✅ Concise declarative chain
const activeTitles = activities
  .filter((a) => a.status === 'active' && a.title)
  .map((a) => a.title.trim());
```

---

## 4. Line Length & Prettification Discipline

### 4.1 Strict 100-Character Rule
Long single-line statements reduce readability and make git diffs difficult to review. Break statements at logical boundaries.

### 4.2 JSX Element Wrapping
- If a component has **more than 2 props** or exceeds **80 characters**, wrap each prop onto its own line.
- Place the closing `>` or `/>` on a new line aligned with the opening tag.

```tsx
// ❌ Poor: Unreadable horizontal scrolling (>120 chars)
<ActivityCard title={item.title} category={item.category} date={item.date} isCompleted={item.isCompleted} onPress={() => handlePress(item.id)} />

// ✅ Clean: Structured multi-line formatting (<80 chars per line)
<ActivityCard
  title={item.title}
  category={item.category}
  date={item.date}
  isCompleted={item.isCompleted}
  onPress={() => handlePress(item.id)}
/>
```

### 4.3 Breaking Long Conditionals & Ternaries
Never write nested ternaries in a single line. Either break them into readable multi-line blocks or use an early return or lookup map.

```typescript
// ❌ Poor: Nested ternary on one line
const badgeColor = isOwner ? colors.primary : isEditor ? colors.secondary : isPending ? colors.warning : colors.surface;

// ✅ Clean: Lookup dictionary or helper function
const BADGE_COLORS: Record<MemberRole, keyof MD3Theme['colors']> = {
  owner: 'primary',
  editor: 'secondary',
  pending: 'warning',
  viewer: 'surface',
};

const badgeColor = colors[BADGE_COLORS[role] ?? 'surface'];
```

### 4.4 Function Signatures & Destructuring
When function parameters exceed 80 characters, expand them vertically with trailing commas.

```typescript
// ❌ Poor
function updateActivityExpense(activityId: string, expenseId: string, amount: number, currency: string, note?: string) { ... }

// ✅ Clean
function updateActivityExpense(
  activityId: string,
  expenseId: string,
  amount: number,
  currency: string,
  note?: string,
): Promise<void> {
  // ...
}
```

---

## 5. Performance & Scalability (BKM)

### 5.1 Stable Callbacks & Memoization Boundaries
Passing inline functions or object literals to memoized children invalidates memoization on every render.

```tsx
// ❌ Poor: New callback and object created every render
<MemoizedListCard
  item={item}
  style={{ marginVertical: 8, padding: 12 }}
  onSelect={() => handleSelect(item.id)}
/>

// ✅ Clean: Hoisted/themed styles and useCallback with item ID
const handleSelect = useCallback((id: string) => {
  navigation.navigate('Detail', { id });
}, [navigation]);

<MemoizedListCard
  item={item}
  style={styles.card}
  onSelect={handleSelect}
/>
```

### 5.2 $O(1)$ Lookups Over $O(N)$ Nested Searches
Avoid calling `.find()` or `.filter()` inside loops or list renders. Pre-index with `Map` or `Set`.

```typescript
// ❌ Poor: O(N * M) nested scan on each render
const itemsWithCategory = items.map((item) => {
  const category = categories.find((c) => c.id === item.categoryId);
  return { ...item, categoryName: category?.name };
});

// ✅ Clean: O(N + M) indexed map
const categoryMap = useMemo(
  () => new Map(categories.map((c) => [c.id, c.name])),
  [categories]
);

const itemsWithCategory = useMemo(
  () => items.map((item) => ({
    ...item,
    categoryName: categoryMap.get(item.categoryId),
  })),
  [items, categoryMap]
);
```

### 5.3 FlatList / Virtualized List Optimization
When refactoring list components:
- Always define `keyExtractor` as a stable function outside render.
- Keep `renderItem` memoized with `useCallback` or as a standalone component.
- Provide `getItemLayout` for fixed-height items to bypass asynchronous layout measurement.

---

## 6. Production-Grade Standards & Travee BKM

### 6.1 Safe Error Handling & Observability
- Never swallow exceptions silently with empty `catch {}`.
- Log errors using `errorLogger.logError(error, { category, severity })`.
- Never leave bare `console.log` in production code.

```typescript
try {
  await travelService.syncTrip(tripId);
} catch (error) {
  errorLogger.logError(error, {
    category: 'TravelSync',
    severity: 'error',
    metadata: { tripId },
  });
}
```

### 6.2 Defensive JSON & External Input Handling
- Never use raw `JSON.parse` on DB fields or network responses. Use `safeJsonParse`.
- Use `fetchWithTimeout` for network operations to prevent infinite hanging.

### 6.3 Layering Architecture
Refactored code must respect Travee's strict layer boundaries:
`UI (Screens/Components) ──> Hooks ──> Services ──> Database (WatermelonDB)`
- Never import `src/db` directly inside UI components.
- Keep components focused on presentation; encapsulate business logic in hooks or services.

### 6.4 Theme & Accessibility Rules
- Never hardcode color hex values; consume React Native Paper's `useTheme()` or NativeWind tokens.
- Custom interactive buttons/cards must use `TouchableOpacity` with `accessibilityRole="button"`.
- Icon-only touchables must have `accessibilityLabel`.

---

## 7. Refactoring Smells Checklist

Use this checklist during refactoring reviews to quickly catch code debt:

| Code Smell | Issue | Refactoring Action |
|------------|-------|--------------------|
| **God Function / Component** | >150 lines, does everything | Extract subcomponents, custom hooks, or utility functions |
| **Deep Nesting** | >3 levels of `if/else` | Invert conditions and apply early return guard clauses |
| **Long Line Length** | Lines exceeding 100 characters | Split JSX props, destructure parameters, break chained calls |
| **Duplicate Logic** | Copy-pasted helper logic | Extract to `@/utils` or shared hook |
| **Leaky `any` Types** | Bypasses TypeScript checks | Replace with strict interfaces, generics, or unknown + type guards |
| **Inline Function in List** | Recreates closures on every render | Wrap in `useCallback` or move ID handling inside child component |
| **Bare `console.log`** | Pollutes production output | Replace with `errorLogger.logError` or debug logger |
| **Hardcoded Color Hex** | Breaks dark mode and theming | Replace with `colors.xxx` from `useTheme()` |
| **Direct DB in Component** | Breaks layering architecture | Route through custom hook (`useXxx`) and service layer |

---

## 8. Definition of Done for Refactored Code

A refactored file is production-ready only when:
1. **Behavior Preserved:** Implementation behavior, business logic, state handling, and props remain 100% identical.
2. `npx tsc --noEmit` passes with 0 errors.
3. `npm test` passes with 0 failures.
4. All lines are formatted cleanly and stay under 100 characters.
5. No dead imports, unused variables, or commented-out code remains.
6. All buttons adhere to accessibility and theme rules.
