import { database } from "../../db";
import MemberSplitBillModel from "../../db/models/MemberSplitBill";
import { MemberSplitBill } from "../../features/Travel/types/TravelDto";
import { Q } from "@nozbe/watermelondb";

export const fetchLocalMemberSplitBills = async (travelId: string): Promise<MemberSplitBill[]> => {
  const records = await database
    .get<MemberSplitBillModel>("member_split_bills")
    .query(Q.where("travel_id", travelId))
    .fetch();

  return records.map((r) => ({
    id: r.id,
    travelId: travelId,
    memberId: r.member?.id || "",
    owesAmount: r.owesAmount,
    percentageShare: r.percentageShare,
    isPaid: r.isPaid,
    paymentType: r.paymentType || undefined,
    paidDate: r.paidDate ? new Date(r.paidDate) : undefined,
    notes: r.notes || "",
    isOffline: r.isOffline,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
};

export const saveMemberSplitBillLocally = async (splitData: MemberSplitBill): Promise<MemberSplitBillModel> => {
  return await database.write(async () => {
    if (splitData.id) {
      const record = await database.get<MemberSplitBillModel>("member_split_bills").find(splitData.id);
      return await record.update((r) => {
        r.owesAmount = splitData.owesAmount;
        r.percentageShare = splitData.percentageShare;
        r.isPaid = splitData.isPaid;
        r.paymentType = splitData.paymentType || null;
        r.paidDate = splitData.paidDate ? new Date(splitData.paidDate) : null;
        r.notes = splitData.notes || null;
        r.isOffline = true;
        // @ts-ignore
        r.travel.id = splitData.travelId;
        // @ts-ignore
        r.member.id = splitData.memberId;
      });
    } else {
      const existing = await database
        .get<MemberSplitBillModel>("member_split_bills")
        .query(Q.where("travel_id", splitData.travelId), Q.where("member_id", splitData.memberId))
        .fetch();

      if (existing.length > 0) {
        return await existing[0].update((r) => {
          r.owesAmount = splitData.owesAmount;
          r.percentageShare = splitData.percentageShare;
          r.isPaid = splitData.isPaid;
          r.paymentType = splitData.paymentType || null;
          r.paidDate = splitData.paidDate ? new Date(splitData.paidDate) : null;
          r.notes = splitData.notes || null;
          r.isOffline = true;
        });
      }

      return await database.get<MemberSplitBillModel>("member_split_bills").create((r) => {
        r.owesAmount = splitData.owesAmount;
        r.percentageShare = splitData.percentageShare;
        r.isPaid = splitData.isPaid;
        r.paymentType = splitData.paymentType || null;
        r.paidDate = splitData.paidDate ? new Date(splitData.paidDate) : null;
        r.notes = splitData.notes || null;
        r.isOffline = true;
        // @ts-ignore
        r.travel.id = splitData.travelId;
        // @ts-ignore
        r.member.id = splitData.memberId;
      });
    }
  });
};

export const saveManyMemberSplitBillsLocally = async (splits: MemberSplitBill[]): Promise<void> => {
  await database.write(async () => {
    for (const split of splits) {
      const existing = await database
        .get<MemberSplitBillModel>("member_split_bills")
        .query(Q.where("travel_id", split.travelId), Q.where("member_id", split.memberId))
        .fetch();

      if (existing.length > 0) {
        await existing[0].update((r) => {
          r.owesAmount = split.owesAmount;
          r.percentageShare = split.percentageShare;
          r.isPaid = split.isPaid ?? r.isPaid;
          if (split.paymentType !== undefined) r.paymentType = split.paymentType;
          if (split.paidDate !== undefined) r.paidDate = split.paidDate ? new Date(split.paidDate) : null;
          if (split.notes !== undefined) r.notes = split.notes;
        });
      } else {
        await database.get<MemberSplitBillModel>("member_split_bills").create((r) => {
          r.owesAmount = split.owesAmount;
          r.percentageShare = split.percentageShare;
          r.isPaid = split.isPaid ?? false;
          r.paymentType = split.paymentType || null;
          r.paidDate = split.paidDate ? new Date(split.paidDate) : null;
          r.notes = split.notes || null;
          r.isOffline = true;
          // @ts-ignore
          r.travel.id = split.travelId;
          // @ts-ignore
          r.member.id = split.memberId;
        });
      }
    }
  });
};
