import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import Accordion from "./indexV2";

/**
 * Example component demonstrating various usage patterns of the Accordion component
 */
const AccordionExample: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.heading}>Accordion Component Examples</Text>

          {/* Basic Usage */}
          <Accordion title="Basic Accordion">
            <Text style={styles.contentText}>
              This is a basic accordion with default styling. It starts expanded
              and contains simple text content.
            </Text>
          </Accordion>

          {/* Custom Styling */}
          <Accordion
            title="Custom Styled Accordion"
            iconColor="#FF6B6B"
            backgroundColor="#FFF5F5"
            headerBackgroundColor="#FFE5E5"
            borderColor="#FF6B6B"
            borderRadius={12}
          >
            <Text style={styles.contentText}>
              This accordion has custom colors and styling applied through
              props.
            </Text>
            <View style={styles.innerContent}>
              <Text style={styles.innerContentText}>
                You can also nest other components inside!
              </Text>
            </View>
          </Accordion>

          {/* Disabled State */}
          <Accordion
            title="Disabled Accordion"
            disabled={true}
            iconColor="#999"
          >
            <Text style={styles.contentText}>
              This accordion is disabled and cannot be toggled.
            </Text>
          </Accordion>

          {/* No Icon */}
          <Accordion title="Accordion Without Icon" showIcon={false}>
            <Text style={styles.contentText}>
              This accordion doesnt show an expand/collapse icon.
            </Text>
          </Accordion>

          {/* Complex Content */}
          <Accordion title="Accordion with Complex Content">
            <Text style={styles.contentText}>
              This accordion contains more complex content including multiple
              elements.
            </Text>
            <View style={styles.buttonGroup}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Button 1</Text>
              </View>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Button 2</Text>
              </View>
            </View>
            <Text style={styles.contentText}>
              You can put any React Native components inside an accordion.
            </Text>
          </Accordion>

          {/* Custom Animation Duration */}
          <Accordion title="Slow Animation Accordion" animationDuration={1000}>
            <Text style={styles.contentText}>
              This accordion has a slower animation duration (1 second).
            </Text>
          </Accordion>

          {/* Minimal Styling */}
          <Accordion
            title="Minimal Accordion"
            containerStyle={styles.minimalContainer}
            headerStyle={styles.minimalHeader}
            titleStyle={styles.minimalTitle}
            borderWidth={0}
            shadowOpacity={0}
            elevation={0}
          >
            <Text style={styles.contentText}>
              This accordion has minimal styling with no borders or shadows.
            </Text>
          </Accordion>

          {/* With Callback */}
          <Accordion
            title="Accordion with Toggle Callback"
            onToggle={(expanded) => {
              console.log(
                `Accordion is now ${expanded ? "expanded" : "collapsed"}`
              );
            }}
          >
            <Text style={styles.contentText}>
              This accordion calls a callback function when toggled. Check the
              console for logs.
            </Text>
          </Accordion>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  contentText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 10,
  },
  innerContent: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#e8f4fd",
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  innerContentText: {
    fontSize: 12,
    color: "#1976D2",
    fontStyle: "italic",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 10,
  },
  button: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  minimalContainer: {
    backgroundColor: "transparent",
    marginVertical: 2,
  },
  minimalHeader: {
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  minimalTitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
});

export default AccordionExample;
