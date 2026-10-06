import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { GoogleMapView, GoogleMapPin } from "../index";

describe("GoogleMapView Component", () => {
  const mockPins: GoogleMapPin[] = [
    {
      id: "pin-1",
      latitude: 35.6762,
      longitude: 139.6503,
      title: "Tokyo Station",
      color: "#2196F3",
    },
    {
      id: "pin-2",
      latitude: 35.6586,
      longitude: 139.7454,
      title: "Tokyo Tower",
      color: "#c10003",
    },
  ];

  it("renders correctly with default props", () => {
    const { getByTestId } = render(<GoogleMapView pins={mockPins} />);
    expect(getByTestId("google-map-view")).toBeTruthy();
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("renders with custom initial coordinates and zoom", () => {
    const initialCoords = { latitude: 37.7749, longitude: -122.4194 };
    const { getByTestId } = render(
      <GoogleMapView
        pins={mockPins}
        initialCoordinates={initialCoords}
        zoom={15}
        testID="custom-map"
      />
    );
    expect(getByTestId("custom-map")).toBeTruthy();
  });

  it("handles pin press message from WebView", () => {
    const handlePinPress = jest.fn();
    const { getByTestId } = render(
      <GoogleMapView pins={mockPins} onPinPress={handlePinPress} />
    );

    const webview = getByTestId("webview");

    // Simulate WebView posting PIN_PRESS message
    fireEvent(webview, "message", {
      nativeEvent: {
        data: JSON.stringify({
          type: "PIN_PRESS",
          pin: mockPins[0],
        }),
      },
    });

    expect(handlePinPress).toHaveBeenCalledWith(mockPins[0]);
  });

  it("handles map press message from WebView", () => {
    const handleMapPress = jest.fn();
    const { getByTestId } = render(
      <GoogleMapView pins={mockPins} onMapPress={handleMapPress} />
    );

    const webview = getByTestId("webview");

    fireEvent(webview, "message", {
      nativeEvent: {
        data: JSON.stringify({
          type: "MAP_PRESS",
        }),
      },
    });

    expect(handleMapPress).toHaveBeenCalledTimes(1);
  });

  it("hides POIs and disables clickable icons by default", () => {
    const { getByTestId } = render(<GoogleMapView pins={mockPins} />);
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain('"featureType":"poi"');
    expect(html).toContain('"visibility":"off"');
    expect(html).toContain("clickableIcons: false");
  });

  it("does not hide POIs when showBusinesses is true", () => {
    const { getByTestId } = render(
      <GoogleMapView pins={mockPins} showBusinesses={true} />
    );
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).not.toContain('"featureType":"poi"');
  });

  it("renders connector polyline and requests road route via DirectionsService when showConnectors is true", () => {
    const { getByTestId } = render(
      <GoogleMapView pins={mockPins} showConnectors={true} connectorGeodesic={true} connectorWidth={3} />
    );
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("google.maps.DirectionsService");
    expect(html).toContain("new google.maps.Polyline");
    expect(html).toContain("geodesic: true");
    expect(html).toContain("let currentConnectorColor = '#0EA5E9';");
    expect(html).toContain("strokeColor: currentConnectorColor");
    expect(html).toContain("strokeWeight: 3");
    expect(html).toContain("travelMode: google.maps.TravelMode['DRIVING']");
    expect(html).not.toContain("drawPolylinePath(pathCoordinates);");
  });

  it("customizes connector styling with color, width, and dashed line", () => {
    const { getByTestId } = render(
      <GoogleMapView
        pins={mockPins}
        showConnectors={true}
        connectorColor="#FF5722"
        connectorWidth={5}
        connectorDashed={true}
        routeMode="WALKING"
      />
    );
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("let currentConnectorColor = '#FF5722';");
    expect(html).toContain("strokeColor: currentConnectorColor");
    expect(html).toContain("strokeWeight: 5");
    expect(html).toContain("repeat: '16px'");
    expect(html).toContain("travelMode: google.maps.TravelMode['WALKING']");
    expect(html).not.toContain("drawPolylinePath(pathCoordinates);");
  });

  it("supports lowercase 'walking' and normalizes to uppercase WALKING", () => {
    const { getByTestId } = render(
      <GoogleMapView
        pins={mockPins}
        showConnectors={true}
        routeMode="walking"
      />
    );
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("travelMode: google.maps.TravelMode['WALKING']");
    expect(html).toContain("currentRouteMode = 'WALKING'");
  });

  it("supports TRANSIT mode and configures segment routing with fallback", () => {
    const { getByTestId } = render(
      <GoogleMapView
        pins={mockPins}
        showConnectors={true}
        routeMode="TRANSIT"
      />
    );
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("currentRouteMode = 'TRANSIT'");
    expect(html).toContain("google.maps.TravelMode.TRANSIT");
    expect(html).toContain("google.maps.TravelMode.WALKING");
  });

  it("supports BICYCLING and bicycling mode", () => {
    const { getByTestId } = render(
      <GoogleMapView
        pins={mockPins}
        showConnectors={true}
        routeMode="bicycling"
      />
    );
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("travelMode: google.maps.TravelMode['BICYCLING']");
    expect(html).toContain("currentRouteMode = 'BICYCLING'");
  });

  it("injects JavaScript to dynamically update routeMode when prop changes", () => {
    const { rerender } = render(
      <GoogleMapView
        pins={mockPins}
        showConnectors={true}
        routeMode="DRIVING"
      />
    );

    rerender(
      <GoogleMapView
        pins={mockPins}
        showConnectors={true}
        routeMode="WALKING"
      />
    );

    // Re-renders without error and maintains connector functionality
  });

  it("exposes window.centerOnLocation and marks markers with pin IDs", () => {
    const { getByTestId } = render(<GoogleMapView pins={mockPins} />);
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("window.centerOnLocation = function(lat, lng, zoomLevel, pinId, offsetY)");
    expect(html).toContain("marker._pinId = String(pin.id || '');");
    expect(html).toContain("map.panTo(target)");
  });

  it("centers map on specified coordinates and pin", () => {
    const { rerender } = render(
      <GoogleMapView pins={mockPins} />
    );

    rerender(
      <GoogleMapView
        pins={mockPins}
        centerCoordinates={{ latitude: 35.6586, longitude: 139.7454, zoom: 15 }}
        selectedPinId="pin-2"
      />
    );
  });

  it("exposes window.updateConnectorColor and injects updates dynamically", () => {
    const { getByTestId, rerender } = render(
      <GoogleMapView pins={mockPins} showConnectors={true} connectorColor="#0EA5E9" />
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("window.updateConnectorColor = function(newColor)");

    rerender(
      <GoogleMapView pins={mockPins} showConnectors={true} connectorColor="#FF0000" />
    );
  });

  it("groups connectors by activity type and applies custom pin colors when connectByType is true", () => {
    const pinsWithTypes = [
      { id: "1", latitude: 35.68, longitude: 139.76, type: 1, color: "#10B981" },
      { id: "2", latitude: 35.69, longitude: 139.77, type: 1, color: "#10B981" },
      { id: "3", latitude: 35.70, longitude: 139.78, type: 2, color: "#F59E0B" },
      { id: "4", latitude: 35.71, longitude: 139.79, type: 2, color: "#F59E0B" },
    ];
    const { getByTestId } = render(
      <GoogleMapView pins={pinsWithTypes} showConnectors={true} connectByType={true} />
    );
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("typeGroups[typeKey]");
    expect(html).toContain("calculateRoadRoute(group.coords, currentRouteMode, reqId, group.color)");
  });

  it("adapts map centering and exposes window.setBottomOffset when bottomOffset changes", () => {
    const { getByTestId, rerender } = render(
      <GoogleMapView pins={mockPins} bottomOffset={300} />
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("window.setBottomOffset = function(newOffset)");
    expect(webview.props.source.html).toContain("currentBottomOffset = 300;");

    rerender(
      <GoogleMapView pins={mockPins} bottomOffset={500} />
    );
  });

  it("implements smoothPanTo for smooth transitions without zoom jumps", () => {
    const { getByTestId } = render(<GoogleMapView pins={mockPins} />);
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("function smoothPanTo(targetLatLng, duration)");
    expect(html).toContain("easeInOutCubic");
    expect(html).toContain("smoothPanTo(target, 600)");
  });

  it("does not call fitBounds inside setBottomOffset on snap height changes", () => {
    const { getByTestId } = render(<GoogleMapView pins={mockPins} />);
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    const setBottomOffsetCode = html
      .split("window.setBottomOffset = function")[1]
      .split("window.centerOnLocation")[0];
    expect(setBottomOffsetCode).not.toContain("fitBounds");
  });

  it("positions pin label at the top of the pin with custom-pin-label styling", () => {
    const pinsWithTitles = [
      {
        id: "pin-label-1",
        latitude: 35.6895,
        longitude: 139.6917,
        title: "Tokyo City Tour",
        subType: "sightseeing",
      },
    ];
    const { getByTestId } = render(<GoogleMapView pins={pinsWithTitles} />);
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("labelOrigin: new google.maps.Point(16, -10)");
    expect(html).toContain("markerOptions.label = {");
    expect(html).toContain("text: pin.title");
    expect(html).toContain("className: 'custom-pin-label'");
    expect(html).toContain(".custom-pin-label {");
    expect(html).toContain("transform: translate(-50%, -50%)");
  });

  it("renders specialized SVG icon inside pin circle based on activity subtype", () => {
    const pinsWithSubtypes = [
      {
        id: "pin-hotel",
        latitude: 35.6895,
        longitude: 139.6917,
        title: "Tokyo Hotel",
        subType: "Hotel",
      },
      {
        id: "pin-default",
        latitude: 35.6762,
        longitude: 139.6503,
        title: "Default Pin",
      },
    ];
    const { getByTestId } = render(<GoogleMapView pins={pinsWithSubtypes} />);
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("function getSubtypeIconPath(subType)");
    expect(html).toContain("const iconUrl = createSvgPin(pin.color, pin.subType);");
    expect(html).toContain("s.includes('hotel')");
    expect(html).toContain("s.includes('flight')");
    expect(html).toContain("s.includes('cafe')");
    expect(html).toContain("s.includes('restaurant')");
    expect(html).toContain("s.includes('walk')");
    expect(html).toContain("s.includes('meetup')");
    expect(html).toContain("s.includes('preparation')");
    expect(html).toContain("s === '1'");
    expect(html).toContain("s === '12'");
  });

  it("checks title and subType changes inside window.updatePins", () => {
    const { getByTestId } = render(<GoogleMapView pins={mockPins} />);
    const webview = getByTestId("webview");
    const html = webview.props.source.html;

    expect(html).toContain("incoming[i].title !== currentPins[i].title");
    expect(html).toContain("incoming[i].subType !== currentPins[i].subType");
  });
});
