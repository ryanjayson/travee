import "@testing-library/react-native";

// 1. Mock Async Storage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// 2. Mock WatermelonDB
jest.mock("@nozbe/watermelondb/adapters/sqlite", () => {
  return jest.fn().mockImplementation(() => ({
    schema: { tables: {} },
    migrations: {},
    batch: jest.fn(),
    find: jest.fn(),
    query: jest.fn(),
    count: jest.fn(),
  }));
});

jest.mock("@nozbe/watermelondb", () => {
  const actual = jest.requireActual("@nozbe/watermelondb");
  return {
    ...actual,
    Database: jest.fn().mockImplementation(() => {
      const mockCollection = {
        query: jest.fn().mockReturnValue({
          fetch: jest.fn().mockResolvedValue([]),
          fetchCount: jest.fn().mockResolvedValue(0),
        }),
        find: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      };
      return {
        get: jest.fn().mockReturnValue(mockCollection),
        write: jest.fn((cb: any) => cb()),
        batch: jest.fn(),
      };
    }),
  };
});

// 3. Mock Expo Vector Icons to render simple mock elements
const createMockIcon = () => {
  const React = require("react");
  const { Text } = require("react-native");
  const Mock = (props: any) =>
    React.createElement(Text, { testID: `icon-${props?.name || "icon"}`, ...props }, props?.name || "");
  Mock.default = Mock;
  return Mock;
};

const MockIconComponent = createMockIcon();

jest.mock("@expo/vector-icons", () => ({
  __esModule: true,
  default: {
    MaterialIcons: MockIconComponent,
    Ionicons: MockIconComponent,
    FontAwesome: MockIconComponent,
    FontAwesome5: MockIconComponent,
    Feather: MockIconComponent,
    AntDesign: MockIconComponent,
    MaterialCommunityIcons: MockIconComponent,
  },
  MaterialIcons: MockIconComponent,
  Ionicons: MockIconComponent,
  FontAwesome: MockIconComponent,
  FontAwesome5: MockIconComponent,
  Feather: MockIconComponent,
  AntDesign: MockIconComponent,
  MaterialCommunityIcons: MockIconComponent,
}));

jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => ({
  __esModule: true,
  default: MockIconComponent,
}));

// 4. Mock React Native Vector Icons
jest.mock("react-native-vector-icons/MaterialIcons", () => ({
  __esModule: true,
  default: MockIconComponent,
}));

jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => ({
  __esModule: true,
  default: MockIconComponent,
}));

// 5. Mock expo-linear-gradient
jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: (props: any) => React.createElement(View, props, props.children),
  };
});

// 6. Mock DateTimePicker / Modal DateTime Picker
jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  const { View } = require("react-native");
  return (props: any) => React.createElement(View, { testID: "datetimepicker", ...props });
});

jest.mock("react-native-modal-datetime-picker", () => {
  const React = require("react");
  const { View } = require("react-native");
  return (props: any) => (props.isVisible ? React.createElement(View, { testID: "modal-datetimepicker", ...props }) : null);
});

// 7. Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const SafeAreaInsetsContext = React.createContext(inset);
  const SafeAreaFrameContext = React.createContext(frame);
  return {
    SafeAreaProvider: ({ children }: any) =>
      React.createElement(
        SafeAreaInsetsContext.Provider,
        { value: inset },
        React.createElement(SafeAreaFrameContext.Provider, { value: frame }, children)
      ),
    SafeAreaConsumer: SafeAreaInsetsContext.Consumer,
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    initialWindowMetrics: { insets: inset, frame },
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
  };
});

// 8. Mock @react-navigation/native
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: (cb: any) => {
      const React = require("react");
      React.useEffect(cb, []);
    },
  };
});

// 9. Mock react-native-webview
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    WebView: (props: any) => React.createElement(View, { testID: "webview", ...props }),
  };
});

// 9. Mock react-native-calendars
jest.mock("react-native-calendars", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CalendarList: (props: any) => React.createElement(View, { testID: "calendar-list", ...props }),
    Calendar: (props: any) => React.createElement(View, { testID: "calendar", ...props }),
  };
});

// 10. Mock expo image & document pickers
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

// 12. Mock react-native-reanimated
try {
  require("react-native-reanimated").setUpTests();
} catch {
  jest.mock("react-native-reanimated", () => {
    const Reanimated = require("react-native-reanimated/mock");
    Reanimated.default.call = () => {};
    return Reanimated;
  });
}

// 9. Silence console warnings/errors for clean test output
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Animated: `useNativeDriver`") ||
      args[0].includes("NativeBase:") ||
      args[0].includes("ReactImageView:"))
  ) {
    return;
  }
  originalWarn(...args);
};
