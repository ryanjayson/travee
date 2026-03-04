import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CheckboxItem from './checkitem'; // Import the item component
import { CheckboxGroupProps, CheckboxOption} from '../../types/groupCheckbox'; // Import the item component



const CheckboxGroup = ({ title , initialOptions}: CheckboxGroupProps) => {
  const [options, setOptions] = useState<CheckboxOption[]>(initialOptions);

  // Logic to handle the toggle of a single item
  const handleToggle = (id: string): void => {
    setOptions(prevOptions => 
      prevOptions.map(option => 
        option.id === id ? { ...option, selected: !option.selected } : option
      )
    );
  };
  
  // Optional: Function to retrieve all selected IDs
  const getSelectedIds = () : string[] => {
      return options
          .filter(option => option.selected)
          .map(option => option.id);
  };
  
  // Optional: Console log the current selection
   React.useEffect(() => {
       console.log("Selected IDs:", getSelectedIds());
   }, [options]);

  return (
    <View style={styles.groupContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Lorem ipsume dolor</Text>
      {options.map((option) => (
        <CheckboxItem
          key={option.id}
          label={option.label}
          selected={option.selected}
          onToggle={() => handleToggle(option.id)} // Pass ID to handler
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  groupContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
  }, 
  subtitle: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 10
  },
});

export default CheckboxGroup;