import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Accordion } from '../index';

/**
 * Example showing how to integrate the Accordion component into existing trip pages
 * This demonstrates how you can replace the current section-based approach with accordions
 */

// Example: How to use accordion in trip detail page
export const TripDetailWithAccordion: React.FC = () => {
  const tripData = {
    title: "Winter in Japan 2025",
    destination: "Tokyo, Japan",
    startDate: "2025-02-15",
    endDate: "2025-02-22",
    members: ["John", "Sarah", "Mike"],
    budget: 2500
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      {/* Trip Header */}
      <View style={styles.tripHeader}>
        <Text style={styles.tripTitle}>{tripData.title}</Text>
        <Text style={styles.tripDestination}>{tripData.destination}</Text>
      </View>

      {/* Trip Information Accordion */}
      <Accordion 
        title="Trip Information" 
        defaultExpanded={true}
        backgroundColor="#f8f9fa"
        headerBackgroundColor="#e9ecef"
      >
        <View style={styles.tripDates}>
          <Text style={styles.dateLabel}>Dates:</Text>
          <Text style={styles.dateText}>
            {formatDate(tripData.startDate)} - {formatDate(tripData.endDate)}
          </Text>
        </View>
        <View style={styles.tripBudget}>
          <Text style={styles.budgetLabel}>Budget:</Text>
          <Text style={styles.budgetText}>${tripData.budget}</Text>
        </View>
      </Accordion>

      {/* Members Accordion */}
      <Accordion 
        title={`Members (${tripData.members.length})`}
        iconColor="#007bff"
      >
        {tripData.members.map((member, index) => (
          <Text key={index} style={styles.memberText}>• {member}</Text>
        ))}
      </Accordion>

      {/* Itinerary Accordion */}
      <Accordion 
        title="Itinerary"
        iconColor="#28a745"
      >
        <Text style={styles.contentText}>
          Your itinerary content would go here. This could include:
          • Day-by-day activities
          • Restaurant reservations
          • Transportation details
          • Attraction bookings
        </Text>
      </Accordion>

      {/* Checklist Accordion */}
      <Accordion 
        title="Pre-trip Checklist"
        iconColor="#ffc107"
      >
        <Text style={styles.contentText}>
          • Book flights ✓
          • Reserve hotel ✓
          • Get travel insurance
          • Exchange currency
          • Pack winter clothes
        </Text>
      </Accordion>
    </View>
  );
};

// Example: How to use accordion in the trip list page
export const TripListWithAccordion: React.FC = () => {
  const trips = [
    {
      id: '1',
      title: 'Winter in Japan 2025',
      destination: 'Tokyo, Japan',
      startDate: '2025-02-15',
      endDate: '2025-02-22',
      status: 'upcoming'
    },
    {
      id: '2', 
      title: 'Summer in Europe 2024',
      destination: 'Paris, France',
      startDate: '2024-07-10',
      endDate: '2024-07-20',
      status: 'completed'
    }
  ];

  return (
    <View style={styles.container}>
      {trips.map((trip) => (
        <Accordion 
          key={trip.id}
          title={trip.title}
          defaultExpanded={false}
          containerStyle={styles.tripCard}
        >
          <View style={styles.tripInfo}>
            <Text style={styles.destinationText}>{trip.destination}</Text>
            <Text style={styles.datesText}>
              {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
            </Text>
            <Text style={[
              styles.statusText,
              trip.status === 'upcoming' ? styles.upcomingStatus : styles.completedStatus
            ]}>
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </Text>
          </View>
        </Accordion>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  tripHeader: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tripTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tripDestination: {
    fontSize: 16,
    color: '#666',
  },
  tripDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tripBudget: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  budgetText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  memberText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  contentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  tripCard: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripInfo: {
    paddingVertical: 8,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  datesText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  upcomingStatus: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  completedStatus: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
});

export default TripDetailWithAccordion;
