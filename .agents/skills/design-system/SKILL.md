---
name: design-system
description: Complete design system reference for Travee — colors, typography, spacing, components, and patterns across Tailwind, NativeWind, and React Native Paper.
---

# Travee Design System

## Overview

Three overlapping theme layers:

| Layer | File | Purpose |
|-------|------|---------|
| NativeWind / Tailwind | `tailwind.config.js` | Utility-first CSS classes via `className` |
| React Native Paper | `src/theme/theme.ts` | Material Design 3 component theming |
| Legacy RN Stylesheet | `src/styles/common.ts` | Older inline styles (partially used) |

---

## Colors

### Brand Primary

```
brand-25    #E2E9F1
brand-50    #C6D4E2
brand-100   #AAC0D4
brand-200   #8DABC6
brand-300   #7097B8
brand-400   #5184AB
brand-500   #2A719D
brand-600   #263F69      ← DEFAULT / primary / button-primary
brand-700   #00466E      ← button-tertiary
brand-800   #003258
brand-900   #001F42
brand-950   #00092E
brand-secondary  #2591E4
```

### Blue (Untitled UI scale)

```
blue-25  #F5FAFF    blue-50  #EFF8FF    blue-100 #D1E9FF
blue-200 #B2DDFF    blue-300 #84CAFF    blue-400 #53B1FD
blue-500 #2E90FA    blue-600 #1570EF    blue-700 #175CD3
blue-800 #1849A9    blue-900 #194185    blue-950 #102A56
```

### Gray (neutral scale)

```
gray-25  #FCFCFD    gray-50  #F9FAFB    gray-100 #F2F4F7
gray-200 #EAECF0    gray-300 #D0D5DD    gray-400 #98A2B3
gray-500 #667085    gray-600 #475467    gray-700 #344054
gray-800 #182230    gray-900 #101828    gray-950 #0C111D
```

### Semantic

| Token | Default | Primary |
|-------|---------|---------|
| success | `#17B26A` | `#079455` |
| error | `#F04438` | `#D92D20` |
| warning | `#F79009` | `#DC6803` |

### CSS Variable-based (shadcn/ui style)

```
--background, --foreground, --card, --card-foreground
--primary, --primary-foreground, --secondary, --secondary-foreground
--muted, --muted-foreground, --accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring
--chart-1 through --chart-5
```

### Paper Theme Colors (src/theme/theme.ts)

| Token | Value |
|-------|-------|
| primary | `#263F69` |
| secondary | `#059669` |
| tertiary | `#F59E0B` |
| error | `#DC2626` |
| background | `#F8FAFC` |
| surface | `#FFFFFF` |

---

## Typography

### Font Family
```
dm-sans: ['var(--font-dm-sans)']
```

### Tailwind Font Size Classes

**xxs (10px):** `text-xxs-regular` / `text-xxs-medium` / `text-xxs-semibold`
**xs (12px):** `text-xs-regular` / `text-xs-medium` / `text-xs-semibold` / `text-xs-bold`
**sm (14px):** `text-sm-regular` / `text-sm-medium` / `text-sm-semibold`
**md (16px):** `text-md-regular` / `text-md-medium` / `text-md-semibold`
**lg (18px):** `text-lg-regular` / `text-lg-medium` / `text-lg-semibold`
**xl (20px):** `text-xl-regular` / `text-xl-medium` / `text-xl-semibold` / `text-xl-bold`
**2xl (24px):** `text-2xl-regular` / `text-2xl-medium` / `text-2xl-semibold`
**3xl (30px):** `text-3xl-regular` / `text-3xl-medium` / `text-3xl-semibold`

**Display sizes:**
```
text-display-xs-*  (24px / 32px)
text-display-sm-*  (30px / 38px)
text-display-md-*  (36px / 44px, letter-spacing -0.72px)
text-display-lg-*  (48px / 60px, letter-spacing -0.72px)
text-display-xl-medium (60px / 72px, letter-spacing -0.72px)
```

### Paper Typography Tokens

| Token | Size | Weight |
|-------|------|--------|
| displayLarge | 57 | 700 |
| displayMedium | 45 | 700 |
| displaySmall | 36 | 700 |
| headlineLarge | 32 | 700 |
| headlineMedium | 28 | 600 |
| headlineSmall | 24 | 600 |
| titleLarge | 22 | 600 |
| titleMedium | 16 | 600 |
| bodyLarge | 16 | 400 |

---

## Spacing

### Tailwind Extended Spacing (available for space/gap/margin/padding/left/width)

```
1px: 1px    xxs: 2px    xs: 4px
sm:  6px    7px: 7px    md: 8px
9px: 9px    10px: 10px  lg: 12px
14px: 14px  xl: 16px    18px: 18px
2xl: 20px   22px: 22px  3xl: 24px
4xl: 32px   42px: 42px  5xl: 40px
6xl: 48px   7xl: 64px   8xl: 80px
```

Standard Tailwind spacing also applies (e.g. `p-4` = 16px).

---

## Border Radius

```
xxs: 2px    xs: 4px     sm: 6px
md:  8px    xl: 12px    lg: var(--radius)
rounded-full: 9999px
```

### Common component radii:
- `rounded-full` → pills, circles, FABs
- `rounded-[30px]` → modals, search bars, hero
- `rounded-xl` (12px) → activity cards
- `rounded-2xl` (16px) → card containers
- `rounded-[20px]` → accordion containers
- `rounded-[16px]` → input fields
- `rounded-lg` (8px) → icons
- `rounded-md` (6px) → toggle groups

---

## Shadows

### Tailwind (Web/CSS)
```
shadow-xs: 0px 1px 2px 0px #1018280D
shadow-sm: 0 1px 2px 0 rgba(16, 24, 40, 0.06)
shadow-md: 0px 4px 8px -2px ... , 0px 2px 4px -2px ...
shadow-xl: 0px 20px 24px -4px ... , 0px 8px 8px -4px ...
```

### Paper Theme (RN cross-platform)
```
light:  shadowColor #0F172A, offset 0x2, opacity 0.05, radius 3.84, elevation 2
medium: shadowColor #0F172A, offset 0x4, opacity 0.1,  radius 6,    elevation 4
strong: shadowColor #0F172A, offset 0x6, opacity 0.15, radius 10,   elevation 8
```

### Common card shadow:
```
shadow-sm elevation-3       → trip cards
shadow-sm elevation-2       → stat cards
shadow-lg elevation-5       → search bar
shadow-lg elevation-10      → FAB buttons
shadow-xl elevation-20      → slide modals
```

---

## Component Patterns

### Card Pattern
```tsx
<View className="bg-white rounded-2xl p-4 shadow-sm elevation-3 border border-gray-100">
```

### Activity Card
```tsx
<View className="border border-[#e0e0e0] rounded-xl bg-white p-2.5">
```

### Button (TouchButton atom)
```tsx
<TouchableOpacity
  className="bg-[#263F69] rounded-[30px] p-4"
  activeOpacity={0.7}
  accessibilityRole="button"
>
  <Text className="text-white font-semibold text-lg">Label</Text>
</TouchableOpacity>
```

### Pill Button
```tsx
<TouchableOpacity className="bg-brand-primary/10 rounded-full px-4 py-2">
```

### Accordion Container
```tsx
<View className="bg-white my-1.5 rounded-[20px] border border-[#e0e0e0] overflow-hidden">
```

### Modal Slide Panel
```tsx
<View className="rounded-t-[30px] shadow-xl elevation-20">
```

### SlideModal Pattern
```tsx
// Import
import SlideModal from "../../components/molecules/SlideModal";
// Usage
<SlideModal visible={bool} onClose={fn} direction="bottom">
  <YourContent />
</SlideModal>
```

### Tab Header
```tsx
// Types: "primary" (large, border indicator), "secondary" (medium, brand border), "normal" (pill)
<Tabs tabs={tabData} initialActiveTabId="details" type="secondary" />
```

### StatusBadge
```tsx
import StatusBadge from "../../components/StatusBadge";
<StatusBadge type={1} status={TravelStatus.Ongoing} />
```

| Status | bg | text |
|--------|----|------|
| Draft | `#E0E0E0` | `#666` |
| Upcoming | `#B9E6FE` | `#263F69` |
| Ongoing | `#B9E6FE` | `#263F69` |
| Completed | `#E8F5E8` | `#2E7D32` |
| Archived | `#FFEBEE` | `#D32F2F` |
| Cancelled | `#FFEBEE` | `#D32F2F` |

### Text Input
```tsx
<TextInput
  className="border border-gray-300 rounded-[16px] p-4 text-base"
  placeholder="Placeholder"
  placeholderTextColor="#667085"
/>
```

### Overlay
```tsx
<View className="bg-black/40 absolute inset-0" />  {/* light overlay */}
<View className="bg-black/80 absolute inset-0" />  {/* heavy overlay */}
```

---

## Text Color Tokens

```
primary           #101828    (default text)
secondary         #344054    (body text)
tertiary          #475467    (supporting text)
placeholder       #667085    (input placeholders)
brand             #263F69    (brand text)
error-primary     #D92D20
fg-disabled       #98A2B3
```

---

## Background Color Tokens

```
primary           #FFFFFF
primary-hover     #F9FAFB
secondary         #F9FAFB
tertiary          #F2F4F7
quaternary        #EAECF0
overlay           #0C111D
primary-solid     #0C111D
```

---

## Border Color Tokens

```
primary           #D0D5DD
secondary         #EAECF0
tertiary          #F2F4F7
button-primary    #263F69
button-secondary  #D0D5DD
brand             #7097B8
error             #FDA29B
disabled          #D0D5DD
```

---

## Enums

### TravelStatus
```
Draft = 0, Upcoming = 1, Ongoing = 2, Completed = 3, Archieved = 4, Cancelled = 5
```

### ActivityType
```
none=0, flight=1, checkIn=2, checkOut=3, taxi=4, cafe=5, food=6,
walk=7, sightseeing=8, shopping=9, preparation=10, ride=11, rest=12
```

### ExpenseCategory
```
None=0, FoodAndDining=1, Transportation=2, Accommodation=3,
Shopping=4, Entertainment=5, Sightseeing=6, HealthAndWellness=7, Others=8
```

---

## Key File Paths

| Asset | Path |
|-------|------|
| Tailwind config | `tailwind.config.js` |
| Global CSS | `global.css` |
| Paper theme | `src/theme/theme.ts` |
| Legacy styles | `src/styles/common.ts` |
| Style guide | `STYLE.md` |
| Enums | `src/types/enums.ts` |
| Tabs | `src/components/Tabs/index.tsx` |
| Accordion v1 | `src/components/Accordion/index.tsx` |
| Accordion v2 | `src/components/Accordion/indexV2.tsx` |
| SlideModal | `src/components/molecules/SlideModal/index.tsx` |
| StatusBadge | `src/components/StatusBadge/index.tsx` |
| ActivityIcon | `src/components/ActivityIcon/index.tsx` |
| TextLimiter | `src/components/atoms/TextLimiter/index.tsx` |
| TouchButton | `src/components/atoms/TouchButton/index.tsx` |

---

## Quick Reference

```tsx
// Most common utility classes at a glance
flex-1                    // fill available space
flex-row / flex-col       // layout direction
items-center              // align-items center
justify-between           // justify-content space-between
gap-2 / gap-x-3 / gap-y-4

// Padding/Margin
p-4 (16px)  p-2.5 (10px)  p-3 (12px)
px-4 py-3

// Text
text-brand                // #263F69
text-gray-900             // #101828
text-sm / text-base / text-lg / text-xl
font-medium / font-semibold / font-bold

// Background
bg-white
bg-gray-50 / gray-100
bg-brand-primary/10       // with 10% opacity

// Border
border border-gray-200
rounded-xl / rounded-2xl / rounded-full

// Shadow
shadow-sm elevation-2
shadow-lg elevation-5
```
