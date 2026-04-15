import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { CheckboxItemProps } from '../../types/groupCheckbox';

const CheckboxItem = ({ label, selected, onToggle }: CheckboxItemProps) => (
  <TouchableOpacity className="flex-row items-center py-2 pr-2" onPress={onToggle}>
    <View className="flex">
      <Text 
        className={`text-sm px-4 py-2 rounded-full border ${
          selected 
            ? 'text-white bg-primary border-transparent' 
            : 'text-black bg-white border-[#DDD]'
        }`}
      >
        {label}
      </Text>
    </View>
  </TouchableOpacity>
);

export default CheckboxItem;