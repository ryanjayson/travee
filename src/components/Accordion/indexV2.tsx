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
  Platform,
  UIManager,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Define the props for the Accordion component
export interface AccordionProps extends PropsWithChildren {
  title: string;
  defaultExpanded?: boolean;
  containerStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  contentContainerStyle?: ViewStyle;
  iconColor?: string;
  iconSize?: number;
  onToggle?: (expanded: boolean) => void;
  disabled?: boolean;
  showIcon?: boolean;
  customIcon?: React.ReactNode;
  animationDuration?: number;
  headerPadding?: number;
  contentPadding?: number;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  headerBackgroundColor?: string;
  contentBackgroundColor?: string;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

const Accordion: FC<AccordionProps> = ({
  title,
  children,
  defaultExpanded = false,
  containerStyle,
  headerStyle,
  titleStyle,
  contentContainerStyle,
  iconColor = "#666",
  iconSize = 20,
  onToggle,
  disabled = false,
  showIcon = true,
  customIcon,
  animationDuration = 300,
  headerPadding = 15,
  contentPadding = 15,
  borderRadius = 8,
  borderColor = "#e0e0e0",
  borderWidth = 1,
  backgroundColor = "#fff",
  headerBackgroundColor = "#f9f9f9",
  contentBackgroundColor = "#fff",
  shadowColor = "#000",
  shadowOffset = { width: 0, height: 2 },
  shadowOpacity = 0.1,
  shadowRadius = 4,
  elevation = 2,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
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
    if (disabled) return;

    // Standard LayoutAnimation for smooth general transitions
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);
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

  // Animate opacity for smooth fade effect
  const animatedOpacity = animationController.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  useEffect(() => {
    Animated.timing(animationController, {
      duration: animationDuration,
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
            duration: animationDuration,
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
  }, [expanded, bodyHeight, animationController, animationDuration]);

  // Default arrow icon
  const DefaultIcon = () => (
    <Animated.View style={{ transform: [{ rotate: arrowAngle }] }}>
      <Ionicons name="chevron-down" size={iconSize} color={iconColor} />
    </Animated.View>
  );

  const dynamicContainerStyle: ViewStyle = {
    backgroundColor,
    borderRadius,
    borderColor,
    borderWidth,
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  };

  const dynamicHeaderStyle: ViewStyle = {
    padding: headerPadding,
    backgroundColor: headerBackgroundColor,
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
    opacity: disabled ? 0.6 : 1,
  };

  const dynamicContentStyle: ViewStyle = {
    padding: contentPadding,
    paddingTop: 0, // Remove top padding if header already provides spacing
    backgroundColor: contentBackgroundColor,
  };

  return (
    <View style={[styles.container, dynamicContainerStyle, containerStyle]}>
      <TouchableOpacity
        onPress={toggleAccordion}
        style={[styles.header, dynamicHeaderStyle, headerStyle]}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
      >
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {showIcon && (
          <View style={styles.iconContainer}>
            {customIcon || <DefaultIcon />}
          </View>
        )}
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            maxHeight: animatedHeight,
            opacity: animatedOpacity,
          },
        ]}
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
          style={[styles.content, dynamicContentStyle, contentContainerStyle]}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    overflow: "hidden", // Essential for animated height to clip content
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  iconContainer: {
    marginLeft: 10,
  },
  defaultIcon: {
    fontWeight: "bold",
  },
  contentWrapper: {
    overflow: "hidden", // Ensures content is clipped during height animation
  },
  content: {
    backgroundColor: "#ffffff",
  },
});

export default Accordion;
