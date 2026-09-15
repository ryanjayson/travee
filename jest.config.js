module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|nativewind|react-native-css|react-native-reanimated|react-native-paper|@nozbe/watermelondb|lexorank)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@env$": "<rootDir>/jest.env.mock.js",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
