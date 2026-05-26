import React, { useState } from 'react';
import { FAB, Portal, useTheme } from 'react-native-paper';

interface TravelActionFABProps {
  onAddNote: () => void;
  onAddChecklist: () => void;
  onAddExpense: () => void;
}

const TravelActionFAB = ({ onAddNote, onAddChecklist, onAddExpense }: TravelActionFABProps) => {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();

  const onStateChange = ({ open }: { open: boolean }) => setOpen(open);

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible
        icon={open ? 'close' : 'plus'}
        
        actions={[
          {
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
          
        ]}
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
