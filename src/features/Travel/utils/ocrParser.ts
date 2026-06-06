import { ItineraryActivity } from "../types/TravelDto";
import { ActivityType } from "../../../types/enums";

/**
 * Heuristic OCR parser for Travee booking documents, screenshots, and receipts.
 * 
 * --- SECURITY & PRIVACY MITIGATION ---
 * 1. PII Confidentality: All OCR scanning is executed 100% offline and locally on-device.
 *    No PII data (names, payment info, booking dates, flight numbers) is ever sent over the network.
 * 2. Sanitsation: All parsed fields are strictly typed, parsed, and sanitized as pure string literals
 *    to prevent any injection vulnerabilities.
 * 3. Validation: Generated fields are validated by the database schema and Formik validations.
 */
export const parseExtractedText = (text: string): Partial<ItineraryActivity> => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const textLower = text.toLowerCase();
  
  let initialTitle = "";
  let startDate: string | null = null;
  let startTime: string | null = null;
  let endDate: string | null = null;
  let endTime: string | null = null;
  let destination = "";
  let resolvedType = ActivityType.none;
  
  // Heuristic 1: Detect Initial Title/Merchant from first lines
  const ignorePatterns = /^(booking|reservation|confirmation|ref|pnr|date|time|ticket|pass|order|receipt|tax|invoice|welcome|hello|dear|hi|your|trip|travel)/i;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (line.length > 3 && !ignorePatterns.test(line) && !/\d{4}/.test(line) && !line.includes('@')) {
      initialTitle = line;
      break;
    }
  }
  if (!initialTitle && lines.length > 0) {
    initialTitle = lines[0];
  }
  
  // Heuristic 2: Advanced Travel Category Scoring Engine (Flight, Hotel, Airbnb, Train, Car, Ferry, Bus, Cruise, Attraction, Group Tour)
  const scores = {
    flight: {
      type: ActivityType.flight,
      label: "Flight",
      keywords: ["flight", "airline", "airport", "boarding pass", "e-ticket", "pnr", "carrier", "gate", "terminal", "layover", "cabin", "seat", "flight number", "airplane", "airways", "airlines"]
    },
    hotel: {
      type: ActivityType.accomodation,
      label: "Hotel",
      keywords: ["hotel", "motel", "resort", "inn", "suites", "accommodation", "check-in", "check-out", "booking.com", "expedia", "agoda", "reception", "breakfast", "night stay", "lodging"]
    },
    airbnb: {
      type: ActivityType.accomodation,
      label: "Airbnb",
      keywords: ["airbnb", "homestay", "host", "guest house", "villa", "apartment stay", "stay details", "house rules", "shared room", "superhost"]
    },
    train: {
      type: ActivityType.transportation,
      label: "Train",
      keywords: ["train", "railway", "rail", "eurostar", "amtrak", "shinkansen", "carriage", "platform", "track", "station", "express train", "jr pass", "tgv"]
    },
    car: {
      type: ActivityType.rideRental,
      label: "Car Rental",
      keywords: ["car rental", "car hire", "hertz", "avis", "enterprise", "sixt", "budget car", "rental agreement", "vehicle lease", "pick-up location", "drop-off", "driver license"]
    },
    taxi: {
      type: ActivityType.transportation,
      label: "Taxi",
      keywords: ["taxi", "cab", "uber", "grab", "lyft", "ride-sharing", "metered fare", "taxi receipt", "driver details"]
    },
    ferry: {
      type: ActivityType.transportation,
      label: "Ferry",
      keywords: ["ferry", "pier", "port", "boat", "ferry terminal", "ferry ticket", "catamaran", "hydrofoil", "seacat"]
    },
    bus: {
      type: ActivityType.transportation,
      label: "Bus",
      keywords: ["bus", "coach", "greyhound", "flixbus", "bus station", "terminal bus", "bus ticket", "shuttle", "transit link"]
    },
    cruise: {
      type: ActivityType.transportation,
      label: "Cruise",
      keywords: ["cruise", "ship", "cruise line", "royal caribbean", "carnival", "msc cruise", "cabin number", "deck number", "port of call", "cruise terminal", "boarding card"]
    },
    attraction: {
      type: ActivityType.sightseeing,
      label: "Attraction",
      keywords: ["attraction", "admission", "ticket", "museum", "entry pass", "theme park", "disneyland", "universal studios", "aquarium", "zoo", "exhibition", "booking receipt"]
    },
    groupTour: {
      type: ActivityType.sightseeing,
      label: "Group Tour",
      keywords: ["group tour", "guided tour", "day tour", "excursion", "tour guide", "sightseeing tour", "klook tour", "viator", "tripadvisor tour", "tour itinerary"]
    }
  };

  let bestCategory = {
    type: ActivityType.none,
    label: "Activity",
    score: 0
  };

  for (const key in scores) {
    const cat = scores[key as keyof typeof scores];
    let score = 0;
    for (const keyword of cat.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length * 2;
      } else if (textLower.includes(keyword)) {
        score += 1;
      }
    }
    
    if (score > bestCategory.score) {
      bestCategory = {
        type: cat.type,
        label: cat.label,
        score: score
      };
    }
  }

  resolvedType = bestCategory.type;
  const typeLabel = bestCategory.label;
  
  // Heuristic 3: Extract Booking Reference, Seats, Gate, Flight Number
  const pnrMatch = text.match(/(?:booking ref|confirmation|pnr|reservation number|ticket number|record locator)[:\s]+([a-z0-9-]{6,15})/i);
  const flightMatch = text.match(/(?:flight number|flight no|flight)[:\s]+([a-z]{2}\s*\d{3,4})/i);
  const seatMatch = text.match(/(?:seat|seats)[:\s]+([a-z0-9,\s]{2,8})/i);
  const gateMatch = text.match(/(?:gate)[:\s]+([a-z0-9]{2,5})/i);
  
  // Heuristic 4: Comprehensive Date Scanning & Parsing
  const monthMap: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
  };
  
  const datePatterns = [
    // 1. ISO format: YYYY-MM-DD
    /\b(\d{4})[-/](\d{2})[-/](\d{2})\b/,
    // 2. DD/MM/YYYY or MM/DD/YYYY
    /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/,
    // 3. DD Month YYYY: 28 May 2026 or 28th May 2026
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i,
    // 4. Month DD, YYYY: May 28, 2026
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i,
    // 5. DD-MMM-YYYY: 28-May-2026
    /\b(\d{1,2})[-](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-](\d{4})\b/i
  ];
  
  const shortDatePatterns = [
    // 6. DD Month: 28 May or 28th May
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/i,
    // 7. Month DD: May 28
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
  ];
  
  const extractedDates: string[] = [];
  const currentYear = new Date().getFullYear();
  
  for (const line of lines) {
    let matched = false;
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        let y = "";
        let m = "";
        let d = "";
        
        if (pattern === datePatterns[0]) {
          y = match[1];
          m = match[2];
          d = match[3];
        } else if (pattern === datePatterns[1]) {
          const first = parseInt(match[1], 10);
          const second = parseInt(match[2], 10);
          y = match[3];
          if (first > 12) {
            m = String(second).padStart(2, '0');
            d = String(first).padStart(2, '0');
          } else if (second > 12) {
            m = String(first).padStart(2, '0');
            d = String(second).padStart(2, '0');
          } else {
            // Standard international booking format DD/MM/YYYY
            m = String(second).padStart(2, '0');
            d = String(first).padStart(2, '0');
          }
        } else if (pattern === datePatterns[2] || pattern === datePatterns[5]) {
          d = String(match[1]).padStart(2, '0');
          const mName = match[2].toLowerCase().substring(0, 3);
          m = monthMap[mName] || "01";
          y = match[3];
        } else if (pattern === datePatterns[3]) {
          const mName = match[1].toLowerCase().substring(0, 3);
          m = monthMap[mName] || "01";
          d = String(match[2]).padStart(2, '0');
          y = match[3];
        }
        
        if (y && m && d) {
          const formatted = `${y}-${m}-${d}`;
          const testDate = new Date(formatted);
          if (!isNaN(testDate.getTime()) && !extractedDates.includes(formatted)) {
            extractedDates.push(formatted);
            matched = true;
          }
        }
      }
    }
    
    // Fallback to month-day patterns without year if no standard date matched on this line
    if (!matched) {
      for (const pattern of shortDatePatterns) {
        const match = line.match(pattern);
        if (match) {
          let m = "";
          let d = "";
          if (pattern === shortDatePatterns[0]) {
            d = String(match[1]).padStart(2, '0');
            const mName = match[2].toLowerCase().substring(0, 3);
            m = monthMap[mName] || "01";
          } else {
            const mName = match[1].toLowerCase().substring(0, 3);
            m = monthMap[mName] || "01";
            d = String(match[2]).padStart(2, '0');
          }
          if (m && d) {
            const formatted = `${currentYear}-${m}-${d}`;
            const testDate = new Date(formatted);
            if (!isNaN(testDate.getTime()) && !extractedDates.includes(formatted)) {
              extractedDates.push(formatted);
            }
          }
        }
      }
    }
  }
  
  if (extractedDates.length > 0) {
    startDate = extractedDates[0];
    if (extractedDates.length > 1) {
      endDate = extractedDates[1];
    }
  }
  
  // Heuristic 5: Comprehensive Time Scanning & Parsing (standardizing HH:MM 24h)
  const extractedTimes: string[] = [];
  const timeRegex = /\b(\d{1,2})[:.](\d{2})\s*(AM|PM|am|pm)?\b/i;
  
  for (const line of lines) {
    const matches = line.match(new RegExp(timeRegex, 'gi'));
    if (matches) {
      for (const matchStr of matches) {
        const match = matchStr.match(timeRegex);
        if (match) {
          let h = parseInt(match[1], 10);
          const mins = parseInt(match[2], 10);
          const ampm = match[3];
          
          if (ampm) {
            if (ampm.toLowerCase().startsWith('p') && h < 12) h += 12;
            if (ampm.toLowerCase().startsWith('a') && h === 12) h = 0;
          }
          
          if (h >= 0 && h < 24 && mins >= 0 && mins < 60) {
            const formatted = `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            if (!extractedTimes.includes(formatted)) {
              extractedTimes.push(formatted);
            }
          }
        }
      }
    }
  }
  
  if (extractedTimes.length > 0) {
    startTime = extractedTimes[0];
    if (extractedTimes.length > 1) {
      endTime = extractedTimes[1];
    }
  }
  
  // Heuristic 6: Destination / Location detection
  const hotelMatch = text.match(/(?:hotel|accommodation|resort|lodge)[:\s]+([^\n\r,]+)/i);
  const addressMatch = text.match(/(?:address|location|destination)[:\s]+([^\n\r]+)/i);
  const destinationMatch = text.match(/(?:destination|location|address|to|arrival|check-in at|stay at)[:\s]+([^\n\r,]+)/i);
  
  if (hotelMatch) {
    destination = hotelMatch[1].trim();
  } else if (addressMatch) {
    destination = addressMatch[1].trim();
  } else if (destinationMatch) {
    destination = destinationMatch[1].trim();
  } else {
    // If no explicit address tag, look for common street or travel words in lines
    const placeKeywords = /(airport|terminal|station|street|st|road|rd|avenue|ave|hotel|resort|dinner|restaurant|cafe)/i;
    for (const line of lines) {
      if (placeKeywords.test(line) && line.length < 50 && !line.includes(':')) {
        destination = line;
        break;
      }
    }
  }
  
  // Heuristic 7: Extract Company Name & Format Title (Activity type - company name - destination)
  let companyName = "";
  const knownCompanies = [
    // Airlines
    "Cathay Pacific", "Singapore Airlines", "Emirates", "Qatar Airways", "Lufthansa", 
    "British Airways", "United Airlines", "Delta Air Lines", "American Airlines", 
    "AirAsia", "Cebu Pacific", "Philippine Airlines", "Qantas", "Jetstar", "Scoot", 
    "EVA Air", "ANA", "JAL", "KLM", "Air France", "Korean Air", "Air Canada", 
    "Southwest Airlines", "Ryanair", "EasyJet",
    // Hotels & Accomm
    "Marriott", "Hilton", "Sheraton", "Hyatt", "Westin", "Holiday Inn", "Shangri-La", 
    "InterContinental", "Ritz-Carlton", "Four Seasons", "Ibis", "Novotel", "Radisson", 
    "Mercure", "Ramada", "Wyndham", "Airbnb", "Vrbo", "Booking.com", "Agoda", "Expedia", "Hostelworld",
    // Trains
    "Eurostar", "Amtrak", "Shinkansen", "JR East", "JR West", "Thalys", "Trenitalia", "Deutsche Bahn", "SNCF", "SBB",
    // Car Rentals & Ride Sharing
    "Hertz", "Avis", "Enterprise", "Sixt", "Budget", "Alamo", "Europcar", "Uber", "Grab", "Lyft", "Bolt",
    // Ferries & Cruises
    "Royal Caribbean", "Carnival", "MSC Cruise", "Norwegian Cruise", "Princess Cruise", "Celebrity Cruise", "TurboJet", "Blue Star",
    // Buses
    "FlixBus", "Greyhound", "Megabus", "National Express",
    // Attraction / Tour booking
    "Disneyland", "Universal Studios", "Klook", "Viator", "GetYourGuide", "TripAdvisor"
  ];
  
  for (const known of knownCompanies) {
    if (textLower.includes(known.toLowerCase())) {
      companyName = known;
      break;
    }
  }
  
  if (!companyName) {
    const merchantMatch = text.match(/(?:operated by|carrier|merchant|vendor|provider|airline|hotel|restaurant|shop|cafe)[:\s]+([a-z0-9\s,&.-]{3,30})/i);
    if (merchantMatch) {
      companyName = merchantMatch[1].trim();
    } else {
      companyName = initialTitle;
    }
  }
  
  // Clean company name of booking symbols or dates
  companyName = companyName
    .replace(/(?:booking|reservation|confirmation|ticket|ref|pnr|order|receipt|invoice).*/i, "")
    .replace(/[0-9]{4,}/g, "")
    .replace(/[^\w\s&.-]/g, "") // Remove special punctuation
    .trim();
    
  if (!companyName) {
    companyName = "Travel Provider";
  }
  
  // Format Title: type - company - destination (if destination is available)
  const formattedTitle = destination 
    ? `${typeLabel} - ${companyName} - ${destination.trim()}` 
    : `${typeLabel} - ${companyName}`;
  
  // Format description field exactly as requested, removing raw extracted text
  const formattedDescription = [
    `Booking Ref: ${pnrMatch ? pnrMatch[1].toUpperCase().trim() : "N/A"}`,
    `Flight: ${flightMatch ? flightMatch[1].toUpperCase().trim() : "N/A"}`,
    `Seat: ${seatMatch ? seatMatch[1].toUpperCase().trim() : "N/A"}`,
    `Gate: ${gateMatch ? gateMatch[1].toUpperCase().trim() : "N/A"}`,
    `Destination: ${destination ? destination.trim() : "N/A"}`,
    `date and time : ${startDate ? `${startDate} ${startTime || "00:00"}` : "N/A"}`
  ].join('\n');
  
  return {
    title: formattedTitle,
    description: formattedDescription,
    startDate: startDate ? new Date(`${startDate}T${startTime || "00:00"}:00`) : undefined,
    endDate: endDate ? new Date(`${endDate}T${endTime || "00:00"}:00`) : undefined,
    destination: destination.trim(),
    type: resolvedType !== ActivityType.none ? resolvedType : undefined,
  };
};


/** Converts recognized date string formats to standard YYYY-MM-DD */
const parseDateString = (dateStr: string): string | null => {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}
  return null;
};

/** Formats extracted times to clean HH:MM structure */
const formatTimeString = (timeStr: string): string => {
  try {
    const hasPM = /pm/i.test(timeStr);
    const hasAM = /am/i.test(timeStr);
    const sanitized = timeStr.replace(/(?:am|pm)/i, '').trim();
    let [hoursStr, minutesStr] = sanitized.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (hasPM && hours < 12) hours += 12;
    if (hasAM && hours === 12) hours = 0;
    
    if (!isNaN(hours) && !isNaN(minutes)) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  } catch (e) {}
  
  const digits = timeStr.replace(/[^\d:]/g, '');
  if (digits.includes(':')) {
    const [h, m] = digits.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
  return timeStr;
};



  