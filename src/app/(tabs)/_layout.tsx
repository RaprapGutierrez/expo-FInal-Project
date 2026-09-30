import { Ionicons } from "@expo/vector-icons";
import { router, Tabs, usePathname } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_ITEMS = [
  {
    label: "Adoption",
    key: "adoption",
    href: "/(tabs)/adoption",
    icon: "paw" as const,
  },
  {
    label: "News",
    key: "announcements",
    href: "/(tabs)/announcements",
    icon: "megaphone" as const,
  },
  {
    label: "Stock",
    key: "stock",
    href: "/(tabs)/stock",
    icon: "cube" as const,
  },
  {
    label: "Consult",
    key: "consultation",
    href: "/(tabs)/consultation",
    icon: "videocam" as const,
  },
];

function TopHeader() {
  return (
    <SafeAreaView edges={["top"]} style={styles.headerSafe}>
      <View style={styles.headerRow}>
        <Image
          source={require("../../../assets/images/hospital.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Angeles Animal Pet Care</Text>
      </View>
    </SafeAreaView>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <SafeAreaView edges={["bottom"]} style={styles.bottomSafe}>
      <View style={styles.navRow}>
        {NAV_ITEMS.map((item) => {
          const active = pathname.includes(item.key);
          return (
            <TouchableOpacity
              key={item.href}
              style={styles.navItem}
              onPress={() => router.push(item.href as any)}
            >
              <Ionicons
                name={active ? item.icon : (`${item.icon}-outline` as any)}
                size={22}
                color={active ? "#1e3a8a" : "#94a3b8"}
              />
              <Text style={[styles.navText, active && styles.navTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <TopHeader />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        >
          <Tabs.Screen name="adoption" />
          <Tabs.Screen name="announcements" />
          <Tabs.Screen name="stock" />
          <Tabs.Screen name="consultation" />
        </Tabs>
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  headerSafe: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  logo: { width: 32, height: 32, borderRadius: 16 },
  title: { fontSize: 16, fontWeight: "800", color: "#1e3a8a" },
  bottomSafe: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  navRow: { flexDirection: "row" },
  navItem: { flex: 1, alignItems: "center", paddingVertical: 8, gap: 2 },
  navText: { fontSize: 11, fontWeight: "600", color: "#94a3b8" },
  navTextActive: { color: "#1e3a8a" },
});
