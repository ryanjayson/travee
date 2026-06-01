import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
import {
  useDeleteTripMemberMutation,
  useTripMembers,
} from "../../hooks/useTripMembers";
import { TripMember } from "../../types/TravelDto";
import { useConfirm } from "../../../../context/ConfirmContext";
import { useToast } from "../../../../context/ToastContext";
import { useTravelContext } from "../../../../context/TravelContext";

interface TripMembersProps {
  travelId: string;
}

const TripMembers = ({ travelId }: TripMembersProps) => {
  const { colors } = useTheme();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { openMemberModal } = useTravelContext();
  
  // Queries & Mutations
  const { data: tripMembers = [], isLoading, isError, error } = useTripMembers(travelId);
  const { mutate: deleteMember, isPending: isDeleting } = useDeleteTripMemberMutation(travelId);



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

      <Text className="text-xl font-semibold ">Trip Members</Text>
       <Text className="text-base font-normal text-gray-400 mb-5">
        Manage your travel companions. See who’s joining your trip to share memories, split costs, and more.
      </Text>
      {/* Trigger Button to Open Modal */}
      <View className="mb-6">
        <TouchableOpacity
          onPress={() => openMemberModal(null, travelId)}
          style={{ backgroundColor: colors.primary }}
          className="flex-row items-center justify-center p-4 rounded-[16px] shadow-sm"
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open add member modal"
        >
          <View className="flex-row items-center text-center gap-2">
            <Icon 
              name="person-add" 
              size={20} 
              color={colors.onPrimary} 
            />
            <Text 
              className="text-base font-semibold"
              style={{ color: colors.onPrimary }}
            >
              Add Member
            </Text>
          </View>
        </TouchableOpacity>
      </View>

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
                    onPress={() => openMemberModal(member, travelId)}
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
