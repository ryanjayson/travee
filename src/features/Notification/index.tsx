import React, { useEffect, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, StatusBar, PanResponder } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { AppNotificationData } from "../../services/local/notificationService";

const { width } = Dimensions.get("window");

interface NotificationItemProps {
  notif: AppNotificationData;
  onPress: (notif: AppNotificationData) => void;
  onDelete: (id: string) => void;
}

const NotificationItem = ({ notif, onPress, onDelete }: NotificationItemProps) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteBtnWidth = 80;
  const isSwipeOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const base = isSwipeOpen.current ? -deleteBtnWidth : 0;
        let newValue = base + gestureState.dx;
        
        if (newValue < -deleteBtnWidth) {
          const excess = newValue + deleteBtnWidth;
          newValue = -deleteBtnWidth + excess * 0.3;
        } else if (newValue > 0) {
          newValue = newValue * 0.3;
        }
        
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const base = isSwipeOpen.current ? -deleteBtnWidth : 0;
        const finalValue = base + gestureState.dx;
        
        if (finalValue < -deleteBtnWidth / 2) {
          Animated.spring(translateX, {
            toValue: -deleteBtnWidth,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
          isSwipeOpen.current = true;
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
          isSwipeOpen.current = false;
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: isSwipeOpen.current ? -deleteBtnWidth : 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      isSwipeOpen.current = false;
      if (notif.id) {
        onDelete(notif.id);
      }
    });
  };

  return (
    <View style={{ position: "relative", overflow: "hidden", backgroundColor: colors.error || "#EF4444" }}>
      {/* Background delete button layer */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: deleteBtnWidth,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={handleDelete}
          style={{
            flex: 1,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel={`Delete notification ${notif.title}`}
        >
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600", marginTop: 4 }}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground swipable content */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX }],
          backgroundColor: "#FFFFFF",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (isSwipeOpen.current) {
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
              isSwipeOpen.current = false;
            } else {
              onPress(notif);
            }
          }}
          activeOpacity={0.9}
          className={`flex-row p-4 border-b border-gray-100 items-start ${notif.isRead ? "bg-white" : "bg-blue-50/40"}`}
          accessibilityRole="button"
        >
          <View className="p-2 rounded-full bg-blue-50 mr-3">
            <Ionicons name="notifications" size={18} color="#263F69" />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-start mb-0.5">
              <Text className={`text-lg ${notif.isRead ? "text-[#374151]" : "text-primary font-bold"}`} numberOfLines={1}>
                {notif.title}
              </Text>
              <Text className="text-sm text-tertiary font-semibold" style={{ flexShrink: 0 }}>
                {notif.createdAt
                  ? `${new Date(notif.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}, ${new Date(notif.createdAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`
                  : ""}
              </Text>
            </View>
            <Text className="text-base leading-6 text-tertiary/80" numberOfLines={2}>
              {notif.body}
            </Text>
          </View>
          {!notif.isRead && (
            <View className="w-2 h-2 rounded-full bg-accent ml-2 self-center" />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  unreadNotifications: number;
  notificationsList: AppNotificationData[];
  onMarkAllAsRead: () => void;
  onNotificationPress: (notif: AppNotificationData) => void;
  onDeleteNotification: (id: string) => void;
}

export const Notifications = ({
  visible,
  onClose,
  unreadNotifications,
  notificationsList,
  onMarkAllAsRead,
  onNotificationPress,
  onDeleteNotification,
}: NotificationsModalProps) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Semi-transparent backdrop click to close */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
        />
        
        {/* Animated Container - Full Height, slides from right to left */}
        <Animated.View
          style={{
            width: width,
            height: "100%",
            backgroundColor: "#FFFFFF",
            transform: [{ translateX: slideAnim }],
            shadowColor: "#000",
            shadowOffset: { width: -2, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 5,
            paddingTop: insets.top + 20,
          }}
        >
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-lg font-bold text-[#111827]">Notifications</Text>
                {unreadNotifications > 0 && (
                  <View className="bg-accent px-2 py-0.5 rounded-full">
                    <Text className="text-white text-[10px] font-semibold">{unreadNotifications} new</Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close notifications modal"
                className="p-1 rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Actions (Mark all read) */}
            {unreadNotifications > 0 && (
              <View className="px-5 py-1.5 bg-gray-50 flex-row justify-end border-b border-gray-100">
                <TouchableOpacity 
                  onPress={onMarkAllAsRead}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all as read"
                >
                  <Text className="text-base font-semibold text-primary">Mark all as read</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Scrollable Content */}
            <ScrollView 
              className="flex-1 bg-gray-50"
              contentContainerStyle={notificationsList.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : { paddingBottom: 60 }}
            >
              {notificationsList.length === 0 ? (
                <View className="flex-1 items-center justify-center py-20 px-5">
                  <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
                    <Ionicons name="notifications-off-outline" size={28} color="#9CA3AF" />
                  </View>
                  <Text className="text-lg font-semibold text-[#111827] mb-1">No notifications yet</Text>
                  <Text className="text-base text-[#6B7280] text-center">
                    We'll notify you when your trips are about to start or have important updates.
                  </Text>
                </View>
              ) : (
                notificationsList.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onPress={onNotificationPress}
                    onDelete={onDeleteNotification}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
