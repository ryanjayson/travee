import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { View, ActivityIndicator } from "react-native";

// --- Types ---
interface AuthContextType {
  userToken: string | null;
  signIn: () => void;
  signOut: () => void;
}

// --- Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Simulate checking for a token on app launch
  useEffect(() => {
    // In a real app, you would check AsyncStorage here
    setTimeout(() => {
      // setUserToken(tokenFromStorage);
      setIsLoading(false);
    }, 1000);
  }, []);

  const authContextValue = React.useMemo(
    () => ({
      signIn: () => {
        // In a real app, perform API login and save token
        setUserToken("dummy-auth-token");
      },
      signOut: () => {
        // Clear token from AsyncStorage
        setUserToken(null);
      },
      userToken,
    }),
    [userToken]
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook to Use Auth ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
