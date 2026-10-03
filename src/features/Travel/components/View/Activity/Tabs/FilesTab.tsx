import React, { useState } from "react";
import {
  View,
  Animated,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  AlertButton,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme, Button } from "react-native-paper";
import WebView from "react-native-webview";
import * as Sharing from "expo-sharing";
import { Paths, File } from "expo-file-system";
import Tabs from "../../../../../../components/Tabs";
import { ItineraryActivity, Attachment, Images } from "../../../../types/TravelDto";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useUpdateActivityMutation } from "../../../../hooks/useActivity";
import { useConfirm } from "../../../../../../context/ConfirmContext";
import {
  formatFileSize,
  getFileIcon,
  isLocalUrl,
  isPdf,
} from "./fileTabUtils";
import { logger } from "../../../../../../services/errorLogger";

interface FilesTabProps {
  itineraryActivity?: ItineraryActivity;
  onImageViewerToggle?: (isOpen: boolean) => void;
}

const { width: screenWidth } = Dimensions.get("window");
const IMAGE_SIZE = (screenWidth - 48) / 3; // 3 columns with padding

const FilesTab = ({
  itineraryActivity,
  onImageViewerToggle,
}: FilesTabProps) => {
  const { colors } = useTheme();
  const { confirm } = useConfirm();
  const updateMutation = useUpdateActivityMutation();
  const images: Images[] = itineraryActivity?.images || [];
  const attachments: Attachment[] = itineraryActivity?.attachments || [];
  const [viewerActiveIndex, setViewerActiveIndex] = useState<number | null>(null);

  // Document/Attachment web viewer states
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleAddImage = async (mediaType: "camera" | "gallery") => {
    try {
      let result;
      if (mediaType === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "Camera permission is needed to take photos."
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "Gallery permission is needed to upload images."
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages: Images[] = result.assets.map((asset) => ({
          url: asset.uri,
          title: asset.fileName || "Uploaded Image",
        }));

        const updatedImages = [...images, ...newImages];
        if (itineraryActivity) {
          updateMutation.mutate({
            ...itineraryActivity,
            images: updatedImages,
          });
        }
      }
    } catch (error) {
      logger.service(error, { screen: "FilesTab", action: "addImage" });
      Alert.alert("Error", "Failed to select image.");
    }
  };

  const handleAddImagePress = () => {
    Alert.alert("Add Image", "Choose an option", [
      { text: "Take Photo", onPress: () => handleAddImage("camera") },
      { text: "Choose from Gallery", onPress: () => handleAddImage("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleDeleteImage = async (indexToDelete: number) => {
    const isConfirmed = await confirm({
      title: "Delete Image",
      message: "Are you sure you want to delete this image?",
      confirmText: "Delete",
      type: "danger",
    });

    if (!isConfirmed) return;

    const updatedImages = images.filter((_, idx) => idx !== indexToDelete);
    if (itineraryActivity) {
      updateMutation.mutate({
        ...itineraryActivity,
        images: updatedImages,
      });
    }
  };

  const handleAddAttachmentPress = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAttachments: Attachment[] = result.assets.map((asset) => ({
          name: asset.name,
          url: asset.uri,
          size: asset.size,
        }));

        const updatedAttachments = [...attachments, ...newAttachments];
        if (itineraryActivity) {
          updateMutation.mutate({
            ...itineraryActivity,
            attachments: updatedAttachments,
          });
        }
      }
    } catch (error) {
      logger.service(error, { screen: "FilesTab", action: "addAttachment" });
      Alert.alert("Error", "Failed to select attachment.");
    }
  };

  const handleDeleteAttachment = async (
    indexToDelete: number,
    fileName: string
  ) => {
    const isConfirmed = await confirm({
      title: "Delete Attachment",
      message: `Are you sure you want to delete "${fileName}"?`,
      confirmText: "Delete",
      type: "danger",
    });

    if (!isConfirmed) return;

    const updatedAttachments = attachments.filter(
      (_, idx) => idx !== indexToDelete
    );
    if (itineraryActivity) {
      updateMutation.mutate({
        ...itineraryActivity,
        attachments: updatedAttachments,
      });
    }
  };

  const handleOpenLocalFile = async (item: Attachment) => {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(item.url);
      } else {
        const supported = await Linking.canOpenURL(item.url);
        if (supported) {
          await Linking.openURL(item.url);
        } else {
          Alert.alert(
            "Cannot Open File",
            "There is no default application installed to view this file type."
          );
        }
      }
    } catch (error) {
      logger.service(error, { screen: "FilesTab", action: "openLocalFile" });
      Alert.alert(
        "Error",
        "An error occurred while trying to open this local file."
      );
    }
  };

  const handleOpenRemoteFile = async (item: Attachment) => {
    setIsDownloading(true);
    try {
      const targetFile = new File(Paths.cache, item.name);
      const downloadedFile = await File.downloadFileAsync(
        item.url,
        targetFile,
        { idempotent: true }
      );
      setIsDownloading(false);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadedFile.uri);
      } else {
        await Linking.openURL(item.url);
      }
    } catch (error) {
      setIsDownloading(false);
      logger.service(error, { screen: "FilesTab", action: "openRemoteFile" });
      Alert.alert(
        "Preview Failed",
        "Could not load the preview natively. Open in browser instead?",
        [
          { text: "Open in Browser", onPress: () => Linking.openURL(item.url) },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };

  const handleOpenAttachment = (item: Attachment) => {
    const isLocal = isLocalUrl(item.url);

    const options: AlertButton[] = [
      {
        text: "Native App / Share",
        onPress: () => {
          if (isLocal) {
            handleOpenLocalFile(item);
          } else {
            handleOpenRemoteFile(item);
          }
        },
      },
    ];

    if (!isLocal) {
      options.push({
        text: "In-App Viewer",
        onPress: () => {
          setSelectedFileUrl(item.url);
          setSelectedFileName(item.name);
          onImageViewerToggle?.(true);
        },
      });
      options.push({
        text: "External Browser",
        onPress: () => {
          Linking.openURL(item.url);
        },
      });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert(
      "Attachment Options",
      `Choose how you want to open: ${item.name}`,
      options
    );
  };

  const renderImages = () => {
    const data = [{ isAddButton: true } as any, ...images];

    return (
      <FlatList
        key="images-grid-list"
        data={data}
        keyExtractor={(item, index) =>
          item.isAddButton ? "add-image-button" : `${item.url}-${index}`
        }
        numColumns={3}
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          gap: 8,
          marginBottom: 8,
        }}
        renderItem={({ item, index }) => {
          if (item.isAddButton) {
            return (
              <TouchableOpacity
                style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                className={
                  "rounded-lg overflow-hidden bg-gray-100 justify-center " +
                  "items-center border-[1.5px] border-dashed " +
                  "border-[#263F69] p-2"
                }
                onPress={handleAddImagePress}
                disabled={updateMutation.isPending}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Add image"
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator size="small" color="#263F69" />
                ) : (
                  <>
                    <MaterialIcons
                      name="add-a-photo"
                      size={24}
                      color="#263F69"
                    />
                    <Text
                      className={
                        "text-[11px] font-semibold mt-1.5 " +
                        "text-center text-[#263F69]"
                      }
                      numberOfLines={1}
                    >
                      Add Image
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          }

          const actualIndex = index - 1;
          return (
            <View
              style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
              className="rounded-lg overflow-hidden bg-gray-100 relative"
            >
              <TouchableOpacity
                className="w-full h-full"
                onPress={() => {
                  setViewerActiveIndex(actualIndex);
                  onImageViewerToggle?.(true);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`View image ${item.title || ""}`}
              >
                <Image
                  source={{ uri: item.url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <TouchableOpacity
                className={
                  "absolute top-1.5 right-1.5 w-6 h-6 rounded-full " +
                  "justify-center items-center z-10"
                }
                style={{
                  backgroundColor: "rgba(0,0,0,0.50)",
                }}
                onPress={() => handleDeleteImage(actualIndex)}
                disabled={updateMutation.isPending}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Delete image"
              >
                <MaterialIcons name="delete-outline" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    );
  };

  const renderAttachments = () => {
    if (attachments.length === 0) {
      return (
        <View className="flex-1 justify-center items-center px-8 py-12">
          <MaterialIcons
            name="attach-file"
            size={48}
            color={colors.outline}
            style={{ marginBottom: 16, opacity: 0.6 }}
          />
          <Text
            className="text-lg font-semibold text-center"
            style={{ color: colors.outline }}
          >
            No attachments uploaded yet
          </Text>
          <Button
            mode="text"
            icon="plus"
            onPress={handleAddAttachmentPress}
            disabled={updateMutation.isPending}
            textColor="#0EA5E9"
            className="self-center"
            labelStyle={{
              fontSize: 14,
              fontWeight: "600",
              textDecorationLine: "underline",
            }}
            accessibilityRole="button"
            accessibilityLabel="Add attachment"
          >
            {updateMutation.isPending ? "Adding..." : "Add Attachment"}
          </Button>
          <Text
            className="text-xs text-center"
            style={{ color: colors.onSurfaceVariant }}
          >
            Supported formats: PDF, Word, Excel, PowerPoint
          </Text>
        </View>
      );
    }

    const data = [{ isAddButton: true } as any, ...attachments];

    return (
      <FlatList
        key="attachments-list-view"
        data={data}
        keyExtractor={(item, index) =>
          item.isAddButton ? "add-attachment-button" : `${item.url}-${index}`
        }
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item, index }) => {
          if (item.isAddButton) {
            return (
              <View>
                <Button
                  mode="text"
                  icon="plus"
                  onPress={handleAddAttachmentPress}
                  disabled={updateMutation.isPending}
                  textColor="#263F69"
                  className="self-start -ml-2"
                  labelStyle={{
                    fontSize: 14,
                    fontWeight: "600",
                    textDecorationLine: "underline",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add attachment"
                >
                  {updateMutation.isPending ? "Adding..." : "Add Attachment"}
                </Button>
                <Text
                  className="text-xs ml-2 -mt-1 mb-2"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  Supported formats: PDF, Word, Excel, PowerPoint
                </Text>
              </View>
            );
          }

          const actualIndex = index - 1;
          const iconName = getFileIcon(item.name);
          return (
            <View
              className={
                "flex-row items-center p-3 rounded-xl border " +
                "border-[#DDD] bg-[#F3F4F6]"
              }
            >
              <TouchableOpacity
                className="flex-1 flex-row items-center"
                onPress={() => handleOpenAttachment(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Open file ${item.name}`}
              >
                <View className="w-11 h-11 rounded-lg justify-center items-center mr-3">
                  <MaterialIcons
                    name={iconName as any}
                    size={24}
                    color="#263F69"
                  />
                </View>
                <View className="flex-1 pr-lg">
                  <Text
                    className={
                      "text-base leading-5 font-semibold " +
                      "mb-0.5 text-black"
                    }
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-xs text-[#999999]">
                    {formatFileSize(item.size)}
                  </Text>
                </View>
                <MaterialIcons
                  name="open-in-new"
                  size={20}
                  color={colors.outline}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteAttachment(actualIndex, item.name)}
                disabled={updateMutation.isPending}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Delete file ${item.name}`}
                className="p-1.5 ml-2 rounded-lg justify-center items-center"
              >
                <MaterialIcons
                  name="delete-outline"
                  size={20}
                  color="#D32F2F"
                />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    );
  };

  const subTabs = [
    {
      id: "images",
      title: `Images (${images.length})`,
      content: renderImages(),
    },
    {
      id: "attachments",
      title: `Attachments (${attachments.length})`,
      content: renderAttachments(),
    },
  ];

  // Resolve url with Android PDF viewer support
  const getWebViewSourceUrl = () => {
    if (!selectedFileUrl) return "";
    if (isPdf(selectedFileName) && Platform.OS === "android") {
      const encoded = encodeURIComponent(selectedFileUrl);
      return `https://docs.google.com/gview?embedded=true&url=${encoded}`;
    }
    return selectedFileUrl;
  };

  return (
    <View className="flex-1">
      <Tabs
        tabs={subTabs}
        initialActiveTabId="images"
        type="secondary"
        expanded={true}
      />

      {/* Full-screen Image Viewer Modal */}
      <Modal
        visible={viewerActiveIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setViewerActiveIndex(null);
          onImageViewerToggle?.(false);
        }}
      >
        <Animated.View
          className="flex-1 justify-center items-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.99)",
          }}
        >
          {viewerActiveIndex !== null && (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `${item.url}-${index}`}
              initialScrollIndex={viewerActiveIndex}
              getItemLayout={(_, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              renderItem={({ item }) => (
                <Pressable
                  style={{ width: screenWidth }}
                  className="h-full justify-center items-center"
                  onPress={() => {
                    setViewerActiveIndex(null);
                    onImageViewerToggle?.(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Close image viewer"
                >
                  <Image
                    source={{ uri: item.url }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </Pressable>
              )}
            />
          )}

          {/* Floating Close Button */}
          <TouchableOpacity
            className={
              "absolute top-12 right-5 w-10 h-10 rounded-full " +
              "bg-white/20 justify-center items-center z-10"
            }
            onPress={() => {
              setViewerActiveIndex(null);
              onImageViewerToggle?.(false);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MaterialIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      {/* In-app Document/Web Viewer Modal */}
      <Modal
        visible={!!selectedFileUrl}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setSelectedFileUrl(null);
          onImageViewerToggle?.(false);
        }}
      >
        <View
          className="flex-1"
          style={{ backgroundColor: colors.background }}
        >
          {/* Header */}
          <View
            className="flex-row items-center px-4 h-14 border-b"
            style={{
              borderBottomColor: colors.outlineVariant,
              backgroundColor: colors.surface,
              ...(Platform.OS === "android" ? { elevation: 2 } : {}),
            }}
          >
            <TouchableOpacity
              className="p-1 mr-4"
              onPress={() => {
                setSelectedFileUrl(null);
                onImageViewerToggle?.(false);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back to activity details"
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={colors.onSurface}
              />
            </TouchableOpacity>
            <Text
              className="text-lg font-semibold flex-1"
              style={{ color: colors.onSurface }}
              numberOfLines={1}
            >
              {selectedFileName}
            </Text>
          </View>

          {/* Web View Content */}
          {selectedFileUrl && (
            <WebView
              source={{ uri: getWebViewSourceUrl() }}
              className="flex-1"
              originWhitelist={["*"]}
              allowFileAccess={true}
              domStorageEnabled={true}
              javaScriptEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View className="absolute inset-0 justify-center items-center bg-white/70">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Downloading Overlay */}
      {isDownloading && (
        <View className="absolute inset-0 bg-black/40 justify-center items-center z-[999]">
          <View
            className="bg-white p-6 rounded-2xl items-center gap-3 shadow-lg"
            style={Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
              },
              android: {
                elevation: 5,
              },
            })}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.onSurface }}
            >
              Downloading file...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default FilesTab;
