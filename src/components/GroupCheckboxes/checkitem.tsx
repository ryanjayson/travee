import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons'; 
import { CheckboxItemProps } from '../../types/groupCheckbox'; // Import the item component

const CheckboxItem = ({ label, selected, onToggle }: CheckboxItemProps) => (
 <TouchableOpacity style={styles.itemContainer} onPress={onToggle}>

    {/* <Icon 
      name={selected ? 'check-box' : 'check-box-outline-blank'}
      size={24}
      color={selected ? '#007AFF' : '#555'}
    /> */}
    <View style={styles.labelDiv} >
      <Text style={selected ? styles.labelSelected : styles.label}>{label}</Text>
    </View>
  </TouchableOpacity>
 
);

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  labelDiv: {
    display: 'flex',
  },
  label: {
    marginLeft: 10,
    fontSize: 14,
    borderColor: '#DDD',
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 8,
    borderRadius: 50,
    paddingHorizontal: 10,
  },
  labelSelected: {
    marginLeft: 10,
    fontSize: 14,
    color: 'white',
    backgroundColor: '#183B7A',
    padding: 8,
    borderRadius: 50,
    borderColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 1,
    paddingHorizontal: 10
  },
});

export default CheckboxItem;