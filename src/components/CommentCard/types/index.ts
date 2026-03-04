export interface Comment {
  id: string;
  name: string;
  avatar: string;
  text: string;
  time: string;
  likesCount: number;
  replies?: Comment[];
}

export interface AddComment {
  userid: number;
  text: string;
  parentCommentId?: number;
}
