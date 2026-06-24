import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions, Linking, StyleSheet, Modal, Pressable, Platform, ActivityIndicator, Alert, AlertButton } from "react-native";
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

interface FilesTabProps {
  itineraryActivity?: ItineraryActivity;
  onImageViewerToggle?: (isOpen: boolean) => void;
}

const { width: screenWidth } = Dimensions.get("window");
const IMAGE_SIZE = (screenWidth - 48) / 3; // 3 columns with padding

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const getFileIcon = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "picture-as-pdf";
    case "doc":
    case "docx":
      return "description";
    case "xls":
    case "xlsx":
      return "table-chart";
    case "ppt":
    case "pptx":
      return "slideshow";
    case "zip":
    case "rar":
    case "tar":
      return "inventory";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
      return "image";
    default:
      return "insert-drive-file";
  }
};

const isPdf = (fileName: string) => {
  return fileName.toLowerCase().endsWith(".pdf");
};

const isLocalUrl = (url: string) => {
  return url.startsWith("file://") || url.startsWith("content://") || !url.startsWith("http");
};

const FilesTab = ({ itineraryActivity, onImageViewerToggle }: FilesTabProps) => {
  const { colors } = useTheme();
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
          Alert.alert("Permission required", "Camera permission is needed to take photos.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required", "Gallery permission is needed to upload images.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => ({
          title: "",
          url: asset.uri,
        }));
        
        if (itineraryActivity) {
          const updatedActivity: ItineraryActivity = {
            ...itineraryActivity,
            images: [...images, ...newImages],
          };
          await updateMutation.mutateAsync(updatedActivity);
        }
      }
    } catch (error) {
      console.error("Error adding image:", error);
      Alert.alert("Error", "Failed to add image to the activity.");
    }
  };

  const handleAddImagePress = () => {
    Alert.alert(
      "Add Image",
      "Choose how you want to select an image:",
      [
        {
          text: "Take Photo",
          onPress: () => handleAddImage("camera"),
        },
        {
          text: "Choose from Gallery",
          onPress: () => handleAddImage("gallery"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
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
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newAttachments = result.assets.map((asset) => ({
          name: asset.name,
          url: asset.uri,
          size: asset.size || undefined,
          type: asset.mimeType || undefined,
        }));

        if (itineraryActivity) {
          const updatedActivity: ItineraryActivity = {
            ...itineraryActivity,
            attachments: [...attachments, ...newAttachments],
          };
          await updateMutation.mutateAsync(updatedActivity);
        }
      }
    } catch (error) {
      console.error("Error adding attachment:", error);
      Alert.alert("Error", "Failed to add attachment to the activity.");
    }
  };

  const openInAppWebView = (item: Attachment) => {
    setSelectedFileName(item.name);
    setSelectedFileUrl(item.url);
    onImageViewerToggle?.(true); // Disable parent swipe gestures
  };

  const handleOpenLocalFile = async (url: string, name: string) => {
    try {
      let shareUrl = url;
      
      // Try to copy to cache directory with original name to maintain filename in share sheet
      try {
        const sourceFile = new File(url);
        const targetFile = new File(Paths.cache, name);
        if (targetFile.exists) {
          targetFile.delete();
        }
        sourceFile.copy(targetFile);
        shareUrl = targetFile.uri;
      } catch (copyError) {
        console.warn("Could not copy local file to cache with original name:", copyError);
        // Fallback to original url
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(shareUrl);
      } else {
        Alert.alert(
          "Not Supported",
          "Sharing and viewing local files is not supported on this device."
        );
      }
    } catch (error) {
      console.error("Error opening local file with expo-sharing:", error);
      Alert.alert(
        "Error",
        "An error occurred while trying to open this local file."
      );
    }
  };

  const handleOpenRemoteFile = async (item: Attachment) => {
    setIsDownloading(true);
    try {
      // Create a target File instance with the exact original filename to maintain name
      const targetFile = new File(Paths.cache, item.name);
      
      // Download remote file to the specific file location, overwriting if exists
      const downloadedFile = await File.downloadFileAsync(item.url, targetFile, { idempotent: true });
      setIsDownloading(false);
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadedFile.uri);
      } else {
        await Linking.openURL(item.url);
      }
    } catch (error) {
      setIsDownloading(false);
      console.error("Error downloading and previewing remote file:", error);
      Alert.alert(
        "Preview Failed",
        "Could not load the preview natively. Would you like to open it in your browser instead?",
        [
          { text: "Open in Browser", onPress: () => Linking.openURL(item.url) },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  const handleOpenAttachment = (item: Attachment) => {
    const isLocal = isLocalUrl(item.url);
    
    const options: AlertButton[] = [
      {
        text: "View Natively (System Viewer)",
        onPress: () => {
          if (isLocal) {
            handleOpenLocalFile(item.url, item.name);
          } else {
            handleOpenRemoteFile(item);
          }
        }
      }
    ];

    if (!isLocal) {
      options.push({
        text: "View In-App (Web View)",
        onPress: () => openInAppWebView(item)
      });
      options.push({
        text: "Open in External Browser",
        onPress: () => Linking.openURL(item.url)
      });
    }

    options.push({
      text: "Cancel",
      style: "cancel"
    });

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
        keyExtractor={(item, index) => (item.isAddButton ? "add-image-button" : `${item.url}-${index}`)}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridColumnWrapper}
        renderItem={({ item, index }) => {
          if (item.isAddButton) {
            return (
              <TouchableOpacity
                style={[
                  styles.imageContainer,
                  styles.addButtonContainer,
                  {
                    width: IMAGE_SIZE,
                    height: IMAGE_SIZE,
                    borderColor: "#263F69",
                  },
                ]}
                onPress={handleAddImagePress}
                disabled={updateMutation.isPending}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Add image"
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator size="small" color={"#263F69"} />
                ) : (
                  <>
                    <MaterialIcons name="add-a-photo" size={24} color={"#263F69"} />
                    <Text style={[styles.addButtonText, { color: "#263F69" }]} numberOfLines={1}>
                      Add Image
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          }

          const actualIndex = index - 1; // map back to original images array
          return (
            <TouchableOpacity
              style={[styles.imageContainer, { width: IMAGE_SIZE, height: IMAGE_SIZE }]}
              onPress={() => {
                setViewerActiveIndex(actualIndex);
                onImageViewerToggle?.(true);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View image ${item.title || ""}`}
            >
              <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  const renderAttachments = () => {
    if (attachments.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="attach-file" size={48} color={colors.outline} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: colors.outline }]}>No attachments uploaded yet</Text>
          <Button
            mode="text"
            icon="plus"
            onPress={handleAddAttachmentPress}
            disabled={updateMutation.isPending}
            textColor="#263F69"
            style={[styles.addAttachmentButtonEmpty, { }]}
            labelStyle={styles.addAttachmentButtonLabel}
            accessibilityRole="button"
            accessibilityLabel="Add attachment"
          >
            {updateMutation.isPending ? "Adding..." : "Add Attachment"}
          </Button>
          <Text style={[styles.acceptedTypesLabelEmpty, { color: colors.onSurfaceVariant }]}>
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
        keyExtractor={(item, index) => (item.isAddButton ? "add-attachment-button" : `${item.url}-${index}`)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          if (item.isAddButton) {
            return (
              <View>
                <Button
                  mode="text"
                  icon="plus"
                  onPress={handleAddAttachmentPress}
                  disabled={updateMutation.isPending}
                  textColor="#263F69"
                  style={styles.addAttachmentButton}
                  labelStyle={styles.addAttachmentButtonLabel}
                  accessibilityRole="button"
                  accessibilityLabel="Add attachment"
                >
                  {updateMutation.isPending ? "Adding..." : "Add Attachment"}
                </Button>
                <Text style={[styles.acceptedTypesLabel, { color: colors.onSurfaceVariant }]}>
                  Supported formats: PDF, Word, Excel, PowerPoint
                </Text>
              </View>
            );
          }

          const iconName = getFileIcon(item.name);
          return (
            <TouchableOpacity
              style={[styles.attachmentItem, { borderColor: "#DDD", backgroundColor: "#F3F4F6" }]}
              onPress={() => handleOpenAttachment(item)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Open file ${item.name}`}
            >
              <View style={[styles.iconWrapper, {  }]}>
                <MaterialIcons name={iconName as any} size={24} color={"#263F69"} />
              </View>
              <View style={styles.attachmentDetails}>
                <Text style={[styles.fileName, { color: "#000000" }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.fileSize, { color: "#999999" }]}>
                  {formatFileSize(item.size)}
                </Text>
              </View>
              <MaterialIcons name="open-in-new" size={20} color={colors.outline} />
            </TouchableOpacity>
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
      // Android WebView doesn't render PDF naturally, use Google Docs viewer proxy
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(selectedFileUrl)}`;
    }
    return selectedFileUrl;
  };

  return (
    <View style={styles.container}>
      <Tabs tabs={subTabs} initialActiveTabId="images" type="secondary" expanded={true} />

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
        <View style={styles.viewerBackground}>
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
                  style={styles.viewerSlide}
                  onPress={() => {
                    setViewerActiveIndex(null);
                    onImageViewerToggle?.(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Close image viewer"
                >
                  <Image 
                    source={{ uri: item.url }} 
                    style={styles.viewerImage} 
                    resizeMode="contain" 
                  />
                </Pressable>
              )}
            />
          )}

          {/* Floating Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
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
        </View>
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
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setSelectedFileUrl(null);
                onImageViewerToggle?.(false);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back to activity details"
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]} numberOfLines={1}>
              {selectedFileName}
            </Text>
          </View>

          {/* Web View Content */}
          {selectedFileUrl && (
            <WebView
              source={{ uri: getWebViewSourceUrl() }}
              style={styles.webView}
              originWhitelist={["*"]}
              allowFileAccess={true}
              domStorageEnabled={true}
              javaScriptEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Downloading Overlay */}
      {isDownloading && (
        <View style={styles.downloadingOverlay}>
          <View style={styles.downloadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.downloadingText, { color: colors.onSurface }]}>Downloading file...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    // marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 18,
  },
  gridContent: {
    padding: 16,
  },
  gridColumnWrapper: {
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  addButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 8,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  addAttachmentButton: {
    alignSelf: "flex-start",
    marginLeft: -8,
  },
  addAttachmentButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  acceptedTypesLabel: {
    fontSize: 12,
    marginLeft: 8,
    marginTop: -4,
    marginBottom: 8,
  },
  addAttachmentButtonEmpty: {
    alignSelf: "center",
    textDecorationLine: "underline",
  },
  acceptedTypesLabelEmpty: {
    fontSize: 12,
    textAlign: "center",
    // marginTop: -4,
    // marginBottom: 8,    
  },
  image: {
    width: "100%",
    height: "100%",
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  attachmentDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
  },
  viewerBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerSlide: {
    width: screenWidth,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
      android: {
        paddingTop: 0,
        elevation: 2,
      },
    }),
  },
  modalCloseButton: {
    padding: 4,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  webLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  downloadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  downloadingCard: {
    backgroundColor: "#FFF",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  downloadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default FilesTab;
