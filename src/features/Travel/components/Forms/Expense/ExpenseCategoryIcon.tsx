import React from "react";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { ExpenseCategory } from "../../../../../types/enums";

interface ExpenseCategoryIconProps {
  category?: ExpenseCategory;
  size?: number;
  color?: string;
}

export const getExpenseCategoryColor = (category?: ExpenseCategory): string => {
  switch (category) {
    case ExpenseCategory.FoodAndDining:
      return "#FF5722"; // Coral/Deep Orange
    case ExpenseCategory.Transportation:
      return "#2196F3"; // Blue
    case ExpenseCategory.Accommodation:
      return "#9C27B0"; // Purple
    case ExpenseCategory.Shopping:
      return "#E91E63"; // Pink
    case ExpenseCategory.Entertainment:
      return "#673AB7"; // Deep Purple
    case ExpenseCategory.Sightseeing:
      return "#FF9800"; // Orange
    case ExpenseCategory.HealthAndWellness:
      return "#EC407A"; // Rose Pink
    case ExpenseCategory.Gifts:
      return "#E040FB"; // Magenta
    case ExpenseCategory.Insurance:
      return "#607D8B"; // Slate Blue/Grey
    case ExpenseCategory.Emergency:
      return "#F44336"; // Red
    case ExpenseCategory.Subscriptions:
      return "#00BCD4"; // Cyan
    case ExpenseCategory.BankAndFees:
      return "#795548"; // Brown
    case ExpenseCategory.Communication:
      return "#009688"; // Teal
    case ExpenseCategory.Fuel:
      return "#FFC107"; // Amber
    case ExpenseCategory.Activities:
      return "#4CAF50"; // Green
    case ExpenseCategory.Laundry:
      return "#03A9F4"; // Light Blue
    case ExpenseCategory.VisasAndDocuments:
      return "#455A64"; // Charcoal
    case ExpenseCategory.Others:
      return "#9E9E9E"; // Neutral Grey
    case ExpenseCategory.None:
    default:
      return "#9E9E9E"; // Grey
  }
};

const ExpenseCategoryIcon = ({
  category,
  size = 24,
  color,
}: ExpenseCategoryIconProps) => {
  let iconName = "more-horiz";
  const resolvedColor = color ?? getExpenseCategoryColor(category);

  switch (category) {
    case ExpenseCategory.FoodAndDining:
      iconName = "restaurant";
      break;
    case ExpenseCategory.Transportation:
      iconName = "commute";
      break;
    case ExpenseCategory.Accommodation:
      iconName = "hotel";
      break;
    case ExpenseCategory.Shopping:
      iconName = "shopping-bag";
      break;
    case ExpenseCategory.Entertainment:
      iconName = "local-movies";
      break;
    case ExpenseCategory.Sightseeing:
      iconName = "photo-camera";
      break;
    case ExpenseCategory.HealthAndWellness:
      iconName = "spa";
      break;
    case ExpenseCategory.Gifts:
      iconName = "card-giftcard";
      break;
    case ExpenseCategory.Insurance:
      iconName = "security";
      break;
    case ExpenseCategory.Emergency:
      iconName = "emergency";
      break;
    case ExpenseCategory.Subscriptions:
      iconName = "subscriptions";
      break;
    case ExpenseCategory.BankAndFees:
      iconName = "account-balance";
      break;
    case ExpenseCategory.Communication:
      iconName = "wifi";
      break;
    case ExpenseCategory.Fuel:
      iconName = "local-gas-station";
      break;
    case ExpenseCategory.Activities:
      iconName = "sports-gymnastics";
      break;
    case ExpenseCategory.Laundry:
      iconName = "local-laundry-service";
      break;
    case ExpenseCategory.VisasAndDocuments:
      iconName = "badge";
      break;
    case ExpenseCategory.Others:
      iconName = "more-horiz";
      break;
    default:
      iconName = "receipt";
      break;
  }

  return <Icon name={iconName as any} size={size} color={resolvedColor} />;
};

export default ExpenseCategoryIcon;
