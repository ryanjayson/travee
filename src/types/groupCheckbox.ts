
// Interface for a single option item
export interface CheckboxOption {
  id: string;
  label: string;
  selected: boolean;
}

// Props for the CheckboxItem component
export interface CheckboxItemProps {
  label: string;
  selected: boolean;
  onToggle: () => void; // A function that takes no arguments and returns nothing
}

// Props for the CheckboxGroup component
export interface CheckboxGroupProps {
  title: string;
  initialOptions: CheckboxOption[]; // The array of options passed from the parent
}