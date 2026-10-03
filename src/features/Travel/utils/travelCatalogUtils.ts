import { Travel } from '../types/TravelDto';
import { TravelStatus } from '../../../types/enums';

/**
 * Determines the effective display status for a travel plan.
 */
export const getEffectiveStatus = (travel: Travel): TravelStatus => {
  if (
    travel.status === TravelStatus.Past ||
    travel.status === TravelStatus.Archieved ||
    travel.status === TravelStatus.Cancelled
  ) {
    return travel.status || TravelStatus.Draft;
  }

  if (!travel.startOrDepartureDate) {
    return TravelStatus.Draft;
  }
  return travel.status;
};

/**
 * Normalizes a date value (Date, string, ISO format) to a midnight millisecond timestamp.
 */
export const getNormalizedDate = (dateVal: any): number => {
  if (!dateVal) return 0;
  let d: Date;
  if (dateVal instanceof Date) {
    d = dateVal;
  } else {
    const str = String(dateVal);
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day).getTime();
    }
    d = new Date(dateVal);
  }
  if (!d || isNaN(d.getTime())) return 0;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/**
 * Formats a date into a localized "Mon DD" string.
 */
export const formatDate = (dateValue: Date | string | undefined): string => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Computes duration in days between two dates.
 */
export const getDuration = (
  start: Date | string | undefined,
  end: Date | string | undefined
): string => {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = Math.abs(e.getTime() - s.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} trip`;
};

/**
 * Extracts 2-digit day and uppercase short month from a date.
 */
export const getStartDateParts = (
  dateInput?: string | Date
): { day: string | null; month: string | null } => {
  if (!dateInput) return { day: null, month: null };
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return { day: null, month: null };
    const day = d
      .toLocaleDateString('en-US', { day: '2-digit' })
      .toUpperCase();
    const month = d
      .toLocaleDateString('en-US', { month: 'short' })
      .toUpperCase();
    return { day, month };
  } catch {
    return { day: null, month: null };
  }
};

/**
 * Computes a human-readable countdown label (Today, Tomorrow, In X days, Xd ago).
 */
export const getCountdownLabel = (dateInput?: string | Date): string => {
  if (!dateInput) return '';
  try {
    const tripDate = new Date(dateInput);
    tripDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = tripDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)}d ago`;
  } catch {
    return '';
  }
};

/**
 * Extracts an array of destination strings from a travel object.
 */
export const getValidDestinations = (travel: Travel): string[] => {
  if (travel.tripDestinations && travel.tripDestinations.length > 0) {
    return travel.tripDestinations
      .map((d: any) => d.destination)
      .filter(Boolean);
  }
  if (travel.destination) {
    return travel.destination
      .split(' | ')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * Builds a readable destination label for travel cards.
 */
export const getDestinationLabel = (
  validDestinations: string[],
  travel: Travel
): string => {
  if (validDestinations.length > 1) {
    return `${validDestinations.length} destinations`;
  }
  const country = travel.destinationData?.country;
  if (validDestinations.length === 1) {
    const single = validDestinations[0];
    if (country === single) return single;
    return country ? `${single}, ${country}` : single;
  }
  if (country === travel.destination) {
    return travel.destination || '';
  }
  return travel.destination
    ? `${travel.destination}${country ? `, ${country}` : ''}`
    : '';
};

export interface StatusColors {
  bg: string;
  text: string;
  label: string;
}

/**
 * Returns color tokens and display label for a travel status.
 */
export const getStatusColors = (status: TravelStatus): StatusColors => {
  switch (status) {
    case TravelStatus.Travelling:
      return { bg: '#DCFAE6', text: '#079455', label: 'Travelling' };
    case TravelStatus.Upcoming:
      return {
        bg: 'rgba(185, 230, 254, 0.4)',
        text: '#0EA5E9',
        label: 'Upcoming',
      };
    case TravelStatus.Draft:
      return { bg: '#E0E0E0', text: '#666666', label: 'Draft' };
    case TravelStatus.Past:
      return { bg: '#fab00f', text: '#FFFFFF', label: 'Past' };
    default:
      return { bg: '#E0E0E0', text: '#666666', label: 'Unknown' };
  }
};
