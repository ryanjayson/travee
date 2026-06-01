import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";
import { useSaveTripMemberMutation } from "../../../hooks/useTripMembers";
import { TripMember } from "../../../types/TravelDto";
import { useToast } from "../../../../../context/ToastContext";

interface MemberModalProps {
  visible: boolean;
  onClose: () => void;
  editingMember: TripMember | null;
  travelId: string;
}

const { height: screenHeight } = Dimensions.get("window");

const MemberModal = ({
  visible,
  onClose,
  editingMember,
  travelId,
}: MemberModalProps) => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { mutate: saveMember, isPending: isSaving } = useSaveTripMemberMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");

  const [modalHeight] = useState(screenHeight * 0.70);
  const { keyboardVisible } = useKeyboardVisible();

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isAtTop = useRef(true);
  const dragStartDy = useRef(0);

  // Sync state with editingMember prop
  useEffect(() => {
    if (visible) {
      if (editingMember) {
        setName(editingMember.name || "");
        setDescription(editingMember.description || "");
        setEmail(editingMember.email || "");
      } else {
        setName("");
        setDescription("");
        setEmail("");
      }
    }
  }, [visible, editingMember]);

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
        if (keyboardVisible) return false;
        const { dy } = gestureState;
        if (isAtTop.current && dy > 8) {
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
      }
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

  const handleAddMember = () => {
    if (!name.trim()) {
      showToast({ type: "error", message: "Member name is required." });
      return;
    }

    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      showToast({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    saveMember(
      {
        id: editingMember?.id || undefined,
        travelId,
        name: name.trim(),
        description: description.trim() || undefined,
        email: email.trim() || undefined,
      },
      {
        onSuccess: () => {
          handleCancel();
        },
        onError: (err) => {
          console.error("Save Member Error:", err);
        },
      }
    );
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
      onRequestClose={handleCancel}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined}
        style={{ flex: 1 }}
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
              { height: keyboardVisible ? "100%" : modalHeight },
              {
                paddingTop: keyboardVisible ? 40 : 4,
                transform: [{ translateY }],
              }
            ]}
          >
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl text-gray-700 font-medium">
                  {editingMember?.id ? "Edit Member" : "Add Member"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Close add member modal"
              >
                <Icon name="clear" size={36} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Body */}
            <ScrollView
              className="flex-1 p-5"
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                const y = e.nativeEvent.contentOffset.y;
                isAtTop.current = y <= 0;
              }}
              scrollEventThrottle={16}
            >
              <Text className="text-xs font-semibold tracking-wider uppercase mb-4 text-gray-500">
                New Member Details
              </Text>

              <View className="mb-4">
                <TextInput
                  mode="outlined"
                  label="Full Name"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChangeText={setName}
                  outlineColor="#E0E0E0"
                  activeOutlineColor={colors.primary}
                  theme={{ colors: { onSurfaceVariant: '#888' } }}
                  outlineStyle={{ borderWidth: 1, borderRadius: 16 }}
                  style={{ height: 60 }}
                />
              </View>

              <View className="mb-4">
                <TextInput
                  mode="outlined"
                  label="Email Address (Optional)"
                  placeholder="e.g. john@example.com"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  outlineColor="#E0E0E0"
                  activeOutlineColor={colors.primary}
                  theme={{ colors: { onSurfaceVariant: '#888' } }}
                  outlineStyle={{ borderWidth: 1, borderRadius: 16 }}
                  style={{ height: 60 }}
                />
              </View>

              <View className="mb-6">
                <TextInput
                  mode="outlined"
                  label="Description (Optional)"
                  placeholder="e.g. Co-pilot, Photographer"
                  value={description}
                  onChangeText={setDescription}
                  outlineColor="#E0E0E0"
                  activeOutlineColor={colors.primary}
                  theme={{ colors: { onSurfaceVariant: '#888' } }}
                  outlineStyle={{ borderWidth: 1, borderRadius: 16 }}
                  style={{ height: 60 }}
                />
              </View>

              <TouchableOpacity
                onPress={handleAddMember}
                disabled={!name.trim() || isSaving}
                style={{ backgroundColor: colors.primary, opacity: name.trim() && !isSaving ? 1 : 0.6 }}
                className="flex-row items-center justify-center p-4 rounded-[16px] shadow-sm mb-6"
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <View className="flex-row items-center gap-2">
                  <Icon name="check" size={20} color={colors.onPrimary} />
                  <Text style={{ color: colors.onPrimary }} className="text-base font-semibold">
                    {isSaving ? "Saving..." : editingMember?.id ? "Save Changes" : "Add Member"}
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default MemberModal;
