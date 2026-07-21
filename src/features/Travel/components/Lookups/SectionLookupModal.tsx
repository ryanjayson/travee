import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useRef, useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { useTheme } from "react-native-paper";
import { ItinerarySection } from "../../types/TravelDto";

interface SectionLookupModalProps {
  visible: boolean;
  onClose: () => void;
  sections: ItinerarySection[];
  selectedSectionId?: string;
  onSelect: (sectionId: string) => void;
}

const { height: screenHeight } = Dimensions.get("window");

const SectionLookupModal = ({
  visible,
  onClose,
  sections = [],
  selectedSectionId,
  onSelect,
}: SectionLookupModalProps) => {
  const { colors } = useTheme();
  const [modalHeight] = useState(screenHeight * 0.55);

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  // Slide up transition on opening
  useEffect(() => {
    if (visible) {
      isAtTop.current = true;
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Main sheet responder to capture downward drags only when at top scroll limit
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        // Verify downward swipe and ensure vertical dominance to not block other gestures
        if (isAtTop.current && dy > 8 && Math.abs(dy) > Math.abs(dx)) {
          return true;
        }
        return false;
      },
      onPanResponderGrant: (evt, gestureState) => {
        dragStartDy.current = gestureState.dy;
      },
      onPanResponderMove: (_, gestureState) => {
        const currentDy = gestureState.dy - dragStartDy.current;
        if (currentDy > 0) {
          translateY.setValue(currentDy);
        } else {
          translateY.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentDy = gestureState.dy - dragStartDy.current;
        if (currentDy > 120 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Handle bar pan responder
  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleCancel = () => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleSelect = (sectionId: string) => {
    onSelect(sectionId);
    handleCancel();
  };
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <Animated.View
        className="flex-1 justify-end"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: backdropOpacity,
        }}
      >
        <Animated.View
          {...sheetPanResponder.panHandlers}
          className="rounded-t-[30px] bg-white overflow-hidden"
          style={[
            { height: modalHeight },
            {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 24,
              transform: [{ translateY }],
            },
          ]}
        >
          <StatusBar style="dark" />

          {/* Drag Handle Area */}
          <View
            {...dragPanResponder.panHandlers}
            className="w-full items-center py-4 bg-white rounded-t-[30px]"
          >
            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View
            {...dragPanResponder.panHandlers}
            className="flex-row justify-between items-center px-6 pb-5 border-b border-gray-200"
            style={{ paddingTop: 4 }}
          >
            <View className="flex-1 gap-1">
                <Text
                  className="text-2xl font-semibold  text-primary"
                >
                  Trip sections
                </Text>
                <Text
                  className="text-base  text-tertiary"
                >
                  Available section in this trip
                </Text>
              </View>
            <TouchableOpacity onPress={handleCancel}>
              <Icon name="clear" size={24} color={"#999"} />
            </TouchableOpacity>
          </View>

          <View className="flex-1">
            <ScrollView
              onScroll={(e) => {
                const y = e.nativeEvent.contentOffset.y;
                isAtTop.current = y <= 0;
              }}
              scrollEventThrottle={16}
            >
              {sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  className="px-6 py-4 border-b border-gray-100 flex-row items-center gap-4 active:bg-gray-50"
                  onPress={() => handleSelect(section.id!)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select section ${section.title}`}
                >
                  <Icon name="folder" size={24} color="#263F69" />
                  <View className="flex-1">
                    <Text className="text-lg text-secondary font-semibold">
                      {section?.isDefaultSection ? "[Ungroup]" : section.title}
                    </Text>
                    {section.startDate && !isNaN(new Date(section.startDate).getTime()) ? (
                      <Text className="text-base text-tertiary">
                        {new Date(section.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' })}
                      </Text>
                    ) : (
                      <Text className="text-base text-tertiary italic">
                        No date
                      </Text>
                    )}
                  </View>
                  {selectedSectionId === section.id && (
                    <Icon name="check" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default SectionLookupModal;
