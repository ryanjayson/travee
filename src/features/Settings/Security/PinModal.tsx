import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  BackHandler,
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";

export interface PinModalProps {
  visible: boolean;
  title: string;
  description: string;
  pinLength: number;
  error?: string;
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onClose: () => void;
}

const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

export const PinModal: React.FC<PinModalProps> = ({
  visible,
  title,
  description,
  pinLength,
  error,
  onDigitPress,
  onBackspace,
  onClose,
}) => {
  const { colors } = useTheme();

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            width: "100%",
            maxWidth: 360,
            padding: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              marginBottom: 24,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}
            >
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel PIN entry"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {description}
          </Text>

          {/* PIN Indicators */}
          <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pinLength > index;
              return (
                <View
                  key={index}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: colors.primary,
                    backgroundColor: isFilled ? colors.primary : "transparent",
                  }}
                />
              );
            })}
          </View>

          {/* Error Message */}
          {error ? (
            <Text
              style={{
                color: "#EF4444",
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          ) : null}

          {/* Keypad */}
          <View style={{ width: "100%", gap: 12 }}>
            {KEYPAD_ROWS.map((row, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 16,
                }}
              >
                {row.map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => onDigitPress(num)}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Digit ${num}`}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "bold",
                        color: "#1F2937",
                      }}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Bottom Keypad Row: Empty, 0, Backspace */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <View style={{ width: 64, height: 64 }} />
              <TouchableOpacity
                onPress={() => onDigitPress("0")}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel="Digit 0"
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: "#1F2937",
                  }}
                >
                  0
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onBackspace}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel="Backspace"
                activeOpacity={0.7}
              >
                <Ionicons name="backspace-outline" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default PinModal;
