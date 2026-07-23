import { useCallback } from 'react';
import { LexoRank } from 'lexorank';

export const useLexicographicSort = () => {
  const generateSortOrder = useCallback((prev: string | null | undefined, next: string | null | undefined): string => {
    const tryParseRank = (val: string | null | undefined): LexoRank | null => {
      if (!val) return null;
      try {
        if (/^\d+$/.test(val)) {
          return null;
        }
        return LexoRank.parse(val);
      } catch (e) {
        return null;
      }
    };

    try {
      const prevRank = tryParseRank(prev);
      const nextRank = tryParseRank(next);

      if (!prevRank && !nextRank) {
        return LexoRank.middle().toString();
      }
      if (!prevRank) {
        return LexoRank.min().between(nextRank!).toString();
      }
      if (!nextRank) {
        return prevRank.between(LexoRank.max()).toString();
      }

      if (prevRank.toString() === nextRank.toString()) {
        return prevRank.genNext().toString();
      }
      if (prevRank.compareTo(nextRank) > 0) {
        return nextRank.between(prevRank).toString();
      }

      return prevRank.between(nextRank).toString();
    } catch (e: any) {
      console.warn("LexoRank generation failed, falling back to middle:", e.message);
      return LexoRank.middle().toString();
    }
  }, []);

  return { generateSortOrder };
};
