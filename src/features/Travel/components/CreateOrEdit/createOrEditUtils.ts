import { MaterialIcons as Icon } from '@expo/vector-icons';
import { TravelStatus, TripType, getTripTypeLabel } from '../../../../types/enums';
import { Travel } from '../../types/TravelDto';

/**
 * Extracts city name from a destination string (before the first comma).
 */
export const getCityOnly = (destination?: string): string => {
  if (!destination) return '';
  return destination.split(',')[0].trim();
};

/**
 * Returns user-facing label for a trip type.
 */
export const getTripTypeName = (type: TripType): string => {
  if (type === undefined || type === null || type === TripType.none) return '';
  const label = getTripTypeLabel(type);
  if (label) return label;
  return String(TripType[type])
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

/**
 * Formats a departure date as DD.MM.YY.
 */
export const formatDepartureDate = (date: Date | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
};

/**
 * Progressive title suggestion generator based on destination, type, and date.
 */
export const generateTitleSuggestion = (
  destination: string,
  type: TripType,
  date: Date | null | undefined
): string => {
  const cityName = getCityOnly(destination);
  if (!cityName) return '';

  const tripTypeName = getTripTypeName(type);
  const dateStr = formatDepartureDate(date);

  if (tripTypeName && dateStr) {
    return `${tripTypeName} in ${cityName} [${dateStr}]`;
  }
  if (tripTypeName) {
    return `${tripTypeName} in ${cityName}`;
  }
  if (dateStr) {
    return `${cityName} Trip [${dateStr}]`;
  }
  return `${cityName} Trip`;
};

/**
 * Computes the effective travel status based on dates.
 */
export const computeEffectiveTripStatus = (
  startOrDepartureDate?: Date | null,
  endOrReturnDate?: Date | null,
  currentTripStatus?: TravelStatus
): TravelStatus => {
  if (
    currentTripStatus === TravelStatus.Past ||
    currentTripStatus === TravelStatus.Archieved ||
    currentTripStatus === TravelStatus.Cancelled
  ) {
    return currentTripStatus;
  }
  if (!startOrDepartureDate) return TravelStatus.Draft;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startOrDepartureDate);
  start.setHours(0, 0, 0, 0);

  const end = endOrReturnDate ? new Date(endOrReturnDate) : start;
  end.setHours(0, 0, 0, 0);

  if (end < today) return TravelStatus.Past;
  return start > today ? TravelStatus.Upcoming : TravelStatus.Travelling;
};

/**
 * Computes calendar blocked dates from existing travels.
 */
export const computeBlockedTravelDates = (
  travels: Travel[] | undefined,
  currentTripId?: string
): Record<string, any> => {
  const dates: Record<string, any> = {};
  if (!travels) return dates;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const excludedStatuses = new Set<TravelStatus>([
    TravelStatus.Cancelled,
    TravelStatus.Archieved,
    TravelStatus.Past,
  ]);

  travels.forEach((t) => {
    if (currentTripId && t.id === currentTripId) return;
    if (t.isArchived || excludedStatuses.has(t.status as TravelStatus)) {
      return;
    }

    if (t.startOrDepartureDate) {
      const start = new Date(t.startOrDepartureDate);
      start.setHours(0, 0, 0, 0);
      const end = t.endOrReturnDate ? new Date(t.endOrReturnDate) : start;
      end.setHours(0, 0, 0, 0);

      if (end >= today) {
        const current = new Date(start);
        const isTravelling = start <= today && end >= today;
        const color = isTravelling ? '#E8F5E8' : '#E3F2FD';
        const textColor = isTravelling ? '#2E7D32' : '#263F69';

        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0];
          dates[dateStr] = {
            disableTouchEvent: true,
            selected: true,
            color,
            textColor,
          };
          current.setDate(current.getDate() + 1);
        }
      }
    }
  });

  return dates;
};

/**
 * Computes marked range dates for calendar display.
 */
export const computeMarkedDates = (
  start: Date | null,
  end: Date | null,
  blockedDates: Record<string, any>
): Record<string, any> => {
  const marked: Record<string, any> = {};

  if (start && !isNaN(start.getTime())) {
    const startStr = start.toISOString().split('T')[0];
    marked[startStr] = {
      startingDay: true,
      selected: true,
      color: '#263F69',
      textColor: '#ffffff',
    };

    if (end && !isNaN(end.getTime())) {
      const endStr = end.toISOString().split('T')[0];
      marked[endStr] = {
        endingDay: true,
        selected: true,
        color: '#263F69',
        textColor: '#ffffff',
      };

      const current = new Date(start.getTime());
      current.setDate(current.getDate() + 1);

      while (
        current.toDateString() !== end.toDateString() &&
        current < end
      ) {
        const midStr = current.toISOString().split('T')[0];
        marked[midStr] = {
          selected: true,
          color: '#263F6920',
          textColor: '#ffffff',
        };
        current.setDate(current.getDate() + 1);
      }
    }
  }

  return {
    ...blockedDates,
    ...marked,
  };
};

/**
 * Checks if any date between start and end is blocked.
 */
export const hasBlockedDateInRange = (
  start: Date,
  end: Date,
  blockedDates: Record<string, any>
): boolean => {
  const current = new Date(start.getTime());
  current.setDate(current.getDate() + 1);

  while (current.getTime() < end.getTime()) {
    const dateStr = current.toISOString().split('T')[0];
    if (blockedDates[dateStr]) {
      return true;
    }
    current.setDate(current.getDate() + 1);
  }
  return false;
};

/**
 * Generates a standard UUID-v4-like session token for Google Places requests.
 */
export const generateSessionToken = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Maps Google Places place types to suitable MaterialIcons glyphs.
 */
export const getPlaceTypeIcon = (
  types?: string[]
): keyof typeof Icon.glyphMap => {
  if (!types || types.length === 0) return 'place';
  const typeStr = types.join(' ').toLowerCase();

  if (
    typeStr.includes('country') ||
    typeStr.includes('administrative_area_level_1') ||
    typeStr.includes('region')
  ) {
    return 'flag';
  }
  if (
    typeStr.includes('locality') ||
    typeStr.includes('city') ||
    typeStr.includes('town') ||
    typeStr.includes('administrative_area')
  ) {
    return 'location-city';
  }
  if (typeStr.includes('airport') || typeStr.includes('flight')) {
    return 'flight';
  }
  if (
    typeStr.includes('island') ||
    typeStr.includes('beach') ||
    typeStr.includes('natural_feature') ||
    typeStr.includes('park')
  ) {
    return 'terrain';
  }

  return 'place';
};
