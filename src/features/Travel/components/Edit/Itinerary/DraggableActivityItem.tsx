import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, Text, TouchableOpacity, View } from "react-native";

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
  onPress?: () => void;
  startDate?: string | null;
  endDate?: string | null;
}

const DraggableActivityItem = ({
  title,
  index,
  onDragStart,
  onDragEnd,
  listLength,
  itemHeight = 70,
  onDragMove,
  onPress,
  startDate,
  endDate,
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
      onStartShouldSetPanResponder: () => !startDate,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !startDate && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2);
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
    transform: [
      ...pan.getTranslateTransform(),
      { scale: isActive ? 1.05 : 1 },
    ],
    zIndex: isActive ? 9999 : 1,
    elevation: isActive ? 10 : 0,
    shadowOpacity: isActive ? 0.25 : 0,
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const timeString = startDate ? `${formatTime(startDate)}${endDate ? ` - ${formatTime(endDate)}` : ''}` : null;

  return (
    <Animated.View
      style={animatedStyle}
      className={`rounded-md p-2 mb-3 border border-[#ddd] flex-row items-center ${
        isActive ? "bg-[#F8F9FA] opacity-60" : "bg-white"}
        ${startDate ? "bg-gray-100" : "" }
      `}
      collapsable={false}
    >
      <View 
        {...(startDate ? {} : panResponder.panHandlers)}
        className="flex-row items-center h-[50px]"
      >
        {!startDate ? (
          <Icon
            name="drag-handle"
            size={24}
            color={isActive ? "#183B7A" : "#CCC"}
            className="mx-3"
          />
        ) : (
          <View className="w-[48px] items-center justify-center">
            <Icon name="schedule" size={20} color="#999" />
          </View>
        )}
      </View>
      <View className="flex-1 flex-row items-center justify-between pr-4">
        <View className="flex-1 justify-center">
          <Text 
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-md font-semibold text-primary"
          >
            {title}
          </Text>
          {timeString && (
            <Text className="text-xs text-tertiary mt-0.5 font-medium">
              {timeString}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onPress}>
          <Icon name="edit" size={20} color={"#183B7A"} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default DraggableActivityItem;
