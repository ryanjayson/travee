import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, PanResponder } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

interface DraggableActivityItemProps {
  id?: number;
  title: string;
  description?: string;
  location: string;
  index: number;
  onDragStart: (index: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  isDragging: boolean;
  dragIndex: number | null;
  listLength: number;
  itemHeight?: number;
}

const DraggableActivityItem = ({
  id,
  title,
  description,
  location,
  index,
  onDragStart,
  onDragEnd,
  isDragging,
  dragIndex,
  listLength,
  itemHeight = 72,
}: DraggableActivityItemProps) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isActive, setIsActive] = useState(false);

  const panResponder = PanResponder.create({
    // Only the handle should start dragging
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
    },
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      setIsActive(true);
      onDragStart(index);
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (evt, gestureState) => {
      setIsActive(false);
      const deltaY = gestureState.dy;
      const offset = Math.round(deltaY / itemHeight);
      const targetIndex = Math.max(0, Math.min(index + offset, listLength - 1));
      onDragEnd(index, targetIndex);
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
    },
  });

  const animatedStyle = {
    transform: pan.getTranslateTransform(),
    zIndex: isActive ? 1000 : 1,
    opacity: isActive ? 0.8 : 1,
    borderColor: isActive ? "#000" : "#ddd",

    // elevation: isActive ? 10 : 1,
    // shadowOpacity: isActive ? 0.3 : 0.1,
  };

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View
        style={styles.dragHandle}
        {...panResponder.panHandlers}
        accessibilityRole="button"
        accessibilityLabel="Reorder activity"
        accessibilityHint="Drag up or down to reorder within the section"
      >
        <Icon name="drag-handle" size={20} color={"#DDD"} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text numberOfLines={2} style={styles.desc}>
          {description}
        </Text>
        {location && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.location}>{location}</Text>
          </View>
        )}

        <Icon name="keyboard-arrow-down" size={20} color={"red"} />
      </View>
    </Animated.View>
  );
};

export default DraggableActivityItem;

const styles = StyleSheet.create({
  card: {
    opacity: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
    borderWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "flex-start",
    alignContent: "center",
  },
  dragHandle: {
    marginRight: 8,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  dragIcon: {
    fontSize: 18,
    color: "#999",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#183B7A",
    marginBottom: 4,
  },
  desc: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    fontSize: 10,
    marginRight: 3,
  },
  location: {
    fontSize: 10,
    color: "#999",
    fontStyle: "italic",
  },
});
