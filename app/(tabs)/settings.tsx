import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Card } from "@/components/card";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { SectionTitle } from "@/components/section-title";
import { useCropTrails } from "@/store/croptrails-store";
import { colors } from "@/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const {
    checks,
    recommendationHistory,
    reminders,
    marketPrices,
    marketSyncStatus,
    marketLastSyncedAt,
    listings,
    clearLocalData,
  } = useCropTrails();

  function reset() {
    Alert.alert("Reset local data?", "This clears saved checks, recommendations, profile edits, and listings.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          clearLocalData();
          router.replace("/onboarding");
        },
      },
    ]);
  }

  return (
    <Screen>
      <SectionTitle
        title="Settings"
        subtitle="Offline state, project scope, and prototype controls."
      />

      <Card>
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
          Prototype scope
        </Text>
        <Text selectable style={{ color: colors.muted, lineHeight: 21 }}>
          CropTrails currently focuses on maize, rule-based post-harvest advice,
          sample market prices, and offline produce listings.
        </Text>
      </Card>

      <Card>
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
          Local data
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={{ color: colors.muted }}>Saved stage checks</Text>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {checks.length}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={{ color: colors.muted }}>Produce listings</Text>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {listings.length}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={{ color: colors.muted }}>Recommendation history</Text>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {recommendationHistory.length}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={{ color: colors.muted }}>Active reminders</Text>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {reminders.length}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={{ color: colors.muted }}>Cached market prices</Text>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {marketPrices.length}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={{ color: colors.muted }}>Market sync status</Text>
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            {marketSyncStatus}
          </Text>
        </View>
        {marketLastSyncedAt ? (
          <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
            Last market sync:{" "}
            {new Intl.DateTimeFormat("en-GH", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(marketLastSyncedAt))}
          </Text>
        ) : null}
        <PrimaryButton label="Reset prototype data" icon="refresh-outline" variant="muted" onPress={reset} />
      </Card>
    </Screen>
  );
}
