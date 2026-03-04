import React, {
  FC,
  PropsWithChildren,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
  Modal,
  StatusBar,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

// Enable LayoutAnimation for Android
// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// Define the props for the Accordion component
interface AccordionProps extends PropsWithChildren {
  title: string;
  defaultExpanded?: boolean;
  defaultFullscreen?: boolean;
  containerStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  contentContainerStyle?: ViewStyle;
  iconColor?: string;
  iconSize?: number;
}

const Accordion: FC<AccordionProps> = ({
  title,
  children,
  defaultExpanded = false,
  defaultFullscreen = false,
  containerStyle,
  headerStyle,
  titleStyle,
  contentContainerStyle,
  iconColor = "#333",
  iconSize = 24,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [fullscreen, setFullscreen] = useState(defaultFullscreen);
  const animationController = useRef(
    new Animated.Value(defaultExpanded ? 1 : 0)
  ).current;
  const contentRef = useRef<View>(null);
  const [bodyHeight, setBodyHeight] = useState(0);

  // Measure content height when it's first rendered (and expanded if defaultExpanded)
  useEffect(() => {
    if (defaultExpanded && contentRef.current) {
      // Use requestAnimationFrame to ensure layout is calculated
      requestAnimationFrame(() => {
        contentRef.current?.measure((x, y, width, height) => {
          setBodyHeight(height);
        });
      });
    }
  }, [defaultExpanded]);

  // Handle accordion toggle
  const toggleAccordion = () => {
    // Standard LayoutAnimation for smooth general transitions
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const toggleFullscreenAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFullscreen(!fullscreen);
  };

  // Animate the rotation of the icon
  const arrowAngle = animationController.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"], // 0deg for collapsed, 180deg for expanded
  });

  // Animate the height of the content body
  const animatedHeight = animationController.interpolate({
    inputRange: [0, 1],
    outputRange: [0, bodyHeight || 0], // Use measured height when expanded, 0 when collapsed
  });

  useEffect(() => {
    Animated.timing(animationController, {
      duration: 300,
      toValue: expanded ? 1 : 0,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design standard easing
      useNativeDriver: false, // Height animation requires useNativeDriver: false
    }).start();

    // If expanding, we need to measure the content's actual height
    // This is a common pattern for "auto" height animations
    if (expanded && contentRef.current && bodyHeight === 0) {
      requestAnimationFrame(() => {
        contentRef.current?.measure((x, y, width, height) => {
          setBodyHeight(height);
          // Restart animation with actual height if it was 0 initially
          Animated.timing(animationController, {
            duration: 300,
            toValue: 1,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: false,
          }).start();
        });
      });
    }
    // If collapsing, no need to re-measure, just animate to 0
    if (!expanded) {
      setBodyHeight(0); // Reset height so it remeasures next time it opens
    }
  }, [expanded, bodyHeight, animationController]);

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        onPress={toggleFullscreenAccordion}
        style={{
          position: "absolute",
          right: 45,
          top: 16,
          zIndex: 1,
        }}
      >
        <Animated.View>
          <Icon name="fullscreen" size={iconSize} color={iconColor} />
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={toggleAccordion}
        style={[styles.header, headerStyle]}
        activeOpacity={0.8}
      >
        <Text style={[styles.title, titleStyle]}>{title}</Text>

        <Animated.View style={{ transform: [{ rotate: arrowAngle }] }}>
          <Icon name="keyboard-arrow-down" size={iconSize} color={iconColor} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[styles.contentWrapper, { maxHeight: animatedHeight }]}
      >
        <View
          ref={contentRef}
          onLayout={(event) => {
            // If bodyHeight is not yet set or has changed
            if (
              bodyHeight === 0 ||
              event.nativeEvent.layout.height !== bodyHeight
            ) {
              // Only update if expanded, or if defaultExpanded
              if (expanded || defaultExpanded) {
                setBodyHeight(event.nativeEvent.layout.height);
              }
            }
          }}
          style={[styles.content, contentContainerStyle]}
        >
          {children}
        </View>
      </Animated.View>

      <Modal
        animationType="slide" // Or "slide"
        visible={fullscreen}
        backdropColor="#FFF"
        onRequestClose={() => setFullscreen(false)} // Handles the Android back button
      >
        {/*
          3. Optionally hide the status bar while in fullscreen
          The Status Bar is managed separately from the Modal.
        */}
        {/* <StatusBar barStyle={"dark-content"} /> */}
        <View style={[styles.fullscreenHeader, headerStyle]}>
          <Text style={[styles.fullscreenTitle, titleStyle]}>{title}</Text>

          <TouchableOpacity
            onPress={() => setFullscreen(false)}
            style={[styles.header, headerStyle]}
            activeOpacity={0.8}
          >
            <Animated.View>
              <Icon name="fullscreen-exit" size={30} color={iconColor} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <ScrollView>{children}</ScrollView>

        {/* 4. Restore the status bar when the modal closes (implicitly handled) */}
        {/* <StatusBar hidden={true} barStyle={"dark-content"} /> */}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginVertical: 6,
    borderRadius: 12,
    overflow: "hidden", // Essential for animated height to clip content
    borderColor: "#e0e0e0",
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  contentWrapper: {
    overflow: "hidden", // Ensures content is clipped during height animation
  },
  content: {
    paddingVertical: 5,
    paddingTop: 10, // Remove top padding if header already provides spacing
    backgroundColor: "#DDD",
  },

  fullscreenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 0,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
  },
  fullscreenTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
});

export default Accordion;
