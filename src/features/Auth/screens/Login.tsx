import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import TouchButton from "../../../components/atoms/TouchButton";
import { useAuth } from "../hooks/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { signIn } = useAuth();

  return (
    <ImageBackground
      source={require("../../../assets/images/japan.jpg")} // local image
      style={styles.container}
      resizeMode="cover" // or 'contain', 'stretch', 'center', 'repeat'
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome! Please Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchButton
            onPress={signIn}
            buttonText="Login"
            customStyle={{ minWidth: "90%" }}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)", // dark overlay for text contrast
  },
  title: {
    fontSize: 26,
    marginBottom: 40,
    color: "#FFFFFF",
  },

  input: {
    minWidth: "90%",
    height: 60,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "white",
    fontSize: 16,
  },
});

export default Login;
