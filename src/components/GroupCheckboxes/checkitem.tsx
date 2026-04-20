import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { CheckboxItemProps } from '../../types/groupCheckbox';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'react-native-paper';

const getIconName = (label: string) => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('domestic')) return 'home';
  if (lowerLabel.includes('local')) return 'location-on';
  if (lowerLabel.includes('international')) return 'public';
  if (lowerLabel.includes('ride')) return 'directions-car';
  if (lowerLabel.includes('camp')) return 'terrain';
  if (lowerLabel.includes('hike')) return 'directions-walk';
  if (lowerLabel.includes('event')) return 'event';
  if (lowerLabel.includes('concert')) return 'music-note';
  if (lowerLabel.includes('marathon') || lowerLabel.includes('run')) return 'directions-run';
  if (lowerLabel.includes('shopping')) return 'shopping-cart';
  if (lowerLabel.includes('forum')) return 'forum';
  if (lowerLabel.includes('workshop')) return 'work';
  if (lowerLabel.includes('symposium')) return 'assignment';
  if (lowerLabel.includes('colloquium')) return 'group';
  return 'place';
};

const CheckboxItem = ({ label, selected, onToggle }: CheckboxItemProps) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      className="p-1" 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View 
        className={`w-[70px] h-[70px] items-center justify-center rounded-2xl border ${
          selected 
            ? 'bg-white border-brand-primary border-2' 
            : 'bg-white border-gray-200'
        }`}
        style={selected ? { elevation: 0, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 } : {}}
      >
        <Icon 
          name={getIconName(label)} 
          size={22} 
          color={selected ? '#0C4C8A' : '#555'} 
        />
        <Text 
          className={`text-[11px] font-medium mt-2 text-center px-1 ${
            selected ? 'text-primary' : 'text-gray-600'
          }`}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CheckboxItem;