import { database } from "../../db";
import AppNotification from "../../db/models/AppNotification";
import { Q } from "@nozbe/watermelondb";

export interface AppNotificationData {
  id?: string;
  title: string;
  body: string;
  isRead: boolean;
  travelId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const saveNotificationLocally = async (data: AppNotificationData): Promise<AppNotification> => {
  return await database.write(async () => {
    if (data.id) {
      const item = await database.get<AppNotification>("app_notifications").find(data.id);
      return await item.update((record) => {
        record.title = data.title;
        record.body = data.body;
        record.isRead = data.isRead;
        if (data.travelId) {
          // @ts-ignore
          record.travel.id = data.travelId;
        }
      });
    } else {
      return await database.get<AppNotification>("app_notifications").create((record) => {
        record.title = data.title;
        record.body = data.body;
        record.isRead = data.isRead;
        if (data.travelId) {
          // @ts-ignore
          record.travel.id = data.travelId;
        }
      });
    }
  });
};

export const fetchLocalNotifications = async (): Promise<AppNotificationData[]> => {
  const items = await database
    .get<AppNotification>("app_notifications")
    .query(Q.sortBy("created_at", Q.desc))
    .fetch();

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    isRead: item.isRead,
    travelId: item.travel?.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
};

export const fetchUnreadNotificationsCount = async (): Promise<number> => {
  return await database
    .get<AppNotification>("app_notifications")
    .query(Q.where("is_read", false))
    .fetchCount();
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await database.write(async () => {
    const item = await database.get<AppNotification>("app_notifications").find(id);
    await item.update((record) => {
      record.isRead = true;
    });
  });
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await database.write(async () => {
    const items = await database
      .get<AppNotification>("app_notifications")
      .query(Q.where("is_read", false))
      .fetch();
    for (const item of items) {
      await item.update((record) => {
        record.isRead = true;
      });
    }
  });
};

export const deleteNotificationLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const item = await database.get<AppNotification>("app_notifications").find(id);
    await item.destroyPermanently();
  });
};

export const seedTestNotifications = async (): Promise<void> => {
  await database.write(async () => {
    const notificationsRepo = database.get<AppNotification>("app_notifications");

    await notificationsRepo.create((record) => {
      record.title = "Packing List Ready";
      record.body = "Your checklist for Paris Trip is updated. 12 items pending pack.";
      record.isRead = false;
    });

    await notificationsRepo.create((record) => {
      record.title = "Weather Update";
      record.body = "Sunny skies forecasted in Tokyo for the next 3 days. Average 24°C.";
      record.isRead = false;
    });

    await notificationsRepo.create((record) => {
      record.title = "Trip Tomorrow";
      record.body = "Bon voyage! Your weekend getaway to Boracay starts tomorrow.";
      record.isRead = false;
    });
  
  });
};

