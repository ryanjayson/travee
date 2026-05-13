import { useEffect, useState } from "react";
import { Keyboard, Dimensions, KeyboardEvent } from "react-native";

export function useKeyboardStatus() {
  const [keyboardVisible, setVisible] = useState(false);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e: KeyboardEvent) => {
      setVisible(true);
      
      const screenWidth = Dimensions.get('window').width;
      // If the keyboard width is less than the screen width (with a margin),
      // it is likely floating (on iPad) or split.
      if (e.endCoordinates && e.endCoordinates.width < screenWidth - 50) {
        setIsFloating(true);
      } else {
        setIsFloating(false);
      }
    });

    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setVisible(false);
      setIsFloating(false);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return { keyboardVisible, isFloating };
}

// Keep the original hook for backward compatibility
export function useKeyboardVisible() {
  const { keyboardVisible, isFloating } = useKeyboardStatus();
  return { keyboardVisible, isFloating };
}
