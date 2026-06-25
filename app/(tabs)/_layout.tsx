import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ColorValue } from "react-native";

import { colors } from "@/theme";

const tabIcon = (name: keyof typeof Ionicons.glyphMap) =>
  function Icon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: tabIcon("home-outline") }}
      />
      <Tabs.Screen
        name="advisory"
        options={{ title: "Advisory", tabBarIcon: tabIcon("leaf-outline") }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Progress", tabBarIcon: tabIcon("trail-sign-outline") }}
      />
      <Tabs.Screen
        name="market"
        options={{ title: "Market", tabBarIcon: tabIcon("bar-chart-outline") }}
      />
      <Tabs.Screen
        name="farm"
        options={{ title: "My Farm", tabBarIcon: tabIcon("map-outline") }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
