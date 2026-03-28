export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: "online" | "offline" | "traveling";
  lastSeen?: string;
  location?: string;
}

export const sampleFriends: Friend[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    status: "online",
    location: "San Francisco, CA",
  },
  {
    id: "2",
    name: "Mike Chen",
    email: "mike.chen@email.com",
    status: "offline",
    lastSeen: "2h ago",
    location: "New York, NY",
  },
  {
    id: "3",
    name: "Emma Wilson",
    email: "emma.wilson@email.com",
    status: "traveling",
    location: "Paris, France",
  },
  {
    id: "4",
    name: "Alex Rodriguez",
    email: "alex.rodriguez@email.com",
    status: "online",
    location: "Los Angeles, CA",
  },
  {
    id: "5",
    name: "Lisa Thompson",
    email: "lisa.thompson@email.com",
    status: "offline",
    lastSeen: "1d ago",
    location: "Chicago, IL",
  },
];

export const getFriendById = (id: string): Friend | undefined => {
  return sampleFriends.find((friend) => friend.id === id);
};

export const getFriendsByStatus = (
  status: "online" | "offline" | "traveling"
): Friend[] => {
  return sampleFriends.filter((friend) => friend.status === status);
};

export const searchFriends = (query: string): Friend[] => {
  const lowercaseQuery = query.toLowerCase();
  return sampleFriends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(lowercaseQuery) ||
      friend.email.toLowerCase().includes(lowercaseQuery) ||
      friend.location?.toLowerCase().includes(lowercaseQuery)
  );
};
