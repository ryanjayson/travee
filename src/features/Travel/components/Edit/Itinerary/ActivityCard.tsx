import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, PanResponder } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

interface ActivityCardProps {
  title: string;
  description: string;
  location: string;
  index: number;
  onDragStart: (index: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  isDragging: boolean;
  dragIndex: number | null;
  listLength: number;
  itemHeight?: number;
}

const ActivityCard = ({
  title,
  description,
  location,
  index,
  onDragStart,
  onDragEnd,
  // isDragging,
  // dragIndex,
  listLength,
  itemHeight = 80,
}: ActivityCardProps) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isActive, setIsActive] = useState(false);

  const panResponder = PanResponder.create({
    // Only the handle should start dragging
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
    },
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
    elevation: isActive ? 10 : 1,
    shadowOpacity: isActive ? 0.3 : 0.1,
  };

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <Icon name="drag-handle" size={20} color={"#DDD"} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {location && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.location}>{location}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    alignContent: "center",
  },
  dragHandle: {
    marginRight: 12,
    paddingTop: 2,
  },
  dragIcon: {
    fontSize: 16,
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
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  location: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
});

export default ActivityCard;
