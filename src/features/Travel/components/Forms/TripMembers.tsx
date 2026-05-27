import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { useKeyboardVisible } from "../../../../hooks/useKeyboardVisible";
import {
  useDeleteTripMemberMutation,
  useSaveTripMemberMutation,
  useTripMembers,
} from "../../hooks/useTripMembers";
import { TripMember } from "../../types/TravelDto";
import { useConfirm } from "../../../../context/ConfirmContext";
import { useToast } from "../../../../context/ToastContext";

interface TripMembersProps {
  travelId: string;
}

const { height: screenHeight } = Dimensions.get("window");

const TripMembers = ({ travelId }: TripMembersProps) => {
  const { colors } = useTheme();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  
  // Queries & Mutations
  const { data: tripMembers = [], isLoading, isError, error } = useTripMembers(travelId);
  const { mutate: saveMember, isPending: isSaving } = useSaveTripMemberMutation();
  const { mutate: deleteMember, isPending: isDeleting } = useDeleteTripMemberMutation(travelId);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const [modalHeight, setModalHeight] = useState(screenHeight * 0.70);
  const { keyboardVisible, isFloating } = useKeyboardVisible();

  const handleCloseModal = () => {
    setName("");
    setDescription("");
    setEmail("");
    setEditingMemberId(null);
    setShowAddForm(false);
  };

  const handleOpenAddModal = () => {
    setName("");
    setDescription("");
    setEmail("");
    setEditingMemberId(null);
    setShowAddForm(true);
  };

  const handleEditMemberPress = (member: TripMember) => {
    setName(member.name);
    setDescription(member.description || "");
    setEmail(member.email || "");
    setEditingMemberId(member.id || null);
    setShowAddForm(true);
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
        id: editingMemberId || undefined,
        travelId,
        name: name.trim(),
        description: description.trim() || undefined,
        email: email.trim() || undefined,
      },
      {
        onSuccess: () => {
          handleCloseModal();
        },
        onError: (err) => {
          console.error("Save Member Error:", err);
        },
      }
    );
  };

  const handleDeleteMember = async (id: string, memberName: string) => {
    const isConfirmed = await confirm({
      title: "Remove Member",
      message: `Are you sure you want to remove ${memberName} from this trip?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      type: "danger",
    });

    if (isConfirmed) {
      deleteMember(id, {
        onError: (err) => {
          console.error("Delete Member Error:", err);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-10 bg-gray-100">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-gray-500 mt-2">Loading trip members...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center py-10 bg-gray-100 px-5">
        <Icon name="error-outline" size={48} color={colors.error} />
        <Text className="text-gray-800 font-bold mt-3 text-lg">Failed to Load Members</Text>
        <Text className="text-red-500 mt-1 text-center">{error?.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ padding: 20 }}>
      {/* Trigger Button to Open Modal */}
      <View className="mb-5">
        <TouchableOpacity
          onPress={handleOpenAddModal}
          style={{ backgroundColor: colors.primary }}
          className="flex-row items-center justify-between p-4 rounded-[16px] shadow-sm"
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open add member modal"
        >
          <View className="flex-row items-center gap-2">
            <Icon 
              name="person-add" 
              size={20} 
              color={colors.onPrimary} 
            />
            <Text 
              className="text-base font-semibold"
              style={{ color: colors.onPrimary }}
            >
              Add New Member
            </Text>
          </View>
          <Icon 
            name="expand-more" 
            size={24} 
            color={colors.onPrimary} 
          />
        </TouchableOpacity>
      </View>

      {/* Add Member Bottom Sheet Modal */}
      <Modal 
        visible={showAddForm} 
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
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
                    {editingMemberId ? "Edit Member" : "Add New Member"}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={handleCloseModal} 
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
                    <Text className="text-white text-base font-semibold">
                      {isSaving ? "Saving..." : editingMemberId ? "Save Changes" : "Add Member"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Members List */}
      <View className="mb-6">
        <Text className="text-xs font-semibold tracking-wider uppercase mb-3 text-gray-500">
          Trip Members List ({tripMembers.length})
        </Text>
        
        {tripMembers.length > 0 ? (
          <View className="bg-white rounded-[24px] border border-gray-200 shadow-sm shadow-black/5 overflow-hidden">
            {tripMembers.map((member, index) => {
              const firstLetter = member.name.trim().charAt(0).toUpperCase();
              const isLast = index === tripMembers.length - 1;

              return (
                <View 
                  key={member.id} 
                  className={`flex-row items-center p-4 justify-between ${!isLast ? 'border-b border-gray-100' : ''}`}
                >
                  <TouchableOpacity 
                    className="flex-row items-center flex-1 pr-4"
                    onPress={() => handleEditMemberPress(member)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit member ${member.name}`}
                  >
                    {/* Circle Avatar */}
                    <View 
                      style={{ backgroundColor: colors.primaryContainer }}
                      className="w-12 h-12 rounded-full justify-center items-center mr-4"
                    >
                      <Text 
                        style={{ color: colors.onPrimaryContainer }}
                        className="text-lg font-bold"
                      >
                        {firstLetter}
                      </Text>
                    </View>

                    {/* Member Details */}
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-800">{member.name}</Text>
                      {member.email && (
                        <Text className="text-xs text-gray-500 mt-0.5">{member.email}</Text>
                      )}
                      {member.description && (
                        <Text className="text-xs text-gray-400 italic mt-0.5" numberOfLines={1}>
                          {member.description}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Remove Button */}
                  <TouchableOpacity
                    onPress={() => member.id && handleDeleteMember(member.id, member.name)}
                    disabled={isDeleting}
                    className="p-2 rounded-full bg-red-50"
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${member.name}`}
                  >
                    <Icon name="delete" size={20} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-white rounded-[24px] border border-dashed border-gray-300 p-8 items-center justify-center">
            <Icon name="people-outline" size={48} color="#9E9E9E" />
            <Text className="text-gray-800 font-semibold text-base mt-3">No Members Added Yet</Text>
            <Text className="text-gray-400 text-xs text-center mt-1 px-4 leading-4">
              Add your travel buddies so you can split expenses and plan together!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default TripMembers;
