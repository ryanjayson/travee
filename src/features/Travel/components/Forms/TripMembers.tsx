import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { Friend } from "../../../../data/sampleFriends";

interface TripMembersProps {
  tripMembers: Friend[];
  onAddMember: () => void;
}

const TripMembers = ({
  tripMembers,
  onAddMember,
}: TripMembersProps) => {
  return (
    <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <Text className="text-lg font-bold text-[#183B7A] mb-3">Trip Members</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/10 elevation-3 items-center">
          {tripMembers.length > 0 ? (
            <>
              {tripMembers.map((member) => (
                <View key={member.id} className="flex-row items-center py-3 px-4 border-b border-[#F0F0F0] w-full">
                  <View className="w-10 h-10 rounded-full bg-[#183B7A] justify-center items-center mr-3">
                    <Text className="text-white text-lg font-bold">
                      {member.name.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-[#183B7A]">{member.name}</Text>
                    <Text className="text-sm text-[#666]">{member.email}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity className="bg-[#183B7A] rounded-lg px-5 py-2.5 mt-4" onPress={onAddMember}>
                <Text className="text-white text-sm font-bold">Add More Members</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View className="items-center py-5 w-full">
              <Text className="text-[#888] italic text-center mb-4">No members added yet.</Text>
              <TouchableOpacity className="bg-[#183B7A] rounded-lg px-5 py-2.5" onPress={onAddMember}>
                <Text className="text-white text-sm font-bold">Add Member</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default TripMembers;
