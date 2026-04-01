import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";

interface DraggableSectionContainerProps {
  index: number;
  listLength: number;
  onDragStart: (index: number) => void;
  onDragMove: (currentIndex: number, dy: number, moveY: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  children: (panHandlers: any, isActive: boolean) => React.ReactNode;
}

const DraggableSectionContainer = ({
  index,
  listLength,
  onDragStart,
  onDragMove,
  onDragEnd,
  children,
}: DraggableSectionContainerProps) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isActive, setIsActive] = useState(false);

  const propsRef = useRef({ index, listLength, onDragMove, onDragEnd });
  useEffect(() => {
    propsRef.current = { index, listLength, onDragMove, onDragEnd };
  }, [index, listLength, onDragMove, onDragEnd]);

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
        setIsActive(false);
        const { index: currentIndex } = propsRef.current;
        
        // Let the parent calculate where it landed based on moveY via onDragEnd instead of trying to guess height here, 
        // because sections have drastically variable heights! We will just pass 0 as targetIndex and let parent handle it.
        propsRef.current.onDragEnd(currentIndex, 0);

        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5,
        }).start();
      },
    })
  ).current;

  const animatedStyle = {
    transform: pan.getTranslateTransform(),
    zIndex: isActive ? 9999 : 1,
    elevation: isActive ? 10 : 0,
    opacity: isActive ? 0.95 : 1,
    backgroundColor: isActive ? "#F8F9FA" : "transparent",
  };

  return (
    <Animated.View style={[animatedStyle]} collapsable={false}>
      {children(panResponder.panHandlers, isActive)}
    </Animated.View>
  );
};

export default DraggableSectionContainer;
