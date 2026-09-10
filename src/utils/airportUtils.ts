export interface ParsedAirport {
  code: string;
  name: string;
}

export const parseAirport = (airportStr: string | null | undefined): ParsedAirport => {
  if (!airportStr) return { code: "", name: "" };

  const str = airportStr.trim();
  if (!str) return { code: "", name: "" };

  // 1. Try to find the last opening parenthesis '('
  const lastParenIndex = str.lastIndexOf("(");
  if (lastParenIndex !== -1) {
    const afterParen = str.slice(lastParenIndex + 1).trim();
    // Match the first 3 alphanumeric characters as the IATA code
    const codeMatch = afterParen.match(/^([a-z0-9]{3})/i);
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();
      const name = str.slice(0, lastParenIndex).trim();
      return { code, name: name || code };
    }
  }

  // 2. Try to find the last opening bracket '['
  const lastBracketIndex = str.lastIndexOf("[");
  if (lastBracketIndex !== -1) {
    const afterBracket = str.slice(lastBracketIndex + 1).trim();
    const codeMatch = afterBracket.match(/^([a-z0-9]{3})/i);
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();
      const name = str.slice(0, lastBracketIndex).trim();
      return { code, name: name || code };
    }
  }

  // 3. Fallback to other patterns if no parenthesis or bracket is found
  // Match patterns like "MNL - Name" or "Name - MNL"
  const dashMatchStart = str.match(/^([a-z0-9]{3})\s*[-–—]\s*(.+)$/i);
  if (dashMatchStart) {
    return { code: dashMatchStart[1].trim().toUpperCase(), name: dashMatchStart[2].trim() };
  }

  const dashMatchEnd = str.match(/^(.+?)\s*[-–—]\s*([a-z0-9]{3})$/i);
  if (dashMatchEnd) {
    return { code: dashMatchEnd[2].trim().toUpperCase(), name: dashMatchEnd[1].trim() };
  }

  // Match pure 3-letter alphanumeric code
  if (/^[a-z0-9]{3}$/i.test(str)) {
    return { code: str.toUpperCase(), name: str.toUpperCase() };
  }

  return { code: "", name: str };
};
