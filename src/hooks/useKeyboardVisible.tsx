import { useEffect, useState } from "react";
import { Keyboard, Dimensions, KeyboardEvent, Platform } from "react-native";

export function useKeyboardStatus() {
  const [keyboardVisible, setVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setVisible(true);
      setKeyboardHeight(e.endCoordinates ? e.endCoordinates.height : 0);

      const screenWidth = Dimensions.get("window").width;
      // If the keyboard width is less than the screen width (with a margin),
      // it is likely floating (on iPad) or split.
      if (e.endCoordinates && e.endCoordinates.width < screenWidth - 50) {
        setIsFloating(true);
      } else {
        setIsFloating(false);
      }
    });

    const hide = Keyboard.addListener(hideEvent, () => {
      setVisible(false);
      setKeyboardHeight(0);
      setIsFloating(false);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return { keyboardVisible, keyboardHeight, isFloating };
}

// Keep the original hook for backward compatibility
export function useKeyboardVisible() {
  const { keyboardVisible, keyboardHeight, isFloating } = useKeyboardStatus();
  return { keyboardVisible, keyboardHeight, isFloating };
}
