import { MemberSplitBill } from "../../features/Travel/types/TravelDto";
import { fetchLocalMemberSplitBills, saveMemberSplitBillLocally, saveManyMemberSplitBillsLocally } from "../local/memberSplitBillService";

export const fetchMemberSplitBills = async (travelId: string) => {
  return await fetchLocalMemberSplitBills(travelId);
};

export const saveMemberSplitBill = async (splitData: MemberSplitBill) => {
  return await saveMemberSplitBillLocally(splitData);
};

export const saveManyMemberSplitBills = async (splits: MemberSplitBill[]) => {
  return await saveManyMemberSplitBillsLocally(splits);
};
