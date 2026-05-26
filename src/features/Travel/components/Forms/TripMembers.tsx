import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import {
  useDeleteTripMemberMutation,
  useSaveTripMemberMutation,
  useTripMembers,
} from "../../hooks/useTripMembers";

interface TripMembersProps {
  travelId: string;
}

const TripMembers = ({ travelId }: TripMembersProps) => {
  const { colors } = useTheme();
  
  // Queries & Mutations
  const { data: tripMembers = [], isLoading, isError, error } = useTripMembers(travelId);
  const { mutate: saveMember, isPending: isSaving } = useSaveTripMemberMutation();
  const { mutate: deleteMember, isPending: isDeleting } = useDeleteTripMemberMutation(travelId);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddMember = () => {
    if (!name.trim()) {
      Alert.alert("Required Field", "Member name is required.");
      return;
    }

    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    saveMember(
      {
        travelId,
        name: name.trim(),
        description: description.trim() || undefined,
        email: email.trim() || undefined,
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setEmail("");
          setShowAddForm(false);
        },
        onError: (err) => {
          Alert.alert("Error", "Failed to add member. Please try again.");
          console.error("Save Member Error:", err);
        },
      }
    );
  };

  const handleDeleteMember = (id: string, memberName: string) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberName} from this trip?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            deleteMember(id, {
              onError: (err) => {
                Alert.alert("Error", "Failed to remove member. Please try again.");
                console.error("Delete Member Error:", err);
              },
            });
          },
        },
      ]
    );
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
      {/* Add New Member Section Toggle */}
      <View className="mb-5">
        <TouchableOpacity
          onPress={() => setShowAddForm(!showAddForm)}
          style={{ backgroundColor: showAddForm ? colors.surface : colors.primary }}
          className={`flex-row items-center justify-between p-4 rounded-[16px] border ${showAddForm ? 'border-gray-200' : 'border-transparent'} shadow-sm`}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Toggle add member form"
        >
          <View className="flex-row items-center gap-2">
            <Icon 
              name={showAddForm ? "close" : "person-add"} 
              size={20} 
              color={showAddForm ? colors.primary : colors.onPrimary} 
            />
            <Text 
              className="text-base font-semibold"
              style={{ color: showAddForm ? colors.primary : colors.onPrimary }}
            >
              {showAddForm ? "Cancel Add Member" : "Add New Member"}
            </Text>
          </View>
          <Icon 
            name={showAddForm ? "expand-less" : "expand-more"} 
            size={24} 
            color={showAddForm ? colors.primary : colors.onPrimary} 
          />
        </TouchableOpacity>
      </View>

      {/* Add Member Form Card */}
      {showAddForm && (
        <View className="bg-white rounded-[24px] p-5 mb-6 border border-gray-200 shadow-sm shadow-black/5">
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
            className="flex-row items-center justify-center p-4 rounded-[16px] shadow-sm"
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View className="flex-row items-center gap-2">
              <Icon name="check" size={20} color={colors.onPrimary} />
              <Text className="text-white text-base font-semibold">
                {isSaving ? "Saving..." : "Add Member"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

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
                  <View className="flex-row items-center flex-1 pr-4">
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
                  </View>

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
