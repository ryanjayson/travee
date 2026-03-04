import React, { FC } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Comment } from "./types";
// Assuming you have a default Avatar image or a similar setup
// import DefaultAvatar from "../../assets/images/image-d.png";

interface CommentCardProps {
  comment: Comment;
  onLikePress: (id: string) => void;
  onReplyPress: (parentId: string) => void;
  isReply?: boolean; // New prop to handle slight styling changes for replies
}

const CommentCard: FC<CommentCardProps> = ({
  comment,
  onLikePress,
  onReplyPress,
  isReply = false,
}) => {
  const { id, name, avatar, text, time, likesCount, replies } = comment;

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      {/* 1. Avatar */}
      <Image
        source={avatar ? { uri: avatar } : { uri: "placeholder-uri" }}
        style={styles.avatar}
      />

      <View style={styles.content}>
        {/* 2. Comment Bubble */}
        <View style={styles.bubble}>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.commentText}>{text}</Text>
        </View>

        {/* 3. Actions and Metadata */}
        <View style={styles.actionsRow}>
          <Text style={styles.timestamp}>{time}</Text>
          <Text style={styles.dot}>·</Text>

          <TouchableOpacity onPress={() => onLikePress(id)} activeOpacity={0.7}>
            <Text style={styles.actionText}>Like ({likesCount})</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>·</Text>

          <TouchableOpacity
            onPress={() => onReplyPress(id)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Recursive Rendering of Replies */}
        {replies && replies.length > 0 && (
          <View style={styles.repliesList}>
            {replies.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                onLikePress={onLikePress}
                onReplyPress={onReplyPress}
                isReply={true} // Indicate this is a nested reply
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 15,
    paddingRight: 10,
  },
  replyContainer: {
    marginTop: 10,
    marginLeft: 25, // Indent replies
    marginBottom: 0, // Less space between individual replies
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginTop: 5,
    backgroundColor: "#ccc",
  },
  content: {
    flex: 1,
  },
  bubble: {
    backgroundColor: "#f0f2f5",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  userName: {
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    marginTop: 4,
    marginBottom: 5, // Space before next reply/comment
  },
  timestamp: {
    fontSize: 12,
    color: "#606770",
    marginRight: 8,
  },
  dot: {
    fontSize: 12,
    color: "#606770",
    marginHorizontal: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#606770",
  },
  repliesList: {
    // This view wraps all the nested comments
    marginTop: 5,
  },
});

export default CommentCard;
