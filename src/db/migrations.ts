import { schemaMigrations, addColumns, createTable } from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: "itinerary_activities",
          columns: [
            { name: "is_done", type: "boolean" },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        // This might have been skipped if schema version was bumped without migrations
      ],
    },
    {
      toVersion: 4,
      steps: [
        createTable({
          name: "itinerary_expenses",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "activity_id", type: "string", isOptional: true, isIndexed: true },
            { name: "title", type: "string" },
            { name: "amount", type: "number" },
            { name: "date_time", type: "number" },
            { name: "currency", type: "string", isOptional: true },
            { name: "category", type: "string", isOptional: true },
            { name: "notes", type: "string", isOptional: true },
            { name: "is_offline", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: "itinerary_expenses",
          columns: [
            { name: "expense_category", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        addColumns({
          table: "itinerary_expenses",
          columns: [
            { name: "user_id", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 7,
      steps: [
        createTable({
          name: "itinerary_notes",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "activity_id", type: "string", isOptional: true, isIndexed: true },
            { name: "title", type: "string" },
            { name: "content", type: "string", isOptional: true },
            { name: "images", type: "string", isOptional: true },
            { name: "user_id", type: "string", isOptional: true },
            { name: "is_offline", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 8,
      steps: [
        createTable({
          name: "checklist_groups",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "title", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "sort_order", type: "string" },
            { name: "user_id", type: "string", isOptional: true },
            { name: "is_offline", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "checklist_items",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "activity_id", type: "string", isOptional: true, isIndexed: true },
            { name: "checklist_group_id", type: "string", isOptional: true, isIndexed: true },
            { name: "title", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "sort_order", type: "string" },
            { name: "is_done", type: "boolean" },
            { name: "user_id", type: "string", isOptional: true },
            { name: "checked_by", type: "string", isOptional: true },
            { name: "checked_at", type: "number", isOptional: true },
            { name: "uncheck_by", type: "string", isOptional: true },
            { name: "uncheck_at", type: "number", isOptional: true },
            { name: "is_offline", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 9,
      steps: [
        addColumns({
          table: "travels",
          columns: [
            { name: "start_or_departure_date", type: "number", isOptional: true },
            { name: "end_or_return_date", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 10,
      steps: [
        addColumns({
          table: "travels",
          columns: [
            { name: "is_archived", type: "boolean", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 11,
      steps: [
        createTable({
          name: "user_profiles",
          columns: [
            { name: "username", type: "string", isOptional: true },
            { name: "display_name", type: "string", isOptional: true },
            { name: "email", type: "string", isOptional: true },
            { name: "avatar_url", type: "string", isOptional: true },
            { name: "default_currency", type: "string", isOptional: true },
            { name: "default_country", type: "string", isOptional: true },
            { name: "account_type", type: "number" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 12,
      steps: [
        createTable({
          name: "error_logs",
          columns: [
            { name: "category", type: "string", isIndexed: true },
            { name: "severity", type: "string", isIndexed: true },
            { name: "error_code", type: "string", isOptional: true },
            { name: "message", type: "string" },
            { name: "stack_trace", type: "string", isOptional: true },
            { name: "screen", type: "string", isOptional: true },
            { name: "action", type: "string", isOptional: true },
            { name: "context_data", type: "string", isOptional: true },
            { name: "app_version", type: "string", isOptional: true },
            { name: "platform", type: "string", isOptional: true },
            { name: "device_info", type: "string", isOptional: true },
            { name: "is_resolved", type: "boolean" },
            { name: "resolved_note", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 13,
      steps: [
        addColumns({
          table: "itinerary_expenses",
          columns: [
            { name: "is_include_in_bill", type: "boolean" },
          ],
        }),
        createTable({
          name: "trip_members",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "email", type: "string", isOptional: true },
            { name: "is_offline", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 14,
      steps: [
        createTable({
          name: "member_split_bills",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "member_id", type: "string", isIndexed: true },
            { name: "owes_amount", type: "number" },
            { name: "percentage_share", type: "number" },
            { name: "is_paid", type: "boolean" },
            { name: "payment_type", type: "string", isOptional: true },
            { name: "paid_date", type: "number", isOptional: true },
            { name: "is_offline", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 15,
      steps: [
        addColumns({
          table: "member_split_bills",
          columns: [
            { name: "notes", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 16,
      steps: [
        addColumns({
          table: "itinerary_expenses",
          columns: [
            { name: "member_id", type: "string", isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
    {
      toVersion: 17,
      steps: [
        addColumns({
          table: "itinerary_activities",
          columns: [
            { name: "attachments", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 18,
      steps: [
        addColumns({
          table: "travels",
          columns: [
            { name: "type", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 19,
      steps: [
        createTable({
          name: "flight_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "departure_airport", type: "string" },
            { name: "arrival_airport", type: "string" },
            { name: "departure_date", type: "number" },
            { name: "arrival_date", type: "number", isOptional: true },
            { name: "flight_number", type: "string", isOptional: true },
            { name: "airline", type: "string", isOptional: true },
            { name: "gate", type: "string", isOptional: true },
            { name: "terminal", type: "string", isOptional: true },
            { name: "seat_number", type: "string", isOptional: true },
            { name: "booking_reference", type: "string", isOptional: true },
            { name: "price", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 20,
      steps: [
        createTable({
          name: "accomodation_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "accomodation_name", type: "string" },
            { name: "address", type: "string", isOptional: true },
            { name: "checkin_date_time", type: "number" },
            { name: "checkout_date_time", type: "number", isOptional: true },
            { name: "website_address", type: "string", isOptional: true },
            { name: "booking_reference", type: "string", isOptional: true },
            { name: "booking_status", type: "string", isOptional: true },
            { name: "contact_number", type: "string", isOptional: true },
            { name: "email_address", type: "string", isOptional: true },
            { name: "contact_name", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 21,
      steps: [
        createTable({
          name: "sightseeing_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "attraction_name", type: "string" },
            { name: "address", type: "string", isOptional: true },
            { name: "entry_fee", type: "string", isOptional: true },
            { name: "website_address", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "hike_or_camp_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "trail_or_site_name", type: "string" },
            { name: "address", type: "string", isOptional: true },
            { name: "sub_type", type: "string", isOptional: true },
            { name: "estimated_distance_km", type: "string", isOptional: true },
            { name: "campsite_name", type: "string", isOptional: true },
            { name: "permit_required", type: "boolean", isOptional: true },
            { name: "contact_person", type: "string", isOptional: true },
            { name: "contact_number", type: "string", isOptional: true },
            { name: "website_address", type: "string", isOptional: true },
            { name: "reservation_link", type: "string", isOptional: true },
            { name: "checkin_date_time", type: "number", isOptional: true },
            { name: "checkout_date_time", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 22,
      steps: [
        createTable({
          name: "cafe_restaurant_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "restaurant_name", type: "string" },
            { name: "address", type: "string", isOptional: true },
            { name: "cuisine", type: "string", isOptional: true },
            { name: "price_range", type: "string", isOptional: true },
            { name: "reservation_link", type: "string", isOptional: true },
            { name: "website_address", type: "string", isOptional: true },
            { name: "contact_number", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "nature_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "spot_name", type: "string" },
            { name: "address", type: "string", isOptional: true },
            { name: "sub_type", type: "string", isOptional: true },
            { name: "entry_fee", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "shopping_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "venue_name", type: "string" },
            { name: "address", type: "string", isOptional: true },
            { name: "sub_type", type: "string", isOptional: true },
            { name: "website_address", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "entertainment_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "venue_name", type: "string" },
            { name: "address", type: "string", isOptional: true },
            { name: "sub_type", type: "string", isOptional: true },
            { name: "website_address", type: "string", isOptional: true },
            { name: "ticket_price", type: "string", isOptional: true },
            { name: "booking_reference", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "transportation_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "mode", type: "string", isOptional: true },
            { name: "operator_provider", type: "string", isOptional: true },
            { name: "pickup_location", type: "string", isOptional: true },
            { name: "dropoff_location", type: "string", isOptional: true },
            { name: "booking_reference", type: "string", isOptional: true },
            { name: "price", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "walk_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "route_name", type: "string", isOptional: true },
            { name: "estimated_distance_km", type: "string", isOptional: true },
            { name: "estimated_duration", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "preparation_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "task_label", type: "string", isOptional: true },
            { name: "deadline_date_time", type: "number", isOptional: true },
            { name: "priority", type: "string", isOptional: true },
            { name: "notes", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "rest_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "rest_location_name", type: "string", isOptional: true },
            { name: "rest_location_type", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "motorcycle_ride_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "route_name", type: "string", isOptional: true },
            { name: "starting_point", type: "string", isOptional: true },
            { name: "ending_point", type: "string", isOptional: true },
            { name: "estimated_distance_km", type: "string", isOptional: true },
            { name: "road_type", type: "string", isOptional: true },
            { name: "bike_model", type: "string", isOptional: true },
            { name: "fuel_stops", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "meetup_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "venue_name", type: "string" },
            { name: "address", type: "string", isOptional: true },
            { name: "host_or_organizer", type: "string", isOptional: true },
            { name: "number_of_people", type: "string", isOptional: true },
            { name: "meetup_type", type: "string", isOptional: true },
            { name: "rsvp_link", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
        createTable({
          name: "ride_rental_details",
          columns: [
            { name: "activity_id", type: "string", isIndexed: true },
            { name: "provider_name", type: "string" },
            { name: "address", type: "string", isOptional: true },
            { name: "vehicle_type", type: "string", isOptional: true },
            { name: "pickup_location", type: "string", isOptional: true },
            { name: "dropoff_location", type: "string", isOptional: true },
            { name: "rental_start_date_time", type: "number", isOptional: true },
            { name: "rental_end_date_time", type: "number", isOptional: true },
            { name: "booking_reference", type: "string", isOptional: true },
            { name: "price", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 23,
      steps: [
        createTable({
          name: "trip_settings",
          columns: [
            { name: "travel_id", type: "string", isIndexed: true },
            { name: "currency", type: "string" },
            { name: "timezone", type: "string" },
            { name: "itinerary_view", type: "string" },
            { name: "allow_item_reordering", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        }),
      ],
    },
    {
      toVersion: 24,
      steps: [
        addColumns({
          table: "user_profiles",
          columns: [
            { name: "nickname", type: "string", isOptional: true },
            { name: "travel_style", type: "string", isOptional: true },
          ],
        }),
      ],
    },
  ],
});
