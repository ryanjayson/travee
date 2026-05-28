import React, { useState, useMemo } from 'react';
import { FAB, Portal, useTheme } from 'react-native-paper';

interface TravelActionFABProps {
  onAddNote: () => void;
  onAddChecklist: () => void;
  onAddExpense: () => void;
  onAddActivity: () => void;
  currentTab?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

const TravelActionFAB = ({ 
  onAddNote, 
  onAddChecklist, 
  onAddExpense, 
  onAddActivity, 
  currentTab = 'details',
  open: controlledOpen,
  setOpen: controlledSetOpen
}: TravelActionFABProps) => {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setLocalOpen;
  const { colors } = useTheme();

  const onStateChange = ({ open }: { open: boolean }) => setOpen(open);

  const actions = useMemo(() => {
    const list = [
      {
        id: 'activity',
        icon: 'calendar-plus',
        label: 'Add Activity',
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
      {
        id: 'note',
        icon: 'note-text',
        label: 'Add Note',
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
    ];

    let targetId = '';
    if (currentTab === 'itinerary') targetId = 'activity';
    else if (currentTab === 'expenses') targetId = 'expense';
    else if (currentTab === 'checklist') targetId = 'checklist';
    else if (currentTab === 'notes') targetId = 'note';

    if (targetId) {
      const match = list.find(item => item.id === targetId);
      if (match) {
        const filtered = list.filter(item => item.id !== targetId);
        return [...filtered, match];
      }
    }
    return list;
  }, [currentTab, onAddActivity, onAddNote, onAddChecklist, onAddExpense]);

  return (
    <Portal>
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
            backgroundColor: '#263F69',
            borderRadius: 50,
        }}
        color="white"
      />
    </Portal>
  );
};

export default TravelActionFAB;
