import { MaterialIcons as Icon } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Formik } from "formik";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { TextInput } from "react-native-paper";
import * as Yup from "yup";
import TouchButton from "../../../../../components/atoms/TouchButton";
import { useTravelContext } from "../../../../../context/TravelContext";
import { useAuth } from "../../../../Auth/hooks/AuthContext";
import { useDeleteNoteMutation, useSaveNoteMutation } from "../../../hooks/useNote";
import { ItineraryActivity, ItineraryNote } from "../../../types/TravelDto";
import { useConfirm } from "../../../../../context/ConfirmContext";
import { useToast } from "../../../../../context/ToastContext";

interface EditNoteProps {
  itineraryNote: ItineraryNote | null;
  activities?: ItineraryActivity[];
  onClose: () => void;
}

const NoteSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
});

export interface NoteFormValues {
  id?: string;
  travelId: string;
  activityId?: string;
  title: string;
  content: string;
  images: string[];
  userId: string;
}

const EditNote = ({ itineraryNote, activities, onClose }: EditNoteProps) => {
  const { selectedTravelPlan } = useTravelContext();
  const { userToken } = useAuth();
  const saveMutation = useSaveNoteMutation();
  const deleteMutation = useDeleteNoteMutation();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const handleSaveNote = async (values: NoteFormValues) => {
    const payload: ItineraryNote = {
      id: values.id,
      travelId: values.travelId,
      activityId: values.activityId,
      title: values.title,
      content: values.content,
      images: values.images,
      userId: values.userId,
      isOffline: true,
    };
    await saveMutation.mutateAsync(payload);
    onClose();
  };

  const handleDelete = async (id: string, travelId: string) => {
    const isConfirmed = await confirm({
      title: "Delete Note",
      message: "Are you sure you want to delete this note?",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (isConfirmed) {
      await deleteMutation.mutateAsync({ noteId: id, travelId, activityId: itineraryNote?.activityId || undefined });
      onClose();
    }
  };

  const pickImage = async (setFieldValue: (field: string, value: any) => void, currentImages: string[]) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast({ type: "error", message: "Camera roll permission is needed to upload images." });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setFieldValue("images", [...currentImages, ...newUris]);
    }
  };

  return (
    <Formik<NoteFormValues>
      initialValues={{
        id: itineraryNote?.id,
        travelId: itineraryNote?.travelId || selectedTravelPlan?.id || "",
        activityId: itineraryNote?.activityId,
        title: itineraryNote?.title || "",
        content: itineraryNote?.content || "",
        images: itineraryNote?.images || [],
        userId: itineraryNote?.userId || userToken || "current-user",
      }}
      validationSchema={NoteSchema}
      onSubmit={handleSaveNote}
    >
      {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
        <View className="flex-1 bg-white rounded-t-[20px] overflow-hidden">
          <StatusBar barStyle="dark-content" />
          <ScrollView
            className="flex-1 p-[15px] bg-gray-100"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Linked Activity */}
            <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Linked Activity (Optional)</Text>
              <TouchableOpacity
                onPress={() => setShowActivityModal(true)}
                className="mt-2 border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-4 flex-row items-center gap-3 h-7xl"
                accessibilityRole="button"
              >
                <Icon name="event-note" size={24} color={values.activityId ? "#263F69" : "#BDBDBD"} />
                <Text className={`text-base flex-1 ${values.activityId ? "text-gray-800" : "text-gray-400"}`} numberOfLines={1}>
                  {values.activityId
                    ? activities?.find((a) => a.id === values.activityId)?.title || "Activity"
                    : "No Activity Selected"}
                </Text>
                {values.activityId && (
                  <TouchableOpacity accessibilityRole="button" onPress={() => setFieldValue("activityId", undefined)}>
                    <Icon name="close" size={20} color="#666" />
                  </TouchableOpacity>
                )}
                <Icon name="keyboard-arrow-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Title</Text>
              <TextInput
                mode="outlined"
                className="h-7xl!"
                placeholder="e.g. Food Trip in Osaka..."
                value={values.title}
                onChangeText={handleChange("title")}
                onBlur={handleBlur("title")}
                error={touched.title && Boolean(errors.title)}
                outlineColor="#E0E0E0"
                activeOutlineColor="#263F69"
                theme={{ colors: { onSurfaceVariant: '#888' } }}
                outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                style={{ marginTop: 6 }}
                contentStyle={{ backgroundColor: "transparent" }}
              />
              {touched.title && errors.title && (
                <Text className="text-red-500 text-xs mt-1 ml-1">{errors.title}</Text>
              )}
            </View>

            {/* Content */}
            <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Content</Text>
              <TextInput
                mode="outlined"
                placeholder="Write your note here..."
                multiline
                numberOfLines={4}
                value={values.content}
                onChangeText={handleChange("content")}
                onBlur={handleBlur("content")}
                outlineColor="#E0E0E0"
                activeOutlineColor="#263F69"
                theme={{ colors: { onSurfaceVariant: '#888' } }}
                outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                style={{ marginTop: 6, height: 120 }}
                textAlignVertical="top"
                contentStyle={{ backgroundColor: "transparent" }}
              />
            </View>

            {/* Image Upload */}
            <View className="mb-5">
              <Text className="text-xs font-medium tracking-wider uppercase mb-2">Images</Text>
              <TouchableOpacity
                onPress={() => pickImage(setFieldValue, values.images)}
                className="border border-dashed border-[#263F69] h-[150px] rounded-[16px] bg-white px-4 py-5 flex-row items-center justify-center gap-3"
                accessibilityRole="button"
                accessibilityLabel="Upload images"
              >
                <Icon name="add-photo-alternate" size={28} color="#263F69" />
                <Text className="text-base text-[#263F69] font-medium">Add Photos</Text>
              </TouchableOpacity>

              {values.images.length > 0 && (
                <FlatList
                  data={values.images}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, idx) => `${item}-${idx}`}
                  contentContainerStyle={{ gap: 10, marginTop: 12 }}
                  renderItem={({ item, index }) => (
                    <View className="relative">
                      <Image
                        source={{ uri: item }}
                        style={{ width: 100, height: 100, borderRadius: 12 }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
                        accessibilityRole="button"
                        accessibilityLabel="Remove image"
                        onPress={() => {
                          const updated = values.images.filter((_, i) => i !== index);
                          setFieldValue("images", updated);
                        }}
                      >
                        <Icon name="close" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}
            </View>

            {/* Delete */}
            {itineraryNote?.id && (
              <View className="mt-2 pt-5 border-t border-[#E0E0E0]">
                <TouchableOpacity
                  className="flex-row items-center gap-2.5 justify-center py-2"
                  accessibilityRole="button"
                  onPress={() => handleDelete(itineraryNote.id!, itineraryNote.travelId || "")}
                >
                  <Icon name="delete-outline" size={24} color="#c93030" />
                  <Text className="text-base font-medium text-[#c93030]">Delete Note</Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="mb-5"></View>
            
          </ScrollView>

          <View className="mb-8 mx-4 bg-transparent">
            <TouchButton
              buttonText={itineraryNote?.id ? "Update Note" : "Add Note"}
              onPress={() => handleSubmit()}
              className="h-7xl p-6"
            />
          </View>
                

          {/* Activity Selection Modal */}
          <Modal
            visible={showActivityModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowActivityModal(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50 p-5">
              <View className="bg-white rounded-[30px] shadow-lg w-full max-h-[80%] overflow-hidden">
                <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                  <Text className="text-lg font-bold text-[#263F69]">Select Activity</Text>
                  <TouchableOpacity accessibilityRole="button" onPress={() => setShowActivityModal(false)}>
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  <TouchableOpacity
                    className="p-4 border-b border-gray-100 flex-row items-center gap-4"
                    accessibilityRole="button"
                    onPress={() => { setFieldValue("activityId", undefined); setShowActivityModal(false); }}
                  >
                    <Icon name="event-busy" size={24} color="#666" />
                    <Text className="text-base text-gray-800">None</Text>
                    {!values.activityId && (
                      <Icon name="check" size={24} color="#263F69" style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                  {activities?.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      className="p-4 border-b border-gray-100 flex-row items-center gap-4"
                      accessibilityRole="button"
                      onPress={() => { setFieldValue("activityId", activity.id); setShowActivityModal(false); }}
                    >
                      <Icon name="event-note" size={24} color="#183B7A" />
                      <View className="flex-1">
                        <Text className="text-base text-gray-800 font-medium">{activity.title}</Text>
                        {activity.startDate && (
                          <Text className="text-xs text-gray-500">
                            {new Date(activity.startDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      {values.activityId === activity.id && (
                        <Icon name="check" size={24} color="#263F69" style={{ marginLeft: "auto" }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </Formik>
  );
};

export default EditNote;
