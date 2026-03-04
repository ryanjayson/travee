import React, { FC } from "react";
import { FlatList, View } from "react-native";
import CommentCard from "../../../../components/CommentCard";
import { Comment, AddComment } from "../../../../components/CommentCard/types";

// --- Mock Nested Data ---
const mockComments: Comment[] = [
  {
    id: "c1",
    name: "Alice Johnson",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    text: "This is the main top-level comment. I want to see replies!",
    time: "5m",
    likesCount: 12,
    replies: [
      {
        id: "r1",
        name: "Bob Smith",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
        text: "I agree with Alice! Great point.",
        time: "3m",
        likesCount: 5,
        replies: [], // Can be empty or omitted
      },
      {
        id: "r2",
        name: "Charlie Brown",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
        text: "Thanks for the feedback, Alice!",
        time: "1m",
        likesCount: 1,
        replies: [
          // Third level nesting is possible
          {
            id: "r3",
            name: "Daisy",
            avatar: "https://randomuser.me/api/portraits/women/4.jpg",
            text: "Nested reply test!",
            time: "1m",
            likesCount: 0,
          },
        ],
      },
    ],
  },
  {
    id: "c2",
    name: "Eve Williams",
    avatar: "https://randomuser.me/api/portraits/women/5.jpg",
    text: "Another independent top-level comment.",
    time: "1h",
    likesCount: 20,
    replies: [],
  },
  {
    id: "c3",
    name: "Alice Johnson",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    text: "This is the main top-level comment. I want to see replies!",
    time: "5m",
    likesCount: 12,
    replies: [
      {
        id: "r23",
        name: "Bob Smith",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
        text: "I agree with Alice! Great point.",
        time: "3m",
        likesCount: 5,
        replies: [], // Can be empty or omitted
      },
      {
        id: "r24",
        name: "Charlie Brown",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
        text: "Thanks for the feedback, Alice!",
        time: "1m",
        likesCount: 1,
        replies: [
          // Third level nesting is possible
          {
            id: "r32",
            name: "Daisy",
            avatar: "https://randomuser.me/api/portraits/women/4.jpg",
            text: "Nested reply test!",
            time: "1m",
            likesCount: 0,
          },
        ],
      },
    ],
  },
];

const CommentSection: FC = () => {
  const handleLike = (id: string) => {
    console.log(`Liking comment/reply ID: ${id}`);
    // Logic to update the likes count in your state/API
  };

  const handleReply = (parentId: string) => {
    console.log(`Opening reply field for parent ID: ${parentId}`);
    // Logic to show an input box focused on replying to this comment
  };

  return (
    <View style={{ paddingBottom: 120 }}>
      {mockComments.map((item) => (
        <CommentCard
          key={item.id}
          comment={item}
          onLikePress={handleLike}
          onReplyPress={handleReply}
        />
      ))}
    </View>

    // <FlatList
    //   data={mockComments}
    //   renderItem={renderItem}
    //   keyExtractor={(item) => item.id}
    //   ListHeaderComponent={() => (
    //     <View>
    //       <Text>--- Header Content: (Not part of the list data) ---</Text>
    //     </View>
    //   )}
    // />
  );
};

export default CommentSection;
