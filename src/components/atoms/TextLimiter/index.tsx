import React from "react";
import { View, Text, StyleSheet } from "react-native";
const MAX_CHARS = 100;

// JavaScript truncation function
const getTruncatedText = (text: string) => {
  if (text.length > MAX_CHARS) {
    return text.substring(0, MAX_CHARS) + "...";
  }
  return text;
};

type TextLimiterProps = {
  text: string;
};

const TextLimiter = ({ text }: TextLimiterProps) => {
  return (
    <View
      style={{
        maxHeight: 200,
      }}
    >
      <Text
        style={{
          color: "#555",
          lineHeight: 20,
        }}
      >
        {getTruncatedText(text)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({});

export default TextLimiter;
