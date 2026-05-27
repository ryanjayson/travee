import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Formik } from "formik";
import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import * as Yup from "yup";
import { useKeyboardVisible } from "../../../../../hooks/useKeyboardVisible";

interface ChecklistGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (values: { title: string; description: string }) => Promise<void> | void;
  isSaving?: boolean;
}

const { height: screenHeight } = Dimensions.get("window");

const GroupSchema = Yup.object().shape({
  title: Yup.string().required("Group title is required"),
});

const ChecklistGroupModal = ({
  visible,
  onClose,
  onSave,
  isSaving = false,
}: ChecklistGroupModalProps) => {
  const { colors } = useTheme();
  const { keyboardVisible } = useKeyboardVisible();
  const [modalHeight] = useState(screenHeight * 0.55);

  const handleClose = () => {
    onClose();
  };

  const handleFormSubmit = async (values: { title: string; description: string }, { resetForm }: any) => {
    try {
      await onSave(values);
      resetForm();
    } catch (error) {
      console.error("Save Checklist Group Error:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : keyboardVisible ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-black/50 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Animated.View
            className="rounded-t-[30px] bg-white overflow-hidden"
            style={[
              { height: keyboardVisible ? "100%" : modalHeight },
              {
                paddingTop: keyboardVisible ? 40 : 4
              }
            ]}
          >
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl text-gray-700 font-medium">
                  New Checklist Group
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Close new group modal"
              >
                <Icon name="clear" size={36} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Body */}
            <Formik
              initialValues={{ title: "", description: "" }}
              validationSchema={GroupSchema}
              onSubmit={handleFormSubmit}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <ScrollView
                  className="flex-1 p-5"
                  contentContainerStyle={{ paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text className="text-xs font-semibold tracking-wider uppercase mb-4 text-gray-500">
                    Group Details
                  </Text>

                  <View className="mb-4">
                    <TextInput
                      mode="outlined"
                      label="Group Title"
                      placeholder="e.g. Documents, Clothing, Electronics..."
                      value={values.title}
                      onChangeText={handleChange("title")}
                      onBlur={handleBlur("title")}
                      error={touched.title && Boolean(errors.title)}
                      outlineColor="#E0E0E0"
                      activeOutlineColor={colors.primary}
                      theme={{ colors: { onSurfaceVariant: '#888' } }}
                      outlineStyle={{ borderWidth: 1, borderRadius: 16 }}
                      style={{ height: 60 }}
                      left={<TextInput.Icon icon="folder-outline" />}
                    />
                    {touched.title && errors.title && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">{errors.title}</Text>
                    )}
                  </View>

                  <View className="mb-6">
                    <TextInput
                      mode="outlined"
                      label="Description (Optional)"
                      placeholder="e.g. Items needed before departure"
                      value={values.description}
                      onChangeText={handleChange("description")}
                      onBlur={handleBlur("description")}
                      multiline
                      numberOfLines={3}
                      outlineColor="#E0E0E0"
                      activeOutlineColor={colors.primary}
                      theme={{ colors: { onSurfaceVariant: '#888' } }}
                      outlineStyle={{ borderWidth: 1, borderRadius: 16 }}
                      style={{ minHeight: 90 }}
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleSubmit()}
                    disabled={!values.title.trim() || isSaving}
                    style={{ backgroundColor: colors.primary, opacity: values.title.trim() && !isSaving ? 1 : 0.6 }}
                    className="flex-row items-center justify-center p-4 rounded-[16px] shadow-sm mb-6"
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <View className="flex-row items-center gap-2">
                      <Icon name="check" size={20} color={colors.onPrimary} />
                      <Text className="text-white text-base font-semibold" style={{ color: colors.onPrimary }}>
                        {isSaving ? "Saving..." : "Create Group"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </Formik>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ChecklistGroupModal;
