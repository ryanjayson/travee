import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";

const initialData = [
  { id: "1", label: "Item 1", backgroundColor: "#FF5733" },
  { id: "2", label: "Item 2", backgroundColor: "#33FF57" },
  { id: "3", label: "Item 3", backgroundColor: "#5733FF" },
  { id: "4", label: "Item 4", backgroundColor: "#FF33A8" },
];

export const DraggableList = () => {
  const [data, setData] = useState(initialData);
  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<(typeof initialData)[0]>) => (
    <View
      style={[
        styles.item,
        { backgroundColor: isActive ? "lightblue" : item.backgroundColor },
      ]}
      // onLongPress={drag} // Start drag on long press
    >
      <Text style={styles.text}>{item.label}</Text>
    </View>
  );
  return (
    <DraggableFlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onDragEnd={({ data }) => setData(data)}
    />
  );
};
// const App = () => (
//   <GestureHandlerRootView style={{ flex: 1 }}>
//     <DraggableList />
//   </GestureHandlerRootView>
// );

// export default App;

const styles = StyleSheet.create({
  item: {
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    color: "#FFF",
  },
});
