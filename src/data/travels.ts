import {
  Travel,
  ItinerarySection,
  ItineraryActivity,
} from "../features/Travel/types/TravelDto";
import { TravelStatus, ActivityType } from "../types/enums";

export const sampleActivities: ItineraryActivity[] = [
  {
    id: 0,
    sectionId: 0,
    title: "Meiji Shrine",
    description:
      "One of Tokyo's most revered religious sites, Meiji Shrine is located in a lush and spacious forest area in the middle of the dense cityscape. The grounds' walking paths are great for a relaxing stroll and provide solace from the bustle of the nearby streets of Harajuku.",
    commentsCount: 10,
    notesCount: 23,
    primaryType: ActivityType.walk,
    startDate: new Date(),
    images: [
      {
        title: "shibuya",
        url: "https://www.japan-guide.com/g7/3051_shibuya.jpg",
      },
    ],
  },
  {
    id: 1,
    title: "Takeshita Street",
    sectionId: 0,
    description:
      "Explore the trendy shops and boutiques of this bustling hotbed of fashion and youth culture. Be prepared for huge crowds at weekends and other peak periods, and note that most shops here do not open until 11am.",
    commentsCount: 19,
    notesCount: 3,
    primaryType: ActivityType.sightseeing,
  },
  {
    id: 3,
    title: "Omotesando",
    sectionId: 1,
    description:
      "Around one kilometer in length and lined with trees, Omotesando is home to numerous mid and high end stores, fashion boutiques, cafes and restaurants; including those within the stylish Omotesando Hills mall.",
    commentsCount: 10,
    notesCount: 23,
    primaryType: ActivityType.walk,
    images: [
      {
        title: "shibuya",
        url: "https://www.japan-guide.com/g7/3051_takeshitadori.jpg",
      },
    ],
  },
  {
    id: 4,
    title: "Explore Shibuya",
    sectionId: 0,
    description:
      "Continue south and turn right after the Parco Department Store down toward the Spain Slope, Tokyu Hands and Center Gai. Check out the famous Shibuya Crossing and Hachiko Statue next to Shibuya Station.",
    commentsCount: 19,
    notesCount: 3,
    primaryType: ActivityType.shopping,
  },
  {
    id: 5,
    title: "Explore Shinjuku",
    sectionId: 1,
    description:
      "Walk to the Tokyo Metropolitan Government Building and head up to the observation deck. Afterwards spend the rest of your time explore the shops and restaurants around Shinjuku.",
    commentsCount: 19,
    notesCount: 3,
  },
  {
    id: 6,
    title: "Yoyogi Park",
    sectionId: 2,
    description: "A spacious public park in Western Tokyo.",
    commentsCount: 19,
    notesCount: 3,
  },
  {
    id: 7,
    title: "Kabukicho ",
    sectionId: 2,
    description:
      "Japan's largest red light district features countless restaurants, bars, nightclubs, pachinko parlors, love hotels and a wide variety of red light establishments for both sexes and sexual orientations. Explore with caution and beware of exorbitant cover fees.",
    commentsCount: 19,
    notesCount: 3,
  },
];

export const sampleTravel: Travel[] = [
  {
    id: 0,
    title: "Winter in Japan 2025",
    description:
      "Winter in Japan 2025 with the fam, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
    destination: "Japan",
    status: TravelStatus.Upcoming,
    startDate: new Date(),
    endDate: new Date(),
    itinerarySection: [
      {
        id: 3,
        title: "Tokyo",
        description:
          "Tokyo drift. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ",
        itineraryActivity: sampleActivities.filter((a) => a.sectionId == 0),
      },
      {
        id: 1,
        title: "Osaka",
        itineraryActivity: sampleActivities.filter((a) => a.sectionId == 1),
        description:
          "Osaka night travel, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ",
      },
      {
        id: 2,
        title: "Kyoto",
        itineraryActivity: sampleActivities.filter((a) => a.sectionId == 2),
        description:
          "Kyoto Era travel, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ",
      },
    ],
  },
];
