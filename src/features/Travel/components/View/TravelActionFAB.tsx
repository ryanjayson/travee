import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FAB, Portal, useTheme } from 'react-native-paper';
import { BackHandler, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface TravelActionFABProps {
  onAddNote: () => void;
  onAddChecklist: () => void;
  onAddExpense: () => void;
  onAddActivity: () => void;
  currentTab?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  travelId?: string;
  isIncreasePosition?: boolean;
}

const TravelActionFAB = ({ 
  onAddNote, 
  onAddChecklist, 
  onAddExpense, 
  onAddActivity, 
  currentTab = 'details',
  open: controlledOpen,
  setOpen: controlledSetOpen,
  travelId,
  isIncreasePosition
}: TravelActionFABProps) => {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setLocalOpen;
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const translateYAnim = useRef(new Animated.Value(isIncreasePosition ? -100 : 0)).current;

  useEffect(() => {
    Animated.spring(translateYAnim, {
      toValue: isIncreasePosition ? -92 : 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [isIncreasePosition]);

  useEffect(() => {
    const backAction = () => {
      if (open) {
        setOpen(false);
        return true; // intercept back action and close FAB
      }
      return false; // default back navigation
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [open]);

  const onStateChange = ({ open }: { open: boolean }) => setOpen(open);

  const actions = useMemo(() => {
    const list = [
      {
        id: 'note',
        icon: 'note-text',
        label: 'Add Note',
        labelTextColor: 'white',
        style: {
            elevation: 0,
            borderRadius: 50,
            padding: 6,
            backgroundColor: '#263F69',
            marginRight: -6,
            marginBottom: 10
        },
        color: 'white',
        onPress: onAddNote,
      },
      {
        id: 'checklist',
        icon: 'playlist-check',
        label: 'Add Checklist',
        labelTextColor: 'white',
        style: {
            elevation: 0,
            borderRadius: 50,
            padding: 6,
            backgroundColor: '#263F69',
            marginRight: -6,
            marginBottom: 10
        },
        color: 'white',
        onPress: onAddChecklist,
      },
      {
        id: 'expense',
        icon: 'currency-usd',
        label: 'Add Expense',
        labelTextColor: 'white',
        style: {
            elevation: 0,
            borderRadius: 50,
            padding: 6,
            backgroundColor: '#263F69',
            marginRight: -6,
            marginBottom: 10
        },
        color: 'white',
        onPress: onAddExpense,
      },
       {
        id: 'activity',
        icon: 'calendar-plus',
        label: 'Add Activity',
        labelTextColor: 'white',
        style: {
            elevation: 0,
            borderRadius: 50,
            padding: 6,
            backgroundColor: '#263F69',
            marginRight: -6,
            marginBottom: 10
        },
        color: 'white',
        onPress: onAddActivity,
      },
    ];

    // let targetId = '';
    // if (currentTab === 'itinerary') targetId = 'activity';
    // else if (currentTab === 'expenses') targetId = 'expense';
    // else if (currentTab === 'checklist') targetId = 'checklist';
    // else if (currentTab === 'notes') targetId = 'note';

    // if (targetId) {
    //   const match = list.find(item => item.id === targetId);
    //   if (match) {
    //     const filtered = list.filter(item => item.id !== targetId);
    //     return [...filtered, match];
    //   }
    // }
    return list;
  }, [currentTab, onAddActivity, onAddNote, onAddChecklist, onAddExpense]);

  return (
    <Portal>
      {open && (
        <TouchableOpacity
          activeOpacity={1}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.75)'}]}
          onPress={() => setOpen(false)}
        />
      )}
      <Animated.View
        style={[{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateY: translateYAnim }]
        }]}
        pointerEvents="box-none"
      >
        <FAB.Group
          open={open}
          visible
          icon={open ? 'close' : 'plus'}
          actions={actions}
          onStateChange={onStateChange}
          onPress={() => {
            if (open) {
              // do something if the speed dial is open
            }
          }}
          fabStyle={{
              backgroundColor: open ? '#82181a' : '#263F69',
              borderRadius: 50,
              padding: 6,
              height: 68,
              width: 68,
          }}
          backdropColor="transparent"
          color="white"
        />
        {open && (
          <TouchableOpacity
          className='bg-brand-50'
            style={[styles.editTripButton, { borderColor: colors.primary || '#263F69', borderWidth: 1 }]}
            onPress={() => {
              setOpen(false);
              if (travelId) {
                navigation.navigate("EditTravelPlan", { travelId });
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit Trip"
            activeOpacity={0.7}
          >
            <Icon name="edit-note" size={24} color="#263F69" />
            <Text style={styles.editTripText}>Edit Trip</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  editTripButton: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    zIndex: 9999,
  },
  editTripText: {
    color: '#263F69',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default TravelActionFAB;
