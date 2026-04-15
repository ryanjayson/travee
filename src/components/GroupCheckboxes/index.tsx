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

  React.useEffect(() => {
    console.log("Selected IDs:", getSelectedIds());
  }, [options]);

  return (
    <View className="p-3 border border-[#ddd] rounded-lg">
      <Text className="text-base font-medium text-primary">{title}</Text>
      <Text className="text-xs text-gray-400 mb-2.5">Select options below</Text>
      <View className="flex-row flex-wrap">
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