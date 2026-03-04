# Accordion Component

A highly customizable and reusable accordion component for React Native applications.

## Features

- ✅ Smooth animations with customizable duration
- ✅ Fully customizable styling
- ✅ TypeScript support
- ✅ Disabled state support
- ✅ Custom icons support
- ✅ Toggle callback functionality
- ✅ Auto height calculation
- ✅ Shadow and elevation support
- ✅ Cross-platform compatibility (iOS/Android)

## Basic Usage

```tsx
import { Accordion } from '../components';

<Accordion title="Basic Accordion">
  <Text>Your content here</Text>
</Accordion>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | **Required.** The title text displayed in the header |
| `children` | `ReactNode` | - | **Required.** Content to display when expanded |
| `defaultExpanded` | `boolean` | `false` | Whether the accordion starts expanded |
| `disabled` | `boolean` | `false` | Whether the accordion can be toggled |
| `showIcon` | `boolean` | `true` | Whether to show the expand/collapse icon |
| `customIcon` | `ReactNode` | - | Custom icon component to replace the default arrow |
| `onToggle` | `(expanded: boolean) => void` | - | Callback fired when accordion is toggled |
| `animationDuration` | `number` | `300` | Animation duration in milliseconds |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `containerStyle` | `ViewStyle` | - | Custom styles for the container |
| `headerStyle` | `ViewStyle` | - | Custom styles for the header |
| `titleStyle` | `TextStyle` | - | Custom styles for the title text |
| `contentContainerStyle` | `ViewStyle` | - | Custom styles for the content container |
| `iconColor` | `string` | `'#666'` | Color of the expand/collapse icon |
| `iconSize` | `number` | `20` | Size of the expand/collapse icon |
| `headerPadding` | `number` | `15` | Padding for the header |
| `contentPadding` | `number` | `15` | Padding for the content |

### Appearance Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `backgroundColor` | `string` | `'#fff'` | Background color of the accordion |
| `headerBackgroundColor` | `string` | `'#f9f9f9'` | Background color of the header |
| `contentBackgroundColor` | `string` | `'#fff'` | Background color of the content |
| `borderRadius` | `number` | `8` | Border radius of the accordion |
| `borderColor` | `string` | `'#e0e0e0'` | Border color |
| `borderWidth` | `number` | `1` | Border width |
| `shadowColor` | `string` | `'#000'` | Shadow color (iOS) |
| `shadowOffset` | `{width: number, height: number}` | `{width: 0, height: 2}` | Shadow offset (iOS) |
| `shadowOpacity` | `number` | `0.1` | Shadow opacity (iOS) |
| `shadowRadius` | `number` | `4` | Shadow radius (iOS) |
| `elevation` | `number` | `2` | Elevation (Android) |

## Examples

### Basic Usage

```tsx
<Accordion title="Basic Accordion" defaultExpanded={true}>
  <Text>This accordion starts expanded and contains simple text content.</Text>
</Accordion>
```

### Custom Styling

```tsx
<Accordion 
  title="Custom Styled Accordion" 
  iconColor="#FF6B6B"
  backgroundColor="#FFF5F5"
  headerBackgroundColor="#FFE5E5"
  borderColor="#FF6B6B"
  borderRadius={12}
>
  <Text>This accordion has custom colors and styling.</Text>
</Accordion>
```

### With Toggle Callback

```tsx
<Accordion 
  title="Accordion with Callback"
  onToggle={(expanded) => {
    console.log(`Accordion is now ${expanded ? 'expanded' : 'collapsed'}`);
  }}
>
  <Text>This accordion calls a function when toggled.</Text>
</Accordion>
```

### Disabled State

```tsx
<Accordion title="Disabled Accordion" disabled={true}>
  <Text>This accordion cannot be toggled.</Text>
</Accordion>
```

### Without Icon

```tsx
<Accordion title="No Icon Accordion" showIcon={false}>
  <Text>This accordion doesn't show an expand/collapse icon.</Text>
</Accordion>
```

### Complex Content

```tsx
<Accordion title="Complex Content">
  <Text>You can put any React Native components inside.</Text>
  <View style={{flexDirection: 'row', gap: 10, marginVertical: 10}}>
    <Button title="Action 1" />
    <Button title="Action 2" />
  </View>
  <Image source={{uri: 'https://example.com/image.jpg'}} style={{width: '100%', height: 100}} />
</Accordion>
```

## Notes

- The component automatically measures content height for smooth animations
- Layout animations are enabled for Android devices
- The component uses React Native's Animated API for smooth transitions
- All styling props are optional and have sensible defaults
- The component is fully typed with TypeScript for better development experience

## See Also

- `AccordionExample.tsx` - Comprehensive examples of all features
- `index.ts` - Component exports
