import { database } from "../../db";
import TripMemberModel from "../../db/models/TripMember";
import { TripMember } from "../../features/Travel/types/TravelDto";
import { Q } from "@nozbe/watermelondb";

export const fetchLocalTripMembers = async (travelId: string): Promise<TripMember[]> => {
  const members = await database
    .get<TripMemberModel>("trip_members")
    .query(Q.where("travel_id", travelId))
    .fetch();

  return members.map((m) => ({
    id: m.id,
    travelId: travelId,
    name: m.name,
    description: m.description || undefined,
    email: m.email || undefined,
    isOffline: m.isOffline,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
};

export const saveTripMemberLocally = async (memberData: TripMember): Promise<TripMemberModel> => {
  return await database.write(async () => {
    if (memberData.id) {
      const member = await database.get<TripMemberModel>("trip_members").find(memberData.id);
      return await member.update((record) => {
        record.name = memberData.name;
        record.description = memberData.description || null;
        record.email = memberData.email || null;
        record.isOffline = true;
        // @ts-ignore
        record.travel.id = memberData.travelId;
      });
    } else {
      return await database.get<TripMemberModel>("trip_members").create((record) => {
        record.name = memberData.name;
        record.description = memberData.description || null;
        record.email = memberData.email || null;
        record.isOffline = true;
        // @ts-ignore
        record.travel.id = memberData.travelId;
      });
    }
  });
};

export const deleteTripMemberLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const member = await database.get<TripMemberModel>("trip_members").find(id);
    await member.destroyPermanently();
  });
};
