import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../lib/firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/(tabs)/adoption");
    } catch (err: any) {
      Alert.alert(
        "Login failed",
        err.message || "Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.imgWrap}>
        <Image
          source={require("../../assets/images/hospital.png")}
          style={styles.img}
        />
      </View>
      <Text style={styles.title}>Angeles Animal Pet Care</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      {/* TEMP: preview-only skip, remove once Firebase is set up */}
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/adoption" as any)}
      >
        <Text style={{ color: "#94a3b8", marginTop: 16, fontSize: 12 }}>
          Skip login (preview only)
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  imgWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 4,
    backgroundColor: "#1e3a8a",
    marginBottom: 18,
  },
  img: { width: "100%", height: "100%", borderRadius: 42 },
  title: { fontSize: 20, fontWeight: "800", color: "#1e3a8a", marginBottom: 2 },
  subtitle: { fontSize: 13, color: "#64748b", marginBottom: 28 },
  input: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1e3a8a",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
