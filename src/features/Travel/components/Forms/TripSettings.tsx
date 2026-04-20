import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";

const TripSettings = () => {
  return (
    <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <Text className="text-lg font-bold text-[#183B7A] mb-3">Trip Settings</Text>
        <View className="bg-white rounded-xl shadow-sm shadow-black/10 elevation-3">
          <TouchableOpacity className="flex-row justify-between items-center py-4 px-4 border-b border-[#F0F0F0]">
            <Text className="text-base text-[#183B7A]">Edit Trip</Text>
            <Text className="text-lg text-[#999]">›</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-4 px-4 border-b border-[#F0F0F0]">
            <Text className="text-base text-[#183B7A]">Share Trip</Text>
            <Text className="text-lg text-[#999]">›</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-4 px-4 border-b border-[#F0F0F0]">
            <Text className="text-base text-[#183B7A]">Export Itinerary</Text>
            <Text className="text-lg text-[#999]">›</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-4 px-4 border-t border-[#F0F0F0]">
            <Text className="text-base text-[#FF3B30]">
              Delete Trip
            </Text>
            <Text className="text-lg text-[#999]">›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default TripSettings;
