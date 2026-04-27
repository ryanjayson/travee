import { database } from "../../db";
import ChecklistGroupModel from "../../db/models/ChecklistGroup";
import ChecklistItemModel from "../../db/models/ChecklistItem";
import { ChecklistGroup, ChecklistItem } from "../../features/Travel/types/TravelDto";
import { Q } from "@nozbe/watermelondb";

// ─── Checklist Group ────────────────────────────────────────────────────────

export const saveChecklistGroupLocally = async (data: ChecklistGroup): Promise<ChecklistGroupModel> => {
  return await database.write(async () => {
    if (data.id) {
      const record = await database.get<ChecklistGroupModel>("checklist_groups").find(data.id);
      return await record.update((r) => {
        r.title = data.title;
        r.description = data.description || null;
        r.sortOrder = data.sortOrder;
        r.userId = data.userId || null;
        r.isOffline = true;
        // @ts-ignore
        r.travel.id = data.travelId;
      });
    } else {
      return await database.get<ChecklistGroupModel>("checklist_groups").create((r) => {
        r.title = data.title;
        r.description = data.description || null;
        r.sortOrder = data.sortOrder;
        r.userId = data.userId || null;
        r.isOffline = true;
        // @ts-ignore
        r.travel.id = data.travelId;
      });
    }
  });
};

export const fetchLocalChecklistGroups = async (travelId: string): Promise<ChecklistGroup[]> => {
  const records = await database
    .get<ChecklistGroupModel>("checklist_groups")
    .query(Q.where("travel_id", travelId))
    .fetch();

  return records.map((r) => ({
    id: r.id,
    travelId,
    title: r.title,
    description: r.description || undefined,
    sortOrder: r.sortOrder,
    userId: r.userId || undefined,
    isOffline: r.isOffline,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
};

export const deleteChecklistGroupLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const record = await database.get<ChecklistGroupModel>("checklist_groups").find(id);
    await record.destroyPermanently();
  });
};

// ─── Checklist Item ─────────────────────────────────────────────────────────

export const saveChecklistItemLocally = async (data: ChecklistItem): Promise<ChecklistItemModel> => {
  return await database.write(async () => {
    if (data.id) {
      const record = await database.get<ChecklistItemModel>("checklist_items").find(data.id);
      return await record.update((r) => {
        r.title = data.title;
        r.description = data.description || null;
        r.sortOrder = data.sortOrder;
        r.isDone = data.isDone;
        r.userId = data.userId || null;
        r.checkedBy = data.checkedBy || null;
        r.checkedAt = data.checkedAt ? new Date(data.checkedAt) : null;
        r.uncheckBy = data.uncheckBy || null;
        r.uncheckAt = data.uncheckAt ? new Date(data.uncheckAt) : null;
        r.isOffline = true;
        // @ts-ignore
        r.travel.id = data.travelId;
        // @ts-ignore
        r.activity.id = data.activityId || null;
        // @ts-ignore
        r.checklistGroup.id = data.checklistGroupId || null;
      });
    } else {
      return await database.get<ChecklistItemModel>("checklist_items").create((r) => {
        r.title = data.title;
        r.description = data.description || null;
        r.sortOrder = data.sortOrder;
        r.isDone = data.isDone ?? false;
        r.userId = data.userId || null;
        r.isOffline = true;
        // @ts-ignore
        r.travel.id = data.travelId;
        if (data.activityId) {
          // @ts-ignore
          r.activity.id = data.activityId;
        }
        if (data.checklistGroupId) {
          // @ts-ignore
          r.checklistGroup.id = data.checklistGroupId;
        }
      });
    }
  });
};

export const fetchLocalChecklistItems = async (travelId: string): Promise<ChecklistItem[]> => {
  const records = await database
    .get<ChecklistItemModel>("checklist_items")
    .query(Q.where("travel_id", travelId))
    .fetch();

  return records.map((r) => ({
    id: r.id,
    travelId,
    activityId: r.activity?.id || undefined,
    checklistGroupId: r.checklistGroup?.id || undefined,
    title: r.title,
    description: r.description || undefined,
    sortOrder: r.sortOrder,
    isDone: r.isDone,
    userId: r.userId || undefined,
    checkedBy: r.checkedBy || undefined,
    checkedAt: r.checkedAt || undefined,
    uncheckBy: r.uncheckBy || undefined,
    uncheckAt: r.uncheckAt || undefined,
    isOffline: r.isOffline,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
};

export const deleteChecklistItemLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const record = await database.get<ChecklistItemModel>("checklist_items").find(id);
    await record.destroyPermanently();
  });
};

export const toggleChecklistItemLocally = async (
  id: string,
  isDone: boolean,
  userId: string
): Promise<ChecklistItemModel> => {
  return await database.write(async () => {
    const record = await database.get<ChecklistItemModel>("checklist_items").find(id);
    return await record.update((r) => {
      r.isDone = isDone;
      if (isDone) {
        r.checkedBy = userId;
        r.checkedAt = new Date();
        r.uncheckBy = null;
        r.uncheckAt = null;
      } else {
        r.uncheckBy = userId;
        r.uncheckAt = new Date();
        r.checkedBy = null;
        r.checkedAt = null;
      }
    });
  });
};
