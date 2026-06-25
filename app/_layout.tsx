import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { NotificationObserver } from "@/components/notification-observer";
import { CropTrailsProvider } from "@/store/croptrails-store";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <CropTrailsProvider>
      <StatusBar style="dark" />
      <NotificationObserver />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="market/[id]"
          options={{ title: "Market details", headerBackButtonDisplayMode: "minimal" }}
        />
        <Stack.Screen
          name="listings"
          options={{ title: "Produce listings", headerBackButtonDisplayMode: "minimal" }}
        />
      </Stack>
    </CropTrailsProvider>
  );
}
