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
  LayoutAnimation,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
  Modal,
  ScrollView,
  Platform,
  UIManager,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const toggleFullscreenAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFullscreen(!fullscreen);
  };

  const arrowAngle = animationController.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"], 
  });

  useEffect(() => {
    Animated.timing(animationController, {
      duration: 300,
      toValue: expanded ? 1 : 0,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1), 
      useNativeDriver: true, 
    }).start();
  }, [expanded, animationController]);

  return (
    <View style={containerStyle} className="bg-white my-1.5 rounded-[20px] overflow-hidden border border-[#e0e0e0]">
      <TouchableOpacity
        onPress={toggleFullscreenAccordion}
        className="absolute right-[45px] top-4 z-10"
      >
        <Animated.View>
          <Icon name="fullscreen" size={iconSize} color={iconColor} />
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={toggleAccordion}
        style={headerStyle}
        className={`flex-row justify-between items-center py-[18px] px-3 bg-[#f9f9f9] pr-[74px] ${expanded ? "pb-1" : ""}`}
        activeOpacity={0.8}
      >
        <Text style={titleStyle} 
          className="text-base font-semibold text-[#333] "
          numberOfLines={expanded ? 10 : 1}
        >{title}</Text>

        <Animated.View style={{ transform: [{ rotate: arrowAngle }] }} className="absolute right-3 top-4 " >
          <Icon name="keyboard-arrow-down" size={iconSize} color={iconColor} />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <View
          style={contentContainerStyle}
          className="overflow-hidden p-1 pb-3"
        >
          {children}
        </View>
      )}

      <Modal
        animationType="slide" 
        visible={fullscreen}
        transparent={false}
        onRequestClose={() => setFullscreen(false)} 
      >
        <View style={headerStyle} className="flex-row justify-between items-center py-0 px-3 bg-[#f9f9f9]">
          <Text style={titleStyle} className="text-xl font-semibold text-[#333]">{title}</Text>

          <TouchableOpacity
            onPress={() => setFullscreen(false)}
            style={headerStyle}
            className="flex-row justify-between items-center py-[18px] px-3 bg-[#f9f9f9]"
            activeOpacity={0.8}
          >
            <Animated.View>
              <Icon name="fullscreen-exit" size={30} color={iconColor} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <ScrollView>{children}</ScrollView>

      </Modal>
    </View>
  );
};

export default Accordion;
