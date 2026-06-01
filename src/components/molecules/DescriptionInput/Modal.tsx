import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");

interface DescriptionModalProps {
  visible: boolean;
  onClose: () => void;
  /** Current value of the text */
  value: string;
  /** Called with the confirmed text when the user taps Add / Save */
  onConfirm: (text: string) => void;
  /** Label shown centred in the header. Defaults to "Description". */
  label?: string;
  /** Placeholder for the multiline input. */
  placeholder?: string;
  /** Text for the confirm button. Defaults to "Add". */
  confirmLabel?: string;
  /** Max character count (optional). */
  maxLength?: number;
}

const DescriptionModal = ({
  visible,
  onClose,
  value,
  onConfirm,
  label = "Description",
  placeholder = "Write something here...",
  confirmLabel = "Add",
  maxLength,
}: DescriptionModalProps) => {
  const [draft, setDraft] = useState(value);
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const inputRef = useRef<TextInput>(null);

  // Sync draft when modal opens / value changes externally
  useEffect(() => {
    if (visible) {
      setDraft(value);
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start(() => {
        // Auto-focus after animation completes
        setTimeout(() => inputRef.current?.focus(), 50);
      });
    }
  }, [visible]);

  const slideDown = (callback?: () => void) => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      callback?.();
    });
  };

  const handleClose = () => slideDown(onClose);

  const handleConfirm = () => {
    slideDown(() => {
      onConfirm(draft.trim());
      onClose();
    });
  };

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Animated.View
          className="flex-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity }}
        >
          <Animated.View
            className="flex-1 bg-white"
            style={{
              paddingTop: 44,
              transform: [{ translateY }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 24,
            }}
          >
            {/* ── Header ── */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              {/* Back / close */}
              <TouchableOpacity
                onPress={handleClose}
                className="p-1.5"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Icon name="arrow-back" size={24} color="#263F69" />
              </TouchableOpacity>

              {/* Centred label */}
              <Text className="absolute left-0 right-0 text-center text-base font-semibold text-gray-800">
                {label}
              </Text>

              {/* Confirm / Add */}
              <TouchableOpacity
                onPress={handleConfirm}
                className="px-4 py-1.5 rounded-full bg-[#263F69]"
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
                activeOpacity={0.75}
              >
                <Text className="text-white text-sm font-semibold">{confirmLabel}</Text>
              </TouchableOpacity>
            </View>

            {/* ── Text input area ── */}
            <View className="flex-1 px-5 pt-4">
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={setDraft}
                placeholder={placeholder}
                placeholderTextColor="#BDBDBD"
                multiline
                textAlignVertical="top"
                maxLength={maxLength}
                style={{
                  flex: 1,
                  fontSize: 16,
                  lineHeight: 24,
                  color: "#1a1a1a",
                  fontFamily: Platform.OS === "ios" ? "System" : undefined,
                  paddingTop: 0,
                  paddingBottom: 24,
                }}
              />
              {maxLength !== undefined && (
                <Text className="text-xs text-gray-400 text-right mb-3">
                  {draft.length}/{maxLength}
                </Text>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default DescriptionModal;
