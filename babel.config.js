module.exports = {
  presets: [
    ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    "nativewind/babel",
  ],
  plugins: [
    [
      "module:react-native-dotenv",
      {
        moduleName: "@env", // The virtual module you will import from
        path: ".env",
        blacklist: null,
        whitelist: null,
        safe: false, // Set to true to use default values if .env is missing
        allowUndefined: true,
      },
    ],
    // ["react-native-reanimated/plugin"],
  ],
};
