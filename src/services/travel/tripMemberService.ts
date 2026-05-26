import { TripMember } from "../../features/Travel/types/TravelDto";
import { fetchLocalTripMembers, saveTripMemberLocally, deleteTripMemberLocally } from "../local/tripMemberService";

export const fetchTripMembers = async (travelId: string) => {
  return await fetchLocalTripMembers(travelId);
};

export const saveTripMember = async (memberData: TripMember) => {
  return await saveTripMemberLocally(memberData);
};

export const deleteTripMember = async (id: string) => {
  return await deleteTripMemberLocally(id);
};
