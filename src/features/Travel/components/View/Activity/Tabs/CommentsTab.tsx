import React from "react";
import { View, TextInput } from "react-native";
import CommentSection from "../../CommentSection";

const AddComment = () => (
  <View
    style={{
      position: "absolute",
      bottom: 50,
      left: 0,
      right: 0,
      height: 70,
      backgroundColor: "#FFF",
      borderTopWidth: 1,
      borderTopColor: "#DDD",
      padding: 10,
    }}
  >
    <TextInput
      style={{
        backgroundColor: "#EEE",
        borderRadius: 30,
        borderWidth: 1,
        padding: 10,
        height: 50,
        borderColor: "#DDD",
      }}
      placeholder="Comment as User name"
      multiline
      numberOfLines={4}
    />
  </View>
);

const CommentsTab = () => {
  return (
    <View
      style={{
        padding: 10,
        backgroundColor: "#FFF",
      }}
    >
      <View style={{ flex: 2 }}>
        <CommentSection />
      </View>
      <AddComment />
    </View>
  );
};

export default CommentsTab;
