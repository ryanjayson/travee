import React from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
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
    case ExpenseCategory.Others:
      iconName = "more-horiz";
      break;
    default:
      iconName = "receipt";
      break;
  }

  return <Icon name={iconName} size={size} color={color} />;
};

export default ExpenseCategoryIcon;
