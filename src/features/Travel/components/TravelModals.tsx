import React, { useMemo } from "react";
import { useTravelContext } from "../../../context/TravelContext";
import { useTravelPlan } from "../hooks/useTravel";
import { TripPlanType } from "../../../types/enums";
import type { TravelPlan } from "../types/TravelDto";

import ExpenseModal from "./Forms/Expense/Modal";
import NoteModal from "./Forms/Note/Modal";
import ChecklistModal from "./Forms/Checklist/Modal";
import ChecklistGroupModal from "./Forms/Checklist/ChecklistGroupModal";
import ActivityModal from "./Edit/Itinerary/Activity/Modal";
import ActivityTypeLookupModal from "./Lookups/ActivityTypeLookupModal";
import MemberModal from "./Forms/Member/Modal";
import SectionModal from "./Edit/Itinerary/Section/Modal";
import DescriptionModal from "../../../components/molecules/DescriptionInput/Modal";
import MapboxDestinationSelectorModal from "./MapboxDestinationSelector/Modal";
import FlightModal from "./Forms/Flight/FlightModal";
import { GoogleMapSearchModal } from "../../../components/GoogleMapSearchBox";

interface TravelModalsProps {
  travelPlan?: TravelPlan | any | null;
}

export const TravelModals: React.FC<TravelModalsProps> = ({ travelPlan: propTravelPlan }) => {
  const {
    expenseModal,
    closeExpenseModal,
    noteModal,
    closeNoteModal,
    checklistModal,
    closeChecklistModal,
    checklistGroupModal,
    closeChecklistGroupModal,
    openChecklistGroupModal,
    activityModal,
    openActivityModal,
    closeActivityModal,
    activityTypeModal,
    closeActivityTypeModal,
    openActivityTypeModal: _openActivityTypeModal,
    googleSearchModal,
    openGoogleSearchModal,
    closeGoogleSearchModal,
    memberModal,
    closeMemberModal,
    descriptionModal,
    closeDescriptionModal,
    destinationModal,
    closeDestinationModal,
    flightModal,
    closeFlightModal,
    sectionModal,
    closeSectionModal,
  } = useTravelContext();

  const fallbackTravelId =
    googleSearchModal?.travelId ||
    activityTypeModal?.travelId ||
    activityModal?.travelId ||
    sectionModal?.travelId ||
    "";

  const { data: fallbackTravelPlan } = useTravelPlan(propTravelPlan ? "" : fallbackTravelId);

  const activePlan: any = propTravelPlan || fallbackTravelPlan;

  const travelObj = activePlan?.travel || (activePlan as any);

  const destinations = useMemo(() => {
    const t = activePlan?.travel || (activePlan as any);
    if (t?.tripDestinations && t.tripDestinations.length > 0) {
      return t.tripDestinations;
    }
    if (t?.destination) {
      return [
        {
          destination: t.destination,
          destinationData: t.destinationData,
        },
      ];
    }
    return [];
  }, [activePlan]);

  const defaultSectionId =
    activePlan?.itinerarySection?.find((s) => s.isDefaultSection)?.id ||
    activePlan?.itinerarySection?.[0]?.id ||
    "";

  return (
    <>
      {expenseModal && (
        <ExpenseModal
          visible={expenseModal.visible}
          itineraryExpense={expenseModal.itineraryExpense}
          activityId={expenseModal.activityId}
          activities={expenseModal.activities}
          travelId={expenseModal.travelId}
          onClose={closeExpenseModal}
        />
      )}
      {noteModal && (
        <NoteModal
          visible={noteModal.visible}
          itineraryNote={noteModal.itineraryNote}
          activities={noteModal.activities}
          travelId={noteModal.travelId}
          onClose={closeNoteModal}
        />
      )}
      {checklistModal && (
        <ChecklistModal
          visible={checklistModal.visible}
          checklistItem={checklistModal.checklistItem}
          activities={checklistModal.activities}
          travelId={checklistModal.travelId}
          onClose={closeChecklistModal}
          onOpenNewGroupModal={() => openChecklistGroupModal(checklistModal.travelId)}
        />
      )}
      {checklistGroupModal && (
        <ChecklistGroupModal
          visible={checklistGroupModal.visible}
          travelId={checklistGroupModal.travelId}
          onClose={closeChecklistGroupModal}
        />
      )}
      {activityTypeModal && (
        <ActivityTypeLookupModal
          visible={activityTypeModal.visible}
          onClose={closeActivityTypeModal}
          onSelect={(type) => {
            const itinerarySectionId = activityTypeModal.itinerarySectionId || defaultSectionId;
            const travelId = activityTypeModal.travelId || activePlan?.travel?.id;
            closeActivityTypeModal();
            setTimeout(() => {
              if (type === TripPlanType.plan) {
                const countryName =
                  travelObj?.destinationData?.country ||
                  travelObj?.destination;
                openGoogleSearchModal(
                  itinerarySectionId,
                  travelId,
                  travelObj?.destination,
                  travelObj?.destinationData?.coordinates,
                  countryName,
                  undefined,
                  destinations
                );
              } else {
                openActivityModal(null, itinerarySectionId, travelId, type);
              }
            }, 100);
          }}
        />
      )}
      {googleSearchModal && (
        <GoogleMapSearchModal
          visible={googleSearchModal.visible}
          destination={googleSearchModal.destination || travelObj?.destination}
          destinations={googleSearchModal.destinations || destinations}
          destinationCoordinates={
            googleSearchModal.destinationCoordinates ||
            travelObj?.destinationData?.coordinates
          }
          country={
            googleSearchModal.country ||
            travelObj?.destinationData?.country
          }
          onClose={closeGoogleSearchModal}
          onManualEntry={() => {
            const itinerarySectionId =
              googleSearchModal.itinerarySectionId || defaultSectionId;
            const travelId = googleSearchModal.travelId || activePlan?.travel?.id;
            closeGoogleSearchModal();
            setTimeout(() => {
              openActivityModal(
                {
                  id: "",
                  title: "",
                  destination: "",
                  type: TripPlanType.plan,
                  sectionId: itinerarySectionId || "",
                } as any,
                itinerarySectionId,
                travelId,
                TripPlanType.plan
              );
            }, 100);
          }}
          onSelect={(location) => {
            if (googleSearchModal.onSelect) {
              googleSearchModal.onSelect(location);
              closeGoogleSearchModal();
              return;
            }
            const itinerarySectionId =
              googleSearchModal.itinerarySectionId || defaultSectionId;
            const travelId = googleSearchModal.travelId || activePlan?.travel?.id;
            closeGoogleSearchModal();
            setTimeout(() => {
              openActivityModal(
                {
                  id: "",
                  title: location.name,
                  destination: location.address || location.name,
                  type: TripPlanType.plan,
                  sectionId: itinerarySectionId || "",
                  destinationData: {
                    id: location.placeId || "",
                    name: location.name || undefined,
                    city: location.secondaryText || undefined,
                    coordinates: location.coordinates,
                  },
                } as any,
                itinerarySectionId,
                travelId,
                TripPlanType.plan
              );
            }, 100);
          }}
        />
      )}
      {activityModal && (
        <ActivityModal
          visible={activityModal.visible}
          itineraryActivity={activityModal.itineraryActivity}
          itinerarySectionId={activityModal.itinerarySectionId}
          travelId={activityModal.travelId || activePlan?.travel?.id}
          initialType={activityModal.initialType}
          onClose={closeActivityModal}
        />
      )}
      {memberModal && (
        <MemberModal
          visible={memberModal.visible}
          editingMember={memberModal.editingMember}
          travelId={memberModal.travelId}
          onClose={closeMemberModal}
        />
      )}
      {descriptionModal && (
        <DescriptionModal
          visible={descriptionModal.visible}
          onClose={closeDescriptionModal}
          value={descriptionModal.value}
          onConfirm={descriptionModal.onConfirm}
          label={descriptionModal.label}
          placeholder={descriptionModal.placeholder}
          confirmLabel={descriptionModal.confirmLabel}
          maxLength={descriptionModal.maxLength}
        />
      )}
      {destinationModal && (
        <MapboxDestinationSelectorModal
          visible={destinationModal.visible}
          initialValue={destinationModal.initialValue}
          onSelect={(place, isAddMore) => {
            if (destinationModal.onSelect) {
              destinationModal.onSelect(place, isAddMore);
            }
          }}
          onClose={closeDestinationModal}
        />
      )}
      {flightModal && (
        <FlightModal
          visible={flightModal.visible}
          defaultDate={flightModal.defaultDate}
          onConfirm={(flightData) => {
            if (flightModal.onConfirm) {
              flightModal.onConfirm(flightData);
            }
            closeFlightModal();
          }}
          onClose={closeFlightModal}
        />
      )}
      {sectionModal && (
        <SectionModal
          visible={sectionModal.visible}
          itinerarySection={sectionModal.itinerarySection}
          travelId={sectionModal.travelId || activePlan?.travel?.id}
          onClose={closeSectionModal}
          onSaveSuccess={sectionModal.onSaveSuccess}
        />
      )}
    </>
  );
};

export default TravelModals;
