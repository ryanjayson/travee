import React from "react";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { ExpenseCategory } from "../../../../../types/enums";

interface ExpenseCategoryIconProps {
  category?: ExpenseCategory;
  size?: number;
  color?: string;
}

const ExpenseCategoryIcon = ({
  category,
  size = 24,
  color = "#183B7A",
}: ExpenseCategoryIconProps) => {
  let iconName = "more-horiz";

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

  return <Icon name={iconName as any} size={size} color={color} />;
};

export default ExpenseCategoryIcon;
