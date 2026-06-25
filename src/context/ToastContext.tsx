import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Modal,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("success");
  const insets = useSafeAreaInsets();

  const animValue = useRef(new Animated.Value(0)).current; // Fade / Translate Y
  const swipeValue = useRef(new Animated.Value(0)).current; // Drag X

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    Animated.parallel([
      Animated.timing(animValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(swipeValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, [animValue, swipeValue]);

  const showToast = useCallback(
    ({ type, message, duration = 5000 }: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setType(type);
      setMessage(message);
      swipeValue.setValue(0);
      setVisible(true);

      Animated.spring(animValue, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [animValue, swipeValue, hideToast]
  );

  // Setup swipe responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        swipeValue.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          // Swipe off screen
          const exitDirection = gestureState.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
          Animated.timing(swipeValue, {
            toValue: exitDirection,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setVisible(false);
          });
        } else {
          // Snap back
          Animated.spring(swipeValue, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Determine styles depending on type
  const getToastColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "#E8F5E9",
          border: "#4CAF50",
          text: "#1B5E20",
          icon: "check-circle",
        };
      case "error":
        return {
          bg: "#FFEBEE",
          border: "#EF5350",
          text: "#B71C1C",
          icon: "error",
        };
      case "info":
      default:
        return {
          bg: "#E3F2FD",
          border: "#2196F3",
          text: "#0D47A1",
          icon: "info",
        };
    }
  };

  const colors = getToastColors();

  // Animation values interpolation
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Modal
          visible={visible}
          transparent={true}
          animationType="none"
          onRequestClose={hideToast}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={hideToast}
          >
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.toastWrapper,
                {
                  top: insets.top + 10,
                  opacity,
                  transform: [{ translateY }, { translateX: swipeValue }],
                },
              ]}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <View
                style={[
                  styles.toastContainer,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Icon
                  name={colors.icon}
                  size={24}
                  color={colors.border}
                  style={styles.icon}
                />
                <Text style={[styles.message, { color: colors.text }]}>
                  {message}
                </Text>
                <TouchableOpacity
                  onPress={hideToast}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss notification"
                >
                  <Icon name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  toastWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 99999,
  },
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 10,
  },
});
