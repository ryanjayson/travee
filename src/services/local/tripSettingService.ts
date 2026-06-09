import { database } from "../../db";
import TripSettingModel from "../../db/models/TripSetting";
import { TripSetting } from "../../features/Travel/types/TravelDto";
import { Q } from "@nozbe/watermelondb";

export const fetchLocalTripSetting = async (travelId: string): Promise<TripSetting | null> => {
  const settings = await database
    .get<TripSettingModel>("trip_settings")
    .query(Q.where("travel_id", travelId))
    .fetch();

  if (settings.length === 0) {
    return null;
  }

  const s = settings[0];
  return {
    id: s.id,
    travelId: travelId,
    currency: s.currency,
    timezone: s.timezone,
    itineraryView: s.itineraryView as "plain" | "compact" | "detailed",
    allowItemReordering: s.allowItemReordering,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
};

export const saveTripSettingLocally = async (settingData: TripSetting): Promise<TripSettingModel> => {
  return await database.write(async () => {
    let settingRecord: TripSettingModel | null = null;

    if (settingData.id) {
      try {
        settingRecord = await database.get<TripSettingModel>("trip_settings").find(settingData.id);
      } catch (e) {
        // Not found, will search by travelId
      }
    }

    if (!settingRecord && settingData.travelId) {
      const existing = await database
        .get<TripSettingModel>("trip_settings")
        .query(Q.where("travel_id", settingData.travelId))
        .fetch();
      if (existing.length > 0) {
        settingRecord = existing[0];
      }
    }

    if (settingRecord) {
      return await settingRecord.update((record) => {
        record.currency = settingData.currency;
        record.timezone = settingData.timezone;
        record.itineraryView = settingData.itineraryView;
        record.allowItemReordering = settingData.allowItemReordering;
        // @ts-ignore
        record.travel.id = settingData.travelId;
      });
    } else {
      return await database.get<TripSettingModel>("trip_settings").create((record) => {
        record.currency = settingData.currency;
        record.timezone = settingData.timezone;
        record.itineraryView = settingData.itineraryView;
        record.allowItemReordering = settingData.allowItemReordering;
        // @ts-ignore
        record.travel.id = settingData.travelId;
      });
    }
  });
};

export const deleteTripSettingLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const setting = await database.get<TripSettingModel>("trip_settings").find(id);
    await setting.destroyPermanently();
  });
};
