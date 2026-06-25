import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

import { formatReminderDate } from "@/components/action-reminder-control";
import { Card } from "@/components/card";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { stages } from "@/data/stages";
import { useCropTrails } from "@/store/croptrails-store";
import { colors } from "@/theme";
import { StageId } from "@/types";

export default function HomeScreen() {
  const router = useRouter();
  const {
    farms,
    activeFarmId,
    profile,
    recommendationHistory,
    reminders,
    marketPrices,
    marketSyncStatus,
    isHydrated,
    switchActiveFarm,
  } = useCropTrails();
  const currentStage =
    stages.find((stage) => stage.id === profile.currentStage) || stages[0];
  const latestPlan = recommendationHistory.find(
    (record) => record.stage === profile.currentStage,
  );
  const nextActionIndex =
    latestPlan?.completedActions.findIndex((completed) => !completed) ?? -1;
  const nextAction =
    latestPlan && nextActionIndex >= 0
      ? latestPlan.actions[nextActionIndex]
      : null;
  const activeReminders = [...reminders].sort(
    (a, b) =>
      new Date(a.scheduledFor).getTime() -
      new Date(b.scheduledFor).getTime(),
  );
  const nextReminder = activeReminders[0];
  const reminderOverdue =
    nextReminder &&
    new Date(nextReminder.scheduledFor).getTime() < Date.now();
  const bestMarket = [...marketPrices].sort(
    (a, b) => b.pricePerBag - a.pricePerBag,
  )[0];
  const completedStages = stages.filter((stage) => {
    const record = recommendationHistory.find(
      (item) => item.stage === stage.id,
    );
    return (
      record?.completedActions.length &&
      record.completedActions.every(Boolean)
    );
  }).length;

  useEffect(() => {
    if (isHydrated && !profile.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [isHydrated, profile.onboardingCompleted, router]);

  if (isHydrated && !profile.onboardingCompleted) {
    return (
      <Screen>
        <Text selectable style={{ color: colors.muted }}>
          Preparing setup...
        </Text>
      </Screen>
    );
  }

  function openAdvisory(stage: StageId = profile.currentStage) {
    router.push({ pathname: "/advisory", params: { stage } });
  }

  return (
    <Screen>
      <View style={{ gap: 3 }}>
        <Text selectable style={{ color: colors.muted, fontSize: 14 }}>
          {profile.district || profile.region || "My maize farm"}
        </Text>
        <Text
          selectable
          style={{ color: colors.text, fontSize: 28, fontWeight: "900" }}
        >
          Good day, {profile.farmerName.split(" ")[0] || "Farmer"}
        </Text>
      </View>

      {farms.length > 1 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {farms.map((farm) => {
            const active = farm.id === activeFarmId;
            return (
              <Pressable
                key={farm.id}
                onPress={() => switchActiveFarm(farm.id)}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 11,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : colors.surface,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Ionicons
                  name={active ? "checkmark-circle" : "leaf-outline"}
                  size={15}
                  color={colors.primary}
                />
                <Text
                  selectable
                  style={{
                    color: active ? colors.primary : colors.text,
                    fontWeight: "800",
                    fontSize: 12,
                  }}
                >
                  {farm.farmName}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Card style={{ backgroundColor: colors.primary, padding: 18 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 5 }}>
            <Text
              selectable
              style={{ color: "#DCECDF", fontWeight: "800", fontSize: 13 }}
            >
              WHAT TO DO NOW
            </Text>
            <Text
              selectable
              style={{ color: colors.surface, fontSize: 23, fontWeight: "900" }}
            >
              {nextAction || `Check your ${currentStage.title.toLowerCase()} stage`}
            </Text>
            <Text selectable style={{ color: "#EAF4EC", lineHeight: 20 }}>
              {nextAction
                ? "Open your action plan and mark this task when it is done."
                : `Answer four short questions to get advice for ${currentStage.title.toLowerCase()}.`}
            </Text>
          </View>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.14)",
            }}
          >
            <Ionicons
              name={
                (nextAction ? "checkmark-done-outline" : currentStage.icon) as keyof typeof Ionicons.glyphMap
              }
              size={28}
              color={colors.surface}
            />
          </View>
        </View>
        <PrimaryButton
          label={nextAction ? "Open action plan" : `Start ${currentStage.title} check`}
          icon="arrow-forward-outline"
          variant="muted"
          onPress={() =>
            nextAction ? router.push("/progress") : openAdvisory()
          }
        />
      </Card>

      {nextReminder ? (
        <Pressable onPress={() => router.push("/progress")}>
          <View
            style={{
              minHeight: 58,
              borderRadius: 8,
              paddingHorizontal: 13,
              paddingVertical: 11,
              borderWidth: 1,
              borderColor: reminderOverdue ? colors.danger : colors.border,
              backgroundColor: reminderOverdue
                ? colors.dangerSoft
                : colors.surface,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Ionicons
              name={reminderOverdue ? "alert-circle-outline" : "alarm-outline"}
              size={22}
              color={reminderOverdue ? colors.danger : colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text
                selectable
                style={{
                  color: reminderOverdue ? colors.danger : colors.primary,
                  fontWeight: "900",
                  fontSize: 13,
                }}
              >
                {reminderOverdue
                  ? "Action overdue"
                  : formatReminderDate(new Date(nextReminder.scheduledFor))}
              </Text>
              <Text
                selectable
                numberOfLines={2}
                style={{ color: colors.text, lineHeight: 19 }}
              >
                {nextReminder.action}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </View>
        </Pressable>
      ) : null}

      <View style={{ gap: 9 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            selectable
            style={{ color: colors.text, fontSize: 17, fontWeight: "900" }}
          >
            Maize journey
          </Text>
          <Pressable onPress={() => router.push("/progress")}>
            <Text
              selectable
              style={{ color: colors.primary, fontWeight: "800" }}
            >
              {completedStages}/4 complete
            </Text>
          </Pressable>
        </View>
        <View
          style={{
            flexDirection: "row",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: colors.surface,
          }}
        >
          {stages.map((stage, index) => {
            const active = stage.id === profile.currentStage;
            const record = recommendationHistory.find(
              (item) => item.stage === stage.id,
            );
            const completed =
              !!record?.completedActions.length &&
              record.completedActions.every(Boolean);
            return (
              <Pressable
                key={stage.id}
                onPress={() => openAdvisory(stage.id)}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 72,
                  paddingVertical: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  backgroundColor: active
                    ? colors.primarySoft
                    : colors.surface,
                  borderRightWidth: index < stages.length - 1 ? 1 : 0,
                  borderRightColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons
                  name={
                    completed
                      ? "checkmark-circle"
                      : (stage.icon as keyof typeof Ionicons.glyphMap)
                  }
                  size={21}
                  color={completed ? colors.success : colors.primary}
                />
                <Text
                  selectable
                  style={{
                    color: active ? colors.primary : colors.text,
                    fontWeight: "800",
                    fontSize: 12,
                  }}
                >
                  {stage.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={() => router.push("/market")}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 112,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 14,
            gap: 7,
            opacity: pressed ? 0.78 : 1,
          })}
        >
          <Ionicons name="bar-chart-outline" size={22} color={colors.primary} />
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            Market price
          </Text>
          {bestMarket ? (
            <>
              <Text
                selectable
                style={{
                  color: colors.primary,
                  fontSize: 20,
                  fontWeight: "900",
                  fontVariant: ["tabular-nums"],
                }}
              >
                GHc {bestMarket.pricePerBag}
              </Text>
              <Text
                selectable
                numberOfLines={1}
                style={{ color: colors.muted, fontSize: 12 }}
              >
                {bestMarket.market}
                {marketSyncStatus === "error" ? " - cached" : ""}
              </Text>
            </>
          ) : (
            <Text selectable style={{ color: colors.muted }}>
              No price available
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push("/farm")}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 112,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 14,
            gap: 7,
            opacity: pressed ? 0.78 : 1,
          })}
        >
          <Ionicons name="leaf-outline" size={22} color={colors.accent} />
          <Text selectable style={{ color: colors.text, fontWeight: "900" }}>
            My farm
          </Text>
          <Text selectable style={{ color: colors.text, fontWeight: "800" }}>
            {profile.variety}
          </Text>
          <Text
            selectable
            numberOfLines={2}
            style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}
          >
            {profile.farmSizeAcres} acres in{" "}
            {profile.district || profile.region || "saved location"}
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          paddingHorizontal: 2,
        }}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={16}
          color={colors.muted}
        />
        <Text selectable style={{ color: colors.muted, fontSize: 12 }}>
          Advice, action plans, and cached prices remain available offline.
        </Text>
      </View>
    </Screen>
  );
}
