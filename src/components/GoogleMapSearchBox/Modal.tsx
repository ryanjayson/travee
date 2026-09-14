import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  TouchableOpacity,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  LayoutAnimation,
  UIManager,
} from "react-native";
import GoogleMapSearchBox from "./SearchBox";
import { GooglePlaceLocation, GoogleMapSearchModalProps } from "./types";

export type { GoogleMapSearchModalProps };

const { height: screenHeight } = Dimensions.get("window");

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const GoogleMapSearchModal: React.FC<GoogleMapSearchModalProps> = ({
  visible,
  onClose,
  onSelect,
  onManualEntry,
  title = "Search Places",
  description,
  descriptionText,
  placeholder,
  initialValue = "",
  initialCoordinates,
  destination = "",
  destinations,
  destinationCoordinates,
  country = "",
}) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const dragStartDy = useRef<number>(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Track keyboard height and visibility to keep the searchbox attached to keyboard top
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [sessionKey, setSessionKey] = useState<number>(0);

  // Animate in when visible becomes true
  useEffect(() => {
    if (visible) {
      setSessionKey((k) => k + 1);
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  // Dismiss animation handler
  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [onClose, translateY]);

  // PanResponder to handle downward drag-to-dismiss gesture
  const dragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture vertical downward drags
        return (
          gestureState.dy > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderGrant: (_, gestureState) => {
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
        if (currentDy > 100 || gestureState.vy > 0.5) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Fade the backdrop along with the slide progress
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const handleSelectLocation = (location: GooglePlaceLocation) => {
    onSelect(location);
    handleDismiss();
  };

  const handleManual = () => {
    handleDismiss();
    onManualEntry?.();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        {/* Backdrop (Maintains existing rgba(0,0,0,0.8) dark background) */}
        <Animated.View
          className="absolute inset-0"
          style={{
            backgroundColor: "rgba(0,0,0,0.8)",
            opacity: backdropOpacity,
          }}
        />

        {/* Tap backdrop to dismiss */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          className="absolute inset-0"
          accessibilityRole="button"
          accessibilityLabel="Dismiss search bottom sheet"
        />

        {/* Bottom Sheet Container */}
        <Animated.View
          style={[
            {
              transform: [{ translateY }],
              marginBottom: Platform.OS === "android" ? keyboardHeight : 0,
              maxHeight: isKeyboardVisible
                ? screenHeight - keyboardHeight - 30
                : screenHeight * 0.88,
            },
          ]}
          className="w-full justify-end"
        >
          <GoogleMapSearchBox
            key={`searchbox-${sessionKey}`}
            mode="bottomsheet"
            title={title}
            description={description || descriptionText}
            placeholder={placeholder}
            destination={destination}
            destinations={destinations}
            country={country}
            proximity={destinationCoordinates || initialCoordinates}
            initialValue={initialValue}
            onSelect={handleSelectLocation}
            onClose={handleDismiss}
            onManualEntry={onManualEntry ? handleManual : undefined}
            panResponder={dragPanResponder}
            autoFocus={!initialValue}
            maxResultsHeight={isKeyboardVisible ? 240 : screenHeight * 0.42}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default GoogleMapSearchModal;
