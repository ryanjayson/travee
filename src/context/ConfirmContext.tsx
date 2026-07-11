import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";

type ConfirmType = "default" | "danger" | "warning";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [confirmText, setConfirmText] = useState("Confirm");
  const [cancelText, setCancelText] = useState("Cancel");
  const [type, setType] = useState<ConfirmType>("default");

  // Keep a reference to the promise resolver
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null
  );

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setTitle(options.title);
    setMessage(options.message);
    setConfirmText(options.confirmText || "Confirm");
    setCancelText(options.cancelText || "Cancel");
    setType(options.type || "default");
    setVisible(true);

    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleCancel = () => {
    setVisible(false);
    if (resolver) resolver(false);
  };

  const handleConfirm = () => {
    setVisible(false);
    if (resolver) resolver(true);
  };

  // Resolve dialog layout and accents depending on type
  const getDialogConfig = () => {
    switch (type) {
      case "danger":
        return {
          icon: "delete-forever",
          color: "#D32F2F", // red
          bgLight: "#FFEBEE",
        };
      case "warning":
        return {
          icon: "warning",
          color: "#ED6C02", // orange
          bgLight: "#FFF3E0",
        };
      case "default":
      default:
        return {
          icon: "help-outline",
          color: "#183B7A", // secondary/primary blue 263F69
          bgLight: "#E8EAF6",
        };
    }
  };

  const config = getDialogConfig();

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.overlay}>
          <View style={[styles.dialogCard, { backgroundColor: colors.surface }]}>
            {/* Header Icon Section */}
            <View style={[styles.iconContainer, { backgroundColor: config.bgLight }]}>
              <Icon name={config.icon as any} size={36} color={config.color} />
            </View>

            {/* Title & Message */}
            <Text style={[styles.title, { color: colors.onSurface }]}>
              {title}
            </Text>
            <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
              {message}
            </Text>

            {/* Flat Action Buttons */}
            <View style={styles.buttonRow}>
              {/* Cancel Button - Flat outline/text style */}
              <TouchableOpacity
                onPress={handleCancel}
                style={[
                  styles.btnFlat,
                  {
                    borderColor: colors.outline,
                    backgroundColor: "#E8EAF6",
                  },
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${cancelText} action`}
              >
                <View style={styles.btnContent}>
                  <Icon
                    name="close"
                    size={18}
                    color={colors.onSurfaceVariant}
                    style={styles.btnIcon}
                  />
                  <Text style={[styles.btnText, { color: colors.onSurfaceVariant }]}>
                    {cancelText}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Confirm Button - Flat filled with icon */}
              <TouchableOpacity
                onPress={handleConfirm}
                style={[
                  styles.btnFlat,
                  {
                    backgroundColor: config.color,
                    borderColor: config.color,
                  },
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${confirmText} action`}
              >
                <View style={styles.btnContent}>
                  <Icon
                    name="check"
                    size={18}
                    color="#FFFFFF"
                    style={styles.btnIcon}
                  />
                  <Text style={[styles.btnText, { color: "#FFFFFF" }]}>
                    {confirmText}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btnFlat: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnIcon: {
    marginRight: 6,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
