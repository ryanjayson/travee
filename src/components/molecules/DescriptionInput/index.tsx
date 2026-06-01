import React from "react";
import {
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";
import { useTravelContext } from "../../../context/TravelContext";


interface DescriptionInputProps {
  /** Current value displayed in the trigger */
  value: string;
  /** Called when user confirms text in the modal */
  onChange: (text: string) => void;
  /** Label above the trigger field (default "Description") */
  label?: string;
  /** Placeholder text in both the trigger and modal input */
  placeholder?: string;
  /** Text of the confirm button inside the modal (default "Add") */
  confirmLabel?: string;
  /** Optional max character count */
  maxLength?: number;
  /** Forwarded disabled state */
  disabled?: boolean;
}

/**
 * DescriptionInput
 *
 * A tappable trigger that opens a full-screen modal for entering
 * multi-line description / notes text. Mirrors the destination-field
 * interaction pattern used in TripDetail.
 */
const DescriptionInput = ({
  value,
  onChange,
  label = "Description",
  placeholder = "Describe your next trip...",
  confirmLabel = "Add",
  maxLength,
  disabled = false,
}: DescriptionInputProps) => {
  const { openDescriptionModal } = useTravelContext();

  return (
    <View>
      {/* Tappable trigger — looks like a regular TextInput but opens the modal */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          !disabled &&
          openDescriptionModal(value, onChange, {
            label,
            placeholder,
            confirmLabel,
            maxLength,
          })
        }
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label} input, tap to edit`}
      >
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            placeholder={placeholder}
            value={value}
            editable={false}
            multiline
            numberOfLines={4}
            outlineColor="#E0E0E0"
            activeOutlineColor="#263F69"
            theme={{ colors: { onSurfaceVariant: "#888" } }}
            outlineStyle={{
              borderWidth: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
            }}
            style={{ marginTop: 6, height: 100, fontSize: 14 }}
            textAlignVertical="top"
            contentStyle={{ backgroundColor: "transparent" }}
            right={
              <TextInput.Icon
                icon="pencil-outline"
                color="#BDBDBD"
                style={{ marginTop: 10 }}
              />
            }
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default DescriptionInput;
