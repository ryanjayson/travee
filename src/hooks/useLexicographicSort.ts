import { useCallback } from 'react';
import { LexoRank } from 'lexorank';

export const useLexicographicSort = () => {
  const generateSortOrder = useCallback((prev: string | null | undefined, next: string | null | undefined): string => {
    try {
      if (!prev && !next) {
        return LexoRank.middle().toString();
      }
      if (!prev) {
        const nextRank = LexoRank.parse(next!);
        return LexoRank.min().between(nextRank).toString();
      }
      if (!next) {
        const prevRank = LexoRank.parse(prev);
        return prevRank.between(LexoRank.max()).toString();
      }

      const prevRank = LexoRank.parse(prev);
      const nextRank = LexoRank.parse(next);

      if (prev === next) {
        return prevRank.genNext().toString();
      }
      if (prev > next) {
        // If chronological neighbors are lexicographically inverted, just swap them to find the middle
        return nextRank.between(prevRank).toString();
      }

      return prevRank.between(nextRank).toString();
    } catch (e) {
      console.error("LexoRank generation failed", e);
      // Fallback in case of parse error
      if (prev) {
        try {
          return LexoRank.parse(prev).between(LexoRank.max()).toString();
        } catch (err) {
          return LexoRank.middle().toString();
        }
      }
      return LexoRank.middle().toString();
    }
  }, []);

  return { generateSortOrder };
};
