import React from "react";
import ChecklistTabComponent, {
  ChecklistTabProps,
} from "../../../Edit/Itinerary/Activity/Tabs/ChecklistTab";

const ChecklistTab = (props: ChecklistTabProps) => {
  return <ChecklistTabComponent {...props} isScrollable={props.isScrollable ?? true} />;
};

export default ChecklistTab;
