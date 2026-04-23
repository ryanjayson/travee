import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, PanResponder } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

interface DraggableActivityItemProps {
  id?: string;
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
  onDragMove?: (index: number, dy: number, moveY?: number) => void;
}

// const DraggableActivityItem = ({
//   id,
//   title,
//   description,
//   location,
//   index,
//   onDragStart,
//   onDragEnd,
//   isDragging,
//   dragIndex,
//   listLength,
//   itemHeight = 70,
// }: DraggableActivityItemProps) => {
//   const pan = useRef(new Animated.ValueXY()).current;
//   const [isActive, setIsActive] = useState(false);

//   const panResponder = PanResponder.create({
//     // Only the handle should start dragging
//     onStartShouldSetPanResponder: () => true,
//     onMoveShouldSetPanResponder: (evt, gestureState) => {
//       return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
//     },
//     onMoveShouldSetPanResponderCapture: () => true,
//     onPanResponderTerminationRequest: () => false,
//     onPanResponderGrant: () => {
//       setIsActive(true);
//       onDragStart(index);
//     },
//     onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
//       useNativeDriver: false,
//     }),
//     onPanResponderRelease: (evt, gestureState) => {
//       setIsActive(false);
//       const deltaY = gestureState.dy;
//       const offset = Math.round(deltaY / itemHeight);
//       const targetIndex = Math.max(0, Math.min(index + offset, listLength - 1));
//       onDragEnd(index, targetIndex);
//       Animated.spring(pan, {
//         toValue: { x: 0, y: 0 },
//         useNativeDriver: false,
//       }).start();
//     },
//   });

//   const animatedStyle = {
//     transform: pan.getTranslateTransform(),
//     zIndex: isActive ? 100 : 1,
//     opacity: isActive ? 0.8 : 1,
//     borderColor: isActive ? "#183B7A" : "#ddd",
//     borderWidth: isActive ? 4 : 1,
//     // elevation: isActive ? 10 : 1,
//     shadowOpacity: isActive ? 0.3 : 0.1,
//   };

//   return (
//     <Animated.View style={[styles.card, animatedStyle]}>
//       <View
//         style={styles.dragHandle}
//         {...panResponder.panHandlers}
//         accessibilityRole="button"
//         accessibilityLabel="Reorder activity"
//         accessibilityHint="Drag up or down to reorder within the section"
//       >
//         <Icon name="drag-handle" size={20} color={"#DDD"} />
//       </View>
//       <View style={styles.content}>
//         <Text style={styles.title}>{title}</Text>
//         <Text numberOfLines={2} style={styles.desc}>
//           {description}
//         </Text>
//         {location && (
//           <View style={styles.locationContainer}>
//             <Text style={styles.locationIcon}>📍</Text>
//             <Text style={styles.location}>{location}</Text>
//           </View>
//         )}

//         <Icon name="keyboard-arrow-down" size={20} color={"red"} />
//       </View>
//     </Animated.View>
//   );
// };

const DraggableActivityItem = ({
  id,
  title,
  description,
  location,
  index,
  onDragStart,
  onDragEnd,
  listLength,
  itemHeight = 70,
  onDragMove,
}: DraggableActivityItemProps) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isActive, setIsActive] = useState(false);

  // Use a Ref to store changing props so the PanResponder always has latest values
  const propsRef = useRef({ index, listLength, itemHeight, onDragMove, onDragEnd });
  useEffect(() => {
    propsRef.current = { index, listLength, itemHeight, onDragMove, onDragEnd };
  }, [index, listLength, itemHeight, onDragMove, onDragEnd]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        setIsActive(true);
        // Reset pan to zero just in case
        pan.setValue({ x: 0, y: 0 });
        onDragStart(propsRef.current.index);
      },
      onPanResponderMove: (e, gestureState) => {
        if (propsRef.current.onDragMove) {
          propsRef.current.onDragMove(
            propsRef.current.index,
            gestureState.dy,
            gestureState.moveY
          );
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(e, gestureState);
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsActive(false);
        const {
          index: currentIndex,
          itemHeight: height,
          listLength: length,
        } = propsRef.current;

        const deltaY = gestureState.dy;
        const offset = Math.round(deltaY / height);
        const targetIndex = Math.max(
          0,
          Math.min(currentIndex + offset, length - 1),
        );

        // Trigger the reorder
        propsRef.current.onDragEnd(currentIndex, targetIndex);

        // Snap back to original position (the list will re-render with new data)
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5,
        }).start();
      },
    }),
  ).current;

  const animatedStyle = {
    // transform: pan.getTranslateTransform(),
    transform: [
      ...pan.getTranslateTransform(),
      { scale: isActive ? 1.05 : 1 }, // Slightly larger when dragging
    ],
    zIndex: isActive ? 9999 : 1,
    elevation: isActive ? 10 : 0, // Critical for Android to show above others
    opacity: isActive ? 0.9 : 1,
    backgroundColor: isActive ? "#F8F9FA" : "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isActive ? 0.25 : 0,
    shadowRadius: 3.84,
  };

  return (
    <Animated.View
      style={[styles.card, animatedStyle]}
      collapsable={false} // Prevents UI flattening on Android
    >
      <View style={styles.dragHandle} {...panResponder.panHandlers}
        className="flex items-center flex-row h-[50px]"
      >
        <Icon
          name="drag-handle"
          size={24}
          color={isActive ? "#183B7A" : "#CCC"}
          className="mr-2"
        />
      </View>
      <View className="flex items-center flex-row h-full w-[90%]"
      >
        <Text numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.title}>{title}</Text>
        {/* ... rest of your content */}
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
    // marginRight: 8,
    // width: 28,
    // alignItems: "center",
    // justifyContent: "center",
    // paddingVertical: 8,
  },
  dragIcon: {
    fontSize: 18,
    color: "#999",
  },
  // content: {
  //   flex: 1,
  // },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#183B7A",
    // marginBottom: 4,
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
