import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const user = null; // TEMP: preview mode, always goes to Login
  const initializing = false; // TEMP
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  useEffect(() => {
    if (initializing) return;
    const t = setTimeout(() => {
      router.replace((user ? "/(tabs)/adoption" : "/login") as any);
    }, 1200);
    return () => clearTimeout(t);
  }, [initializing, user]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.imgWrap}>
        <Image
          source={require("../../assets/images/hospital.png")}
          style={styles.img}
        />
      </View>
      <Text style={styles.title}>Angeles Animal Pet Care</Text>
      <Text style={styles.subtitle}>Branch Information System</Text>
      <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />

      <View style={styles.badge}>
        <View style={styles.badgeDivider} />
        <Image
          source={require("../../assets/images/seraphvet-logo.webp")}
          style={styles.badgeImg}
        />
        <Text style={styles.badgeText}>
          Made with <Text style={{ fontWeight: "700" }}>SeraphVet</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f3fa",
    alignItems: "center",
    justifyContent: "center",
  },
  imgWrap: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 4,
    backgroundColor: "#1e3a8a",
    marginBottom: 22,
  },
  img: { width: "100%", height: "100%", borderRadius: 50 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e3a8a",
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: "#3b82f6", marginBottom: 30 },
  spinner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#e0e7ff",
    borderTopColor: "#1e3a8a",
    borderRightColor: "#3b82f6",
  },
  badge: {
    position: "absolute",
    bottom: 30,
    alignItems: "center",
    gap: 6,
  },
  badgeDivider: {
    width: 28,
    height: 1,
    backgroundColor: "#d6dceb",
    marginBottom: 8,
  },
  badgeImg: { width: 40, height: 40, resizeMode: "contain", opacity: 0.7 },
  badgeText: { fontSize: 10.5, color: "#94a3b8", textTransform: "uppercase" },
});
