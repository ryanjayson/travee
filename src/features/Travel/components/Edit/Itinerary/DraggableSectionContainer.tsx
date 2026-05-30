import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View, Easing } from "react-native";

interface DraggableSectionContainerProps {
  index: number;
  listLength: number;
  onDragStart: (index: number) => void;
  onDragMove: (currentIndex: number, dy: number, moveY: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  isChildActive?: boolean;
  disableOpacity?: boolean;
  dragIndex?: number | null;
  hoverIndex?: number | null;
  draggedHeight?: number | null;
  isDragging?: boolean;
  children: (panHandlers: any, isActive: boolean) => React.ReactNode;
}

const DraggableSectionContainer = ({
  index,
  listLength,
  onDragStart,
  onDragMove,
  onDragEnd,
  isChildActive,
  disableOpacity = false,
  dragIndex,
  hoverIndex,
  draggedHeight,
  isDragging,
  children,
}: DraggableSectionContainerProps) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isActive ? 1.03 : 1,
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const propsRef = useRef({ index, listLength, onDragMove, onDragEnd, dragIndex, hoverIndex, draggedHeight });
  useEffect(() => {
    propsRef.current = { index, listLength, onDragMove, onDragEnd, dragIndex, hoverIndex, draggedHeight };
  }, [index, listLength, onDragMove, onDragEnd, dragIndex, hoverIndex, draggedHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        setIsActive(true);
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
        const { index: currentIndex, dragIndex: latestDragIndex, hoverIndex: latestHoverIndex, draggedHeight: activeHeight } = propsRef.current;
        
        const isTargetDifferent = 
          latestDragIndex !== null && 
          latestDragIndex !== undefined && 
          latestHoverIndex !== null && 
          latestHoverIndex !== undefined && 
          latestDragIndex !== latestHoverIndex;

        // Lock coordinates explicitly at final gesture positions to prevent the React Native first-frame reset bug
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        if (isTargetDifferent) {
          const height = activeHeight ?? 180;
          const targetY = (latestHoverIndex - currentIndex) * height;

          // Smoothly glide the section first to its target slot position before executing list reorder
          Animated.timing(pan, {
            toValue: { x: 0, y: targetY },
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            setIsActive(false);
            propsRef.current.onDragEnd(currentIndex, latestHoverIndex);
          });
        } else {
          // Cancelled / released at same spot!
          Animated.timing(pan, {
            toValue: { x: 0, y: 0 },
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            setIsActive(false);
            propsRef.current.onDragEnd(currentIndex, currentIndex);
          });
        }
      },
    })
  ).current;

  const animatedStyle = {
    transform: [
      ...pan.getTranslateTransform(),
      { scale: scaleAnim },
    ] as any,
    zIndex: isActive || isChildActive ? 9999 : 1,
    elevation: 0,
    opacity: 1,
    backgroundColor: "transparent",
    flex: 1,
  };

  return (
    <Animated.View style={[animatedStyle]} collapsable={false}>
      {children(panResponder.panHandlers, isActive)}
    </Animated.View>
  );
};

export default DraggableSectionContainer;
