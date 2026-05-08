import { useCallback } from 'react';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const useLexicographicSort = () => {
  const getCharIndex = (char: string) => ALPHABET.indexOf(char);
  const getChar = (index: number) => ALPHABET[index];

  const midpoint = (prev: string, next: string): string => {
    let result = "";
    let pos = 0;
    
    while (true) {
      const pChar = pos < prev.length ? prev[pos] : ALPHABET[0];
      const nChar = pos < next.length ? next[pos] : ALPHABET[ALPHABET.length - 1];
      
      const pIdx = getCharIndex(pChar);
      const nIdx = getCharIndex(nChar);
      
      if (pIdx === -1 || nIdx === -1) {
        // Fallback for unexpected characters
        return prev + getChar(Math.floor(ALPHABET.length / 2));
      }
      
      if (pIdx === nIdx) {
        result += pChar;
        pos++;
        continue;
      }
      
      if (nIdx - pIdx > 1) {
        result += getChar(Math.floor((pIdx + nIdx) / 2));
        return result;
      }
      
      // Difference is exactly 1.
      result += pChar;
      pos++;
      
      while (true) {
        const nextPChar = pos < prev.length ? prev[pos] : ALPHABET[0];
        const nextPIdx = getCharIndex(nextPChar);
        
        if (nextPIdx < ALPHABET.length - 1) {
          result += getChar(Math.floor((nextPIdx + ALPHABET.length) / 2));
          return result;
        }
        result += nextPChar;
        pos++;
      }
    }
  };

  const generateSortOrder = useCallback((prev: string | null | undefined, next: string | null | undefined): string => {
    const p = prev || null;
    const n = next || null;

    if (!p && !n) {
      return getChar(Math.floor(ALPHABET.length / 2)); 
    }
    if (!p) {
      return midpoint(ALPHABET[0], n!);
    }
    if (!n) {
      return midpoint(p, ALPHABET[ALPHABET.length - 1]);
    }
    
    // ensure prev < next
    if (p >= n) {
      // Fallback if they are equal or out of order due to a bug.
      return p + getChar(Math.floor(ALPHABET.length / 2));
    }
    
    return midpoint(p, n);
  }, []);

  return { generateSortOrder };
};
