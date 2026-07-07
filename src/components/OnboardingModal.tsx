import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Traveler type options with emojis
const TRAVELER_TYPES = [
  { id: "solo", label: "Solo Traveler", emoji: "🚶" },
  { id: "backpacker", label: "Backpacker", emoji: "🎒" },
  { id: "business", label: "Business Traveler", emoji: "💼" },
  { id: "couple", label: "Couple", emoji: "👩‍❤️‍👨" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { id: "luxury", label: "Luxury Traveler", emoji: "💎" },
  { id: "adventure", label: "Adventure Seeker", emoji: "🧭" },
  { id: "foodie", label: "Foodie", emoji: "🍕" },
];

const COUNTRIES = [
  "Philippines", "United States", "United Kingdom", "Australia",
  "Canada", "Japan", "South Korea", "Singapore", "Germany",
  "France", "Italy", "Spain", "Thailand", "Malaysia", "Indonesia",
  "Vietnam", "China", "India", "Brazil", "Mexico",
];

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

const OnboardingModal = ({ visible, onClose }: OnboardingModalProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form State
  const [username, setUsername] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Philippines");
  const [createDemoData, setCreateDemoData] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // Animations for welcome logo
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && step === 1) {
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, step]);

  // Staggered animations for travel style cards
  const styleCardAnims = useRef(
    TRAVELER_TYPES.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (visible && step === 3) {
      styleCardAnims.forEach((anim) => anim.setValue(0));
      const animations = styleCardAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        })
      );
      Animated.stagger(50, animations).start();
    }
  }, [visible, step]);

  // Animations for step transition (applies to titles/texts)
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      textFadeAnim.setValue(0);
      textSlideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, step]);

  // Auto-close Step 6 with countdown
  useEffect(() => {
    if (visible && step === 6) {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [visible, step]);

  // Step 2 toggle selection
  const toggleTravelerType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleNext = () => {
    if (step < 6) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  const handleFinish = () => {
    // Reset state and close modal
    onClose();
    // Wait a brief moment before resetting step back to 1
    setTimeout(() => {
      setStep(1);
      setUsername("");
      setSelectedTypes([]);
      setSearchQuery("");
      setSelectedCountry("Philippines");
      setCreateDemoData(true);
    }, 500);
  };

  // Filter countries for step 3 search
  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={[styles.safeArea, step === 1 && { backgroundColor: "#111827" }]}>
        {/* Progress Header */}
        <View style={[styles.header, 
          {marginTop: insets.top + 0 }
        ]}>
          {step > 1 && step <= 5 ? (
            <>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
              <View style={styles.progressContainer}>
                {[2, 3, 4, 5].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          step === s
                            ? colors.primary
                            : step > s
                            ? `${colors.primary}80`
                            : "#E5E7EB",
                      },
                    ]}
                  />
                ))}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close onboarding"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={{ flex: 1 }} />
              {step === 1 && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close onboarding"
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Form Body */}
        <View style={styles.container}>
          {step === 1 && (
            <View style={styles.welcomeContainer}>
              <Animated.Image
                source={require("../../assets/icon.png")}
                style={[
                  styles.welcomeImage,
                  {
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                  }
                ]}
                resizeMode="contain"
              />
              <Animated.View style={{
                opacity: textFadeAnim,
                transform: [{ translateY: textSlideAnim }],
                alignItems: "center"
              }}>
                <Text style={[styles.welcomeTitle, { color: "#FFFFFF" }]}>
                  travelled
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: "#9CA3AF" }]}>
                  Your ultimate companion for planning and organizing trips, keeping track of checklists, and building detailed itineraries.
                </Text>
              </Animated.View>
            </View>
          )}

          {step === 2 && (
            <Animated.View style={[styles.stepContent, { opacity: textFadeAnim, transform: [{ translateY: textSlideAnim }] }]}>
              <Text style={[styles.title, { color: colors.primary }]}>
                Choose your username
              </Text>
              <Text style={styles.subtitle}>
                What should we call you? Pick a unique handle to get started.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Animated.View style={{ opacity: textFadeAnim, transform: [{ translateY: textSlideAnim }] }}>
                <Text style={[styles.title, { color: colors.primary }]}>
                  What's your travel style?
                </Text>
                <Text style={styles.subtitle}>
                  Select all that apply. We'll use this to suggest ideas.
                </Text>
              </Animated.View>

              <ScrollView
                contentContainerStyle={styles.gridContainer}
                showsVerticalScrollIndicator={false}
              >
                {TRAVELER_TYPES.map((type, index) => {
                  const isSelected = selectedTypes.includes(type.id);
                  const cardAnim = styleCardAnims[index];
                  
                  return (
                    <Animated.View
                      key={type.id}
                      style={{
                        width: "48%",
                        aspectRatio: 1.1,
                        opacity: cardAnim,
                        transform: [
                          {
                            translateY: cardAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0],
                            }),
                          },
                        ],
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => toggleTravelerType(type.id)}
                        style={[
                          styles.gridItem,
                          { width: "100%", height: "100%", aspectRatio: undefined },
                          isSelected && {
                            borderColor: colors.primary,
                            backgroundColor: `${colors.primary}0D`,
                          },
                        ]}
                        accessibilityRole="button"
                        activeOpacity={0.7}
                      >
                        <Text style={styles.itemEmoji}>{type.emoji}</Text>
                        <Text
                          style={[
                            styles.itemLabel,
                            isSelected && {
                              color: colors.primary,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          {type.label}
                        </Text>
                        {isSelected && (
                          <View
                            style={[
                              styles.checkmarkBadge,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {step === 4 && (
            <Animated.View style={[styles.stepContent, { opacity: textFadeAnim, transform: [{ translateY: textSlideAnim }] }]}>
              <Text style={[styles.title, { color: colors.primary }]}>
                Where are you from?
              </Text>
              <Text style={styles.subtitle}>
                Select your primary home country destination.
              </Text>

              {/* Country Selection UI */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search countries..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {filteredCountries.map((c) => {
                  const isSelected = selectedCountry === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setSelectedCountry(c)}
                      style={[
                        styles.listItem,
                        isSelected && { backgroundColor: `${colors.primary}0D` },
                      ]}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.listItemText,
                          isSelected && { color: colors.primary, fontWeight: "bold" },
                        ]}
                      >
                        {c}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          {step === 5 && (
            <Animated.View style={[styles.stepContent, { opacity: textFadeAnim, transform: [{ translateY: textSlideAnim }] }]}>
              <Text style={[styles.title, { color: colors.primary }]}>
                Demo Travel Plan
              </Text>
              <Text style={styles.subtitle}>
                Would you like to import simulated travel data to explore Travelled's features?
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <TouchableOpacity
                  onPress={() => setCreateDemoData(!createDemoData)}
                  style={[
                    styles.checkboxContainer,
                    createDemoData && { borderColor: colors.primary, backgroundColor: `${colors.primary}08` }
                  ]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ checked: createDemoData }}
                >
                  <View style={[
                    styles.checkbox,
                    { borderColor: colors.primary },
                    createDemoData && { backgroundColor: colors.primary }
                  ]}>
                    {createDemoData && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Yes, create demo travel data</Text>
                </TouchableOpacity>

             
              </ScrollView>
            </Animated.View>
          )}

          {step === 6 && (
            <Animated.View
              style={[
                styles.stepContent,
                styles.successContainer,
                {
                  opacity: textFadeAnim,
                  transform: [{ translateY: textSlideAnim }],
                }
              ]}
            >
              <View style={[styles.successIconContainer, { backgroundColor: `${colors.primary}1A` }]}>
                <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
              </View>
              <Text style={[styles.successTitle, { color: colors.primary }]}>
                You're all set!
              </Text>
              <Text style={styles.successSubtitle}>
                Welcome to Travelled! Prepare to start planning your perfect trips.
              </Text>

              <Text style={styles.countdownText}>
                Entering the dashboard in <Text style={{ color: colors.primary, fontWeight: "bold" }}>{countdown}</Text> seconds...
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Sticky Action Footer - safe inset padding */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {step <= 5 ? (
            <TouchableOpacity
              onPress={handleNext}
              disabled={
                (step === 2 && !username.trim())
              }
              style={[
                styles.primaryButton,
                { backgroundColor: step === 1 ? "#FFFFFF" : colors.primary },
                (step === 2 && !username.trim()) && { opacity: 0.5 },
              ]}
              accessibilityRole="button"
            >
              <Text style={[
                styles.primaryButtonText,
                { color: step === 1 ? "#111827" : colors.onPrimary }
              ]}>
                {step === 1 ? "Get Started" : step === 5 ? "Start the Adventure!" : "Next"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 56,
  },
  backButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  stepContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  atSymbol: {
    fontSize: 18,
    color: "#9CA3AF",
    marginRight: 4,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    height: "100%",
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 24,
  },
  gridItem: {
    width: "48%",
    aspectRatio: 1.1,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#EAECF0",
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
    position: "relative",
  },
  itemEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475467",
  },
  checkmarkBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  listItemText: {
    fontSize: 15,
    color: "#374151",
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  countdownText: {
    fontSize: 10,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#EAECF0",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  welcomeImage: {
    width: 140,
    height: 140,
    borderRadius: 32,
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#EAECF0",
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
});

export default OnboardingModal;
