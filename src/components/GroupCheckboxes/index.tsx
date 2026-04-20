import React, { useState } from 'react';
import { View, Text } from 'react-native';
import CheckboxItem from './checkitem';
import { CheckboxGroupProps, CheckboxOption } from '../../types/groupCheckbox';

const CheckboxGroup = ({ title, initialOptions }: CheckboxGroupProps) => {
  const [options, setOptions] = useState<CheckboxOption[]>(initialOptions);

  const handleToggle = (id: string): void => {
    setOptions(prevOptions => 
      prevOptions.map(option => 
        option.id === id ? { ...option, selected: !option.selected } : option
      )
    );
  };

  const getSelectedIds = (): string[] => {
    return options.filter(option => option.selected).map(option => option.id);
  };

  // React.useEffect(() => {
  //   console.log("Selected IDs:", getSelectedIds());
  // }, [options]);

  return (
    <View className=" rounded-lg">
      <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">{title}</Text>
      <View className="flex-row flex-wrap mt-1">
        {options.map((option) => (
          <CheckboxItem
            key={option.id}
            label={option.label}
            selected={option.selected}
            onToggle={() => handleToggle(option.id)}
          />
        ))}
      </View>
    </View>
  );
};

export default CheckboxGroup;